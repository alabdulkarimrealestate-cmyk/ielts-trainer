/* =========================================================
   مدرّب القواعد والكتابة — آيلتس  (app.js)
   كل المنطق محلي، حتمي، بلا أي اتصال شبكة أو ذكاء اصطناعي.
   الحالة محفوظة في localStorage.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- بيانات القواعد ---------- */
  // group: "grammar" | "phonetics" ؛ scored: هل تُحتسب في الدقة؟
  const RULES = [
    { id: "articles",        ar: "أدوات التعريف والتنكير",        group: "grammar",    scored: true },
    { id: "verbform",        ar: "صيغة الفعل بعد الجر/الوصل",      group: "grammar",    scored: true },
    { id: "copula",          ar: "فعل الكون والمطابقة",            group: "grammar",    scored: true },
    { id: "vocab",           ar: "مفردات معكوسة المعنى",           group: "grammar",    scored: true },
    { id: "stress",          ar: "نبر الكلمة",                    group: "phonetics",  scored: true },
    { id: "sentence_stress", ar: "نبر الجملة",                    group: "phonetics",  scored: true },
    { id: "ipa",             ar: "رموز IPA",                      group: "phonetics",  scored: true },
    { id: "schwa",           ar: "الشوا (الحركة المختزلة)",        group: "phonetics",  scored: true },
    { id: "dictionary",      ar: "قاموس النطق الشخصي",             group: "phonetics",  scored: false }
  ];
  const ruleMeta = (id) => RULES.find((r) => r.id === id);
  const BANK = window.IELTS_DATA || {};
  const itemsFor = (id) => (BANK[id] || []).slice();

  /* ---------- التخزين ---------- */
  const KEY = "ielts_trainer_v1";
  function blankState() {
    const rules = {};
    RULES.forEach((r) => { if (r.scored) rules[r.id] = { attempts: 0, correct: 0, streak: 0, last: null }; });
    return { rules, history: [], dictionary_user: [], dayStreak: 0, lastActiveDate: null };
  }
  let state = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blankState();
      const s = JSON.parse(raw);
      const base = blankState();
      return Object.assign(base, s, { rules: Object.assign(base.rules, s.rules || {}) });
    } catch (e) { return blankState(); }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- أدوات ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const app = $("#app");
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const yesterdayStr = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const setEq = (set, arr) => set.size === arr.length && arr.every((x) => set.has(x));

  function ruleAccuracy(id) {
    const r = state.rules[id];
    if (!r || r.attempts === 0) return null;
    return r.correct / r.attempts;
  }

  /* ---------- تسجيل محاولة ---------- */
  function recordAttempt(item, answer, reasoning, correct) {
    const r = state.rules[item.rule];
    if (r) { // مُسجَّلة
      r.attempts++; if (correct) { r.correct++; r.streak++; } else { r.streak = 0; }
      r.last = todayStr();
    }
    // تتابع الأيام
    const t = todayStr();
    if (state.lastActiveDate !== t) {
      state.dayStreak = state.lastActiveDate === yesterdayStr() ? state.dayStreak + 1 : 1;
      state.lastActiveDate = t;
    }
    state.history.push({ ts: Date.now(), rule: item.rule, itemId: item.id, answer: answer, reasoning: reasoning, correct: correct });
    if (state.history.length > 2000) state.history = state.history.slice(-2000);
    save();
    renderStreak();
  }

  function renderStreak() { $("#streakDays").textContent = state.dayStreak || 0; }

  /* =========================================================
     مشغّل العنصر — "فكّر قبل أن تكشف"
     يعرض السؤال، يأخذ الإجابة + التبرير، ثم يكشف.
     onDone(correct) يُستدعى عند الانتقال.
     ========================================================= */
  function renderItem(container, item, progressText, onDone) {
    let answered = false;            // هل أدخل المستخدم إجابة؟
    let revealed = false;
    let selected = null;             // mc/stress
    const multi = new Set();         // multiselect

    container.innerHTML = "";
    const card = document.createElement("div");
    card.className = "card";
    container.appendChild(card);

    if (progressText) {
      const p = document.createElement("div");
      p.className = "progress-line";
      p.textContent = progressText;
      card.appendChild(p);
    }

    // رأس: اسم القاعدة
    const head = document.createElement("div");
    head.className = "muted small";
    head.textContent = ruleMeta(item.rule).ar;
    card.appendChild(head);

    // منطقة السؤال
    const promptBox = document.createElement("div");
    card.appendChild(promptBox);

    // عناصر الإجابة (تختلف حسب النوع)
    const answerArea = document.createElement("div");
    card.appendChild(answerArea);

    // التبرير
    const reasonLabel = document.createElement("label");
    reasonLabel.className = "field-label";
    reasonLabel.textContent = "لماذا اخترت هذه الإجابة؟ (سطر واحد — إلزامي قبل الكشف)";
    const reason = document.createElement("textarea");
    reason.placeholder = "اكتب سبب اختيارك هنا...";
    card.appendChild(reasonLabel);
    card.appendChild(reason);

    // زر الكشف
    const revealBtn = document.createElement("button");
    revealBtn.className = "btn";
    revealBtn.textContent = "اكشف الإجابة";
    revealBtn.disabled = true;
    const btnRow = document.createElement("div");
    btnRow.style.marginTop = "14px";
    btnRow.appendChild(revealBtn);
    card.appendChild(btnRow);

    const revealBox = document.createElement("div");
    card.appendChild(revealBox);

    function refreshGate() {
      revealBtn.disabled = revealed || !answered || norm(reason.value) === "";
    }
    reason.addEventListener("input", refreshGate);

    /* --- بناء واجهة الإجابة حسب النوع --- */
    const gapHtml = (extra) =>
      esc(item.sentence_with_gap).replace("___", '<span class="gap">___' + (extra ? " " + esc(extra) : "") + "</span>");

    if (item.type === "mc") {
      promptBox.innerHTML = '<div class="prompt-sentence en">' +
        (item.direction ? esc(item.sentence_with_gap) : gapHtml()) + "</div>";
      const opts = shuffle([item.correct_answer].concat(item.distractors || []));
      const optWrap = document.createElement("div");
      optWrap.className = "options";
      opts.forEach((o) => {
        const b = document.createElement("button");
        b.className = "opt"; b.textContent = o; b.dataset.val = o;
        b.addEventListener("click", () => {
          if (revealed) return;
          optWrap.querySelectorAll(".opt").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected"); selected = o; answered = true; refreshGate();
        });
        optWrap.appendChild(b);
      });
      answerArea.appendChild(optWrap);

    } else if (item.type === "fill") {
      promptBox.innerHTML = '<div class="prompt-sentence en">' + gapHtml("(" + item.base_verb + ")") + "</div>";
      const inp = document.createElement("input");
      inp.type = "text"; inp.className = "en"; inp.placeholder = "اكتب الصيغة الصحيحة";
      inp.addEventListener("input", () => { selected = inp.value; answered = norm(inp.value) !== ""; refreshGate(); });
      answerArea.appendChild(inp);

    } else if (item.type === "stress") {
      promptBox.innerHTML = '<div class="prompt-sentence">اختر المقطع الذي يحمل النبر الرئيسي في كلمة <b class="en">' + esc(item.word) + "</b></div>";
      const row = document.createElement("div");
      row.className = "syllable-row";
      item.syllables.forEach((syl, idx) => {
        const b = document.createElement("button");
        b.className = "chip"; b.textContent = syl; b.dataset.idx = idx;
        b.addEventListener("click", () => {
          if (revealed) return;
          row.querySelectorAll(".chip").forEach((x) => x.classList.remove("selected"));
          b.classList.add("selected"); selected = idx; answered = true; refreshGate();
        });
        row.appendChild(b);
      });
      answerArea.appendChild(row);

    } else if (item.type === "multiselect") {
      const isSentence = item.rule === "sentence_stress";
      const units = isSentence ? item.words : item.syllables;
      const targets = isSentence ? item.stressed_indices : item.schwa_indices;
      promptBox.innerHTML = '<div class="prompt-sentence">' +
        (isSentence ? "حدّد كل الكلمات المنبورة في الجملة:" : "حدّد كل المقاطع التي تحمل الشوا /ə/ في كلمة <b class=\"en\">" + esc(item.word) + "</b>:") +
        "</div>";
      const row = document.createElement("div");
      row.className = isSentence ? "word-row" : "syllable-row";
      units.forEach((u, idx) => {
        const b = document.createElement("button");
        b.className = "chip"; b.textContent = u; b.dataset.idx = idx;
        b.addEventListener("click", () => {
          if (revealed) return;
          if (multi.has(idx)) { multi.delete(idx); b.classList.remove("selected"); }
          else { multi.add(idx); b.classList.add("selected"); }
          answered = multi.size > 0; refreshGate();
        });
        row.appendChild(b);
      });
      answerArea.appendChild(row);
      item._targets = targets; // للاستخدام عند الكشف
    }

    /* --- الكشف --- */
    revealBtn.addEventListener("click", () => {
      if (revealBtn.disabled) return;
      revealed = true; revealBtn.disabled = true;
      reason.disabled = true;

      let correct = false;
      let answerLabel = "";

      if (item.type === "mc") {
        correct = norm(selected) === norm(item.correct_answer);
        answerLabel = item.correct_answer;
        answerArea.querySelectorAll(".opt").forEach((b) => {
          b.disabled = true;
          if (norm(b.dataset.val) === norm(item.correct_answer)) b.classList.add("correct");
          else if (norm(b.dataset.val) === norm(selected)) b.classList.add("wrong");
        });
      } else if (item.type === "fill") {
        const accept = (item.accept || [item.correct_answer]).map(norm);
        correct = accept.indexOf(norm(selected)) !== -1;
        answerLabel = item.correct_answer;
        answerArea.querySelector("input").disabled = true;
      } else if (item.type === "stress") {
        correct = selected === item.correct_index;
        answerLabel = item.syllables.map((s, i) => i === item.correct_index ? s.toUpperCase() : s.toLowerCase()).join("-");
        answerArea.querySelectorAll(".chip").forEach((b) => {
          b.disabled = true; const i = +b.dataset.idx;
          if (i === item.correct_index) b.classList.add("correct");
          else if (i === selected) b.classList.add("wrong");
        });
      } else if (item.type === "multiselect") {
        const targets = item._targets;
        correct = setEq(multi, targets);
        const units = item.rule === "sentence_stress" ? item.words : item.syllables;
        answerLabel = targets.map((i) => units[i]).join("، ");
        answerArea.querySelectorAll(".chip").forEach((b) => {
          b.disabled = true; const i = +b.dataset.idx;
          if (targets.indexOf(i) !== -1) b.classList.add("correct");
          else if (multi.has(i)) b.classList.add("wrong");
        });
      }

      recordAttempt(item, typeof selected === "object" ? Array.from(multi) : selected, reason.value.trim(), correct);

      revealBox.innerHTML =
        '<div class="reveal ' + (correct ? "ok" : "bad") + '">' +
          '<div class="verdict">' + (correct ? "✓ صحيح" : "✗ خطأ") + "</div>" +
          '<div>الإجابة الصحيحة: <span class="answer-en">' + esc(answerLabel) + "</span></div>" +
          '<div class="explain">' + esc(item.explanation) + "</div>" +
          '<div class="your-reason">تبريرك المحفوظ: <b>' + esc(reason.value.trim()) + "</b></div>" +
        "</div>";

      const next = document.createElement("button");
      next.className = "btn secondary";
      next.style.marginTop = "12px";
      next.textContent = "التالي ▸";
      next.addEventListener("click", () => onDone(correct));
      revealBox.appendChild(next);
      next.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* =========================================================
     عرض: التمارين (اختيار قاعدة)
     ========================================================= */
  function viewDrill() {
    app.innerHTML = '<div class="card"><h2>التمارين</h2><p class="muted small">اختر قاعدة للتدريب عليها وحدها، أو خليطاً من الكل. كل عنصر يطبّق مبدأ «فكّر قبل أن تكشف».</p></div>';
    const grid = document.createElement("div");
    grid.className = "rule-grid";

    const mixed = document.createElement("button");
    mixed.className = "rule-pick";
    mixed.innerHTML = '<div class="rp-title">🎲 خليط من كل القواعد</div><div class="rp-sub">عناصر عشوائية متنوّعة</div>';
    mixed.addEventListener("click", () => startDrill("__mixed__"));
    grid.appendChild(mixed);

    RULES.forEach((r) => {
      const n = itemsFor(r.id).length;
      if (n === 0) return;
      const b = document.createElement("button");
      b.className = "rule-pick";
      const acc = ruleAccuracy(r.id);
      const accTxt = r.scored ? (acc == null ? "لم تبدأ بعد" : "الدقة " + Math.round(acc * 100) + "٪") : "مراجعة (بلا تقييم)";
      b.innerHTML = '<div class="rp-title">' + esc(r.ar) + "</div><div class=\"rp-sub\">" + n + " عنصر • " + accTxt + "</div>";
      b.addEventListener("click", () => { if (r.id === "dictionary") { setView("dictionary"); } else startDrill(r.id); });
      grid.appendChild(b);
    });
    app.appendChild(grid);
  }

  function startDrill(ruleId) {
    let queue;
    if (ruleId === "__mixed__") {
      let all = [];
      RULES.forEach((r) => { if (r.scored) all = all.concat(itemsFor(r.id)); });
      queue = shuffle(all);
    } else {
      queue = shuffle(itemsFor(ruleId));
    }
    let i = 0;
    const total = queue.length;
    function step() {
      if (i >= total) { drillSummary(ruleId); return; }
      const item = queue[i];
      renderItem(app, item, "عنصر " + (i + 1) + " من " + total, () => { i++; step(); });
    }
    step();
  }

  function drillSummary(ruleId) {
    app.innerHTML =
      '<div class="card"><h2>انتهت مجموعة التمارين 👏</h2>' +
      '<p class="muted">أحسنت. راجِع تبريراتك في لوحة التقدّم، أو ابدأ مجموعة أخرى.</p>' +
      '<div class="btn-row"><button class="btn" id="again">إعادة</button>' +
      '<button class="btn secondary" id="toDash">لوحة التقدّم</button></div></div>';
    $("#again").addEventListener("click", () => startDrill(ruleId));
    $("#toDash").addEventListener("click", () => setView("dashboard"));
  }

  /* =========================================================
     عرض: جلسة ١٥ دقيقة (موزونة نحو الأضعف)
     ========================================================= */
  const SESSION_SIZE = 16;
  function buildSession() {
    const scored = RULES.filter((r) => r.scored && itemsFor(r.id).length > 0);
    // وزن كل قاعدة: الأضعف دقةً (والأقل ممارسةً) يأخذ نصيباً أكبر
    const weights = scored.map((r) => {
      const acc = ruleAccuracy(r.id);
      const base = acc == null ? 0.85 : (1 - acc);  // لم تُمارَس → وزن عالٍ
      return { r, w: base + 0.15 };
    });
    const sum = weights.reduce((s, x) => s + x.w, 0);
    let picks = [];
    weights.forEach((x) => {
      let n = Math.max(1, Math.round((x.w / sum) * SESSION_SIZE));
      const pool = shuffle(itemsFor(x.r.id));
      picks = picks.concat(pool.slice(0, Math.min(n, pool.length)));
    });
    picks = shuffle(picks).slice(0, SESSION_SIZE);
    return picks;
  }

  function viewSession() {
    const weakest = RULES
      .filter((r) => r.scored && state.rules[r.id] && state.rules[r.id].attempts > 0)
      .map((r) => ({ r, a: ruleAccuracy(r.id) }))
      .sort((x, y) => x.a - y.a)[0];
    const hint = weakest
      ? "ستُرجَّح العناصر نحو نقطة ضعفك الحالية: <b>" + esc(weakest.r.ar) + "</b> (" + Math.round(weakest.a * 100) + "٪)."
      : "تمرّن قليلاً أولاً ثم ستوزّع الجلسة العناصر تلقائياً نحو الأضعف.";
    app.innerHTML =
      '<div class="card"><h2>جلسة ١٥ دقيقة</h2>' +
      '<p class="muted small">' + SESSION_SIZE + " عنصراً مختلطاً (قواعد + صوتيات)، موزونة نحو الأضعف. تنتهي بملخّص.</p>" +
      '<p class="small">' + hint + "</p>" +
      '<button class="btn" id="startSession">▶︎ ابدأ الجلسة</button></div>';
    $("#startSession").addEventListener("click", runSession);
  }

  function runSession() {
    const queue = buildSession();
    const total = queue.length;
    let i = 0, correctCount = 0;
    const perRule = {};
    function step() {
      if (i >= total) { sessionSummary(total, correctCount, perRule); return; }
      const item = queue[i];
      renderItem(app, item, "جلسة • عنصر " + (i + 1) + " من " + total, (correct) => {
        if (correct) correctCount++;
        perRule[item.rule] = perRule[item.rule] || { c: 0, n: 0 };
        perRule[item.rule].n++; if (correct) perRule[item.rule].c++;
        i++; step();
      });
    }
    step();
  }

  function sessionSummary(total, correct, perRule) {
    const pct = total ? Math.round((correct / total) * 100) : 0;
    let rows = "";
    Object.keys(perRule).forEach((rid) => {
      const x = perRule[rid];
      rows += '<div class="sg"><b>' + x.c + "/" + x.n + "</b>" + esc(ruleMeta(rid).ar) + "</div>";
    });
    app.innerHTML =
      '<div class="card"><h2>ملخّص الجلسة</h2>' +
      '<div class="summary-big">' + pct + "٪</div>" +
      '<p class="muted" style="text-align:center">' + correct + " صحيحة من " + total + " • تتابع الأيام: 🔥 " + (state.dayStreak || 0) + "</p>" +
      '<div class="summary-grid">' + rows + "</div>" +
      '<div class="btn-row"><button class="btn" id="again">جلسة أخرى</button>' +
      '<button class="btn secondary" id="toDash">لوحة التقدّم</button></div></div>';
    $("#again").addEventListener("click", runSession);
    $("#toDash").addEventListener("click", () => setView("dashboard"));
  }

  /* =========================================================
     عرض: لوحة التقدّم (كل قاعدة منفصلة — بلا درجة مجمّعة)
     ========================================================= */
  function viewDashboard() {
    app.innerHTML = '<div class="card"><h2>لوحة التقدّم</h2><p class="muted small">كل قاعدة تُتابَع منفصلة. لا توجد «درجة قواعد إجمالية».</p></div>';
    ["grammar", "phonetics"].forEach((g) => {
      const label = document.createElement("div");
      label.className = "group-label";
      label.textContent = g === "grammar" ? "▌ القواعد" : "▌ الصوتيات (معرفة النطق — بلا صوت)";
      app.appendChild(label);
      RULES.filter((r) => r.group === g).forEach((r) => app.appendChild(statCard(r)));
    });
  }

  function statCard(r) {
    const card = document.createElement("div");
    card.className = "card stat-card";
    if (!r.scored) {
      const userN = (state.dictionary_user || []).length;
      const total = itemsFor("dictionary").length + userN;
      card.innerHTML =
        '<div class="stat-head"><span class="stat-title">' + esc(r.ar) + '</span><span class="muted">' + total + " بطاقة</span></div>" +
        '<div class="stat-meta"><span>مراجعة فقط (بلا تقييم)</span><span>إضافاتك: ' + userN + "</span></div>";
      return card;
    }
    const s = state.rules[r.id];
    const acc = ruleAccuracy(r.id);
    const pct = acc == null ? null : Math.round(acc * 100);
    const cls = pct == null ? "" : pct >= 80 ? "good" : pct >= 60 ? "mid" : "low";
    card.innerHTML =
      '<div class="stat-head"><span class="stat-title">' + esc(r.ar) + "</span>" +
        '<span class="acc-badge ' + cls + '">' + (pct == null ? "—" : pct + "٪") + "</span></div>" +
      '<div class="bar"><span style="width:' + (pct == null ? 0 : pct) + '%"></span></div>' +
      '<div class="stat-meta">' +
        "<span>المحاولات: " + s.attempts + "</span>" +
        "<span>🔥 تتابع صحيح: " + s.streak + "</span>" +
        "<span>آخر تدريب: " + (s.last || "—") + "</span>" +
      "</div>";
    return card;
  }

  /* =========================================================
     عرض: قاموس النطق الشخصي (بطاقات + إضافة)
     ========================================================= */
  function allDictionary() { return itemsFor("dictionary").concat(state.dictionary_user || []); }

  function viewDictionary() {
    app.innerHTML =
      '<div class="card"><h2>قاموسي الصوتي</h2>' +
      '<p class="muted small">بطاقات نطق (IPA + تقريب عربي + نمط النبر + سياق مالي). اضغط البطاقة لقلبها. لا صوت — معرفة فقط.</p></div>';

    const cards = allDictionary();
    const holder = document.createElement("div");
    app.appendChild(holder);

    if (cards.length === 0) {
      holder.innerHTML = '<div class="empty">لا توجد بطاقات بعد. أضِف كلمة أدناه.</div>';
    } else {
      let idx = 0, flipped = false;
      const fc = document.createElement("div");
      fc.className = "flashcard";
      holder.appendChild(fc);
      const nav = document.createElement("div");
      nav.className = "btn-row";
      nav.innerHTML = '<button class="btn secondary" id="prevC">▸ السابق</button><button class="btn secondary" id="nextC">التالي ◂</button>';
      holder.appendChild(nav);

      function draw() {
        const c = cards[idx];
        if (!flipped) {
          fc.innerHTML = '<div class="fc-word en">' + esc(c.word) + "</div><div class=\"tap-hint\">اضغط لإظهار النطق — (" + (idx + 1) + "/" + cards.length + ")</div>";
        } else {
          fc.innerHTML =
            '<div class="fc-word en">' + esc(c.word) + "</div>" +
            '<div class="fc-ipa">' + esc(c.ipa || "") + "</div>" +
            '<div class="fc-row">تقريب عربي: <b>' + esc(c.arabic_approximation || "—") + "</b></div>" +
            '<div class="fc-row">النبر: <b class="en">' + esc(c.stress_pattern || "—") + "</b></div>" +
            (c.finance_context ? '<div class="fc-context en">' + esc(c.finance_context) + "</div>" : "");
        }
      }
      fc.addEventListener("click", () => { flipped = !flipped; draw(); });
      $("#prevC").addEventListener("click", () => { idx = (idx - 1 + cards.length) % cards.length; flipped = false; draw(); });
      $("#nextC").addEventListener("click", () => { idx = (idx + 1) % cards.length; flipped = false; draw(); });
      draw();
    }

    // نموذج الإضافة
    const form = document.createElement("div");
    form.className = "card";
    form.innerHTML =
      "<h3>➕ أضِف كلمة إلى قاموسك</h3>" +
      '<input type="text" class="en" id="dW" placeholder="word (English)" />' +
      '<input type="text" class="en" id="dI" placeholder="/IPA/" style="margin-top:8px" />' +
      '<input type="text" id="dA" placeholder="التقريب العربي" style="margin-top:8px" />' +
      '<input type="text" class="en" id="dS" placeholder="نمط النبر مثل li-QUID-i-ty" style="margin-top:8px" />' +
      '<input type="text" class="en" id="dC" placeholder="جملة سياق مالي (اختياري)" style="margin-top:8px" />' +
      '<button class="btn" id="addD" style="margin-top:10px">حفظ في قاموسي</button>' +
      '<p class="muted small" style="margin-top:8px">تُحفظ إضافاتك في هذا المتصفح. للإضافة الدائمة عدّل ملف <span class="en">data/phonetics_dictionary.js</span>.</p>';
    app.appendChild(form);
    $("#addD").addEventListener("click", () => {
      const w = $("#dW").value.trim();
      if (!w) { $("#dW").focus(); return; }
      state.dictionary_user.push({
        word: w, ipa: $("#dI").value.trim(), arabic_approximation: $("#dA").value.trim(),
        stress_pattern: $("#dS").value.trim(), finance_context: $("#dC").value.trim()
      });
      save();
      viewDictionary();
    });
  }

  /* =========================================================
     عرض: فحص الكتابة (توليد موجّه — بلا أي ذكاء اصطناعي)
     ========================================================= */
  function buildEvalPrompt(essay) {
    return [
      "أنت مصحّح آيلتس خبير. قيّم مقالة الطالب التالية (آيلتس أكاديمي، الهدف Band 7.0).",
      "",
      "=== نص المقالة ===",
      essay,
      "=== نهاية المقالة ===",
      "",
      "أولاً: أعطِ درجة Band منفصلة (٠–٩، بأنصاف الدرجات) لكل معيار من المعايير الأربعة، ثم درجة إجمالية:",
      "1) Task Response — الاستجابة للمهمة.",
      "2) Coherence & Cohesion — التماسك والربط.",
      "3) Lexical Resource — الثروة اللغوية.",
      "4) Grammatical Range & Accuracy — تنوّع ودقّة القواعد.",
      "وضّح بإيجاز سبب كل درجة.",
      "",
      "ثانياً: استخرج كل خطأ في القواعد، ووَسِم كل خطأ بأيٍّ من أنماط المراقبة الأربعة ينتمي (إن انطبق):",
      "[A] أدوات التعريف/التنكير (a/an/the/بدون) — خاصةً: اسم مفرد معدود بلا أداة، و«an advice» الخطأ.",
      "[B] صيغة الفعل بعد حروف الجر وضمائر الوصل (gerund بعد الجر، والمطابقة بعد who/which/that).",
      "[C] فعل الكون والمطابقة مع المفرد الغائب (حذف is/are؛ has لا have؛ الـ s للمفرد).",
      "[D] مفردات معكوسة المعنى (مثل employer/employee, affect/effect, rise/raise...).",
      "لكل خطأ: اقتبس المقطع، صنّفه [A]/[B]/[C]/[D] أو «أخرى»، واكتب التصحيح وسبباً موجزاً.",
      "",
      "ثالثاً (سلامة التشخيص): نبّهني إن كانت الثروة اللغوية تبدو منتفخة بسبب انحياز الموضوع نحو المحاسبة/المالية/CMA،",
      "أي أنني أستخدم مصطلحات مالية متقدّمة بطلاقة لكن قد تضعف لغتي في مواضيع آيلتس العامة. اقترح كيف أتحقق من ذلك.",
      "",
      "رابعاً: أعطِ ٣ أولويات عملية لرفع الدرجة نصف Band، مرتبطة بالأنماط [A]–[D] أعلاه."
    ].join("\n");
  }

  function viewWriting() {
    app.innerHTML =
      '<div class="card"><h2>فحص الكتابة (بلا تكلفة)</h2>' +
      '<p class="muted small">ألصِق فقرة أو مقالة Task 2، ثم وَلِّد موجّه التقييم وانسخه إلى محادثة Claude لديك. التطبيق لا يصحّح ولا يتصل بأي خدمة.</p>' +
      '<textarea id="essayInput" placeholder="Paste your paragraph or Task 2 essay here (English)..."></textarea>' +
      '<div class="btn-row"><button class="btn" id="genBtn">أنشئ موجّه التقييم وانسخه</button>' +
      '<button class="btn secondary" id="clearBtn">مسح</button></div>' +
      '<div class="copied-note" id="copiedNote">✓ تم النسخ إلى الحافظة — ألصِقه في Claude.</div>' +
      '<label class="field-label" id="outLbl" style="display:none">الموجّه الجاهز (انسخه يدوياً إن لزم):</label>' +
      '<textarea id="promptOut" class="en" style="display:none;min-height:160px" readonly></textarea></div>';

    $("#clearBtn").addEventListener("click", () => { $("#essayInput").value = ""; });
    $("#genBtn").addEventListener("click", () => {
      const essay = $("#essayInput").value.trim();
      if (!essay) { $("#essayInput").focus(); return; }
      const prompt = buildEvalPrompt(essay);
      const out = $("#promptOut");
      out.value = prompt; out.style.display = "block"; $("#outLbl").style.display = "block";
      const done = () => { $("#copiedNote").style.display = "block"; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(prompt).then(done).catch(() => { out.select(); done(); });
      } else { out.select(); try { document.execCommand("copy"); } catch (e) {} done(); }
    });
  }

  /* =========================================================
     تصدير البيانات
     ========================================================= */
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ielts-trainer-progress-" + todayStr() + ".json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* =========================================================
     التوجيه (Router)
     ========================================================= */
  const VIEWS = { session: viewSession, drill: viewDrill, dashboard: viewDashboard, dictionary: viewDictionary, writing: viewWriting };
  function setView(name) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === name));
    (VIEWS[name] || viewSession)();
    window.scrollTo(0, 0);
  }

  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setView(t.dataset.view)));
  $("#exportBtn").addEventListener("click", exportJSON);

  renderStreak();
  setView("session");
})();
