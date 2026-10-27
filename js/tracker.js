/* tracker.js — the four skills' bands, margin (gap to 7.0), trend, readiness
   projection, weekly stats vs plan, essay error-tag frequency → drill boost,
   the diagnostic decision, and the data pack for the weekly AI report.
   ENGINE code — reads Store records; the plan itself lives in data/plan.js.
   Per-skill numbers are never bundled, except the official IELTS overall
   formula, which is shown as an *estimate*. */
(function () {
  "use strict";
  var P = window.PLAN || {};
  var SKILLS = ["listening", "reading", "writing", "speaking"];

  function round05(x) { return Math.round(x * 2) / 2; }
  function round1(x) { return Math.round(x * 10) / 10; }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function byTs(a, b) { return String(a.ts || "") < String(b.ts || "") ? -1 : 1; }

  /* ---------------- band conversions ---------------- */

  // Raw score (out of 40) → approximate band, from data/plan.js tables.
  function rawToBand(skill, raw) {
    var tbl = (P.band_tables || {})[skill === "reading" ? "reading_academic" : "listening"] || [];
    raw = Number(raw);
    if (!isFinite(raw)) return null;
    for (var i = 0; i < tbl.length; i++) if (raw >= tbl[i][0]) return tbl[i][1];
    return tbl.length ? Math.max(1, tbl[tbl.length - 1][1] - 0.5) : null;
  }

  // Official overall rounding: mean of the four; fraction <.25 → down,
  // <.75 → .5, otherwise → up (e.g. 6.125→6.0, 6.25→6.5, 6.75→7.0).
  function overallBand(b) {
    var vals = SKILLS.map(function (k) { return b && b[k]; });
    if (!vals.every(isNum)) return null;
    var avg = (vals[0] + vals[1] + vals[2] + vals[3]) / 4;
    var f = Math.floor(avg), frac = avg - f;
    if (frac < 0.25) return f;
    if (frac < 0.75) return f + 0.5;
    return f + 1;
  }

  // Writing = (Task 1 + 2 × Task 2) / 3, rounded to the nearest half band.
  function writingCombined(t1, t2) {
    if (!isNum(t1) && !isNum(t2)) return null;
    if (!isNum(t1)) return t2;
    if (!isNum(t2)) return t1;
    return round05((t1 + 2 * t2) / 3);
  }

  /* ---------------- series per skill ---------------- */

  function evalOverall(w) {
    return (w && w.eval && w.eval.bands && isNum(w.eval.bands.overall)) ? w.eval.bands.overall : null;
  }

  // [{date, ts, band, label, diagnostic, id}] sorted by time.
  // "writing" is the combined series: at each evaluated essay, combine the
  // latest Task 1 and Task 2 bands seen so far.
  function series(skill) {
    var out = [];
    if (skill === "listening" || skill === "reading") {
      Store.exams().forEach(function (e) {
        if (e.skill === skill && isNum(e.band))
          out.push({ date: e.date, ts: e.ts, band: e.band, label: e.source || "", diagnostic: !!e.diagnostic, id: e.id, raw: e.raw });
      });
    } else if (skill === "writing_t1" || skill === "writing_t2") {
      var task = skill === "writing_t1" ? 1 : 2;
      Store.writings().forEach(function (w) {
        var b = evalOverall(w);
        if (w.task === task && b !== null)
          out.push({ date: w.date, ts: w.ts, band: b, label: "Task " + task, diagnostic: !!w.diagnostic, id: w.id });
      });
    } else if (skill === "writing") {
      var t1 = null, t2 = null;
      Store.writings().filter(function (w) { return evalOverall(w) !== null; }).slice().sort(byTs).forEach(function (w) {
        if (w.task === 1) t1 = evalOverall(w); else t2 = evalOverall(w);
        out.push({ date: w.date, ts: w.ts, band: writingCombined(t1, t2), label: "Task " + w.task, diagnostic: !!w.diagnostic, id: w.id });
      });
    } else if (skill === "speaking") {
      Store.speaking().forEach(function (s) {
        if (s.bands && isNum(s.bands.overall))
          out.push({ date: s.date, ts: s.ts, band: s.bands.overall, label: s.kind || "", diagnostic: !!s.diagnostic, id: s.id });
      });
    }
    out.sort(byTs);
    return out;
  }

  // Least-squares line through (daysSinceFirst, band); only with ≥3 points
  // spanning ≥7 days — two points over three months is noise.
  function projection(ser, examDate) {
    if (!ser || ser.length < 3) return { status: ser && ser.length ? "insufficient" : "no_data" };
    var first = ser[0].date;
    var xs = ser.map(function (p) { return Plan.daysBetween(first, p.date); });
    var ys = ser.map(function (p) { return p.band; });
    if (xs[xs.length - 1] - xs[0] < 7) return { status: "insufficient" };
    var n = xs.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += xs[i]; my += ys[i]; }
    mx /= n; my /= n;
    var num = 0, den = 0;
    for (i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) * (xs[i] - mx); }
    var slope = den ? num / den : 0;
    var xe = Plan.daysBetween(first, examDate || Plan.examDate());
    var y = my + slope * (xe - mx);
    y = Math.max(3, Math.min(9, y));
    var target = (P.target || {}).primary || 7;
    return { status: y >= target ? "on_track" : "at_risk", atExam: round05(y), slopePerWeek: round1(slope * 7), n: n };
  }

  function skillSummary(skill) {
    var ser = series(skill);
    var target = (P.target || {}).primary || 7, stretch = (P.target || {}).stretch || 8;
    if (!ser.length) return { skill: skill, n: 0, latest: null, best: null, avg3: null, trend: null, gapTo7: null, gapTo8: null, projection: { status: "no_data" }, series: ser };
    var latest = ser[ser.length - 1].band;
    var best = ser.reduce(function (m, p) { return Math.max(m, p.band); }, -Infinity);
    var last3 = ser.slice(-3);
    var avg3 = round1(last3.reduce(function (a, p) { return a + p.band; }, 0) / last3.length);
    var trend = null;
    if (ser.length >= 2) {
      var prev = ser.slice(Math.max(0, ser.length - 4), ser.length - 1);
      var pavg = prev.reduce(function (a, p) { return a + p.band; }, 0) / prev.length;
      trend = round1(latest - pavg);          // + improving, − slipping
    }
    return {
      skill: skill, n: ser.length, latest: latest, best: best, avg3: avg3, trend: trend,
      gapTo7: round1(latest - target), gapTo8: round1(latest - stretch),
      lastDate: ser[ser.length - 1].date,
      projection: projection(ser), series: ser
    };
  }

  function allSummaries() {
    var out = {};
    SKILLS.forEach(function (k) { out[k] = skillSummary(k); });
    var latest = {};
    SKILLS.forEach(function (k) { latest[k] = out[k].latest; });
    out.overall = overallBand(latest);
    return out;
  }

  /* ---------------- week stats vs plan ---------------- */

  function inWeek(date, ws, we) { return date >= ws && date <= we; }

  function weekStats(date) {
    date = date || Plan.today();
    var ws = Plan.weekStart(date), we = Plan.weekEnd(date);
    var planned = Plan.plannedMinutes(date);
    var logged = 0, tasksDone = 0, tasksTotal = 0;
    var all = Store.allTasks();
    for (var i = 0; i < 7; i++) {
      var d = Plan.addDays(ws, i);
      var ts = Plan.tasksFor(d, { noDiagnostic: true });
      ts.forEach(function (t) {
        if (!t.optional) tasksTotal++;
        var st = all[t.key];
        if (st && st.done) { if (!t.optional) tasksDone++; logged += Number(st.minutes) || t.min || 0; }
      });
    }
    // diagnostic one-offs completed this week (keyed without a date → use ts)
    Object.keys(all).forEach(function (k) {
      if (k.indexOf("diagnostic|") !== 0) return;
      var st = all[k];
      if (st.done && st.ts && inWeek(String(st.ts).slice(0, 10), ws, we)) { logged += Number(st.minutes) || 0; tasksDone++; }
    });
    // drill sessions (timed by session.js)
    (Store.sessions() || []).forEach(function (s) {
      if (s.date && inWeek(s.date, ws, we) && s.seconds) logged += s.seconds / 60;
    });
    // weekly targets met, from the records themselves (not the checklist)
    var tests = {};
    Store.exams().forEach(function (e) {
      if (inWeek(e.date, ws, we) && (e.kind || "test") === "test") tests[e.testRef || (e.date + "|" + (e.source || ""))] = true;
    });
    var counts = { tests: Object.keys(tests).length, essays_t1: 0, essays_t2: 0, speaking: 0 };
    Store.writings().forEach(function (w) {
      if (inWeek(w.date, ws, we) && evalOverall(w) !== null) { if (w.task === 1) counts.essays_t1++; else counts.essays_t2++; }
    });
    Store.speaking().forEach(function (s) {
      if (inWeek(s.date, ws, we) && (s.kind === "tutor" || s.kind === "mock")) counts.speaking++;
    });
    var phase = Plan.phaseFor(date);
    var targets = Object.assign({}, Plan.weeklyTargets(phase));
    if (targets.speaking_every_weeks && (Plan.weekIndex(date) % targets.speaking_every_weeks) !== 0) targets.speaking = 0;
    delete targets.speaking_every_weeks;
    return {
      weekStart: ws, weekEnd: we, weekIndex: Plan.weekIndex(date), phase: phase.id,
      planned: planned, logged: Math.round(logged),
      tasksDone: tasksDone, tasksTotal: tasksTotal,
      targets: targets, counts: counts
    };
  }

  /* ---------------- essay error tags → drill boost ---------------- */

  function errorTagFrequency(lastN) {
    var ws = Store.writings().filter(function (w) { return w.eval && Array.isArray(w.eval.errors); }).slice(-(lastN || 5));
    var freq = {};
    ws.forEach(function (w) {
      w.eval.errors.forEach(function (e) {
        var t = String(e.tag || "OTHER").toUpperCase();
        freq[t] = (freq[t] || 0) + 1;
      });
    });
    return { freq: freq, n: ws.length };
  }

  // 0.5–2 multiplier consulted by Engine.weakness: report weights × tag frequency.
  function ruleBoost(ruleId) {
    var b = 1;
    var rw = ((Store.plan() || {}).ruleWeights || {})[ruleId];
    if (isNum(rw) && rw > 0) b *= rw;
    var tf = errorTagFrequency(5);
    if (tf.n) {
      var tags = P.error_tags || {}, count = 0;
      Object.keys(tags).forEach(function (t) { if (tags[t] === ruleId) count += tf.freq[t] || 0; });
      var perEssay = count / tf.n;
      if (perEssay >= 2) b *= 1.5; else if (perEssay >= 1) b *= 1.25;
    }
    return Math.min(2, Math.max(0.5, b));
  }

  /* ---------------- diagnostic decision ---------------- */

  function diagnosticBands() {
    var ph = Plan.phaseById("diagnostic");
    function inDiag(x) { return !!x.diagnostic || (ph && x.date >= ph.from && x.date <= ph.to); }
    var L = null, R = null, T1 = null, T2 = null, S = null;
    Store.exams().slice().sort(byTs).forEach(function (e) {
      if (!inDiag(e) || !isNum(e.band)) return;
      if (e.skill === "listening") L = e.band; if (e.skill === "reading") R = e.band;
    });
    Store.writings().slice().sort(byTs).forEach(function (w) {
      var b = evalOverall(w);
      if (!inDiag(w) || b === null) return;
      if (w.task === 1) T1 = b; else T2 = b;
    });
    Store.speaking().slice().sort(byTs).forEach(function (s) {
      if (inDiag(s) && s.bands && isNum(s.bands.overall)) S = s.bands.overall;
    });
    var W = writingCombined(T1, T2);
    var vals = [L, R, W, S].filter(isNum);
    var complete = vals.length === 4;
    var min = vals.length ? Math.min.apply(null, vals) : null;
    return {
      listening: L, reading: R, writing: W, writing_t1: T1, writing_t2: T2, speaking: S,
      complete: complete, min: min, overall: complete ? overallBand({ listening: L, reading: R, writing: W, speaking: S }) : null,
      decision: complete ? Plan.decision(min) : null
    };
  }

  /* ---------------- data pack for the weekly AI report ---------------- */

  function dataPack(days) {
    days = days || 14;
    var to = Plan.today(), from = Plan.addDays(to, -(days - 1));
    var ph = Plan.phaseFor(to);
    var skills = {};
    SKILLS.forEach(function (k) {
      var s = skillSummary(k);
      skills[k] = {
        latest: s.latest, best: s.best, avg3: s.avg3, trend: s.trend, gapTo7: s.gapTo7, n: s.n,
        projection: s.projection.status === "on_track" || s.projection.status === "at_risk" ? s.projection : undefined,
        recent: s.series.slice(-6).map(function (p) { return { date: p.date, band: p.band, label: p.label }; })
      };
    });
    var weeks = [weekStats(Plan.addDays(to, -7)), weekStats(to)].map(function (w) {
      return { week: w.weekStart + " → " + w.weekEnd, plannedMin: w.planned, loggedMin: w.logged,
               tasksDone: w.tasksDone, tasksTotal: w.tasksTotal, targets: w.targets, counts: w.counts };
    });
    var drills = {};
    (window.RULES || []).forEach(function (r) {
      var c = Store.modeAccuracy(r.id, "calm", 30), l = Store.modeAccuracy(r.id, "load", 30);
      drills[r.id] = { label: r.label, calm_pct: c ? Math.round(c.accuracy * 100) : null,
                       load_pct: l ? Math.round(l.accuracy * 100) : null, attempts: Store.ruleStat(r.id).attempts };
    });
    var tags = errorTagFrequency(5);
    var recentWritings = Store.writings().filter(function (w) { return w.date >= from && evalOverall(w) !== null; })
      .slice(-5).map(function (w) {
        return { date: w.date, task: w.task, bands: w.eval.bands, timed: !!w.timed,
                 top_fixes_ar: (w.eval.fixes_ar || []).slice(0, 2), finance_bias: !!(w.eval.finance_bias && w.eval.finance_bias.flag) };
      });
    var latest = {}; SKILLS.forEach(function (k) { latest[k] = skills[k].latest; });
    return {
      generated: to, period: { from: from, to: to }, phase: ph.id, phase_name_ar: ph.name_ar,
      days_to_exam: Plan.daysToExam(to), exam_date: Plan.examDate(), exam_date_confirmed: Plan.examDateIsSet(),
      target: P.target, overall_estimate: overallBand(latest),
      skills: skills, weeks: weeks, drills: drills,
      error_tags_last5_essays: tags.freq, essays_analysed: tags.n, recent_writings: recentWritings,
      vocab: { bank: (window.itemsForRule ? window.itemsForRule("vocab_awl").length : 0), added_from_essays: Store.addedVocab().length },
      day_streak: Store.globalStreak()
    };
  }

  window.Tracker = {
    SKILLS: SKILLS,
    rawToBand: rawToBand, overallBand: overallBand, writingCombined: writingCombined, round05: round05,
    series: series, skillSummary: skillSummary, allSummaries: allSummaries, projection: projection,
    weekStats: weekStats, errorTagFrequency: errorTagFrequency, ruleBoost: ruleBoost,
    diagnosticBands: diagnosticBands, dataPack: dataPack
  };
})();
