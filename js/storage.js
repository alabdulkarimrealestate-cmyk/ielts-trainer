/* storage.js — localStorage persistence: per-rule stats + full answer/reasoning log
   + exam-prep records: daily tasks, practice tests, writings, speaking sessions,
   AI reports, user-added vocabulary, and plan settings (exam date, hours…).
   Every new collection here must also be merged in sync.js (mergeStates). */
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
  function genId(prefix) {
    return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  // size caps — the whole state is pushed to a Gist (truncated above ~1 MB)
  var CAPS = { log: 5000, sessions: 200, exams: 500, writings: 100, speaking: 300, reports: 60, chats: 100, chatMessages: 40, essayChars: 2500 };

  function blankRule() {
    return { attempts: 0, correct: 0, streak: 0, lastPracticed: null, recent: [] };
  }
  function blankPlan() {
    return { examDate: null, hours: {}, ruleWeights: {}, diagnosticDone: false };
  }

  function fresh() {
    var s = {
      rules: {}, log: [], sessions: [], addedDict: [], addedPairs: [],
      leitner: {},           // itemId -> { box: 1..5, due: "YYYY-MM-DD" }
      stageStatus: {},       // stageId -> user-confirmed status override
      settings: { sessionMinutes: 15, loadItems: 10, loadSeconds: 300 },
      lastExport: null,
      // ---- exam-prep layer ----
      tasks: {},             // "YYYY-MM-DD|taskId" | "diagnostic|taskId" -> { done, minutes, ts, note }
      exams: [],             // practice tests: { id, ts, date, skill, raw, total, band, source, ... }
      writings: [],          // essays + evaluations
      speaking: [],          // tutor / self / AI-transcript sessions
      reports: [],           // weekly AI reports
      addedVocab: [],        // drill items (rule "vocab_awl") added from evaluations
      chats: [],             // in-page Socratic error chats: { id, ts, date, itemId, rule, messages[] }
      plan: blankPlan()
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
    ["log", "sessions", "addedDict", "addedPairs", "exams", "writings", "speaking", "reports", "addedVocab", "chats"]
      .forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    if (!s.tasks || typeof s.tasks !== "object") s.tasks = {};
    s.plan = Object.assign(blankPlan(), s.plan || {});
    if (!s.plan.hours || typeof s.plan.hours !== "object") s.plan.hours = {};
    if (!s.plan.ruleWeights || typeof s.plan.ruleWeights !== "object") s.plan.ruleWeights = {};
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
    return upgrade(s);
  }

  var state = load();

  // User-added drill items (confusable pairs, vocabulary from evaluations) must
  // be drillable after a reload AND after a sync merge — config.js only knows
  // the bundled banks. Called on load, import, add and reset.
  function syncUserItems() {
    var all = window.ALL_ITEMS;
    if (!all) return;
    var have = {};
    all.forEach(function (i) { if (i && i.id) have[i.id] = true; });
    (state.addedPairs || []).concat(state.addedVocab || []).forEach(function (it) {
      if (it && it.id && !have[it.id]) { all.push(it); have[it.id] = true; }
    });
  }
  function removeUserItems() {
    var all = window.ALL_ITEMS;
    if (!all) return;
    var ids = {};
    (state.addedPairs || []).concat(state.addedVocab || []).forEach(function (it) { if (it && it.id) ids[it.id] = true; });
    for (var i = all.length - 1; i >= 0; i--) if (all[i] && ids[all[i].id]) all.splice(i, 1);
  }
  syncUserItems();

  function cap(list, n) { if (list.length > n) list.splice(0, list.length - n); }

  function save() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    // notify sync layer (set by sync.js) — never let it break a save
    try { if (Store.onChange) Store.onChange(); } catch (e) {}
  }

  function stamp(obj) {
    return Object.assign({ ts: new Date().toISOString(), date: todayStr() }, obj);
  }
  function findById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function removeById(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) { list.splice(i, 1); return true; }
    return false;
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
      if (state.log.length > CAPS.log) state.log = state.log.slice(-CAPS.log);
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
      if (state.sessions.length > CAPS.sessions) state.sessions.shift();
      save();
    },
    sessions: function () { return state.sessions; },

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
    addPair: function (entry) { state.addedPairs.push(entry); syncUserItems(); save(); },
    addedPairs: function () { return state.addedPairs; },

    /* ---------------- exam-prep layer ---------------- */

    // Daily checklist. Never deletes a key (a deletion would be resurrected by
    // the other device on merge) — un-ticking writes done:false with a new ts.
    setTask: function (key, patch) {
      var cur = state.tasks[key] || { done: false, minutes: 0 };
      state.tasks[key] = Object.assign({}, cur, patch || {}, { ts: new Date().toISOString() });
      save();
      return state.tasks[key];
    },
    taskState: function (key) { return state.tasks[key] || null; },
    tasksOn: function (date) {
      var out = {};
      Object.keys(state.tasks).forEach(function (k) { if (k.indexOf(date + "|") === 0) out[k] = state.tasks[k]; });
      return out;
    },
    allTasks: function () { return state.tasks; },

    addExam: function (e) {
      e = stamp(Object.assign({ id: genId("ex") }, e));
      state.exams.push(e); cap(state.exams, CAPS.exams); save();
      return e;
    },
    exams: function () { return state.exams; },
    removeExam: function (id) { if (removeById(state.exams, id)) save(); },

    addWriting: function (w) {
      w = stamp(Object.assign({ id: genId("wr") }, w));
      if (w.essay && w.essay.length > CAPS.essayChars) w.essay = w.essay.slice(0, CAPS.essayChars);
      state.writings.push(w); cap(state.writings, CAPS.writings); save();
      return w;
    },
    updateWriting: function (id, patch) {
      var w = findById(state.writings, id);
      if (!w) return null;
      Object.assign(w, patch || {}, { updatedAt: new Date().toISOString() });
      if (w.essay && w.essay.length > CAPS.essayChars) w.essay = w.essay.slice(0, CAPS.essayChars);
      save();
      return w;
    },
    writings: function () { return state.writings; },
    writing: function (id) { return findById(state.writings, id); },
    removeWriting: function (id) { if (removeById(state.writings, id)) save(); },

    addSpeaking: function (s) {
      s = stamp(Object.assign({ id: genId("sp") }, s));
      state.speaking.push(s); cap(state.speaking, CAPS.speaking); save();
      return s;
    },
    speaking: function () { return state.speaking; },
    removeSpeaking: function (id) { if (removeById(state.speaking, id)) save(); },

    addReport: function (r) {
      r = stamp(Object.assign({ id: genId("rp") }, r));
      state.reports.push(r); cap(state.reports, CAPS.reports); save();
      return r;
    },
    reports: function () { return state.reports; },

    // Socratic error chats (messages: [{ role: "user"|"model", text }]).
    addChat: function (c) {
      c = stamp(Object.assign({ id: genId("ch") }, c));
      c.messages = (c.messages || []).slice(-CAPS.chatMessages);
      state.chats.push(c); cap(state.chats, CAPS.chats); save();
      return c;
    },
    updateChat: function (id, patch) {
      var c = findById(state.chats, id);
      if (!c) return null;
      Object.assign(c, patch || {}, { updatedAt: new Date().toISOString() });
      c.messages = (c.messages || []).slice(-CAPS.chatMessages);
      save();
      return c;
    },
    chats: function () { return state.chats; },
    removeChat: function (id) { if (removeById(state.chats, id)) save(); },

    // Vocabulary items from evaluations: { word, gloss_ar, sentence_with_gap, correct_answer, distractors, explanation }.
    // Deduped by word (case-insensitive) against bundled + added items. Returns the number added.
    addVocab: function (items) {
      var have = {};
      (window.ALL_ITEMS || []).concat(state.addedVocab).forEach(function (i) {
        if (i && i.rule === "vocab_awl" && (i.word || i.correct_answer)) have[String(i.word || i.correct_answer).toLowerCase()] = true;
      });
      var added = 0;
      (items || []).forEach(function (v) {
        if (!v || !v.word || !v.sentence_with_gap || !v.correct_answer) return;
        var k = String(v.word).toLowerCase();
        if (have[k]) return;
        have[k] = true;
        state.addedVocab.push({
          id: genId("uv"), rule: "vocab_awl", word: v.word, gloss_ar: v.gloss_ar || "",
          sentence_with_gap: v.sentence_with_gap, correct_answer: v.correct_answer,
          distractors: (v.distractors || []).slice(0, 3), explanation: v.explanation || v.gloss_ar || "",
          source: v.source || "ai", addedOn: todayStr()
        });
        added++;
      });
      if (added) { syncUserItems(); save(); }
      return added;
    },
    addedVocab: function () { return state.addedVocab; },

    plan: function () { return state.plan; },
    // 2-level merge for hours / ruleWeights so a partial patch never wipes the rest.
    setPlan: function (patch) {
      patch = patch || {};
      var p = Object.assign({}, state.plan, patch);
      if (patch.hours) p.hours = Object.assign({}, state.plan.hours || {}, patch.hours);
      if (patch.ruleWeights) p.ruleWeights = Object.assign({}, state.plan.ruleWeights || {}, patch.ruleWeights);
      state.plan = p; save();
      return state.plan;
    },

    exportJSON: function () { return JSON.stringify(state, null, 2); },

    // Restore a backup produced by exportJSON. Returns true on success.
    importJSON: function (text) {
      var s;
      try { s = JSON.parse(text); } catch (e) { return false; }
      if (!s || typeof s !== "object" || !s.rules) return false;
      removeUserItems();
      state = s;
      (window.RULES || []).forEach(function (r) {
        if (!state.rules[r.id]) state.rules[r.id] = blankRule();
      });
      state = upgrade(state);
      syncUserItems();
      save();
      return true;
    },

    reset: function () { removeUserItems(); state = fresh(); save(); },

    todayStr: todayStr,
    genId: genId,
    CAPS: CAPS,
    _daysBetween: daysBetween
  };

  window.Store = Store;
})();
