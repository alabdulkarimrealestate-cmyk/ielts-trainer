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
    { id:"roadmap",    label:"الخريطة",      icon:"🗺️" },
    { id:"dashboard",  label:"لوحة التقدّم",  icon:"📊" },
    { id:"practice",   label:"تدرّب",         icon:"🎯" },
    { id:"writing",    label:"فحص الكتابة",   icon:"✍️" },
    { id:"translate",  label:"ترجمة",         icon:"🌐" },
    { id:"dictionary", label:"قاموس النطق",   icon:"🔊" },
    { id:"reference",  label:"مرجع المتلازمات", icon:"📚" },
    { id:"diagrams",   label:"رسوم توضيحية",  icon:"🖼️" },
    { id:"data",       label:"البيانات",      icon:"💾" }
  ];

  var currentRoute = "home";

  function go(route, arg) {
    currentRoute = route;
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
    var loadBtn = el("button", "btn load-cta wide", "⚡ جلسة تحت الضغط (بعدّاد)");
    loadBtn.onclick = function () { go("load"); };
    startCard.appendChild(loadBtn);
    wrap.appendChild(startCard);

    // fragile-rules alert: closed/maintenance rules decaying silently
    var fragile = window.Engine.fragileRules();
    if (fragile.length) {
      var fbox = el("div", "fragile-box");
      fbox.appendChild(el("div", "fragile-title", "⚠ قواعد مغلقة بدأت تتآكل:"));
      fragile.forEach(function (f) {
        var chip = el("button", "fragile-chip",
          window.ruleLabel(f.rule) + " · " + Math.round(f.accuracy * 100) + "%");
        chip.onclick = function () { startRule(f.rule); };
        fbox.appendChild(chip);
      });
      wrap.appendChild(fbox);
    }

    // monthly export reminder (a year of history must survive a cleared cache)
    var lastExp = Store.lastExport();
    var expDays = lastExp ? Math.floor((Date.now() - new Date(lastExp)) / 86400000) : null;
    if ((lastExp && expDays >= 30) || (!lastExp && Store.get().log.length > 30)) {
      var ebox = el("div", "export-reminder");
      ebox.textContent = lastExp
        ? "💾 مرّ " + expDays + " يومًا على آخر نسخة احتياطية — صدّر بياناتك من تبويب «البيانات»"
        : "💾 لم تصدّر بياناتك بعد — افعلها مرة شهريًا من تبويب «البيانات»";
      ebox.onclick = function () { go("data"); };
      wrap.appendChild(ebox);
    }

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

    var mins = (Store.settings() || {}).sessionMinutes || 15;
    var queue = Session.buildSession(Math.max(8, Math.round(mins)));
    Session.run(queue, host, {
      kind: "session", progressEl: prog, mode: "calm",
      onFinish: function (sum) { summaryView(sum, wrap, function () { go("session"); }); }
    });
  }

  /* ---------------- LOAD SESSION (timed, mixed old+new) ---------------- */
  function loadSessionView() {
    var wrap = el("div", "page");
    var st = Store.settings() || {};
    var intro = el("div", "load-intro");
    intro.innerHTML =
      '<h2 class="page-title">⚡ جلسة تحت الضغط</h2>' +
      '<p class="muted-p">مجموعة مختلطة <b>بعدّاد تنازلي</b>: قواعد جديدة + قواعد قديمة مغلقة في نفس الجلسة. ' +
      'التثبيت لا يُعتبر حقيقيًا إلا إذا صمد تحت الضغط — نتائجها تُحسب منفصلة عن الجلسات الهادئة وتُغذّي بوابات الإغلاق.</p>';
    var startBtn = el("button", "btn primary huge", "ابدأ (" +
      (st.loadItems || 10) + " أسئلة / " + Math.round((st.loadSeconds || 300) / 60) + " دقائق)");
    intro.appendChild(startBtn);
    wrap.appendChild(intro);
    view.appendChild(wrap);

    startBtn.onclick = function () {
      clear(wrap);
      var prog = el("div", "progress");
      var host = el("div", "runner-host");
      wrap.appendChild(prog); wrap.appendChild(host);
      var queue = Session.buildLoadQueue(st.loadItems || 10);
      Session.run(queue, host, {
        kind: "load_session", progressEl: prog, mode: "load",
        countdownSeconds: st.loadSeconds || 300,
        onFinish: function (sum) { summaryView(sum, wrap, function () { go("load"); }); }
      });
    };
  }

  /* ---------------- ROADMAP (the year-long view) ---------------- */
  var STATUS_META = {
    locked:         { ar: "مقفلة",          cls: "st-locked" },
    active:         { ar: "نشطة الآن",      cls: "st-active" },
    closed_fragile: { ar: "مغلقة (هشّة)",   cls: "st-fragile" },
    consolidated:   { ar: "مثبّتة ✓",       cls: "st-done" }
  };

  function roadmapView() {
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "خريطة الطريق — من ٥ إلى ٧"));
    wrap.appendChild(el("p", "muted-p",
      "التطبيق يقترح عندما تبدو البوابة محقّقة؛ القرار النهائي لك مع مدرّبك — لا تقدّم تلقائي أبدًا."));

    (window.ROADMAP.stages || []).forEach(function (stage) {
      var status = window.Engine.stageStatus(stage);
      var meta = STATUS_META[status] || STATUS_META.locked;
      var card = el("div", "stage-card " + meta.cls);

      var head = el("div", "stage-head");
      head.innerHTML = '<span class="stage-name">' + stage.name_ar + '</span>' +
                       '<span class="stage-status">' + meta.ar + '</span>';
      card.appendChild(head);
      if (stage.desc_ar) card.appendChild(el("div", "stage-desc", stage.desc_ar));

      // gate progress per rule of this stage (skip locked stages)
      if (status !== "locked") {
        (stage.modules || []).forEach(function (mid) {
          var mod = window.moduleById(mid);
          if (!mod) {
            card.appendChild(el("div", "stage-pending", "◌ " + mid + " — المحتوى لم يُضف بعد (يُفتح مع التدريس)"));
            return;
          }
          (mod.rules || []).forEach(function (r) {
            var gp = window.Engine.gateProgress(r.id);
            var row = el("div", "gate-row");
            if (!gp) {
              row.innerHTML = '<span class="gr-name">' + r.short + '</span>' +
                              '<span class="gr-note">عنصر خلفي دائم — بلا بوابة</span>';
            } else {
              var g = gp.gate;
              row.innerHTML =
                '<span class="gr-name">' + r.short + '</span>' +
                '<span class="gr-prog">' + gp.passingSessions + '/' + g.min_load_sessions +
                ' جلسات ضغط ≥' + Math.round(g.min_accuracy * 100) + '% · ' +
                gp.distinctDays + '/' + g.min_days + ' أيام</span>' +
                (gp.met ? '<span class="gr-met">🎯 البوابة تبدو محقّقة — أكّدها مع مدرّبك</span>' : '');
            }
            card.appendChild(row);
          });
        });

        // manual status change (user + coach decision)
        var sel = document.createElement("select");
        sel.className = "stage-select";
        Object.keys(STATUS_META).forEach(function (s) {
          var o = document.createElement("option");
          o.value = s; o.textContent = STATUS_META[s].ar;
          if (s === status) o.selected = true;
          sel.appendChild(o);
        });
        sel.onchange = function () {
          if (confirm("تغيير حالة المرحلة يدويًا — بعد تأكيد مدرّبك؟")) {
            Store.setStageStatus(stage.id, sel.value); go("roadmap");
          } else { sel.value = status; }
        };
        card.appendChild(sel);
      }
      wrap.appendChild(card);
    });
    view.appendChild(wrap);
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
    var denom = sum.answered || sum.total;
    var acc = denom ? Math.round((sum.correct / denom) * 100) : 0;
    wrap.appendChild(el("h2", "page-title",
      sum.mode === "load" ? "ملخّص جلسة الضغط ⚡" : "ملخّص الجلسة"));
    if (sum.timedOut) {
      wrap.appendChild(el("div", "timeout-note",
        "⏱ انتهى الوقت — أجبت " + sum.answered + " من " + sum.total));
    }
    var top = el("div", "sum-top");
    top.innerHTML = window.Dashboard.ring(acc) +
      '<div class="sum-nums"><div class="sum-score">' + sum.correct + ' / ' + denom + '</div>' +
      '<div class="sum-lbl">إجابات صحيحة' + (sum.mode === "load" ? " تحت الضغط" : "") + '</div></div>';
    wrap.appendChild(top);

    var list = el("div", "sum-list");
    Object.keys(sum.perRule).forEach(function (rid) {
      var p = sum.perRule[rid];
      var pct = Math.round((p.c / p.n) * 100);
      var row = el("div", "sum-row");
      row.innerHTML = '<span class="sr-name">' + window.ruleLabel(rid) + '</span>' +
        '<span class="sr-bar"><span style="width:' + pct + '%"></span></span>' +
        '<span class="sr-val">' + p.c + '/' + p.n + '</span>';
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
    wrap.appendChild(el("h2", "page-title", "الكتابة (بدون تكلفة)"));

    /* -- Task 2 prompt generator: general topics ONLY (no finance —
          specialist vocabulary inflates Lexical Resource and masks range) -- */
    var promptCard = el("div", "wp-card");
    promptCard.appendChild(el("h3", "grp-title", "١ · موضوع Task 2 عشوائي"));
    var promptBox = el("div", "wp-text ltr hidden");
    var genPrompt = el("button", "btn wide", "🎲 أعطني موضوعًا (عام — بلا مالية)");
    var currentPrompt = null;
    genPrompt.onclick = function () {
      var bank = window.WRITING_PROMPTS || [];
      if (!bank.length) return;
      var pick = bank[Math.floor(Math.random() * bank.length)];
      currentPrompt = pick;
      promptBox.textContent = pick.text;
      promptBox.classList.remove("hidden");
      genPrompt.textContent = "🎲 موضوع آخر";
    };
    promptCard.appendChild(genPrompt);
    promptCard.appendChild(promptBox);
    wrap.appendChild(promptCard);

    /* -- essay + evaluation assembler -- */
    wrap.appendChild(el("h3", "grp-title", "٢ · الصق مقالك"));
    wrap.appendChild(el("p", "muted-p",
      "اكتب في التطبيق أو على الورق ثم انقله هنا. يولّد التطبيق برومبت تقييم كاملًا (المعايير الأربعة + قائمة مراقبتك الحالية + مرحلتك) تلصقه في Claude. التطبيق لا يُقيّم بنفسه."));
    var ta = el("textarea", "big-input ltr");
    ta.rows = 10; ta.placeholder = "Paste your essay or paragraph here...";
    wrap.appendChild(ta);
    var gen = el("button", "btn primary wide", "أنشئ برومبت التقييم وانسخه");
    var out = el("textarea", "prompt-out ltr hidden"); out.rows = 10; out.readOnly = true;
    gen.onclick = function () {
      if (!ta.value.trim()) { ta.focus(); return; }
      var p = window.Prompts.writing(ta.value.trim(), currentPrompt ? currentPrompt.text : null);
      out.value = p; out.classList.remove("hidden");
      window.Prompts.copy(p, gen);
    };
    wrap.appendChild(gen);
    wrap.appendChild(el("div", "hint-line", "الخطوة التالية: افتح Claude، الصق، أرسل. سيعطيك درجة لكل معيار + وسم كل خطأ بأنماط قائمة مراقبتك."));
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

    /* ---- auto-sync (GitHub Gist) ---- */
    var syncBox = el("div", "sync-box");
    syncBox.appendChild(el("h3", "grp-title", "☁ المزامنة التلقائية بين الأجهزة"));

    var statusLine = el("div", "sync-status");
    function paintStatus() {
      var st = window.Sync.status();
      var labels = {
        off: "غير مفعّلة",
        idle: "بانتظار أول مزامنة…",
        syncing: "جارِ المزامنة…",
        ok: "✓ متزامن" + (window.Sync.lastSync() ? " — آخر مزامنة: " + new Date(window.Sync.lastSync()).toLocaleString("ar") : ""),
        offline: "⏸ " + (st.msg || "دون اتصال"),
        error: "⚠ " + (st.msg || "خطأ")
      };
      statusLine.textContent = labels[st.state] || st.state;
      statusLine.className = "sync-status " + st.state;
    }
    window.Sync.onStatus(paintStatus);
    paintStatus();

    if (!window.Sync.enabled()) {
      syncBox.appendChild(el("p", "muted-p",
        "فعّلها مرة واحدة على كل جهاز، وبعدها يُرفع تقدّمك تلقائيًا بعد كل إجابة ويُدمج عند الفتح — " +
        "تتدرّب على الموبايل وتكمل من الكمبيوتر والعكس."));
      var steps = el("div", "sync-steps");
      steps.innerHTML =
        '<b>خطوات إنشاء التوكن (مرة واحدة):</b><br>' +
        '١. افتح <span class="ltr">github.com/settings/tokens</span><br>' +
        '٢. Generate new token (classic)<br>' +
        '٣. علّم صلاحية <b>gist فقط</b> — لا شيء آخر<br>' +
        '٤. انسخ التوكن والصقه هنا:';
      syncBox.appendChild(steps);
      var tokenInput = document.createElement("input");
      tokenInput.type = "password"; tokenInput.className = "reason ltr";
      tokenInput.placeholder = "ghp_xxxxxxxxxxxx";
      syncBox.appendChild(tokenInput);
      var enableBtn = el("button", "btn primary wide", "تفعيل المزامنة");
      enableBtn.onclick = function () {
        var tk = tokenInput.value.trim();
        if (!tk) { alert("الصق التوكن أولًا."); return; }
        enableBtn.disabled = true; enableBtn.textContent = "جارِ التفعيل…";
        window.Sync.enable(tk).then(function () { go("data"); })
          .catch(function () { enableBtn.disabled = false; enableBtn.textContent = "تفعيل المزامنة"; });
      };
      syncBox.appendChild(enableBtn);
    } else {
      var syncNow = el("button", "btn wide", "↻ مزامنة الآن");
      syncNow.onclick = function () {
        window.Sync.pull().then(function (changed) {
          return window.Sync.push().then(function () { if (changed) go("data"); });
        });
      };
      syncBox.appendChild(syncNow);
      var offBtn = el("button", "btn small", "إيقاف المزامنة على هذا الجهاز");
      offBtn.onclick = function () {
        if (confirm("سيُحذف التوكن من هذا الجهاز فقط. بياناتك المحلية والسحابية تبقى كما هي. متابعة؟")) {
          window.Sync.disable(); go("data");
        }
      };
      syncBox.appendChild(offBtn);
    }
    syncBox.appendChild(statusLine);
    wrap.appendChild(syncBox);

    var exportBtn = el("button", "btn primary wide", "⬇ تصدير التقدّم + سجل الأسباب (JSON)");
    exportBtn.onclick = function () {
      var blob = new Blob([Store.exportJSON()], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ielts-trainer-backup.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      Store.markExported();
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

    wrap.appendChild(el("h3", "grp-title", "سجل الأسباب — مادة تشخيصية لجلسات التدريس"));

    // filters: rule + period + mode (diagnostic material for coaching)
    var filters = el("div", "log-filters");
    var ruleSel = document.createElement("select");
    ruleSel.className = "stage-select";
    var oAll = document.createElement("option");
    oAll.value = ""; oAll.textContent = "كل القواعد"; ruleSel.appendChild(oAll);
    window.RULES.forEach(function (r) {
      var o = document.createElement("option");
      o.value = r.id; o.textContent = r.label; ruleSel.appendChild(o);
    });
    var daySel = document.createElement("select");
    daySel.className = "stage-select";
    [["7", "آخر ٧ أيام"], ["30", "آخر ٣٠ يومًا"], ["", "كل الفترة"]].forEach(function (p) {
      var o = document.createElement("option");
      o.value = p[0]; o.textContent = p[1]; daySel.appendChild(o);
    });
    daySel.value = "30";
    var modeSel = document.createElement("select");
    modeSel.className = "stage-select";
    [["", "الوضعان"], ["calm", "هادئ"], ["load", "تحت الضغط ⚡"]].forEach(function (p) {
      var o = document.createElement("option");
      o.value = p[0]; o.textContent = p[1]; modeSel.appendChild(o);
    });
    filters.appendChild(ruleSel); filters.appendChild(daySel); filters.appendChild(modeSel);
    wrap.appendChild(filters);

    var log = [];
    function applyFilters() {
      var days = daySel.value ? parseInt(daySel.value, 10) : null;
      var cutoff = null;
      if (days) {
        var d = new Date(); d.setDate(d.getDate() - days);
        cutoff = d.toISOString().slice(0, 10);
      }
      log = Store.fullLog().filter(function (e) {
        if (ruleSel.value && e.rule !== ruleSel.value) return false;
        if (modeSel.value && (e.mode || "calm") !== modeSel.value) return false;
        if (cutoff && e.date < cutoff) return false;
        return true;
      }).slice(0, 100);
      renderLog();
    }
    ruleSel.onchange = applyFilters; daySel.onchange = applyFilters; modeSel.onchange = applyFilters;
    var lb = el("div", "log-list");
    function renderLog() {
      clear(lb);
      if (!log.length) { lb.appendChild(el("p", "muted-p", "لا سجل مطابق للفلاتر.")); return; }
      log.forEach(function (e) {
        var row = el("div", "log-row " + (e.correct ? "ok" : "bad"));
        row.innerHTML =
          '<div class="lg-top"><span class="lg-rule">' + window.ruleLabel(e.rule) +
          ((e.mode || "calm") === "load" ? ' <span class="lg-mode">⚡</span>' : '') +
          '</span><span class="lg-date">' + (e.date || "") + '</span>' +
          '<span class="lg-mark">' + (e.correct ? "✓" : "✗") + '</span></div>' +
          '<div class="lg-ans ltr">إجابتك: ' + escapeHtml(e.answer) + '</div>' +
          '<div class="lg-reason">سببك: ' + escapeHtml(e.reasoning || "—") + '</div>';
        // Old mistakes stay discussable: rebuild the Socratic chat prompt.
        if (!e.correct) {
          var it = window.ALL_ITEMS.filter(function (x) { return x.id === e.itemId; })[0];
          if (it) {
            var cb = el("button", "btn small chat-btn", "💬 ناقش هذا الخطأ مع Claude");
            cb.onclick = function () {
              window.Prompts.copy(window.Prompts.errorChat(it, e.answer, e.reasoning), cb);
            };
            row.appendChild(cb);
          }
        }
        lb.appendChild(row);
      });
    }
    applyFilters();
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
    home: homeView, session: sessionView, load: loadSessionView,
    roadmap: roadmapView, practice: practiceView,
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

  window.App = { go: go, startRule: startRule, current: function () { return currentRoute; } };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
