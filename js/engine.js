/* engine.js — session composition (Leitner + active/maintenance/background
   weighting), load-mode set builder, gate progress, fragile-rule detection.
   ENGINE code — content lives in data/, never here. */
(function () {
  "use strict";

  function today() { return new Date().toISOString().slice(0, 10); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---- Leitner-aware pick: due items first, then unseen, then rest ----
  function pickForRule(ruleId, count) {
    var items = window.itemsForRule(ruleId);
    var t = today();
    var due = [], unseen = [], rest = [];
    items.forEach(function (i) {
      var lt = window.Store.leitnerFor(i.id);
      if (lt.box === 0) unseen.push(i);
      else if (lt.due && lt.due <= t) due.push(i);
      else rest.push(i);
    });
    return shuffle(due).concat(shuffle(unseen), shuffle(rest)).slice(0, count);
  }

  // weakness multiplier: weakest recent accuracy → more reps (existing lever)
  function weakness(ruleId) {
    var acc = window.Store.recentAccuracy(ruleId);
    if (acc === null) return 1.5;          // never practised → prioritise
    return 1 + (1 - acc);                  // 0%→2x, 100%→1x
  }

  /* ---------------- calm session (daily default) ----------------
     mode weights: active 70% / maintenance 20% / background 10%,
     scaled inside each bucket by per-rule weakness. */
  function buildCalmSession(totalItems) {
    var buckets = { active: [], maintenance: [], background: [] };
    (window.RULES || []).forEach(function (r) {
      var m = window.ruleMode(r.id);
      (buckets[m] || buckets.active).push(r.id);
    });
    var quota = {
      active: Math.max(1, Math.round(totalItems * 0.7)),
      maintenance: Math.max(1, Math.round(totalItems * 0.2)),
      background: Math.max(1, totalItems - Math.round(totalItems * 0.7) - Math.round(totalItems * 0.2))
    };
    var out = [];
    Object.keys(buckets).forEach(function (mode) {
      var rules = buckets[mode];
      if (!rules.length) return;
      var weights = rules.map(weakness);
      var wsum = weights.reduce(function (a, b) { return a + b; }, 0);
      rules.forEach(function (rid, i) {
        var n = Math.max(mode === "active" ? 1 : 0, Math.round(quota[mode] * weights[i] / wsum));
        out = out.concat(pickForRule(rid, n));
      });
    });
    return shuffle(out).slice(0, totalItems);
  }

  /* ---------------- load session (consolidation-under-pressure) ----------------
     Mixes ACTIVE rules with CLOSED (maintenance) rules in the same timed set —
     Stage-1 errors resurface when attention shifts; this catches them.
     Modules flagged load_priority (copula) are always included. */
  function buildLoadSession(totalItems) {
    var active = [], closed = [], priority = [];
    (window.RULES || []).forEach(function (r) {
      var m = window.RULE_MODULE[r.id] || {};
      if (m.load_priority) priority.push(r.id);
      else if ((m.mode || "active") === "active") active.push(r.id);
      else closed.push(r.id);
    });
    var half = Math.ceil(totalItems / 2);
    var out = [];
    // priority rules first (guaranteed presence), then active/closed halves
    priority.forEach(function (rid) { out = out.concat(pickForRule(rid, 2)); });
    var remaining = totalItems - out.length;
    var activeShare = Math.ceil(remaining / 2);
    shuffle(active).forEach(function (rid) {
      if (out.length < half + activeShare) out = out.concat(pickForRule(rid, Math.ceil(activeShare / Math.max(1, active.length))));
    });
    shuffle(closed).forEach(function (rid) {
      if (out.length < totalItems) out = out.concat(pickForRule(rid, Math.ceil((totalItems - out.length) / Math.max(1, closed.length))));
    });
    return shuffle(out).slice(0, totalItems);
  }

  /* ---------------- gates ----------------
     Gate (editable in roadmap.js): ≥min_accuracy across ≥min_load_sessions
     load sessions on ≥min_days distinct days. The app SUGGESTS; user+coach decide. */
  function gateProgress(ruleId) {
    var gate = (window.ROADMAP || {}).default_gate || { min_accuracy: 0.9, min_load_sessions: 3, min_days: 2 };
    var mod = window.RULE_MODULE[ruleId] || {};
    if (mod.never_gate) return null;
    var sessions = (window.Store.get().sessions || []).filter(function (s) {
      return s.mode === "load" && s.perRule && s.perRule[ruleId] && s.perRule[ruleId].n > 0;
    });
    var passing = sessions.filter(function (s) {
      var pr = s.perRule[ruleId];
      return pr.c / pr.n >= gate.min_accuracy;
    });
    var days = {};
    passing.forEach(function (s) { days[s.date] = true; });
    var dayCount = Object.keys(days).length;
    return {
      gate: gate,
      loadSessions: sessions.length,
      passingSessions: passing.length,
      distinctDays: dayCount,
      met: passing.length >= gate.min_load_sessions && dayCount >= gate.min_days
    };
  }

  /* ---------------- fragile rules ----------------
     A maintenance/background rule whose recent accuracy dropped below 80%. */
  function fragileRules() {
    var out = [];
    (window.RULES || []).forEach(function (r) {
      var mode = window.ruleMode(r.id);
      if (mode === "active") return;
      var acc = window.Store.recentAccuracy(r.id);
      if (acc !== null && acc < 0.8) out.push({ rule: r.id, accuracy: acc, mode: mode });
    });
    return out;
  }

  // effective stage status = user override, else roadmap default
  function stageStatus(stage) {
    return window.Store.stageStatus(stage.id, stage.status);
  }

  window.Engine = {
    buildCalmSession: buildCalmSession,
    buildLoadSession: buildLoadSession,
    pickForRule: pickForRule,
    gateProgress: gateProgress,
    fragileRules: fragileRules,
    stageStatus: stageStatus
  };
})();
