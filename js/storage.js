/* storage.js — localStorage persistence: per-rule stats + full answer/reasoning log */
(function () {
  "use strict";
  var KEY = "ielts_trainer_v1";

  function todayStr() {
    // Local calendar date as YYYY-MM-DD (no time), for streak/last-practiced.
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function daysBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  function blankRule() {
    return { attempts: 0, correct: 0, streak: 0, lastPracticed: null, recent: [] };
  }

  function fresh() {
    var s = {
      rules: {}, log: [], sessions: [], addedDict: [], addedPairs: [],
      leitner: {},           // itemId -> { box: 1..5, due: "YYYY-MM-DD" }
      stageStatus: {},       // stageId -> user-confirmed status override
      settings: { sessionMinutes: 15, loadItems: 10, loadSeconds: 300 },
      lastExport: null
    };
    (window.RULES || []).forEach(function (r) { s.rules[r.id] = blankRule(); });
    return s;
  }

  function upgrade(s) {
    // migrate pre-roadmap data: old log entries were all calm-mode
    if (!s.leitner) s.leitner = {};
    if (!s.stageStatus) s.stageStatus = {};
    if (!s.settings) s.settings = { sessionMinutes: 15, loadItems: 10, loadSeconds: 300 };
    if (!("lastExport" in s)) s.lastExport = null;
    s.log.forEach(function (e) { if (!e.mode) e.mode = "calm"; });
    s.sessions.forEach(function (e) { if (!e.mode) e.mode = "calm"; });
    return s;
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
    if (!raw) return fresh();
    var s;
    try { s = JSON.parse(raw); } catch (e) { return fresh(); }
    if (!s.rules) s.rules = {};
    (window.RULES || []).forEach(function (r) {
      if (!s.rules[r.id]) s.rules[r.id] = blankRule();
    });
    if (!s.log) s.log = [];
    if (!s.sessions) s.sessions = [];
    if (!s.addedDict) s.addedDict = [];
    if (!s.addedPairs) s.addedPairs = [];
    return upgrade(s);
  }

  var state = load();

  function save() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    // notify sync layer (set by sync.js) — never let it break a save
    try { if (Store.onChange) Store.onChange(); } catch (e) {}
  }

  var Store = {
    get: function () { return state; },
    ruleStat: function (ruleId) { return state.rules[ruleId] || blankRule(); },

    accuracy: function (ruleId) {
      var r = state.rules[ruleId];
      if (!r || r.attempts === 0) return null;
      return Math.round((r.correct / r.attempts) * 100);
    },

    // Record one graded attempt (answer + reasoning are always stored).
    // mode: "calm" (default) or "load" — tracked separately per rule.
    record: function (item, isCorrect, answerText, reasoning, mode) {
      mode = mode || "calm";
      var r = state.rules[item.rule];
      if (!r) { r = blankRule(); state.rules[item.rule] = r; }
      r.attempts += 1;
      if (isCorrect) { r.correct += 1; r.streak += 1; }
      else { r.streak = 0; }
      r.lastPracticed = todayStr();
      r.recent.push(isCorrect ? 1 : 0);
      if (r.recent.length > 20) r.recent.shift();

      // Leitner: correct → up a box (max 5), wrong → back to box 1
      var lt = state.leitner[item.id] || { box: 0, due: todayStr() };
      lt.box = isCorrect ? Math.min(5, (lt.box || 0) + 1) : 1;
      var gaps = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
      var d = new Date(); d.setDate(d.getDate() + gaps[lt.box]);
      lt.due = d.toISOString().slice(0, 10);
      state.leitner[item.id] = lt;

      state.log.push({
        ts: new Date().toISOString(),
        date: todayStr(),
        itemId: item.id,
        rule: item.rule,
        mode: mode,
        answer: answerText,
        reasoning: reasoning || "",
        correct: !!isCorrect
      });
      if (state.log.length > 5000) state.log = state.log.slice(-5000);
      save();
    },

    leitnerFor: function (itemId) {
      return state.leitner[itemId] || { box: 0, due: null };
    },

    // per-rule accuracy split by mode, over the last N attempts (default all)
    modeAccuracy: function (ruleId, mode, lastN) {
      var entries = state.log.filter(function (e) {
        return e.rule === ruleId && (e.mode || "calm") === mode;
      });
      if (lastN) entries = entries.slice(-lastN);
      if (!entries.length) return null;
      var c = entries.reduce(function (a, e) { return a + (e.correct ? 1 : 0); }, 0);
      return { n: entries.length, accuracy: c / entries.length };
    },

    stageStatus: function (stageId, fallback) {
      return state.stageStatus[stageId] || fallback;
    },
    setStageStatus: function (stageId, status) {
      state.stageStatus[stageId] = status; save();
    },

    settings: function () { return state.settings; },
    setSetting: function (k, v) { state.settings[k] = v; save(); },

    markExported: function () { state.lastExport = new Date().toISOString(); save(); },
    lastExport: function () { return state.lastExport; },

    recordSession: function (summary) {
      state.sessions.push(Object.assign({ ts: new Date().toISOString(), date: todayStr() }, summary));
      if (state.sessions.length > 200) state.sessions.shift();
      save();
    },

    // Recent accuracy (last N attempts) — drives session weighting.
    recentAccuracy: function (ruleId) {
      var r = state.rules[ruleId];
      if (!r || r.recent.length === 0) return null;
      var sum = r.recent.reduce(function (a, b) { return a + b; }, 0);
      return sum / r.recent.length;
    },

    logForRule: function (ruleId) {
      return state.log.filter(function (e) { return e.rule === ruleId; }).slice().reverse();
    },
    fullLog: function () { return state.log.slice().reverse(); },

    // Global day-streak across ALL practice (any rule).
    globalStreak: function () {
      if (!state.log.length) return 0;
      var days = {};
      state.log.forEach(function (e) { days[e.date] = true; });
      var streak = 0, cursor = todayStr();
      // allow the streak to count if practiced today OR yesterday (grace).
      if (!days[cursor]) {
        var y = new Date(); y.setDate(y.getDate() - 1);
        cursor = y.toISOString().slice(0, 10);
        if (!days[cursor]) return 0;
      }
      while (days[cursor]) {
        streak += 1;
        var d = new Date(cursor); d.setDate(d.getDate() - 1);
        cursor = d.toISOString().slice(0, 10);
      }
      return streak;
    },

    addDictEntry: function (entry) { state.addedDict.push(entry); save(); },
    addedDict: function () { return state.addedDict; },
    addPair: function (entry) { state.addedPairs.push(entry); save(); },
    addedPairs: function () { return state.addedPairs; },

    exportJSON: function () { return JSON.stringify(state, null, 2); },

    // Restore a backup produced by exportJSON. Returns true on success.
    importJSON: function (text) {
      var s;
      try { s = JSON.parse(text); } catch (e) { return false; }
      if (!s || typeof s !== "object" || !s.rules) return false;
      state = s;
      (window.RULES || []).forEach(function (r) {
        if (!state.rules[r.id]) state.rules[r.id] = blankRule();
      });
      if (!state.log) state.log = [];
      if (!state.sessions) state.sessions = [];
      if (!state.addedDict) state.addedDict = [];
      if (!state.addedPairs) state.addedPairs = [];
      state = upgrade(state);
      save();
      return true;
    },

    reset: function () { state = fresh(); save(); },

    _daysBetween: daysBetween
  };

  window.Store = Store;
})();
