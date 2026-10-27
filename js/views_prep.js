/* views_prep.js — exam-prep screens: Today, Plan, Log, Writing, Progress, AI
   report, More. Registers EXTRA_ROUTES / EXTRA_VIEWS that app.js merges
   (this file loads before app.js; views run only after boot).
   Rendering rule: text that came from an AI reply, a pasted reply or any user
   record goes through textContent — never innerHTML. */
(function () {
  "use strict";

  /* ---------------- tiny DOM helpers ---------------- */
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function btn(label, cls, onClick) { var b = el("button", "btn " + (cls || ""), label); b.type = "button"; b.onclick = onClick; return b; }
  function card(title, cls) { var c = el("div", "pcard " + (cls || "")); if (title) c.appendChild(el("h3", "pcard-title", title)); return c; }
  function noteP(text, cls) { return el("p", cls || "muted-p", text); }
  function go(route, arg) { window.App.go(route, arg); }
  function hrs(min) { return (Math.round(((min || 0) / 60) * 10) / 10) + " س"; }
  function fmtBand(b) { return (b == null || !isFinite(b)) ? "—" : (Math.round(b * 2) / 2).toFixed(1); }
  function ltr(txt, cls) { return el("span", "ltr " + (cls || ""), txt); }

  var SKILL_LBL = { listening: "الاستماع (Listening)", reading: "القراءة (Reading)", writing: "الكتابة (Writing)", speaking: "المحادثة (Speaking)" };
  var SKILL_SHORT = { listening: "Listening", reading: "Reading", writing: "Writing", speaking: "Speaking" };
  var WEEKDAY_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  var TARGET_AR = { tests: "اختبارات L/R", essays_t1: "مقالات Task 1", essays_t2: "مقالات Task 2", speaking: "جلسات Speaking" };
  var CRIT_AR = { task: "الاستجابة / الإنجاز", coherence: "التماسك والربط", lexical: "الثروة اللغوية", grammar: "دقّة وتنوّع القواعد", overall: "الإجمالي" };
  var SP_AR = { fluency: "الطلاقة والتماسك", lexical: "الثروة اللغوية", grammar: "القواعد", pronunciation: "النطق", overall: "الإجمالي" };
  var KIND_AR = { tutor: "مدرّس italki", mock: "Mock مع المدرّس", self: "تسجيل ذاتي", ai: "تقييم نصّ بالذكاء" };

  function target() { return ((window.PLAN || {}).target || {}).primary || 7; }
  function gapClass(g) { return g == null ? "" : g >= 0 ? "good" : g >= -0.5 ? "warn" : "bad"; }
  function gapText(g) {
    if (g == null) return "لا بيانات بعد";
    if (g >= 0) return "✓ فوق الهدف بـ " + g.toFixed(1);
    return "▼ تحت الهدف بـ " + Math.abs(g).toFixed(1);
  }
  function bandClass(b) { return b == null ? "" : b >= target() ? "good" : b >= target() - 0.5 ? "warn" : "bad"; }

  function bandSelect(value, allowEmpty) {
    var s = el("select", "stage-select");
    if (allowEmpty) { var o0 = el("option", null, "—"); o0.value = ""; s.appendChild(o0); }
    for (var b = 9; b >= 3; b -= 0.5) {
      var o = el("option", null, b.toFixed(1)); o.value = String(b);
      if (value != null && value !== "" && +value === b) o.selected = true;
      s.appendChild(o);
    }
    return s;
  }
  function numInput(v, min, max, placeholder) {
    var i = el("input", "text-input ltr"); i.type = "number";
    if (min != null) i.min = min; if (max != null) i.max = max;
    if (v != null && v !== "") i.value = v; if (placeholder) i.placeholder = placeholder;
    return i;
  }
  function dateInput(v) { var i = el("input", "text-input ltr"); i.type = "date"; if (v) i.value = v; return i; }
  function textInput(ph, v) { var i = el("input", "text-input"); if (ph) i.placeholder = ph; if (v) i.value = v; return i; }
  function textArea(ph, rows, cls) { var t = el("textarea", "big-input " + (cls || "")); t.rows = rows || 4; if (ph) t.placeholder = ph; return t; }
  function field(label, input) { var w = el("div", "field"); w.appendChild(el("label", null, label)); w.appendChild(input); return w; }
  function aiErr(e) { return (e && (e.ar || e.message)) || "خطأ غير متوقع"; }
  function stripCtl(s) { return String(s == null ? "" : s).replace(/[<>&"]/g, ""); }

  /* ---------------- mini line chart: one series + the 7.0 guide ---------------- */
  function lineChart(series, label) {
    var W = 300, H = 96, padL = 26, padR = 16, padT = 10, padB = 16;
    var pts = (series || []).slice(-10), yMin = 4, yMax = 9, n = pts.length;
    function y(b) { return padT + (yMax - Math.max(yMin, Math.min(yMax, b))) / (yMax - yMin) * (H - padT - padB); }
    function x(i) { return n <= 1 ? padL + (W - padL - padR) / 2 : padL + i * (W - padL - padR) / (n - 1); }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="mini-chart" role="img" aria-label="' + stripCtl(label) + '">';
    [5, 6, 7, 8].forEach(function (g) {
      s += '<line x1="' + padL + '" y1="' + y(g).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y(g).toFixed(1) + '" class="grid' + (g === target() ? " target" : "") + '"/>';
      s += '<text x="' + (padL - 6) + '" y="' + (y(g) + 4).toFixed(1) + '" class="ylab" text-anchor="end">' + g + '</text>';
    });
    if (n) {
      var d = pts.map(function (p, i) { return (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p.band).toFixed(1); }).join(" ");
      s += '<path d="' + d + '" class="series"/>';
      pts.forEach(function (p, i) {
        s += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(p.band).toFixed(1) + '" r="4.5" class="dot' + (p.diagnostic ? " diag" : "") + '">' +
             '<title>' + stripCtl(p.date) + ' · ' + fmtBand(p.band) + (p.label ? ' · ' + stripCtl(p.label) : '') + '</title></circle>';
      });
      var last = pts[n - 1];
      s += '<text x="' + Math.min(W - padR - 4, x(n - 1) + 8).toFixed(1) + '" y="' + Math.max(10, y(last.band) - 8).toFixed(1) + '" class="vlab">' + fmtBand(last.band) + '</text>';
    } else {
      s += '<text x="' + (W / 2) + '" y="' + (H / 2 + 4) + '" class="empty-lab" text-anchor="middle">لا بيانات بعد</text>';
    }
    return s + '</svg>';
  }

  // progress meter (value vs max) with a text label — the "planned vs logged" form
  function meter(value, max, text) {
    var wrap = el("div", "meter-wrap");
    var m = el("div", "meter"); var fill = el("span");
    var pct = max ? Math.min(100, Math.round(value / max * 100)) : 0;
    fill.style.width = pct + "%"; if (pct >= 100) fill.className = "full";
    m.appendChild(fill); wrap.appendChild(m); wrap.appendChild(el("div", "meter-txt", text));
    return wrap;
  }

  // simple countdown: returns { node, start(seconds, label, onDone), stop() }
  function timerBox() {
    var node = el("div", "timer-box hidden"), phase = el("div", "timer-phase"), big = el("div", "timer-big ltr", "00:00");
    node.appendChild(phase); node.appendChild(big);
    var tm = null, left = 0, cb = null;
    function paint() { var mm = Math.floor(left / 60), ss = left % 60; big.textContent = (mm < 10 ? "0" : "") + mm + ":" + (ss < 10 ? "0" : "") + ss; big.classList.toggle("danger", left <= 30); }
    function stop() { if (tm) { clearInterval(tm); tm = null; } }
    function start(seconds, label, onDone) {
      stop(); left = seconds; cb = onDone; phase.textContent = label || ""; node.classList.remove("hidden"); paint();
      tm = setInterval(function () { left--; paint(); if (left <= 0) { stop(); if (cb) cb(); } }, 1000);
    }
    return { node: node, start: start, stop: stop, hide: function () { stop(); node.classList.add("hidden"); } };
  }

  /* ---------------- task actions ---------------- */
  function runAction(t) {
    var a = t.action || "none";
    if (a === "session") return go("session");
    if (a === "load") return go("load");
    if (a.indexOf("rule:") === 0) {
      var rid = a.slice(5);
      if (window.RULE_MAP && window.RULE_MAP[rid] && window.itemsForRule(rid).length) return window.App.startRule(rid);
      return go("practice");
    }
    if (a === "writing:1" || a === "writing:2") return go("writing", { task: +a.slice(8), taskKey: t.key, minutes: t.min });
    if (a === "log:exam") return go("log", { tab: "exam", taskKey: t.key, minutes: t.min, skill: t.skill, kind: t.kind });
    if (a === "log:speaking") return go("log", { tab: "speaking", taskKey: t.key, minutes: t.min });
    if (a === "cards") return go("log", { tab: "cards", taskKey: t.key, minutes: t.min });
  }
  function actionLabel(a) {
    a = a || "none";
    if (a === "session") return "ابدأ الجلسة";
    if (a === "load") return "جلسة ضغط";
    if (a.indexOf("rule:") === 0) return "تدرّب";
    if (a.indexOf("writing:") === 0) return "اكتب";
    if (a === "log:exam") return "سجّل الدرجة";
    if (a === "log:speaking") return "سجّل الباندات";
    if (a === "cards") return "بطاقة + مؤقّت";
    return null;
  }
  function markTaskDone(key, minutes) {
    if (!key) return;
    var cur = Store.taskState(key) || {};
    Store.setTask(key, { done: true, minutes: minutes || cur.minutes || 0 });
  }

  /* ================================================================
     TODAY
     ================================================================ */
  function todayView() {
    var view = window.App.view();
    var wrap = el("div", "page");
    var date = Plan.today(), ph = Plan.phaseFor(date), wk = Tracker.weekStats(date);
    var overridden = /[?&]date=/.test(location.search || "");

    // phase banner
    var banner = el("div", "phase-banner");
    var top = el("div", "pb-top");
    top.appendChild(el("div", "pb-name", ph.name_ar || ph.id));
    top.appendChild(el("div", "pb-week", WEEKDAY_AR[Plan.weekday(date)] + " · " + date + (wk.weekIndex > 0 ? " · الأسبوع " + wk.weekIndex : "")));
    banner.appendChild(top);
    if (ph.focus_ar) banner.appendChild(el("div", "pb-focus", ph.focus_ar));
    var dte = Plan.daysToExam(date);
    banner.appendChild(el("div", "countdown-line",
      (dte >= 0 ? "⏳ " + dte + " يومًا للامتحان" : "✅ الامتحان مضى منذ " + Math.abs(dte) + " يومًا") +
      " (" + Plan.examDate() + (Plan.examDateIsSet() ? "" : " — مبدئي حتى التشخيص") + ")"));
    if (wk.planned > 0 || wk.logged > 0)
      banner.appendChild(meter(wk.logged, wk.planned, "هذا الأسبوع: " + hrs(wk.logged) + " من " + hrs(wk.planned) + " مخطّطة · مهام " + wk.tasksDone + "/" + wk.tasksTotal));
    var tkeys = Object.keys(wk.targets).filter(function (k) { return wk.targets[k] > 0; });
    if (tkeys.length) {
      var chips = el("div", "target-chips");
      tkeys.forEach(function (k) {
        var c = wk.counts[k] || 0, t = wk.targets[k];
        chips.appendChild(el("span", "tchip" + (c >= t ? " met" : ""), (TARGET_AR[k] || k) + " " + c + "/" + t));
      });
      banner.appendChild(chips);
    }
    if (overridden) banner.appendChild(el("div", "pb-note", "⚠ تعرض يومًا مختلفًا (?date=) — للتجربة فقط"));
    wrap.appendChild(banner);

    // diagnostic decision card
    var diag = Tracker.diagnosticBands();
    if ((ph.id === "diagnostic" || diag.complete) && !Plan.examDateIsSet()) wrap.appendChild(decisionCard(diag, true));

    // checklist
    var tasks = Plan.tasksFor(date);
    var tc = card("مهام اليوم");
    if (!tasks.length) tc.appendChild(noteP("لا مهام مخطّطة اليوم — جلسة القواعد ١٥ دقيقة تبقى خيارًا جيدًا."));
    var list = el("div", "task-list");
    tasks.forEach(function (t) {
      var st = Store.taskState(t.key) || {};
      var row = el("div", "task-row" + (st.done ? " done" : "") + (t.optional ? " optional" : ""));
      var chk = el("input"); chk.type = "checkbox"; chk.className = "task-chk"; chk.checked = !!st.done;
      chk.onchange = function () {
        Store.setTask(t.key, { done: chk.checked, minutes: chk.checked ? (Number(minIn.value) || t.min || 0) : (Number(minIn.value) || 0) });
        go("today");
      };
      var main = el("div", "task-main");
      main.appendChild(el("div", "task-lbl", t.label_ar + (t.optional ? " (اختياري)" : "")));
      var sub = el("div", "task-sub");
      var minIn = numInput(st.minutes != null && st.done ? st.minutes : t.min, 0, 600);
      minIn.className = "task-min ltr"; minIn.title = "الدقائق";
      minIn.onchange = function () { if (st.done || chk.checked) Store.setTask(t.key, { done: true, minutes: Number(minIn.value) || 0 }); };
      sub.appendChild(minIn); sub.appendChild(el("span", "task-unit", "د"));
      main.appendChild(sub);
      row.appendChild(chk); row.appendChild(main);
      var lbl = actionLabel(t.action);
      if (lbl) row.appendChild(btn(lbl, "small task-act", function () { runAction(t); }));
      list.appendChild(row);
    });
    tc.appendChild(list);
    wrap.appendChild(tc);

    // the drill widgets that used to be the home screen
    window.App.homeWidgets(wrap);
    view.appendChild(wrap);
  }

  function decisionCard(diag, withSetter) {
    var c = card("بوابة القرار بعد التشخيص", "decision-card");
    var grid = el("div", "diag-grid");
    ["listening", "reading", "writing", "speaking"].forEach(function (k) {
      var b = el("div", "diag-cell " + bandClass(diag[k]));
      b.appendChild(el("div", "dc-name", SKILL_SHORT[k]));
      b.appendChild(el("div", "dc-band", fmtBand(diag[k])));
      grid.appendChild(b);
    });
    c.appendChild(grid);
    if (diag.writing_t1 != null || diag.writing_t2 != null)
      c.appendChild(noteP("Writing = (Task 1 " + fmtBand(diag.writing_t1) + " + 2 × Task 2 " + fmtBand(diag.writing_t2) + ") ÷ 3"));
    if (!diag.complete) {
      c.appendChild(noteP("سجّل النتائج الأربع (Listening، Reading، Task 1 + Task 2، Speaking من المدرّس) ليظهر القرار."));
      return c;
    }
    var d = diag.decision;
    c.appendChild(el("div", "decision-line", "أدنى مهارة: " + fmtBand(diag.min) + " · التقدير الإجمالي: " + fmtBand(diag.overall)));
    c.appendChild(el("div", "decision-rule", d.label_ar));
    c.appendChild(noteP(d.cma_ar));
    if (withSetter) {
      var di = dateInput(d.suggest);
      c.appendChild(field("ثبّت تاريخ الامتحان (المقترح: " + d.suggest + ")", di));
      c.appendChild(btn("حفظ تاريخ الامتحان", "primary wide", function () {
        if (!Plan.isYmd(di.value)) { alert("اختر تاريخًا صالحًا."); return; }
        Store.setPlan({ examDate: di.value, diagnosticDone: true }); go("today");
      }));
    }
    return c;
  }

  /* ================================================================
     PLAN (timeline, settings, AI key, resources)
     ================================================================ */
  function planView() {
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "الخطة — من اليوم إلى الامتحان"));
    var today = Plan.today(), cur = Plan.phaseFor(today);

    var tl = card("المراحل");
    var P = window.PLAN;
    P.phases.forEach(function (p) {
      var r = Plan.phaseRange(p);
      var status = p.id === cur.id ? "current" : (r.to && r.to < today) ? "past" : "future";
      var row = el("div", "ph-row " + status);
      var head = el("div", "ph-head");
      head.appendChild(el("span", "ph-name", p.name_ar));
      head.appendChild(ltr((r.from || "…") + " → " + (r.to || (p.id === "exam_mode" ? Plan.examDate() : "…")), "ph-dates"));
      row.appendChild(head);
      var hrsTxt = Plan.hoursFor(p) ? Plan.hoursFor(p) + " س/أسبوع" : "";
      var tg = Object.keys(p.weekly_targets || {}).filter(function (k) { return k !== "speaking_every_weeks" && p.weekly_targets[k]; })
        .map(function (k) { return (TARGET_AR[k] || k) + " " + p.weekly_targets[k]; }).join(" · ");
      row.appendChild(el("div", "ph-focus", (hrsTxt ? hrsTxt + " — " : "") + (p.focus_ar || "")));
      if (tg) row.appendChild(el("div", "ph-targets", "أهداف الأسبوع: " + tg));
      tl.appendChild(row);
    });
    wrap.appendChild(tl);

    // this week's rota
    var rc = card("جدول الأسبوع الحالي (" + cur.name_ar + ")");
    var ws = Plan.weekStart(today);
    for (var i = 0; i < 7; i++) {
      var d = Plan.addDays(ws, i);
      var ts = Plan.tasksFor(d, { noDiagnostic: true, includeDone: true });
      var line = el("div", "rota-row" + (d === today ? " today" : ""));
      line.appendChild(el("span", "rota-day", WEEKDAY_AR[i]));
      line.appendChild(el("span", "rota-tasks", ts.length ? ts.map(function (t) { return t.label_ar.split("—")[0].split(":")[0].trim() + (t.optional ? "*" : ""); }).join(" · ") : "—"));
      rc.appendChild(line);
    }
    if (cur.id === "diagnostic") rc.appendChild(noteP("+ مهام التشخيص (أي يوم من الأسبوع) تظهر في «اليوم» حتى تُنجز."));
    wrap.appendChild(rc);

    // settings
    var sc = card("إعدادات الخطة");
    var pl = Store.plan();
    var ed = dateInput(pl.examDate || "");
    sc.appendChild(field("تاريخ الامتحان (اتركه فارغًا حتى التشخيص — المبدئي " + P.exam.provisionalDate + ")", ed));
    var hoursGrid = el("div", "settings-grid");
    P.phases.filter(function (p) { return p.hours > 0 || (pl.hours || {})[p.id]; }).forEach(function (p) {
      var inp = numInput((pl.hours || {})[p.id] != null ? pl.hours[p.id] : p.hours, 0, 40);
      inp.dataset.phase = p.id;
      hoursGrid.appendChild(field("ساعات/أسبوع — " + p.name_ar, inp));
    });
    sc.appendChild(hoursGrid);
    sc.appendChild(btn("حفظ الإعدادات", "primary wide", function () {
      var hours = {};
      Array.prototype.forEach.call(hoursGrid.querySelectorAll("input"), function (i) { if (i.value !== "") hours[i.dataset.phase] = Number(i.value); });
      var patch = { hours: hours };
      if (ed.value && Plan.isYmd(ed.value)) patch.examDate = ed.value; else if (!ed.value) patch.examDate = null;
      Store.setPlan(patch); go("plan");
    }));
    sc.appendChild(noteP("الساعات المعروضة في «اليوم» تُحسب من مجموع مهام الجدول نفسه؛ هذه الأرقام مرجعية للتقارير."));
    wrap.appendChild(sc);

    wrap.appendChild(aiBox());

    // resources
    var rs = card("المصادر (قليلة وتُستخدم جيدًا)");
    (P.resources || []).forEach(function (r) {
      var row = el("div", "res-row");
      var name = r.url ? el("a", "res-name", r.name) : el("span", "res-name", r.name);
      if (r.url) { name.href = r.url; name.target = "_blank"; name.rel = "noopener"; }
      row.appendChild(name);
      row.appendChild(el("span", "res-skill", r.skill_ar));
      row.appendChild(el("div", "res-use", r.use_ar + " — " + r.cost_ar));
      rs.appendChild(row);
    });
    wrap.appendChild(rs);
    view.appendChild(wrap);
  }

  // Gemini key box — the key lives only in this device's localStorage (ai.js).
  function aiBox() {
    var box = el("div", "sync-box ai-box");
    box.appendChild(el("h3", "grp-title", "🤖 الذكاء الاصطناعي داخل التطبيق (Gemini — الطبقة المجانية)"));
    var status = el("div", "sync-status");
    if (AI.enabled()) {
      status.textContent = "✓ مفعّل — النموذج: " + AI.model(); status.className = "sync-status ok";
      box.appendChild(status);
      var models = AI.models();
      if (models.length) {
        var sel = el("select", "stage-select");
        models.forEach(function (m) { var o = el("option", null, m); o.value = m; if (m === AI.model()) o.selected = true; sel.appendChild(o); });
        sel.onchange = function () { AI.setModel(sel.value); status.textContent = "✓ مفعّل — النموذج: " + AI.model(); };
        box.appendChild(field("النموذج", sel));
      }
      var cds = AI.cooldowns(), cdKeys = Object.keys(cds);
      if (cdKeys.length) {
        var cdBox = el("div", "export-reminder", "⏳ نماذج نفدت حصّتها المجانية مؤقتًا (يتخطّاها التطبيق تلقائيًا): " +
          cdKeys.map(function (m) { var h = Math.max(1, Math.ceil((cds[m] - Date.now()) / 3600000)); return m + " (~" + h + " س)"; }).join(" · ") + " — اضغط لإعادة المحاولة بها.");
        cdBox.onclick = function () { AI.clearCooldowns(); go("plan"); };
        box.appendChild(cdBox);
      }
      box.appendChild(noteP("الحصص المجانية لكل نموذج على حدة؛ عند نفاد حصّة نموذج يتحوّل التطبيق تلقائيًا إلى التالي (flash-lite أوسع حصّة). لو المفتاح نفسه مستخدم في تطبيقات أخرى (ميزان/التوصيل) فحصّته مشتركة — أنشئ مفتاحًا من مشروع Google Cloud جديد لحصّة مستقلة.", "muted-p small-p"));
      box.appendChild(btn("إيقاف وحذف المفتاح من هذا الجهاز", "small", function () {
        if (confirm("سيُحذف المفتاح من هذا الجهاز فقط. متابعة؟")) { AI.disable(); go("plan"); }
      }));
    } else {
      var steps = el("div", "sync-steps");
      steps.appendChild(el("div", null, "١. افتح Google AI Studio ← Get API key ← Create API key (مجاني)."));
      var a = el("a", "ltr", "aistudio.google.com/app/apikey"); a.href = "https://aistudio.google.com/app/apikey"; a.target = "_blank"; a.rel = "noopener";
      steps.appendChild(a);
      steps.appendChild(el("div", null, "٢. (يُنصح) قيّد المفتاح في Google Cloud: Application restrictions ← Websites ← أضف عنوان التطبيق."));
      steps.appendChild(el("div", null, "٣. الصق المفتاح هنا واضغط «اختبر وفعّل»."));
      box.appendChild(steps);
      steps.appendChild(el("div", "pb-note-dark", "ℹ هذا مفتاح Google Gemini (يبدأ بـ AIza) — وليس توكن GitHub الذي في تبويب «البيانات» للمزامنة."));
      var keyIn = el("input", "reason ltr"); keyIn.type = "password"; keyIn.placeholder = "AIza…"; keyIn.autocomplete = "off";
      box.appendChild(keyIn);
      var en = btn("اختبر المفتاح وفعّل", "primary wide", function () {
        var k = keyIn.value.trim(); if (!k) { keyIn.focus(); return; }
        en.disabled = true; en.textContent = "جارِ التحقق…"; status.textContent = ""; status.className = "sync-status";
        AI.enable(k).then(function () { go("plan"); }).catch(function (e) {
          status.textContent = "⚠ " + aiErr(e); status.className = "sync-status error";
          en.disabled = false; en.textContent = "اختبر المفتاح وفعّل";
        });
      });
      box.appendChild(en); box.appendChild(status);
    }
    box.appendChild(noteP("المفتاح يبقى على هذا الجهاز فقط (لا يُرفع للمستودع ولا للمزامنة). عند التقييم تُرسل مقالتك إلى Google، وقد تُستخدم بيانات الطبقة المجانية لتحسين منتجاتهم. البديل بلا إرسال: زر «انسخ برومبت لـ Claude» في كل شاشة.", "muted-p small-p"));
    return box;
  }

  /* ================================================================
     LOG (L/R tests · Speaking · cue cards · history)
     ================================================================ */
  function logView(arg) {
    arg = arg || {};
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "سجّل نتيجة"));
    var tabs = el("div", "tabs"), body = el("div");
    var TABS = [["exam", "اختبار L/R"], ["speaking", "Speaking"], ["cards", "بطاقات Part 2"], ["history", "السجل"]];
    var current = arg.tab || "exam";
    function paint() {
      clear(tabs);
      TABS.forEach(function (t) {
        var b = el("button", "tab" + (t[0] === current ? " active" : ""), t[1]); b.type = "button";
        b.onclick = function () { current = t[0]; paint(); };
        tabs.appendChild(b);
      });
      clear(body);
      ({ exam: examForm, speaking: speakingForm, cards: cueCards, history: historyList })[current](body, arg);
    }
    wrap.appendChild(tabs); wrap.appendChild(body);
    view.appendChild(wrap);
    paint();
  }

  function examForm(host, arg) {
    var P = window.PLAN, today = Plan.today(), ph = Plan.phaseFor(today);
    var c = card("اختبار Listening / Reading");
    c.appendChild(noteP(P.band_anchor_ar));
    var skill = el("select", "stage-select");
    [["both", "Listening + Reading (امتحان كامل)"], ["listening", "Listening فقط"], ["reading", "Reading فقط"]].forEach(function (o) {
      var op = el("option", null, o[1]); op.value = o[0]; skill.appendChild(op);
    });
    if (arg.skill === "reading") skill.value = "reading";
    else if (arg.kind === "practice" && arg.skill === "listening") skill.value = "listening";
    var kind = el("select", "stage-select");
    [["test", "اختبار كامل بالتوقيت (يُحتسب في أهداف الأسبوع)"], ["practice", "تدريب جزئي (قسم/passage)"]].forEach(function (o) {
      var op = el("option", null, o[1]); op.value = o[0]; kind.appendChild(op);
    });
    if (arg.kind === "practice") kind.value = "practice";
    var source = textInput("المصدر: مثل Cambridge 19 Test 2");
    var rawL = numInput("", 0, 40, "x / 40"), rawR = numInput("", 0, 40, "x / 40");
    var prevL = el("div", "band-preview"), prevR = el("div", "band-preview");
    function previewAll() {
      prevL.textContent = rawL.value === "" ? "" : "→ Band " + fmtBand(Tracker.rawToBand("listening", rawL.value));
      prevR.textContent = rawR.value === "" ? "" : "→ Band " + fmtBand(Tracker.rawToBand("reading", rawR.value));
    }
    rawL.oninput = previewAll; rawR.oninput = previewAll;
    var fL = field("Listening — الإجابات الصحيحة من 40", rawL), fR = field("Reading — الإجابات الصحيحة من 40", rawR);
    fL.appendChild(prevL); fR.appendChild(prevR);
    function showFields() { fL.classList.toggle("hidden", skill.value === "reading"); fR.classList.toggle("hidden", skill.value === "listening"); }
    skill.onchange = showFields;
    c.appendChild(field("المهارة", skill)); c.appendChild(field("النوع", kind)); c.appendChild(field("المصدر", source));
    c.appendChild(fL); c.appendChild(fR); showFields();

    var chips = el("div", "chips"), picked = {};
    (P.error_types_lr || []).forEach(function (t) {
      var ch = el("button", "chip", t); ch.type = "button";
      ch.onclick = function () { picked[t] = !picked[t]; ch.classList.toggle("sel", !!picked[t]); };
      chips.appendChild(ch);
    });
    c.appendChild(field("أنواع الأخطاء (اختياري)", chips));
    var notes = textArea("ملاحظات: أين ضاعت الدرجات؟ (القسم 3/4، الإملاء، T/F/NG…)", 3);
    c.appendChild(notes);
    var diag = el("input"); diag.type = "checkbox"; diag.checked = ph.id === "diagnostic";
    var dl = el("label", "inline-chk"); dl.appendChild(diag); dl.appendChild(document.createTextNode(" امتحان تشخيصي (يحدّد تاريخ الامتحان)"));
    c.appendChild(dl);
    c.appendChild(btn("حفظ النتيجة", "primary wide", function () {
      if (!source.value.trim()) { source.focus(); return; }
      var errs = Object.keys(picked).filter(function (k) { return picked[k]; });
      var ref = today + "|" + source.value.trim();
      var made = 0;
      function add(sk, raw) {
        if (raw === "" || raw == null) return;
        raw = Number(raw); if (!(raw >= 0 && raw <= 40)) return;
        Store.addExam({ skill: sk, kind: kind.value, raw: raw, total: 40, band: Tracker.rawToBand(sk, raw),
                        source: source.value.trim(), testRef: ref, errorTypes: errs, notes: notes.value.trim(), diagnostic: diag.checked });
        made++;
      }
      if (skill.value !== "reading") add("listening", rawL.value);
      if (skill.value !== "listening") add("reading", rawR.value);
      if (!made) { alert("أدخل الدرجة الخام (0–40)."); return; }
      if (arg.taskKey) markTaskDone(arg.taskKey, arg.minutes);
      if (diag.checked && Store.taskState("diagnostic|diag_lr") == null) markTaskDone("diagnostic|diag_lr", 160);
      go("progress");
    }));
    host.appendChild(c);
  }

  function speakingForm(host, arg) {
    var today = Plan.today(), ph = Plan.phaseFor(today);
    var c = card("جلسة Speaking");
    c.appendChild(noteP("النطق يقيّمه إنسان فقط (المدرّس). الذكاء الاصطناعي يقيّم النص المكتوب (الطلاقة/المفردات/القواعد) بلا نطق."));
    var kind = el("select", "stage-select");
    Object.keys(KIND_AR).forEach(function (k) { var o = el("option", null, KIND_AR[k]); o.value = k; kind.appendChild(o); });
    c.appendChild(field("النوع", kind));
    var overall = bandSelect(null, true), fl = bandSelect(null, true), lx = bandSelect(null, true), gr = bandSelect(null, true), pr = bandSelect(null, true);
    c.appendChild(field("الباند الإجمالي (مطلوب)", overall));
    var det = el("details", "add-form"); det.appendChild(el("summary", null, "المعايير الأربعة (اختياري)"));
    var g = el("div", "form-grid");
    g.appendChild(field(SP_AR.fluency, fl)); g.appendChild(field(SP_AR.lexical, lx)); g.appendChild(field(SP_AR.grammar, gr)); g.appendChild(field(SP_AR.pronunciation, pr));
    det.appendChild(g); c.appendChild(det);
    var notes = textArea("ملاحظات المدرّس / ما لاحظته في التسجيل", 3);
    c.appendChild(notes);

    // AI transcript evaluation (text only)
    var tdet = el("details", "add-form"); tdet.appendChild(el("summary", null, "قيّم نصّ ما قلته (بلا نطق)"));
    var tr = textArea("اكتب/الصق ما قلته في Part 2 أو Part 3…", 5, "ltr");
    var part = el("select", "stage-select"); [["2", "Part 2"], ["3", "Part 3"], ["1", "Part 1"]].forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; part.appendChild(op); });
    tdet.appendChild(field("الجزء", part)); tdet.appendChild(tr);
    var aiStatus = el("div", "sync-status"), resBox = el("div");
    var aiB = btn("قيّم بالذكاء (Gemini)", "primary wide", function () {
      if (!tr.value.trim()) { tr.focus(); return; }
      if (!AI.enabled()) { aiStatus.textContent = "فعّل مفتاح Gemini من «الخطة» أولًا، أو استخدم النسخ إلى Claude."; aiStatus.className = "sync-status error"; return; }
      aiB.disabled = true; aiStatus.textContent = "جارِ التقييم…"; aiStatus.className = "sync-status syncing";
      AI.evaluateSpeakingTranscript({ transcript: tr.value.trim(), part: part.value }).then(applySp).catch(function (e) {
        aiStatus.textContent = "⚠ " + aiErr(e); aiStatus.className = "sync-status error"; aiB.disabled = false;
      });
    });
    var cpB = btn("انسخ برومبت لـ Claude", "wide", function () { window.Prompts.copy(window.Prompts.speakingTranscript(tr.value.trim(), part.value, {}), cpB); });
    var paste = textArea("الصق ردّ Claude هنا…", 4, "ltr");
    var pB = btn("اقرأ الردّ الملصوق", "wide", function () {
      var ev = window.Prompts.normalize.speaking(window.Prompts.parseJSON(paste.value));
      if (!ev) { aiStatus.textContent = "لم أجد بيانات صالحة في الردّ."; aiStatus.className = "sync-status error"; return; }
      ev.source = "claude-paste"; applySp(ev);
    });
    var lastEval = null;
    function applySp(ev) {
      lastEval = ev; aiB.disabled = false; aiStatus.textContent = "✓ تم التقييم"; aiStatus.className = "sync-status ok";
      fl.value = String(ev.bands.fluency); lx.value = String(ev.bands.lexical); gr.value = String(ev.bands.grammar); overall.value = String(ev.bands.overall);
      kind.value = "ai"; det.open = true;
      clear(resBox); resBox.appendChild(evalDetails(ev, SP_AR));
    }
    tdet.appendChild(aiB); tdet.appendChild(cpB); tdet.appendChild(paste); tdet.appendChild(pB); tdet.appendChild(aiStatus); tdet.appendChild(resBox);
    c.appendChild(tdet);

    var diag = el("input"); diag.type = "checkbox"; diag.checked = ph.id === "diagnostic";
    var dl = el("label", "inline-chk"); dl.appendChild(diag); dl.appendChild(document.createTextNode(" جلسة تشخيصية"));
    c.appendChild(dl);
    c.appendChild(btn("حفظ الجلسة", "primary wide", function () {
      if (overall.value === "") { alert("اختر الباند الإجمالي."); return; }
      function v(s) { return s.value === "" ? null : Number(s.value); }
      Store.addSpeaking({ kind: kind.value, bands: { overall: v(overall), fluency: v(fl), lexical: v(lx), grammar: v(gr), pronunciation: v(pr) },
                          notes: notes.value.trim(), transcript: tr.value.trim() ? tr.value.trim().slice(0, 2500) : undefined,
                          eval: lastEval || undefined, diagnostic: diag.checked });
      if (arg.taskKey) markTaskDone(arg.taskKey, arg.minutes);
      if (diag.checked && kind.value !== "ai" && Store.taskState("diagnostic|diag_italki") == null) markTaskDone("diagnostic|diag_italki", 30);
      go("progress");
    }));
    host.appendChild(c);
  }

  function cueCards(host, arg) {
    var c = card("بطاقة Part 2 + مؤقّت (التسجيل على هاتفك)");
    var bank = window.SPEAKING_CARDS || [];
    if (!bank.length) { c.appendChild(noteP("بنك البطاقات لم يُضف بعد (data/speaking_cards.js).")); host.appendChild(c); return; }
    var cardBox = el("div", "cue-card"), timer = timerBox(), count = 0;
    var done = el("div", "muted-p", "");
    function draw() {
      var k = bank[Math.floor(Math.random() * bank.length)];
      clear(cardBox);
      cardBox.appendChild(el("div", "cue-text ltr", k.text));
      var ul = el("ul", "cue-bullets ltr");
      (k.bullets || []).forEach(function (b) { ul.appendChild(el("li", null, b)); });
      cardBox.appendChild(ul);
      cardBox.appendChild(el("div", "cue-topic", k.topic || ""));
    }
    draw();
    c.appendChild(cardBox); c.appendChild(timer.node);
    var row = el("div", "row-btns");
    row.appendChild(btn("▶ تحضير ١ دقيقة ثم تحدّث ٢ دقيقة", "primary", function () {
      timer.start(60, "تحضير — دوّن أفكارك", function () { timer.start(120, "تحدّث الآن 🎙", function () { count++; done.textContent = "سجّلت " + count + " بطاقة/بطاقات هذه الجلسة"; }); });
    }));
    row.appendChild(btn("بطاقة أخرى", "", function () { timer.hide(); draw(); }));
    c.appendChild(row); c.appendChild(done);
    c.appendChild(btn("أنهيت المهمة ✓", "wide", function () {
      if (arg.taskKey) markTaskDone(arg.taskKey, arg.minutes);
      if (Plan.phaseFor(Plan.today()).id === "diagnostic" && !(Store.taskState("diagnostic|diag_speak_rec") || {}).done) markTaskDone("diagnostic|diag_speak_rec", 15);
      go("today");
    }));
    host.appendChild(c);
  }

  function historyList(host) {
    var c = card("آخر النتائج");
    var rows = [];
    Store.exams().forEach(function (e) { rows.push({ ts: e.ts, date: e.date, kind: "exam", txt: SKILL_SHORT[e.skill] + " " + e.raw + "/40 → " + fmtBand(e.band) + (e.source ? " · " + e.source : "") + (e.diagnostic ? " · تشخيصي" : ""), del: function () { Store.removeExam(e.id); } }); });
    Store.writings().forEach(function (w) { var b = w.eval && w.eval.bands ? w.eval.bands.overall : null; rows.push({ ts: w.ts, date: w.date, kind: "writing", txt: "Writing Task " + w.task + (b != null ? " → " + fmtBand(b) : " (بلا تقييم)") + (w.parentId ? " · إعادة كتابة" : ""), del: function () { Store.removeWriting(w.id); } }); });
    Store.speaking().forEach(function (s) { rows.push({ ts: s.ts, date: s.date, kind: "speaking", txt: "Speaking (" + (KIND_AR[s.kind] || s.kind) + ") → " + fmtBand(s.bands && s.bands.overall), del: function () { Store.removeSpeaking(s.id); } }); });
    (Store.chats ? Store.chats() : []).forEach(function (ch) {
      rows.push({ ts: ch.ts, date: ch.date, kind: "chat", messages: ch.messages || [],
                  txt: "💬 حوار حول خطأ — " + (window.ruleLabel ? window.ruleLabel(ch.rule) : ch.rule || "") + " (" + (ch.messages || []).length + " رسائل)",
                  del: function () { Store.removeChat(ch.id); } });
    });
    rows.sort(function (a, b) { return a.ts < b.ts ? 1 : -1; });
    if (!rows.length) c.appendChild(noteP("لا نتائج مسجّلة بعد."));
    rows.slice(0, 40).forEach(function (r) {
      var row = el("div", "hist-row");
      row.appendChild(el("span", "hist-date ltr", r.date));
      row.appendChild(el("span", "hist-txt", r.txt));
      row.appendChild(btn("حذف", "small ghost danger", function () { if (confirm("حذف هذا السجل؟")) { r.del(); go("log", { tab: "history" }); } }));
      c.appendChild(row);
      if (r.messages && r.messages.length) {
        var det = el("details", "rep-wrap"); det.appendChild(el("summary", null, "اقرأ الحوار"));
        var tr = el("div", "chat-transcript");
        r.messages.forEach(function (m) { var mm = el("div", "msg " + (m.role === "model" ? "model" : "user")); mm.dir = "auto"; mm.textContent = m.text; tr.appendChild(mm); });
        det.appendChild(tr); c.appendChild(det);
      }
    });
    host.appendChild(c);
  }

  // shared renderer for an evaluation's errors / fixes / summary (AI or pasted → textContent only)
  function evalDetails(ev, critMap) {
    var box = el("div", "eval-details");
    if (ev.bands) {
      var tbl = el("table", "band-table");
      Object.keys(ev.bands).forEach(function (k) {
        if (ev.bands[k] == null) return;
        var trr = el("tr"); trr.appendChild(el("td", null, (critMap || CRIT_AR)[k] || k));
        trr.appendChild(el("td", "band-cell " + bandClass(ev.bands[k]) + " ltr", fmtBand(ev.bands[k])));
        tbl.appendChild(trr);
      });
      box.appendChild(tbl);
    }
    if (ev.summary_ar) box.appendChild(el("p", "eval-summary", ev.summary_ar));
    if (ev.finance_bias && ev.finance_bias.flag) box.appendChild(el("div", "eval-warn", "⚠ انحياز مفردات المالية: " + (ev.finance_bias.note_ar || "")));
    if (ev.errors && ev.errors.length) {
      box.appendChild(el("h4", "eval-h", "الأخطاء الموسومة (" + ev.errors.length + ")"));
      var labels = (window.PLAN || {}).error_tag_labels_ar || {};
      ev.errors.forEach(function (e) {
        var r = el("div", "err-row");
        r.appendChild(el("span", "err-tag", labels[e.tag] || e.tag));
        if (e.quote) r.appendChild(el("div", "err-quote ltr", "✗ " + e.quote));
        if (e.fix) r.appendChild(el("div", "err-fix ltr", "✓ " + e.fix));
        if (e.note_ar) r.appendChild(el("div", "err-note", e.note_ar));
        box.appendChild(r);
      });
    }
    if (ev.fixes_ar && ev.fixes_ar.length) {
      box.appendChild(el("h4", "eval-h", "أولويات الإصلاح"));
      var ol = el("ol", "eval-fixes"); ev.fixes_ar.forEach(function (f) { ol.appendChild(el("li", null, f)); }); box.appendChild(ol);
    }
    return box;
  }

  /* ================================================================
     WRITING (Task 1 / Task 2 → timer → checklist → evaluate → save)
     ================================================================ */
  function writingView(arg) {
    arg = arg || {};
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "الكتابة — اكتب، قيّم، أعد الكتابة"));
    var P = window.PLAN, today = Plan.today(), ph = Plan.phaseFor(today);
    var state = { task: arg.task === 1 ? 1 : 2, prompt: null, startedAt: null, minutes: null, parentId: arg.parentId || null, parentBand: arg.parentBand || null, eval: null, saved: null };

    // 1 · task + prompt
    var pc = card("١ · المهمة والموضوع");
    var tsel = el("div", "row-btns");
    var b1 = btn("Task 1 (١٥٠ كلمة · ٢٠ د)", state.task === 1 ? "primary" : "", function () { state.task = 1; state.prompt = null; go("writing", { task: 1, taskKey: arg.taskKey, minutes: arg.minutes }); });
    var b2 = btn("Task 2 (٢٥٠ كلمة · ٤٠ د)", state.task === 2 ? "primary" : "", function () { state.task = 2; state.prompt = null; go("writing", { task: 2, taskKey: arg.taskKey, minutes: arg.minutes }); });
    tsel.appendChild(b1); tsel.appendChild(b2); pc.appendChild(tsel);
    var promptBox = el("div", "wp-text ltr hidden"), ownBox = textArea("…أو الصق سؤالًا من مصدرك", 2, "ltr");
    var gen = btn("🎲 أعطني موضوعًا (عام — بلا مالية)", "wide", function () {
      var bank = state.task === 1 ? (window.WRITING_PROMPTS_T1 || []) : (window.WRITING_PROMPTS || []);
      if (!bank.length) { promptBox.textContent = "بنك مواضيع Task " + state.task + " غير متاح بعد — الصق سؤالك أدناه."; promptBox.classList.remove("hidden"); return; }
      var pick = bank[Math.floor(Math.random() * bank.length)];
      state.prompt = pick; clear(promptBox);
      promptBox.appendChild(el("div", "wp-q", pick.text));
      if (pick.data_rows && pick.data_rows.length) {
        var t = el("table", "data-table");
        pick.data_rows.forEach(function (r, i) {
          var trr = el("tr"); String(r).split("|").forEach(function (cell) { trr.appendChild(el(i === 0 ? "th" : "td", null, cell.trim())); }); t.appendChild(trr);
        });
        promptBox.appendChild(t);
      }
      promptBox.classList.remove("hidden"); gen.textContent = "🎲 موضوع آخر"; ownBox.value = "";
    });
    pc.appendChild(gen); pc.appendChild(promptBox); pc.appendChild(ownBox);
    if (arg.parentId) pc.appendChild(noteP("إعادة كتابة بعد التقييم — سيُقارن الباند الجديد بالسابق (" + fmtBand(arg.parentBand) + ")."));
    wrap.appendChild(pc);
    if (arg.promptText) { ownBox.value = arg.promptText; }

    // 2 · timer + editor
    var ec = card("٢ · اكتب");
    var timer = timerBox(); var limit = state.task === 1 ? 20 : 40;
    var tBtn = btn("⏱ ابدأ المؤقّت (" + limit + " د)", "wide", function () {
      state.startedAt = Date.now(); tBtn.disabled = true;
      timer.start(limit * 60, "اكتب — Task " + state.task, function () { alert("انتهى الوقت — أنهِ الجملة واعتبر المقال مُسلَّمًا."); });
    });
    ec.appendChild(tBtn); ec.appendChild(timer.node);
    var ta = textArea("Write here…", 12, "ltr essay-input"); var wc = el("div", "word-count", "0 كلمة");
    ta.oninput = function () { var n = ta.value.trim().split(/\s+/).filter(Boolean).length; wc.textContent = n + " كلمة" + (n < (state.task === 1 ? 150 : 250) ? " (أقل من الحد)" : " ✓"); };
    ec.appendChild(ta); ec.appendChild(wc);
    wrap.appendChild(ec);

    // 3 · checklist gate
    var cc = card("٣ · قبل التسليم (فخاخ متحدث العربية)");
    var checks = [];
    (P.checklist_ar || []).forEach(function (txt) {
      var l = el("label", "check-item"); var ch = el("input"); ch.type = "checkbox"; ch.onchange = gate;
      l.appendChild(ch); l.appendChild(document.createTextNode(" " + txt)); cc.appendChild(l); checks.push(ch);
    });
    wrap.appendChild(cc);

    // 4 · evaluate
    var vc = card("٤ · التقييم");
    var status = el("div", "sync-status");
    var aiB = btn("قيّم بالذكاء (Gemini)", "primary wide", function () {
      if (!AI.enabled()) { status.textContent = "فعّل مفتاح Gemini من «الخطة» أولًا، أو استخدم النسخ إلى Claude."; status.className = "sync-status error"; return; }
      var essay = ta.value.trim(); if (!essay) { ta.focus(); return; }
      aiB.disabled = true; status.textContent = "جارِ التقييم… (قد يستغرق ٢٠–٤٠ ثانية)"; status.className = "sync-status syncing";
      stopTimer();
      AI.evaluateWriting({ task: state.task, prompt: promptText(), essay: essay, minutes: state.minutes }).then(showResult).catch(function (e) {
        status.textContent = "⚠ " + aiErr(e); status.className = "sync-status error"; aiB.disabled = false;
      });
    });
    var cpB = btn("انسخ برومبت لـ Claude (بلا إرسال لـ Google)", "wide", function () {
      var essay = ta.value.trim(); if (!essay) { ta.focus(); return; }
      stopTimer();
      window.Prompts.copy(window.Prompts.writing(essay, promptText(), { task: state.task, minutes: state.minutes }), cpB);
    });
    var paste = textArea("الصق ردّ Claude كاملًا هنا…", 4, "ltr");
    var pB = btn("اقرأ الردّ الملصوق", "wide", function () {
      var ev = window.Prompts.normalize.writing(window.Prompts.parseJSON(paste.value), state.task);
      if (!ev) { status.textContent = "لم أجد كتلة البيانات في الردّ — تأكد أنه يحوي IELTS_JSON."; status.className = "sync-status error"; return; }
      ev.source = "claude-paste"; showResult(ev);
    });
    var mdet = el("details", "add-form"); mdet.appendChild(el("summary", null, "أدخل الدرجات يدويًا (من مدرّسك)"));
    var mg = el("div", "form-grid"), ms = {};
    ["task", "coherence", "lexical", "grammar"].forEach(function (k) { ms[k] = bandSelect(null, true); mg.appendChild(field(CRIT_AR[k], ms[k])); });
    mg.appendChild(btn("استخدم هذه الدرجات", "", function () {
      var b = {}; var okAll = true;
      Object.keys(ms).forEach(function (k) { if (ms[k].value === "") okAll = false; b[k] = Number(ms[k].value); });
      if (!okAll) { alert("أدخل المعايير الأربعة."); return; }
      showResult(window.Prompts.normalize.writing({ bands: b, errors: [], fixes_ar: [], summary_ar: "تقييم يدوي" }, state.task));
    }));
    mdet.appendChild(mg);
    [aiB, cpB, paste, pB, mdet, status].forEach(function (n) { vc.appendChild(n); });
    var resBox = el("div"); vc.appendChild(resBox);
    wrap.appendChild(vc);
    view.appendChild(wrap);
    gate();

    function promptText() { return ownBox.value.trim() || (state.prompt ? state.prompt.text + (state.prompt.data_rows ? "\n" + state.prompt.data_rows.join("\n") : "") : null); }
    function stopTimer() { if (state.startedAt && state.minutes == null) state.minutes = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000)); timer.hide(); }
    function gate() {
      var all = checks.every(function (c) { return c.checked; });
      [aiB, cpB, pB].forEach(function (b) { b.disabled = !all; });
      status.textContent = all ? "" : "علّم بنود المراجعة أولًا (بالتصميم — لا تقييم قبل المراجعة الذاتية).";
      status.className = "sync-status";
    }
    function showResult(ev) {
      state.eval = ev; aiB.disabled = false; status.textContent = "✓ تم التقييم" + (ev.source === "gemini" ? " — Gemini" : ev.source === "claude-paste" ? " — Claude" : ""); status.className = "sync-status ok";
      clear(resBox);
      var rc = el("div", "result-card");
      rc.appendChild(el("div", "result-head", "Task " + state.task + " · الإجمالي " + fmtBand(ev.bands.overall) + " · " + gapText(Math.round((ev.bands.overall - target()) * 10) / 10)));
      if (state.parentBand != null) {
        var dlt = Math.round((ev.bands.overall - state.parentBand) * 10) / 10;
        rc.appendChild(el("div", "delta " + (dlt > 0 ? "good" : dlt < 0 ? "bad" : ""), "مقارنة بالنسخة السابقة: " + (dlt > 0 ? "+" : "") + dlt.toFixed(1)));
      }
      rc.appendChild(evalDetails(ev, CRIT_AR));
      if (ev.vocab_to_learn && ev.vocab_to_learn.length) {
        rc.appendChild(el("h4", "eval-h", "كلمات مقترحة لقاموسك"));
        ev.vocab_to_learn.forEach(function (v) {
          var r = el("div", "vocab-row"); r.appendChild(el("span", "vr-word ltr", v.word)); r.appendChild(el("span", "vr-gloss", v.gloss_ar)); rc.appendChild(r);
        });
        var addB = btn("➕ أضف الكلمات إلى مفرداتي (تدخل التمارين)", "wide", function () { var n = Store.addVocab(ev.vocab_to_learn); addB.textContent = "✓ أُضيفت " + n + " كلمة"; addB.disabled = true; });
        rc.appendChild(addB);
      }
      var saveB = btn("💾 احفظ المقال والتقييم", "primary wide", function () {
        var w = Store.addWriting({ task: state.task, prompt: promptText(), essay: ta.value.trim(), minutes: state.minutes, timed: !!state.startedAt,
                                   eval: ev, diagnostic: ph.id === "diagnostic", parentId: state.parentId || undefined, taskKey: arg.taskKey || undefined });
        state.saved = w;
        if (arg.taskKey) markTaskDone(arg.taskKey, state.minutes || arg.minutes);
        if (ph.id === "diagnostic") { var dk = "diagnostic|diag_w" + state.task; if (!(Store.taskState(dk) || {}).done) markTaskDone(dk, state.task === 1 ? 20 : 40); }
        saveB.textContent = "✓ محفوظ"; saveB.disabled = true;
        var rw = btn("✍️ أعد الكتابة بعد التقييم (نسخة مرتبطة)", "wide", function () {
          go("writing", { task: state.task, parentId: w.id, parentBand: ev.bands.overall, promptText: promptText() });
        });
        rc.appendChild(rw);
        rc.appendChild(btn("التقدّم", "wide", function () { go("progress"); }));
      });
      rc.appendChild(saveB);
      resBox.appendChild(rc);
      rc.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ================================================================
     PROGRESS (bands · margin · trend · weeks · error tags)
     ================================================================ */
  function progressView() {
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "التقدّم والهامش عن 7.0"));
    var today = Plan.today(), sums = Tracker.allSummaries();
    var head = el("div", "phase-banner");
    var dte = Plan.daysToExam(today);
    head.appendChild(el("div", "pb-name", (dte >= 0 ? "⏳ " + dte + " يومًا للامتحان" : "الامتحان مضى") + " · " + Plan.examDate()));
    head.appendChild(el("div", "pb-focus", "تقدير إجمالي (بالقاعدة الرسمية): " + fmtBand(sums.overall) + (sums.overall == null ? " — يلزم باند لكل مهارة" : "")));
    wrap.appendChild(head);

    var grid = el("div", "skill-grid");
    ["listening", "reading", "writing", "speaking"].forEach(function (k) {
      var s = sums[k];
      var c = el("div", "skill-card");
      c.appendChild(el("div", "sk-name", SKILL_LBL[k]));
      var line = el("div", "sk-line");
      line.appendChild(el("span", "band-big " + bandClass(s.latest), fmtBand(s.latest)));
      line.appendChild(el("span", "gap-chip " + gapClass(s.gapTo7), gapText(s.gapTo7)));
      c.appendChild(line);
      var meta = el("div", "sk-meta");
      meta.appendChild(el("span", null, "آخر ٣: " + (s.avg3 == null ? "—" : s.avg3.toFixed(1))));
      meta.appendChild(el("span", null, "الأفضل: " + fmtBand(s.best)));
      meta.appendChild(el("span", null, "الاتجاه: " + (s.trend == null ? "—" : s.trend > 0 ? "▲ +" + s.trend.toFixed(1) : s.trend < 0 ? "▼ " + s.trend.toFixed(1) : "◆ ثابت")));
      meta.appendChild(el("span", null, "القياسات: " + s.n));
      c.appendChild(meta);
      var pj = s.projection || {};
      c.appendChild(el("div", "sk-proj " + (pj.status === "on_track" ? "good" : pj.status === "at_risk" ? "bad" : ""),
        pj.status === "on_track" ? "📈 بالوتيرة الحالية: " + fmtBand(pj.atExam) + " يوم الامتحان — على المسار" :
        pj.status === "at_risk" ? "📉 بالوتيرة الحالية: " + fmtBand(pj.atExam) + " يوم الامتحان — يحتاج تدخّلًا" :
        s.n ? "التوقّع يظهر بعد ٣ قياسات على أسبوع+" : "سجّل أول نتيجة"));
      var ch = el("div", "mini-chart-wrap"); ch.innerHTML = lineChart(s.series, SKILL_SHORT[k]); c.appendChild(ch);
      if (k === "writing" && (sums.writing.n)) {
        var t1 = Tracker.skillSummary("writing_t1"), t2 = Tracker.skillSummary("writing_t2");
        c.appendChild(el("div", "sk-sub", "Task 1: " + fmtBand(t1.latest) + " · Task 2: " + fmtBand(t2.latest) + " (الإجمالي = (T1 + 2×T2) ÷ 3)"));
      }
      grid.appendChild(c);
    });
    wrap.appendChild(grid);

    var diag = Tracker.diagnosticBands();
    if (diag.listening != null || diag.reading != null || diag.writing != null || diag.speaking != null) wrap.appendChild(decisionCard(diag, !Plan.examDateIsSet()));

    // weeks
    var wc = card("الأسابيع الأخيرة — منفّذ مقابل مخطّط");
    var ws0 = Plan.weekStart(today), startW = Plan.weekStart(window.PLAN.start);
    var shown = 0;
    for (var i = 7; i >= 0; i--) {
      var d = Plan.addDays(ws0, -7 * i);
      if (d < startW) continue;
      var w = Tracker.weekStats(d);
      if (w.planned === 0 && w.logged === 0 && i > 0) continue;
      var tg = Object.keys(w.targets).filter(function (k) { return w.targets[k] > 0; }).map(function (k) { return (TARGET_AR[k] || k) + " " + (w.counts[k] || 0) + "/" + w.targets[k]; }).join(" · ");
      wc.appendChild(meter(w.logged, w.planned, "أسبوع " + w.weekIndex + " (" + w.weekStart + "): " + hrs(w.logged) + " / " + hrs(w.planned) + (tg ? " · " + tg : "")));
      shown++;
    }
    if (!shown) wc.appendChild(noteP("تبدأ الأسابيع من " + window.PLAN.start + "."));
    wrap.appendChild(wc);

    // error tags → rules
    var tf = Tracker.errorTagFrequency(5);
    var tc = card("أخطاء الكتابة الأكثر تكرارًا (آخر " + tf.n + " مقالات)");
    var keys = Object.keys(tf.freq).sort(function (a, b) { return tf.freq[b] - tf.freq[a]; });
    if (!keys.length) tc.appendChild(noteP("تظهر بعد أول تقييم كتابة."));
    var max = keys.length ? tf.freq[keys[0]] : 1, labels = window.PLAN.error_tag_labels_ar || {}, map = window.PLAN.error_tags || {};
    keys.forEach(function (k) {
      var r = el("div", "tag-row");
      r.appendChild(el("span", "tag-name", (labels[k] || k) + " (" + tf.freq[k] + ")"));
      var bar = el("div", "tag-bar"); var f = el("span"); f.style.width = Math.round(tf.freq[k] / max * 100) + "%"; bar.appendChild(f); r.appendChild(bar);
      var rid = map[k];
      if (rid && window.RULE_MAP && window.RULE_MAP[rid] && window.itemsForRule(rid).length) r.appendChild(btn("تدرّب", "small", function () { window.App.startRule(rid); }));
      tc.appendChild(r);
    });
    wrap.appendChild(tc);

    // writings table
    var wl = Store.writings().slice(-10).reverse();
    if (wl.length) {
      var wt = card("آخر المقالات");
      wl.forEach(function (w) {
        var b = w.eval && w.eval.bands ? w.eval.bands : null;
        var r = el("div", "hist-row");
        r.appendChild(el("span", "hist-date ltr", w.date));
        r.appendChild(el("span", "hist-txt", "Task " + w.task + (b ? " → " + fmtBand(b.overall) + " (TR " + fmtBand(b.task) + " · CC " + fmtBand(b.coherence) + " · LR " + fmtBand(b.lexical) + " · GRA " + fmtBand(b.grammar) + ")" : "") + (w.parentId ? " · إعادة" : "") + (w.diagnostic ? " · تشخيصي" : "")));
        wt.appendChild(r);
      });
      wrap.appendChild(wt);
    }
    wrap.appendChild(btn("🤖 أنشئ تقرير الأسبوعين بالذكاء", "primary wide", function () { go("report"); }));
    view.appendChild(wrap);
  }

  /* ================================================================
     REPORT (weekly AI coaching report)
     ================================================================ */
  function reportView() {
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "تقرير المدرّب الذكي — آخر ١٤ يومًا"));
    wrap.appendChild(noteP("يُرسل ملخّص أرقامك فقط (باندات، ساعات، دقّة التمارين، وسوم الأخطاء) — بلا نصوص مقالاتك."));
    var gc = card("تقرير جديد");
    var status = el("div", "sync-status"), out = el("div");
    var genB = btn("🤖 أنشئ التقرير (Gemini)", "primary wide", function () {
      if (!AI.enabled()) { status.textContent = "فعّل مفتاح Gemini من «الخطة» أولًا، أو استخدم النسخ إلى Claude."; status.className = "sync-status error"; return; }
      genB.disabled = true; status.textContent = "جارِ التحليل…"; status.className = "sync-status syncing";
      var pack = Tracker.dataPack(14);
      AI.weeklyReport(pack).then(function (rep) { saveAndShow(rep, pack); }).catch(function (e) { status.textContent = "⚠ " + aiErr(e); status.className = "sync-status error"; genB.disabled = false; });
    });
    var cpB = btn("انسخ برومبت التقرير لـ Claude", "wide", function () { window.Prompts.copy(window.Prompts.weeklyReport(Tracker.dataPack(14), {}), cpB); });
    var paste = textArea("الصق ردّ Claude هنا…", 4, "ltr");
    var pB = btn("اقرأ الردّ الملصوق", "wide", function () {
      var rep = window.Prompts.normalize.report(window.Prompts.parseJSON(paste.value));
      if (!rep) { status.textContent = "لم أجد كتلة البيانات في الردّ."; status.className = "sync-status error"; return; }
      rep.source = "claude-paste"; saveAndShow(rep, Tracker.dataPack(14));
    });
    [genB, cpB, paste, pB, status, out].forEach(function (n) { gc.appendChild(n); });
    wrap.appendChild(gc);
    function saveAndShow(rep, pack) {
      var saved = Store.addReport({ period: pack.period, phase: pack.phase, days_to_exam: pack.days_to_exam, overall_estimate: pack.overall_estimate,
                                    skills: Object.keys(pack.skills).reduce(function (o, k) { o[k] = pack.skills[k].latest; return o; }, {}), result: rep });
      genB.disabled = false; status.textContent = "✓ تم حفظ التقرير"; status.className = "sync-status ok";
      clear(out); out.appendChild(reportCard(saved));
    }
    var list = card("التقارير السابقة");
    var reps = Store.reports().slice().reverse();
    if (!reps.length) list.appendChild(noteP("لا تقارير بعد."));
    reps.forEach(function (r) { var d = el("details", "rep-wrap"); d.appendChild(el("summary", null, r.date + " · " + (r.phase || "") + " · إجمالي " + fmtBand(r.overall_estimate))); d.appendChild(reportCard(r)); list.appendChild(d); });
    wrap.appendChild(list);
    view.appendChild(wrap);
  }

  function reportCard(r) {
    var rep = r.result || {};
    var c = el("div", "rep-card");
    function sec(title, body) { if (!body) return; c.appendChild(el("h4", "eval-h", title)); if (typeof body === "string") c.appendChild(el("p", "rep-p", body)); else c.appendChild(body); }
    sec("الملخّص", rep.summary_ar);
    sec("الهامش عن 7.0", rep.margin_ar);
    if (rep.risks_ar && rep.risks_ar.length) { var ul = el("ul", "rep-list"); rep.risks_ar.forEach(function (x) { ul.appendChild(el("li", null, x)); }); sec("المخاطر", ul); }
    if (rep.priorities_ar && rep.priorities_ar.length) {
      var pl = el("div");
      rep.priorities_ar.forEach(function (p, i) { var b = el("div", "prio"); b.appendChild(el("div", "prio-t", (i + 1) + ". " + p.title)); b.appendChild(el("div", "prio-w", p.why)); b.appendChild(el("div", "prio-a", "→ " + p.action)); pl.appendChild(b); });
      sec("الأولويات الثلاث", pl);
    }
    if (rep.next_week_ar && rep.next_week_ar.length) { var ul2 = el("ul", "rep-list"); rep.next_week_ar.forEach(function (x) { ul2.appendChild(el("li", null, x)); }); sec("تعديلات الأسبوع القادم", ul2); }
    var rw = rep.rule_weights || {}, rk = Object.keys(rw);
    if (rk.length) {
      var box = el("div");
      box.appendChild(el("div", "rep-p", rk.map(function (k) { return (window.ruleLabel ? window.ruleLabel(k) : k) + " ×" + rw[k]; }).join(" · ")));
      var applied = JSON.stringify((Store.plan().ruleWeights || {})) === JSON.stringify(rw);
      var ab = btn(applied ? "✓ مطبّقة على جلسات التمرين" : "طبّق هذه الأوزان على جلسات التمرين", applied ? "small" : "small primary", function () { Store.setPlan({ ruleWeights: rw }); ab.textContent = "✓ مطبّقة"; ab.disabled = true; });
      if (applied) ab.disabled = true;
      box.appendChild(ab);
      sec("أوزان التمارين المقترحة", box);
    }
    sec("كلمة", rep.motivation_ar);
    if (r.date) c.appendChild(el("div", "rep-meta", r.date + (rep.model ? " · " + rep.model : rep.source === "claude-paste" ? " · Claude" : "")));
    return c;
  }

  /* ================================================================
     MORE (the drill-engine extras folded out of the nav)
     ================================================================ */
  function moreView() {
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "المزيد"));
    var grid = el("div", "quick-grid");
    [["load", "⚡", "جلسة تحت الضغط"], ["roadmap", "🗺️", "خريطة القواعد"], ["dictionary", "🔊", "قاموس النطق"], ["reference", "📚", "مرجع المتلازمات"],
     ["diagrams", "🖼️", "رسوم توضيحية"], ["translate", "🌐", "ترجمة"], ["data", "💾", "البيانات والمزامنة"]].forEach(function (q) {
      var b = el("button", "quick", q[1] + "\n" + q[2]); b.type = "button"; b.onclick = function () { go(q[0]); }; grid.appendChild(b);
    });
    wrap.appendChild(grid);
    view.appendChild(wrap);
  }

  window.EXTRA_ROUTES = [
    { id: "today",    label: "اليوم",       icon: "📅" },
    { id: "practice", label: "تدرّب",       icon: "🎯" },
    { id: "writing",  label: "الكتابة",     icon: "✍️" },
    { id: "log",      label: "سجّل نتيجة",  icon: "📝" },
    { id: "progress", label: "التقدّم",     icon: "📈" },
    { id: "dashboard", label: "لوحة القواعد", icon: "📊" },
    { id: "plan",     label: "الخطة",       icon: "🗓️" },
    { id: "report",   label: "تقرير AI",    icon: "🤖" },
    { id: "more",     label: "المزيد",      icon: "⋯" }
  ];
  window.EXTRA_VIEWS = { today: todayView, plan: planView, log: logView, writing: writingView, progress: progressView, report: reportView, more: moreView };
  window.PrepViews = { aiBox: aiBox, lineChart: lineChart, decisionCard: decisionCard };
})();
