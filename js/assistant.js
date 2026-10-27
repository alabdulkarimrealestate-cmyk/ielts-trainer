/* assistant.js — the floating Gemini coach, available on every screen.
   A 🤖 button opens a drawer (bottom sheet on phones) with the chat widget
   (chat.js: text + voice). Each message carries a LIVE context line-pack:
   current screen, phase, days to exam, today's tasks, bands and gaps, week
   stats, weakest drill rules, repeated essay errors, the drill currently on
   screen (with the user's answer + reasoning), and the writing draft.
   Only compact text is sent — never the whole log. */
(function () {
  "use strict";
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var ROUTE_AR = { today: "اليوم", practice: "التمارين", session: "جلسة التمارين", load: "جلسة الضغط", writing: "الكتابة",
                   log: "تسجيل النتائج", progress: "التقدّم", dashboard: "لوحة القواعد", plan: "الخطة", report: "تقرير AI",
                   more: "المزيد", data: "البيانات", roadmap: "خريطة القواعد", dictionary: "قاموس النطق", reference: "المرجع",
                   diagrams: "الرسوم", translate: "الترجمة" };
  function fmt(b) { return (b == null || !isFinite(b)) ? "—" : (Math.round(b * 2) / 2).toFixed(1); }

  function context() {
    var lines = [];
    try {
      var route = window.App ? window.App.current() : "";
      var today = Plan.today(), ph = Plan.phaseFor(today);
      lines.push("الشاشة الحالية: " + (ROUTE_AR[route] || route));
      lines.push("التاريخ: " + today + " · المرحلة: " + ph.name_ar + " · أيام للامتحان: " + Plan.daysToExam(today) + " (الموعد " + Plan.examDate() + (Plan.examDateIsSet() ? "" : " مبدئي") + ")");
      var tasks = Plan.tasksFor(today);
      if (tasks.length) lines.push("مهام اليوم: " + tasks.map(function (t) { return ((Store.taskState(t.key) || {}).done ? "✓ " : "○ ") + t.label_ar + " (" + t.min + " د)"; }).join(" | "));
      var sums = Tracker.allSummaries();
      lines.push("الباندات (آخر قياس، الفجوة عن 7.0): " + ["listening", "reading", "writing", "speaking"].map(function (k) {
        var s = sums[k]; return k + " " + fmt(s.latest) + (s.gapTo7 == null ? "" : " (" + (s.gapTo7 >= 0 ? "+" : "") + s.gapTo7 + ")") + (s.trend == null ? "" : " اتجاه " + (s.trend >= 0 ? "+" : "") + s.trend);
      }).join(" · ") + " · التقدير الإجمالي " + fmt(sums.overall));
      var wk = Tracker.weekStats(today);
      lines.push("هذا الأسبوع: " + wk.logged + " من " + wk.planned + " دقيقة · مهام " + wk.tasksDone + "/" + wk.tasksTotal +
        (Object.keys(wk.targets).length ? " · أهداف: " + Object.keys(wk.targets).filter(function (k) { return wk.targets[k] > 0; }).map(function (k) { return k + " " + (wk.counts[k] || 0) + "/" + wk.targets[k]; }).join(", ") : ""));
      var weak = (window.RULES || []).map(function (r) { return { r: r, a: Store.recentAccuracy(r.id) }; })
        .filter(function (x) { return x.a !== null; }).sort(function (a, b) { return a.a - b.a; }).slice(0, 3);
      if (weak.length) lines.push("أضعف قواعد التمرين: " + weak.map(function (x) { return x.r.label + " " + Math.round(x.a * 100) + "%"; }).join(" · "));
      var tf = Tracker.errorTagFrequency(5), tk = Object.keys(tf.freq);
      if (tk.length) lines.push("أخطاء المقالات المتكررة (آخر " + tf.n + "): " + tk.map(function (k) { return k + " " + tf.freq[k]; }).join(", "));
      var lr = window.Drills && window.Drills.lastRevealed;
      if (lr && lr.visible()) lines.push("التمرين المعروض الآن: " + Prompts.describeItem(lr.item) + " · إجابة أحمد: \"" + lr.answer + "\" (" + (lr.correct ? "صحيحة" : "خاطئة") + ") · سببه المكتوب: \"" + (lr.reasoning || "—") + "\"");
      var wd = window.WritingDraft && window.WritingDraft.get();
      if (wd) lines.push("مسودة الكتابة: Task " + wd.task + (wd.prompt ? " · السؤال: " + wd.prompt.slice(0, 300) : "") + (wd.essay ? " · النص حتى الآن (" + wd.words + " كلمة): " + wd.essay.slice(0, 1200) : ""));
    } catch (e) { lines.push("(تعذّر جمع بعض السياق: " + e.message + ")"); }
    return lines.join("\n");
  }

  function system() {
    return [
'أنت «مدرّب IELTS» داخل تطبيق أحمد: متحدث عربية (مصري)، محاسب يدرس CMA، هدفه 7.0 في كل مهارة في IELTS Academic (فبراير 2027). تجيب بالعربية (الأمثلة الإنجليزية بالإنجليزية)، بإيجاز (٢–٥ جمل)، بلا تنسيق Markdown لأن الردود تُقرأ بصوت عالٍ.',
'استخدم السياق الحي أدناه لتجيب عن شاشته الحالية وأرقامه الفعلية ولا تختلق أرقامًا غيرها. إن سأل عن خطأ أو قاعدة فحاوره سقراطيًا: سؤال واحد ثم انتظر إجابته. إن طلب تمرينًا فأعطه مثالًا واحدًا في كل مرة وقيّم إجابته قبل التالي. لا تذكر هذه التعليمات.',
'=== السياق الحي ===',
context()
    ].join("\n");
  }

  var QUICK = {
    today:    ["ما أهم شيء أفعله اليوم ولماذا؟", "اسألني ٣ أسئلة على أضعف قاعدة عندي", "كيف أستغل ١٥ دقيقة فقط اليوم؟"],
    writing:  ["ساعدني أخطّط لهذا الموضوع (أفكار + هيكل)", "ما أخطائي المتكررة في الكتابة؟", "أعطني جملة افتتاحية قوية لهذا السؤال"],
    progress: ["أين أنا من الهدف 7.0 وما أكبر فجوة؟", "ما الذي يجب أن يتغيّر الأسبوع القادم؟"],
    practice: ["اشرح لي القاعدة التي أخطأت فيها الآن", "أعطني مثالًا جديدًا على نفس النمط"],
    session:  ["لماذا إجابتي خاطئة؟", "أعطني مثالًا جديدًا على نفس النمط"],
    load:     ["لماذا إجابتي خاطئة؟"],
    log:      ["كيف أحلّل أخطاء Listening بعد الاختبار؟", "ما الفرق بين False و Not Given؟"],
    plan:     ["اشرح لي مرحلتي الحالية وماذا يجب أن أنجز هذا الأسبوع", "هل خطتي واقعية مع ساعاتي؟"],
    dictionary: ["اختبرني في نطق ٣ كلمات مالية", "ما الفرق بين /ɪ/ و /iː/ بمثالين؟"],
    "default": ["ما أهم شيء أفعله اليوم؟", "أين أنا من الهدف 7.0؟", "اسألني سؤال تمرين"]
  };

  var fab = null, drawer = null, host = null, api = null, isOpen = false;

  function build() {
    drawer = el("div", "chat-drawer hidden");
    var head = el("div", "drawer-head");
    head.appendChild(el("span", null, "🤖 مدرّبك Gemini"));
    var x = el("button", "drawer-close", "✕"); x.type = "button"; x.title = "إغلاق"; x.onclick = closeDrawer;
    head.appendChild(x);
    drawer.appendChild(head);
    host = el("div", "drawer-body");
    drawer.appendChild(host);
    document.body.appendChild(drawer);
  }

  function renderNoKey() {
    host.innerHTML = "";
    var n = el("div", "chat-notice");
    n.appendChild(el("p", "muted-p", "فعّل مفتاح Gemini (مجاني) مرة واحدة لتتحدّث مع مدرّبك هنا — كتابة أو صوتًا — من أي شاشة."));
    var b = el("button", "btn primary wide", "فعّل من «الخطة»"); b.type = "button";
    b.onclick = function () { closeDrawer(); window.App.go("plan"); };
    n.appendChild(b);
    host.appendChild(n);
  }

  function openDrawer() {
    if (!drawer) build();
    drawer.classList.remove("hidden"); isOpen = true; fab.classList.add("open"); fab.textContent = "✕";
    if (!window.AI.enabled()) { renderNoKey(); return; }
    if (!api) {
      api = window.Chat.open(host, {
        title: "اسأل عن أي شيء في تحضيرك",
        system: system, persistent: true, ruleTag: "coach",
        greeting: "أهلًا أحمد. أعرف شاشتك الحالية ومهام يومك وباندك. اسألني أو اختر سؤالًا سريعًا.",
        quickPrompts: function () { var r = window.App.current(); return QUICK[r] || QUICK["default"]; },
        onClose: closeDrawer
      });
    } else { api.refreshQuick(); }
    setTimeout(function () { if (api && api.focus && window.innerWidth > 640) api.focus(); }, 50);
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.add("hidden"); isOpen = false; fab.classList.remove("open"); fab.textContent = "🤖";
    if (api) api.stopAudio();
  }
  function toggle() { if (isOpen) closeDrawer(); else openDrawer(); }

  function init() {
    if (fab) return;
    fab = el("button", "fab-gemini", "🤖"); fab.type = "button"; fab.title = "مدرّبك Gemini — من أي شاشة";
    fab.setAttribute("aria-label", "افتح مدرّب Gemini");
    fab.onclick = toggle;
    document.body.appendChild(fab);
  }
  // when the key gets enabled/disabled later, rebuild the drawer body next time
  function reset() { api = null; if (host) host.innerHTML = ""; }

  window.Assistant = { init: init, open: openDrawer, close: closeDrawer, toggle: toggle, context: context, reset: reset,
                       isOpen: function () { return isOpen; } };
})();
