/* plan.js — exam-plan engine: phase for a date, today's checklist, week math,
   planned minutes (derived from the rota), the diagnostic → exam-date decision.
   ENGINE code — the plan itself lives in data/plan.js.
   All dates are LOCAL calendar strings "YYYY-MM-DD" (never toISOString, which
   is UTC and is a day behind between 00:00 and 03:00 Kuwait time). */
(function () {
  "use strict";
  var P = window.PLAN || { phases: [], fixed_daily: {}, rota: {}, exam: {} };

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function toUTC(s) { var p = String(s).split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function fromUTC(ms) { var d = new Date(ms); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function daysBetween(a, b) { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }
  function addDays(s, n) { return fromUTC(toUTC(s) + n * 86400000); }
  function weekday(s) { return new Date(toUTC(s)).getUTCDay(); }   // 0 = Sunday
  function isYmd(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")); }

  // "today" — overridable with ?date=YYYY-MM-DD for testing/planning ahead.
  function today() {
    var m = /[?&]date=(\d{4}-\d{2}-\d{2})/.exec(location.search || "");
    return m ? m[1] : ymd(new Date());
  }

  function planState() { return (window.Store && window.Store.plan) ? (window.Store.plan() || {}) : {}; }
  function examDate() { var e = planState().examDate; return isYmd(e) ? e : P.exam.provisionalDate; }
  function examDateIsSet() { return isYmd(planState().examDate); }
  function daysToExam(date) { return daysBetween(date || today(), examDate()); }

  function phaseById(id) {
    for (var i = 0; i < P.phases.length; i++) if (P.phases[i].id === id) return P.phases[i];
    return null;
  }

  /* Priority: after the exam → after_result (or cma once it starts);
     from examModeFrom until exam day → exam_mode (fixed start, user decision);
     otherwise the dated phase; before the plan → rest. */
  function phaseFor(date) {
    date = date || today();
    var ex = examDate();
    var cma = phaseById("cma"), after = phaseById("after_result"), exam = phaseById("exam_mode");
    if (date > ex) {
      if (cma && date >= cma.from && date <= cma.to) return cma;
      return after || { id: "beyond", name_ar: "بعد الخطة", hours: 0, weekly_targets: {} };
    }
    var from = (P.exam && P.exam.examModeFrom) || (exam && exam.from);
    if (exam && from && date >= from) return exam;
    for (var i = 0; i < P.phases.length; i++) {
      var p = P.phases[i];
      if (p.from && p.to && date >= p.from && date <= p.to) return p;
    }
    if (P.phases.length && date < P.phases[0].from) return P.phases[0];
    return { id: "beyond", name_ar: "خارج الخطة", hours: 0, weekly_targets: {} };
  }

  function phaseRange(phase) {
    var from = phase.from, to = phase.to;
    if (phase.id === "exam_mode") { from = (P.exam && P.exam.examModeFrom) || from; to = examDate(); }
    if (phase.id === "after_result") { from = addDays(examDate(), 1); to = null; }
    return { from: from, to: to };
  }

  function hoursFor(phase) {
    var o = planState().hours || {};
    return (o[phase.id] != null && o[phase.id] !== "") ? +o[phase.id] : (phase.hours || 0);
  }

  function weekStart(date) { date = date || today(); return addDays(date, -weekday(date)); }
  function weekEnd(date) { return addDays(weekStart(date), 6); }
  function weekIndex(date) {
    var s0 = weekStart(P.start || "2026-11-01");
    return Math.floor(daysBetween(s0, weekStart(date || today())) / 7) + 1;
  }

  function taskKey(date, t) { return (t.scope === "diagnostic" ? "diagnostic" : date) + "|" + t.id; }
  function withKey(t, date, scope) {
    var c = Object.assign({}, t);
    if (scope) c.scope = scope;
    c.key = taskKey(date, c);
    return c;
  }
  function taskDone(key) {
    var st = (window.Store && window.Store.taskState) ? window.Store.taskState(key) : null;
    return !!(st && st.done);
  }

  // Today's checklist: fixed-daily (respecting `days`) + rota for the weekday
  // (respecting `every_weeks`) + undone diagnostic one-offs during that phase.
  function tasksFor(date, opts) {
    date = date || today(); opts = opts || {};
    var ph = phaseFor(date), wd = weekday(date), wi = weekIndex(date), out = [];
    ((P.fixed_daily || {})[ph.id] || []).forEach(function (t) {
      if (t.days && t.days.indexOf(wd) === -1) return;
      out.push(withKey(t, date));
    });
    (((P.rota || {})[ph.id] || {})[wd] || []).forEach(function (t) {
      if (t.every_weeks && (wi % t.every_weeks) !== 0) return;
      out.push(withKey(t, date));
    });
    if (ph.id === "diagnostic" && !opts.noDiagnostic) {
      (P.diagnostic_tasks || []).forEach(function (t) {
        var c = withKey(t, date, "diagnostic");
        if (opts.includeDone || !taskDone(c.key)) out.push(c);
      });
    }
    return out;
  }

  // Planned minutes for the week containing `date` — the rota sum (single
  // source of truth), optional tasks excluded, diagnostic one-offs counted once.
  function plannedMinutes(date) {
    var ws = weekStart(date || today()), sum = 0, diagCounted = false;
    for (var i = 0; i < 7; i++) {
      var d = addDays(ws, i), ph = phaseFor(d);
      tasksFor(d, { noDiagnostic: true }).forEach(function (t) { if (!t.optional) sum += t.min || 0; });
      if (ph.id === "diagnostic" && !diagCounted) {
        (P.diagnostic_tasks || []).forEach(function (t) { sum += t.min || 0; });
        diagCounted = true;
      }
    }
    return sum;
  }

  function weeklyTargets(phase) { return (phase && phase.weekly_targets) || {}; }

  // Lowest diagnostic band → booking rule (first match wins; rules sorted desc by min).
  function decision(minBand) {
    var rules = P.decision_rule || [];
    for (var i = 0; i < rules.length; i++) if (minBand >= rules[i].min) return rules[i];
    return rules[rules.length - 1] || null;
  }

  window.Plan = {
    today: today, ymd: ymd, addDays: addDays, daysBetween: daysBetween, weekday: weekday, isYmd: isYmd,
    examDate: examDate, examDateIsSet: examDateIsSet, daysToExam: daysToExam,
    phaseFor: phaseFor, phaseById: phaseById, phaseRange: phaseRange, phases: function () { return P.phases; },
    hoursFor: hoursFor, weekStart: weekStart, weekEnd: weekEnd, weekIndex: weekIndex,
    tasksFor: tasksFor, taskKey: taskKey, plannedMinutes: plannedMinutes,
    weeklyTargets: weeklyTargets, decision: decision
  };
})();
