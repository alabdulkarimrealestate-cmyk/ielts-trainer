/* app.js — router, navigation, and all views. Vanilla JS, single page. */
(function () {
  "use strict";

  var view, nav, floatBtn;

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  var ROUTES = [
    { id:"home",       label:"الرئيسية",     icon:"🏠" },
    { id:"dashboard",  label:"لوحة التقدّم",  icon:"📊" },
    { id:"practice",   label:"تدرّب",         icon:"🎯" },
    { id:"writing",    label:"فحص الكتابة",   icon:"✍️" },
    { id:"translate",  label:"ترجمة",         icon:"🌐" },
    { id:"dictionary", label:"قاموس النطق",   icon:"🔊" },
    { id:"reference",  label:"مرجع المتلازمات", icon:"📚" },
    { id:"diagrams",   label:"رسوم توضيحية",  icon:"🖼️" },
    { id:"data",       label:"البيانات",      icon:"💾" }
  ];

  function go(route, arg) {
    window.scrollTo(0, 0);
    clear(view);
    (VIEWS[route] || VIEWS.home)(arg);
    Array.prototype.forEach.call(nav.children, function (b) {
      b.classList.toggle("active", b.dataset.route === route);
    });
  }

  /* ---------------- HOME ---------------- */
  function homeView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h1", "hero-title", "مدرّب القواعد والنطق — IELTS"));
    wrap.appendChild(el("p", "hero-sub", "١٥ دقيقة يوميًا. فكّر قبل أن تكشف الإجابة. تقدّمك يُحفظ تلقائيًا."));

    var startCard = el("div", "start-card");
    var big = el("button", "btn primary huge", "▶  ابدأ جلسة ١٥ دقيقة");
    big.onclick = function () { go("session"); };
    startCard.appendChild(big);
    startCard.appendChild(el("div", "start-note", "مجموعة مختلطة موزونة نحو أضعف قواعدك"));
    wrap.appendChild(startCard);

    // weakest rules hint
    var weak = window.RULES.map(function (r) {
      return { r: r, acc: Store.recentAccuracy(r.id) };
    }).filter(function (x) { return x.acc !== null; })
      .sort(function (a, b) { return a.acc - b.acc; }).slice(0, 3);
    if (weak.length) {
      var wbox = el("div", "weak-box");
      wbox.appendChild(el("div", "weak-lbl", "ركّز اليوم على:"));
      weak.forEach(function (x) {
        wbox.appendChild(el("span", "weak-chip", x.r.short + " · " + Math.round(x.acc * 100) + "%"));
      });
      wrap.appendChild(wbox);
    }

    var grid = el("div", "quick-grid");
    [["dashboard","📊","لوحة التقدّم"],["practice","🎯","تدرّب على قاعدة"],
     ["writing","✍️","فحص الكتابة"],["dictionary","🔊","قاموس النطق"]].forEach(function (q) {
      var c = el("button", "quick", q[1] + "\n" + q[2]);
      c.onclick = function () { go(q[0]); };
      grid.appendChild(c);
    });
    wrap.appendChild(grid);

    wrap.appendChild(el("div", "streak-inline", "🔥 " + Store.globalStreak() + " أيام متتالية"));
    view.appendChild(wrap);
  }

  /* ---------------- SESSION (15-min mixed) ---------------- */
  function sessionView() {
    var wrap = el("div", "page");
    var prog = el("div", "progress");
    var host = el("div", "runner-host");
    wrap.appendChild(prog);
    wrap.appendChild(host);
    view.appendChild(wrap);

    var queue = Session.buildSession(15);
    Session.run(queue, host, {
      kind: "session", progressEl: prog,
      onFinish: function (sum) { summaryView(sum, wrap, function () { go("session"); }); }
    });
  }

  /* ---------------- PRACTICE (pick a rule) ---------------- */
  function practiceView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "تدرّب على قاعدة واحدة"));
    var groups = {};
    window.RULES.forEach(function (r) { (groups[r.group] = groups[r.group] || []).push(r); });
    Object.keys(groups).forEach(function (g) {
      wrap.appendChild(el("h3", "grp-title", g));
      var grid = el("div", "rule-grid");
      groups[g].forEach(function (r) {
        var n = window.itemsForRule(r.id).length;
        var b = el("button", "rule-btn");
        b.innerHTML = '<span class="rb-name">' + r.label + '</span><span class="rb-count">' + n + ' عنصر</span>';
        b.onclick = function () { startRule(r.id); };
        grid.appendChild(b);
      });
      wrap.appendChild(grid);
    });
    view.appendChild(wrap);
  }

  function startRule(ruleId) {
    clear(view);
    var wrap = el("div", "page");
    var title = el("h2", "page-title", window.ruleLabel(ruleId));
    wrap.appendChild(title);
    if (window.Diagrams.has(ruleId)) {
      var d = el("div", "inline-diagram");
      d.innerHTML = window.Diagrams.get(ruleId);
      wrap.appendChild(d);
    }
    var prog = el("div", "progress");
    var host = el("div", "runner-host");
    wrap.appendChild(prog); wrap.appendChild(host);
    view.appendChild(wrap);

    var queue = Session.buildRuleQueue(ruleId, 10);
    Session.run(queue, host, {
      kind: "rule", progressEl: prog,
      onFinish: function (sum) { summaryView(sum, wrap, function () { startRule(ruleId); }); }
    });
    // deactivate nav highlight to practice
    Array.prototype.forEach.call(nav.children, function (b) {
      b.classList.toggle("active", b.dataset.route === "practice");
    });
  }

  /* ---------------- SUMMARY ---------------- */
  function summaryView(sum, wrap, again) {
    clear(wrap);
    var acc = sum.total ? Math.round((sum.correct / sum.total) * 100) : 0;
    wrap.appendChild(el("h2", "page-title", "ملخّص الجلسة"));
    var top = el("div", "sum-top");
    top.innerHTML = window.Dashboard.ring(acc) +
      '<div class="sum-nums"><div class="sum-score">' + sum.correct + ' / ' + sum.total + '</div>' +
      '<div class="sum-lbl">إجابات صحيحة</div></div>';
    wrap.appendChild(top);

    var list = el("div", "sum-list");
    Object.keys(sum.perRule).forEach(function (rid) {
      var p = sum.perRule[rid];
      var pct = Math.round((p.c / p.a) * 100);
      var row = el("div", "sum-row");
      row.innerHTML = '<span class="sr-name">' + window.ruleLabel(rid) + '</span>' +
        '<span class="sr-bar"><span style="width:' + pct + '%"></span></span>' +
        '<span class="sr-val">' + p.c + '/' + p.a + '</span>';
      list.appendChild(row);
    });
    wrap.appendChild(list);
    wrap.appendChild(el("p", "sum-note", "راجع أسبابك المكتوبة في تبويب «البيانات» لمشاركتها مع مدرّبك."));

    var btns = el("div", "row-btns");
    var a = el("button", "btn primary", "جلسة أخرى");
    a.onclick = again;
    var h = el("button", "btn", "الرئيسية");
    h.onclick = function () { go("home"); };
    var d = el("button", "btn ghost", "لوحة التقدّم");
    d.onclick = function () { go("dashboard"); };
    btns.appendChild(a); btns.appendChild(d); btns.appendChild(h);
    wrap.appendChild(btns);
  }

  /* ---------------- DASHBOARD ---------------- */
  function dashboardView() {
    var wrap = el("div", "page");
    window.Dashboard.render(wrap);
    view.appendChild(wrap);
  }

  /* ---------------- WRITING CHECK ---------------- */
  function writingView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "فحص الكتابة (بدون تكلفة)"));
    wrap.appendChild(el("p", "muted-p", "الصق فقرة أو مقال Task 2. سيولّد التطبيق برومبت تقييم كامل تنسخه وتلصقه في Claude. التطبيق لا يُقيّم بنفسه."));
    var ta = el("textarea", "big-input ltr");
    ta.rows = 10; ta.placeholder = "Paste your essay or paragraph here...";
    wrap.appendChild(ta);
    var gen = el("button", "btn primary wide", "أنشئ برومبت التقييم وانسخه");
    var out = el("textarea", "prompt-out ltr hidden"); out.rows = 10; out.readOnly = true;
    gen.onclick = function () {
      if (!ta.value.trim()) { ta.focus(); return; }
      var p = window.Prompts.writing(ta.value.trim());
      out.value = p; out.classList.remove("hidden");
      window.Prompts.copy(p, gen);
    };
    wrap.appendChild(gen);
    wrap.appendChild(el("div", "hint-line", "الخطوة التالية: افتح Claude، الصق، أرسل. سيعطيك درجة لكل معيار + وسم كل خطأ بأنماطك الأربعة."));
    wrap.appendChild(out);
    view.appendChild(wrap);
  }

  /* ---------------- TRANSLATE (selected text) ---------------- */
  function translateView(prefill) {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "ترجمة النص المحدد إلى العربية"));
    wrap.appendChild(el("p", "muted-p", "حدّد أي نص إنجليزي داخل التطبيق ثم اضغط زر «ترجم المحدد»، أو الصق النص هنا. يولّد برومبت ترجمة تلصقه في Claude."));
    var ta = el("textarea", "big-input ltr"); ta.rows = 5;
    ta.placeholder = "Paste or type English text..."; ta.value = prefill || "";
    wrap.appendChild(ta);
    var ctx = el("input", "text-input"); ctx.placeholder = "السياق (اختياري): من أين هذا النص؟";
    wrap.appendChild(ctx);
    var gen = el("button", "btn primary wide", "أنشئ برومبت الترجمة وانسخه");
    var out = el("textarea", "prompt-out ltr hidden"); out.rows = 8; out.readOnly = true;
    gen.onclick = function () {
      if (!ta.value.trim()) { ta.focus(); return; }
      var p = window.Prompts.translate(ta.value.trim(), ctx.value.trim());
      out.value = p; out.classList.remove("hidden");
      window.Prompts.copy(p, gen);
    };
    wrap.appendChild(gen);

    // Also offer the "generate a visual" prompt from the same text.
    var img = el("button", "btn wide", "🖼️ أنشئ برومبت محتوى مرئي عن هذا النص");
    img.onclick = function () {
      if (!ta.value.trim()) { ta.focus(); return; }
      var p = window.Prompts.image(ta.value.trim());
      out.value = p; out.classList.remove("hidden");
      window.Prompts.copy(p, img);
    };
    wrap.appendChild(img);
    wrap.appendChild(out);
    view.appendChild(wrap);
  }

  /* ---------------- PRONUNCIATION DICTIONARY (flashcards) ---------------- */
  function dictionaryView() {
    var entries = (window.PRON_DICT || []).concat(Store.addedDict());
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "قاموس النطق الشخصي"));
    if (!entries.length) { wrap.appendChild(el("p", "muted-p", "لا مدخلات بعد.")); view.appendChild(wrap); return; }

    var idx = 0;
    var cardBox = el("div", "flash-box");
    var controls = el("div", "flash-ctrl");
    wrap.appendChild(cardBox); wrap.appendChild(controls);

    function renderCard() {
      var e = entries[idx];
      var flipped = false;
      clear(cardBox);
      var fc = el("div", "flash");
      function face() {
        clear(fc);
        if (!flipped) {
          fc.appendChild(el("div", "fl-word ltr", e.word));
          fc.appendChild(el("div", "fl-tap", "اضغط لكشف النطق"));
        } else {
          fc.appendChild(el("div", "fl-ipa ltr", e.ipa || ""));
          fc.appendChild(el("div", "fl-stress ltr", e.stress_pattern || ""));
          fc.appendChild(el("div", "fl-ar", e.arabic_approximation || ""));
          if (e.finance_context) fc.appendChild(el("div", "fl-ctx ltr", e.finance_context));
        }
      }
      fc.onclick = function () { flipped = !flipped; face(); };
      face();
      cardBox.appendChild(fc);
      clear(controls);
      var prev = el("button", "btn small", "◀ السابق");
      prev.onclick = function () { idx = (idx - 1 + entries.length) % entries.length; renderCard(); };
      var count = el("div", "flash-count", (idx + 1) + " / " + entries.length);
      var next = el("button", "btn small", "التالي ▶");
      next.onclick = function () { idx = (idx + 1) % entries.length; renderCard(); };
      controls.appendChild(next); controls.appendChild(count); controls.appendChild(prev);
    }
    renderCard();

    // add-entry form
    var det = el("details", "add-form");
    det.innerHTML = "<summary>➕ أضف كلمة جديدة</summary>";
    var f = el("div", "form-grid");
    var iw = mkField("الكلمة (English)"), ii = mkField("IPA"), is = mkField("نمط النبر (CA-pi-tals)"),
        ia = mkField("تقريب عربي"), ic = mkField("سياق مالي (اختياري)");
    [iw, ii, is, ia, ic].forEach(function (x) { f.appendChild(x.wrap); });
    var addBtn = el("button", "btn primary", "حفظ");
    addBtn.onclick = function () {
      if (!iw.input.value.trim()) return;
      Store.addDictEntry({
        word: iw.input.value.trim(), ipa: ii.input.value.trim(),
        stress_pattern: is.input.value.trim(), arabic_approximation: ia.input.value.trim(),
        finance_context: ic.input.value.trim()
      });
      go("dictionary");
    };
    f.appendChild(addBtn);
    det.appendChild(f);
    wrap.appendChild(det);
    view.appendChild(wrap);
  }

  function mkField(label) {
    var wrap = el("div", "field");
    wrap.appendChild(el("label", null, label));
    var input = el("input", "text-input ltr");
    wrap.appendChild(input);
    return { wrap: wrap, input: input };
  }

  /* ---------------- COLLOCATIONS / WATCHLIST REFERENCE ---------------- */
  function referenceView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "مرجع المتلازمات والكلمات المتشابهة"));
    var search = el("input", "text-input", null);
    search.placeholder = "🔎 ابحث بالإنجليزية أو العربية...";
    wrap.appendChild(search);

    var listBox = el("div", "ref-list");
    wrap.appendChild(listBox);

    var colloc = (window.REF_COLLOCATIONS || []).map(function (c) {
      return { en: c.phrase, ar: c.meaning_ar, ex: c.example, tag: c.topic, type: "متلازمة" };
    });
    var pairs = (window.BANK_VOCAB || []).concat(Store.addedPairs()).map(function (p) {
      return { en: (p.pair ? p.pair.join(" ⇄ ") : ""), ar: p.explanation || "",
               ex: p.sentence_with_gap ? p.sentence_with_gap.replace("___", "____") : "",
               tag: "معكوسة المعنى", type: "زوج" };
    }).filter(function (x) { return x.en; });
    var all = colloc.concat(pairs);

    function draw(q) {
      clear(listBox);
      var filtered = all.filter(function (r) {
        if (!q) return true;
        var hay = (r.en + " " + r.ar + " " + r.ex + " " + r.tag).toLowerCase();
        return hay.indexOf(q.toLowerCase()) !== -1;
      });
      if (!filtered.length) { listBox.appendChild(el("div", "empty", "لا نتائج")); return; }
      filtered.forEach(function (r) {
        var row = el("div", "ref-row");
        row.innerHTML =
          '<div class="rr-top"><span class="rr-en ltr">' + r.en + '</span>' +
          '<span class="rr-tag">' + r.tag + '</span></div>' +
          '<div class="rr-ar">' + r.ar + '</div>' +
          (r.ex ? '<div class="rr-ex ltr">' + r.ex + '</div>' : '');
        listBox.appendChild(row);
      });
    }
    search.oninput = function () { draw(search.value.trim()); };
    draw("");

    // add confusable pair
    var det = el("details", "add-form");
    det.innerHTML = "<summary>➕ أضف زوج كلمات متشابهة</summary>";
    var f = el("div", "form-grid");
    var w1 = mkField("الكلمة الأولى"), w2 = mkField("الكلمة الثانية"),
        sen = mkField("جملة بها ___ للفراغ"), ans = mkField("الإجابة الصحيحة"),
        exp = mkField("شرح الفرق (عربي)");
    [w1, w2, sen, ans, exp].forEach(function (x) { f.appendChild(x.wrap); });
    var addBtn = el("button", "btn primary", "حفظ (يدخل الدرّيلات أيضًا)");
    addBtn.onclick = function () {
      if (!w1.input.value.trim() || !w2.input.value.trim() || !sen.input.value.trim() || !ans.input.value.trim()) return;
      var entry = {
        id: "mr-user-" + Date.now(), rule: "meaning_reversal",
        pair: [w1.input.value.trim(), w2.input.value.trim()],
        sentence_with_gap: sen.input.value.trim(),
        correct_answer: ans.input.value.trim(),
        distractors: [ans.input.value.trim() === w1.input.value.trim() ? w2.input.value.trim() : w1.input.value.trim()],
        explanation: exp.input.value.trim()
      };
      Store.addPair(entry);
      window.ALL_ITEMS.push(entry); // available immediately for drilling
      go("reference");
    };
    f.appendChild(addBtn);
    det.appendChild(f);
    wrap.appendChild(det);
    view.appendChild(wrap);
  }

  /* ---------------- DIAGRAMS ---------------- */
  function diagramsView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "رسوم توضيحية للقواعد"));
    wrap.appendChild(el("p", "muted-p", "مساعدات بصرية أوفلاين (طبقة المعرفة فقط، بلا صوت). لتوليد صورة مخصّصة عن أي كلمة استخدم زر المحتوى المرئي في تبويب الترجمة."));
    var all = window.Diagrams.all();
    Object.keys(all).forEach(function (rid) {
      var box = el("div", "diagram-card");
      box.appendChild(el("h3", "dg-title", window.ruleLabel(rid)));
      var d = el("div", "inline-diagram");
      d.innerHTML = all[rid];
      box.appendChild(d);
      wrap.appendChild(box);
    });
    view.appendChild(wrap);
  }

  /* ---------------- DATA / EXPORT ---------------- */
  function dataView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "البيانات والنسخ الاحتياطي"));
    var s = Store.get();
    var totalAttempts = window.RULES.reduce(function (a, r) { return a + Store.ruleStat(r.id).attempts; }, 0);
    wrap.appendChild(el("p", "muted-p", "إجمالي المحاولات: " + totalAttempts + " · السجلات المخزّنة: " + s.log.length));

    var exportBtn = el("button", "btn primary wide", "⬇ تصدير التقدّم + سجل الأسباب (JSON)");
    exportBtn.onclick = function () {
      var blob = new Blob([Store.exportJSON()], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ielts-trainer-backup.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };
    wrap.appendChild(exportBtn);

    // Import a backup (moves progress between devices — localStorage is per-device).
    var importBtn = el("button", "btn wide", "⬆ استيراد نسخة احتياطية (JSON)");
    var fileInput = document.createElement("input");
    fileInput.type = "file"; fileInput.accept = ".json,application/json";
    fileInput.style.display = "none";
    fileInput.onchange = function () {
      var f = fileInput.files && fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        if (!confirm("سيستبدل الاستيراد كل التقدّم الحالي على هذا الجهاز. متابعة؟")) return;
        if (Store.importJSON(reader.result)) { alert("تم الاستيراد بنجاح ✓"); go("data"); }
        else alert("ملف غير صالح — تأكد أنه نسخة مصدَّرة من التطبيق.");
      };
      reader.readAsText(f);
    };
    importBtn.onclick = function () { fileInput.click(); };
    wrap.appendChild(importBtn);
    wrap.appendChild(fileInput);

    wrap.appendChild(el("h3", "grp-title", "سجل الأسباب (آخر ٣٠)"));
    var log = Store.fullLog().slice(0, 30);
    if (!log.length) wrap.appendChild(el("p", "muted-p", "لا سجل بعد."));
    var lb = el("div", "log-list");
    log.forEach(function (e) {
      var row = el("div", "log-row " + (e.correct ? "ok" : "bad"));
      row.innerHTML =
        '<div class="lg-top"><span class="lg-rule">' + window.ruleLabel(e.rule) + '</span>' +
        '<span class="lg-mark">' + (e.correct ? "✓" : "✗") + '</span></div>' +
        '<div class="lg-ans ltr">إجابتك: ' + escapeHtml(e.answer) + '</div>' +
        '<div class="lg-reason">سببك: ' + escapeHtml(e.reasoning || "—") + '</div>';
      lb.appendChild(row);
    });
    wrap.appendChild(lb);

    var reset = el("button", "btn ghost danger", "حذف كل التقدّم");
    reset.onclick = function () {
      if (confirm("متأكد؟ سيُحذف كل التقدّم والسجل نهائيًا.")) { Store.reset(); go("data"); }
    };
    wrap.appendChild(reset);
    view.appendChild(wrap);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c];
    });
  }

  var VIEWS = {
    home: homeView, session: sessionView, practice: practiceView,
    dashboard: dashboardView, writing: writingView, translate: translateView,
    dictionary: dictionaryView, reference: referenceView,
    diagrams: diagramsView, data: dataView
  };

  /* ---------------- selection -> translate floating button ---------------- */
  function selectedText() {
    var s = window.getSelection ? window.getSelection().toString() : "";
    return s ? s.trim() : "";
  }
  function updateFloat() {
    var t = selectedText();
    // ignore selections inside inputs/textareas (user editing)
    var ae = document.activeElement;
    var editing = ae && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT");
    if (t.length >= 2 && /[A-Za-z]/.test(t) && !editing) {
      floatBtn.classList.remove("hidden");
    } else {
      floatBtn.classList.add("hidden");
    }
  }

  /* ---------------- boot ---------------- */
  function boot() {
    var root = document.getElementById("app");
    var header = el("header", "topbar");
    header.innerHTML = '<div class="brand">ميزان <span>IELTS</span></div>';
    nav = el("nav", "mainnav");
    ROUTES.forEach(function (r) {
      var b = el("button", "navbtn", r.icon + " " + r.label);
      b.dataset.route = r.id;
      b.onclick = function () { go(r.id); };
      nav.appendChild(b);
    });
    view = el("main", "view");

    floatBtn = el("button", "float-translate hidden", "🌐 ترجم المحدد");
    floatBtn.onclick = function () {
      var t = selectedText();
      floatBtn.classList.add("hidden");
      go("translate", t);
    };

    root.appendChild(header);
    root.appendChild(nav);
    root.appendChild(view);
    document.body.appendChild(floatBtn);

    document.addEventListener("mouseup", function () { setTimeout(updateFloat, 10); });
    document.addEventListener("selectionchange", function () { setTimeout(updateFloat, 10); });

    go("home");
  }

  window.App = { go: go, startRule: startRule };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
