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
    var base = acc === null ? 1.5 : 1 + (1 - acc);   // never practised → prioritise; 0%→2x, 100%→1x
    // essay error tags + weekly-report weights (tracker.js, loaded later) nudge
    // a rule's share — clamped so a bad report can never zero a rule out.
    var boost = (window.Tracker && window.Tracker.ruleBoost) ? Number(window.Tracker.ruleBoost(ruleId)) : 1;
    if (!isFinite(boost) || boost <= 0) boost = 1;
    return base * Math.min(2, Math.max(0.5, boost));
  }

  /* ---------------- group mix (the daily vocabulary task) ----------------
     Cards from EVERY rule in a group (e.g. "المفردات": AWL, topics, phrasal
     verbs, collocations, data language), shared by weakness (never-seen and
     low-accuracy rules get more), at least one card per rule, Leitner order
     inside each rule (pickForRule). meaning_reversal stays in grammar.   */
  function buildGroupMix(group, total) {
    var rules = (window.RULES || []).filter(function (r) { return r.group === group && window.itemsForRule(r.id).length; });
    if (!rules.length) return [];
    var w = rules.map(function (r) { return weakness(r.id) * (window.ruleMode(r.id) === "active" ? 1.5 : 1); });
    var wsum = w.reduce(function (a, b) { return a + b; }, 0), out = [];
    rules.forEach(function (r, i) { out = out.concat(pickForRule(r.id, Math.max(1, Math.round(total * w[i] / wsum)))); });
    // top up from the biggest banks if rounding left us short
    var guard = 0;
    while (out.length < total && guard++ < 5) {
      var have = {}; out.forEach(function (x) { have[x.id] = true; });
      var more = [];
      rules.forEach(function (r) { pickForRule(r.id, 4).forEach(function (x) { if (!have[x.id]) more.push(x); }); });
      if (!more.length) break;
      out = out.concat(shuffle(more).slice(0, total - out.length));
    }
    return shuffle(out).slice(0, total);
  }

  /* ---------------- calm session (daily default) ----------------
     mode weights: active 60% / maintenance 33% / background 7%,
     scaled inside each bucket by per-rule weakness. */
  // Spread `quota` picks over `rules`: every rule in `must` gets one first, then
  // the rest by weakness-weighted random draws (diminishing, so a bucket with
  // more rules than picks still rotates through all of them over the days).
  function allocate(rules, weights, quota, core, forceAll) {
    var counts = {}, left = quota;
    rules.forEach(function (r) { counts[r] = 0; });
    // core patterns are always present; every rule is too when the bucket has room for all
    var mustHere = forceAll && rules.length <= quota ? rules.slice() : rules.filter(function (r) { return core[r]; });
    if (mustHere.length <= left) mustHere.forEach(function (r) { counts[r] = 1; left--; });
    var w = weights.slice();
    while (left > 0 && rules.length) {
      var total = w.reduce(function (a, b) { return a + b; }, 0), x = Math.random() * total, i = 0;
      for (; i < w.length - 1; i++) { x -= w[i]; if (x <= 0) break; }
      counts[rules[i]] += 1; left--; w[i] *= 0.5;
    }
    return counts;
  }

  function buildCalmSession(totalItems) {
    var buckets = { active: [], maintenance: [], background: [] };
    var core = {};   // Ahmed's four essay-error patterns: never absent from a daily session
    (window.RULES || []).forEach(function (r) {
      var m = window.ruleMode(r.id), mod = window.RULE_MODULE[r.id] || {};
      (buckets[m] || buckets.active).push(r.id);
      if (mod.core_pattern) core[r.id] = true;
    });
    // 22 rules now share one session: active 60% / maintenance 33% / background 7%
    // (maintenance gained many rules — it needs room so each one rotates in every few days)
    var nAct = Math.round(totalItems * 0.6), nMain = Math.round(totalItems * 0.33);
    var quota = { active: Math.max(1, nAct), maintenance: Math.max(1, nMain), background: Math.max(1, totalItems - nAct - nMain) };
    var out = [];
    Object.keys(buckets).forEach(function (mode) {
      var rules = buckets[mode].filter(function (rid) { return window.itemsForRule(rid).length; });   // empty banks take no slots
      if (!rules.length) return;
      var counts = allocate(rules, rules.map(weakness), quota[mode], core, mode === "active");
      rules.forEach(function (rid) { if (counts[rid]) out = out.concat(pickForRule(rid, counts[rid])); });
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
    buildGroupMix: buildGroupMix,
    pickForRule: pickForRule,
    gateProgress: gateProgress,
    fragileRules: fragileRules,
    stageStatus: stageStatus
  };
})();
