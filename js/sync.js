/* sync.js — zero-cost cross-device auto-sync via a secret GitHub Gist.
   - Push: debounced 4s after every Store.save() (each answer, session, entry).
   - Pull: on app start (and manual button). Merge = union of log entries by
     (ts|itemId) with per-rule stats RECOMPUTED from the merged log, so two
     devices practising independently never overwrite each other.
   - Token: a GitHub personal access token with ONLY the "gist" scope,
     stored in localStorage on each device (one-time paste per device). */
(function () {
  "use strict";
  var CFG_KEY = "ielts_sync_cfg";
  var FILE = "ielts-progress.json";
  var API = "https://api.github.com";

  function loadCfg() {
    try { return JSON.parse(localStorage.getItem(CFG_KEY)) || {}; }
    catch (e) { return {}; }
  }
  var cfg = loadCfg(); // { token, gistId, enabled, lastSync }
  function saveCfg() {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
  }

  var status = { state: cfg.enabled ? "idle" : "off", msg: "" };
  var statusListeners = [];
  function setStatus(state, msg) {
    status = { state: state, msg: msg || "" };
    statusListeners.forEach(function (fn) { try { fn(status); } catch (e) {} });
  }

  function headers() {
    return {
      "Authorization": "Bearer " + cfg.token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    };
  }

  /* ---------------- merge ---------------- */

  function blankRule() {
    return { attempts: 0, correct: 0, streak: 0, lastPracticed: null, recent: [] };
  }

  // Rebuild all per-rule aggregates from a chronologically-sorted log.
  function recomputeRules(sortedLog) {
    var rules = {};
    (window.RULES || []).forEach(function (r) { rules[r.id] = blankRule(); });
    sortedLog.forEach(function (e) {
      var r = rules[e.rule]; if (!r) { r = blankRule(); rules[e.rule] = r; }
      r.attempts += 1;
      if (e.correct) { r.correct += 1; r.streak += 1; } else { r.streak = 0; }
      r.lastPracticed = e.date;
      r.recent.push(e.correct ? 1 : 0);
      if (r.recent.length > 20) r.recent.shift();
    });
    return rules;
  }

  function unionBy(listA, listB, keyFn, cap) {
    var seen = {}, out = [];
    listA.concat(listB).forEach(function (x) {
      var k = keyFn(x);
      if (!seen[k]) { seen[k] = true; out.push(x); }
    });
    out.sort(function (a, b) {
      return String(a.ts || a.date || "") < String(b.ts || b.date || "") ? -1 : 1;
    });
    if (cap && out.length > cap) out = out.slice(-cap);
    return out;
  }

  function mergeStates(a, b) {
    var log = unionBy(a.log || [], b.log || [], function (e) {
      return e.ts + "|" + e.itemId;
    }, 5000);
    // newer overall state wins for scalar/dict fields without per-entry keys
    var newer = String(a.updatedAt || "") >= String(b.updatedAt || "") ? a : b;
    var older = newer === a ? b : a;
    // leitner: per item, the entry with the LATER due date is the more recent rep
    var leitner = {};
    [older.leitner || {}, newer.leitner || {}].forEach(function (src) {
      Object.keys(src).forEach(function (id) {
        var cur = leitner[id];
        if (!cur || String(src[id].due || "") > String(cur.due || "")) leitner[id] = src[id];
      });
    });
    return {
      rules: recomputeRules(log),
      log: log,
      sessions: unionBy(a.sessions || [], b.sessions || [], function (s) {
        return s.ts || JSON.stringify(s);
      }, 200),
      addedDict: unionBy(a.addedDict || [], b.addedDict || [], function (d) {
        return d.word || JSON.stringify(d);
      }),
      addedPairs: unionBy(a.addedPairs || [], b.addedPairs || [], function (p) {
        return JSON.stringify(p);
      }),
      leitner: leitner,
      stageStatus: Object.assign({}, older.stageStatus || {}, newer.stageStatus || {}),
      settings: Object.assign({}, older.settings || {}, newer.settings || {}),
      lastExport: String(a.lastExport || "") > String(b.lastExport || "") ? a.lastExport : b.lastExport,
      updatedAt: new Date().toISOString()
    };
  }

  /* ---------------- push (debounced) ---------------- */

  var pushTimer = null;
  var applying = false;   // true while we import a merge (skip re-push storm)
  var lastPushed = "";

  function schedulePush() {
    if (!cfg.enabled || applying) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(doPush, 4000);
  }

  function doPush() {
    if (!cfg.enabled || !cfg.gistId) return Promise.resolve();
    if (!navigator.onLine) { setStatus("offline", "سيُزامن عند عودة الإنترنت"); return Promise.resolve(); }
    var body = JSON.stringify(window.Store.get());
    if (body === lastPushed) { setStatus("ok"); return Promise.resolve(); }
    setStatus("syncing");
    return fetch(API + "/gists/" + cfg.gistId, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ files: (function () { var f = {}; f[FILE] = { content: body }; return f; })() })
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      lastPushed = body;
      cfg.lastSync = new Date().toISOString(); saveCfg();
      setStatus("ok");
    }).catch(function (e) {
      setStatus("error", e.message === "HTTP 401" ? "التوكن غير صالح" : "تعذّر الرفع — سيعاد تلقائيًا");
    });
  }

  /* ---------------- pull + merge ---------------- */

  function doPull() {
    if (!cfg.enabled || !cfg.gistId || !navigator.onLine) return Promise.resolve(false);
    setStatus("syncing");
    return fetch(API + "/gists/" + cfg.gistId, { headers: headers() })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (g) {
        var f = g.files && g.files[FILE];
        if (!f || !f.content) { setStatus("ok"); return false; }
        var remote;
        try { remote = JSON.parse(f.content); } catch (e) { setStatus("ok"); return false; }
        var local = window.Store.get();
        var merged = mergeStates(local, remote);
        // strip volatile updatedAt before comparing content
        var cmp = function (s) { var c = JSON.parse(JSON.stringify(s)); delete c.updatedAt; return JSON.stringify(c); };
        var changedLocal = cmp(merged) !== cmp(local);
        if (changedLocal) {
          applying = true;
          window.Store.importJSON(JSON.stringify(merged));
          applying = false;
        }
        cfg.lastSync = new Date().toISOString(); saveCfg();
        setStatus("ok");
        // if merge produced something beyond what remote had, push it back
        if (cmp(merged) !== cmp(remote)) schedulePush();
        return changedLocal;
      })
      .catch(function (e) {
        setStatus("error", e.message === "HTTP 401" ? "التوكن غير صالح" : "تعذّر السحب");
        return false;
      });
  }

  /* ---------------- enable / disable ---------------- */

  // Find this user's progress gist (works from a brand-new device), else create it.
  function enable(token) {
    var h = {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json"
    };
    setStatus("syncing");
    return fetch(API + "/gists?per_page=100", { headers: h })
      .then(function (r) {
        if (r.status === 401) throw new Error("bad-token");
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (list) {
        var found = null;
        (list || []).forEach(function (g) { if (g.files && g.files[FILE]) found = g; });
        if (found) return found.id;
        return fetch(API + "/gists", {
          method: "POST", headers: h,
          body: JSON.stringify({
            description: "IELTS trainer progress (auto-sync)",
            public: false,
            files: (function () { var f = {}; f[FILE] = { content: JSON.stringify(window.Store.get()) }; return f; })()
          })
        }).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        }).then(function (g) { return g.id; });
      })
      .then(function (id) {
        cfg = { token: token, gistId: id, enabled: true, lastSync: null };
        saveCfg();
        return doPull().then(function (changed) { doPush(); return changed; });
      })
      .catch(function (e) {
        setStatus("error", e.message === "bad-token"
          ? "التوكن غير صالح — تأكد من نسخه كاملًا ومن صلاحية gist"
          : "تعذّر الاتصال بـ GitHub");
        throw e;
      });
  }

  function disable() {
    cfg = {}; saveCfg();
    if (pushTimer) clearTimeout(pushTimer);
    setStatus("off");
  }

  /* ---------------- wiring ---------------- */

  window.Store.onChange = schedulePush;
  window.addEventListener("online", function () { if (cfg.enabled) doPull().then(doPush); });
  // flush pending changes when leaving the app (best-effort)
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && cfg.enabled && pushTimer) {
      clearTimeout(pushTimer); doPush();
    }
  });

  window.Sync = {
    enabled: function () { return !!cfg.enabled; },
    lastSync: function () { return cfg.lastSync || null; },
    status: function () { return status; },
    onStatus: function (fn) { statusListeners.push(fn); },
    enable: enable,
    disable: disable,
    pull: doPull,
    push: doPush,
    _merge: mergeStates // exposed for testing
  };

  // boot: pull once, re-render current view if the merge changed local data
  if (cfg.enabled) {
    doPull().then(function (changed) {
      if (changed && window.App && window.App.current) {
        window.App.go(window.App.current());
      }
    });
  }
})();
