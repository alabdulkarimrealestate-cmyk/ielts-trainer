/* rl.js — in-app Reading + Listening practice (original passages / scripts).
   Reading: passage + questions (TRUE/FALSE/NOT GIVEN, multiple choice, gap-fill,
   matching headings, which-paragraph), timer, auto-scoring, band estimate, the
   evidence highlighted in the passage, "explain my mistake" chat per wrong answer.
   Listening: the script is read aloud by the browser's own text-to-speech
   (offline, free; voice quality depends on the device — pick voices in the
   hub). Exam mode plays once; practice mode allows replay + speed.
   Results are saved as Store.exams records (source "in-app") so the weekly
   targets, progress screen and plan tasks pick them up automatically.
   Data: data/reading.js (READING_PASSAGES), data/listening.js (LISTENING_SECTIONS). */
(function () {
  "use strict";

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function btn(label, cls, onClick) { var b = el("button", "btn " + (cls || ""), label); b.type = "button"; b.onclick = onClick; return b; }
  function fmtBand(b) { return (b == null || !isFinite(b)) ? "—" : (Math.round(b * 2) / 2).toFixed(1); }
  function mmss(s) { s = Math.max(0, Math.round(s)); var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? "0" : "") + m + ":" + (r < 10 ? "0" : "") + r; }
  function passages() { return window.READING_PASSAGES || []; }
  function sections() { return window.LISTENING_SECTIONS || []; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------------- answer checking ---------------- */
  // case/punctuation-insensitive; "14th" = "14", "10,000" = "10000", "7.15" = "7:15"
  var NUMW = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
               fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100 };
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().replace(/[’‘]/g, "'").replace(/(\d)(st|nd|rd|th)\b/g, "$1").replace(/[.,;:!?"“”()£$€]/g, "")
      .replace(/\s+/g, " ").trim().split(" ").map(function (w) { return Object.prototype.hasOwnProperty.call(NUMW, w) ? String(NUMW[w]) : w; }).join(" ");
  }
  function lev(a, b) {
    var m = a.length, n = b.length, d = [], i, j;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
    return d[m][n];
  }
  // → { ok, near }  (near = a spelling slip: counted wrong but tagged "إملاء")
  function check(q, given) {
    if (given == null || given === "") return { ok: false, near: false };
    if (q.type === "gap") {
      var g = norm(given), acc = [q.answer].concat(q.accept || []).map(norm);
      if (acc.indexOf(g) !== -1) return { ok: true, near: false };
      var near = acc.some(function (a) { return a.length >= 4 && lev(a, g) <= Math.max(1, Math.floor(a.length / 6)); });
      return { ok: false, near: near };
    }
    return { ok: String(given) === String(q.answer), near: false };
  }
  var ERR_BY_TYPE = { tfng: "True/False/Not Given", heading: "Matching headings", para: "مطابقة الفقرات", mcq: "اختيار من متعدد", gap: "إكمال جمل/ملخّص" };

  /* ---------------- history (from Store.exams) ---------------- */
  function attempts(skill) { return (Store.exams() || []).filter(function (e) { return e.source === "in-app" && e.skill === skill && e.refs; }); }
  function seenInfo(skill, id) {
    var best = null, n = 0;
    attempts(skill).forEach(function (e) {
      if (e.refs.indexOf(id) === -1) return;
      n++;
      var pct = e.of ? e.score / e.of : 0;
      if (!best || pct > best.pct) best = { pct: pct, score: e.score, of: e.of, band: e.band, date: e.date };
    });
    return { n: n, best: best };
  }

  /* ---------------- text-to-speech ---------------- */
  var VKEY = "ielts_rl_voices";
  function loadPrefs() { try { return JSON.parse(localStorage.getItem(VKEY)) || {}; } catch (e) { return {}; } }
  function savePrefs(p) { try { localStorage.setItem(VKEY, JSON.stringify(p)); } catch (e) {} }

  var TTS = {
    ok: typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined",
    gen: 0, playing: false,
    voices: function () {
      if (!TTS.ok) return [];
      return (window.speechSynthesis.getVoices() || []).filter(function (v) { return /^en[-_]/i.test(v.lang) || /^en$/i.test(v.lang); })
        .sort(function (a, b) {
          function rank(v) { return (/^en[-_]GB/i.test(v.lang) ? 0 : /^en[-_](AU|IE|NZ|ZA)/i.test(v.lang) ? 1 : /^en[-_]US/i.test(v.lang) ? 2 : 3) + (v.localService ? 0 : 0.5); }
          return rank(a) - rank(b);
        });
    },
    byUri: function (uri) { var vs = TTS.voices(); for (var i = 0; i < vs.length; i++) if (vs[i].voiceURI === uri) return vs[i]; return null; },
    // speaker -> voice: saved choice, else first two distinct voices (female/male hints), else one voice with a different pitch
    assign: function () {
      var vs = TTS.voices(), pref = loadPrefs(), out = {};
      function find(re, skip) { for (var i = 0; i < vs.length; i++) if (re.test(vs[i].name) && vs[i] !== skip) return vs[i]; return null; }
      var fem = find(/female|woman|samantha|susan|hazel|libby|sonia|zira|karen|moira|serena|kate/i), mal = find(/\bmale\b|man\b|daniel|george|ryan|thomas|guy|alex|oliver|arthur|david|mark/i, fem);
      var auto = { A: fem || vs[0] || null, B: mal || vs.filter(function (v) { return v !== (fem || vs[0]); })[0] || vs[0] || null };
      auto.C = vs.filter(function (v) { return v !== auto.A && v !== auto.B; })[0] || auto.B || auto.A;
      ["A", "B", "C"].forEach(function (k) {
        var chosen = pref[k] ? TTS.byUri(pref[k]) : null;
        out[k] = chosen || auto[k];
      });
      return out;
    },
    stop: function () { TTS.gen++; TTS.playing = false; if (TTS.ok) { try { window.speechSynthesis.cancel(); } catch (e) {} } },
    // text as the voice should say it (the data keeps the written form that the learner types):
    //  - spelled words "A-S-H-W-O-R-T-H" -> letter names; UK postcodes "KT8 4BQ" -> letters + digits
    //  - clock times "7.15" -> "7 15"; prices "£2.50" -> "2 pounds 50"; "&" -> "and"
    LETTERS: { a: "ay", b: "bee", c: "see", d: "dee", e: "ee", f: "eff", g: "jee", h: "aitch", i: "eye", j: "jay", k: "kay", l: "el", m: "em",
               n: "en", o: "oh", p: "pee", q: "queue", r: "ar", s: "ess", t: "tee", u: "you", v: "vee", w: "double you", x: "ex", y: "why", z: "zed" },
    spell: function (str) {
      return String(str).replace(/[A-Za-z]/g, function (c) { return " " + TTS.LETTERS[c.toLowerCase()] + " "; }).replace(/\s+/g, " ").trim();
    },
    speakable: function (t) {
      t = String(t);
      t = t.replace(/\b(?:[A-Za-z]-){2,}[A-Za-z]\b/g, function (m) { return m.replace(/-/g, "").split("").map(function (c) { return TTS.LETTERS[c.toLowerCase()]; }).join(", "); });
      t = t.replace(/\b([A-Z]{1,2})(\d[A-Z\d]?)\s?(\d)([A-Z]{2})\b/g, function (m, a, d, n, z) { return TTS.spell(a) + " " + d.replace(/[A-Z]/g, function (c) { return TTS.spell(c); }) + ", " + n + " " + TTS.spell(z); });
      t = t.replace(/\b(1[0-2]|[1-9])\.(00|05|10|15|20|25|30|35|40|45|50|55)\b/g, function (m, h, mi) { return mi === "00" ? h + " o'clock" : h + " " + mi; });
      t = t.replace(/£(\d+)(?:\.(\d{2}))?/g, function (m, a, b) { return a + (a === "1" ? " pound" : " pounds") + (b && b !== "00" ? " " + b : ""); });
      return t.replace(/&/g, " and ");
    },
    // sentences, further cut at commas when long (some engines drop utterances over ~15 s)
    sentences: function (t) {
      var m = String(t).match(/[^.!?]+[.!?]*\s*/g), out = [];
      (m || [String(t)]).forEach(function (x) {
        x = x.trim(); if (!x) return;
        if (x.length <= 190) { out.push(x); return; }
        var parts = x.split(/(?<=,)\s+/), cur = "";
        parts.forEach(function (pt) { if ((cur + " " + pt).length > 190 && cur) { out.push(cur.trim()); cur = pt; } else cur += " " + pt; });
        if (cur.trim()) out.push(cur.trim());
      });
      return out;
    },
    // opts: { rate, from (turn index), onTurn(i), onEnd() }
    play: function (turns, opts) {
      TTS.stop();
      if (!TTS.ok) { if (opts.onEnd) opts.onEnd(new Error("no tts")); return; }
      var gen = TTS.gen, voices = TTS.assign(), rate = opts.rate || 1;
      var seq = [];
      turns.forEach(function (t, ti) {
        if (ti < (opts.from || 0)) return;
        TTS.sentences(TTS.speakable(t.text)).forEach(function (s, si, arr) { seq.push({ ti: ti, s: s, spk: t.s, last: si === arr.length - 1 }); });
      });
      var k = 0; TTS.playing = true;
      (function next() {
        if (gen !== TTS.gen) return;
        if (k >= seq.length) { TTS.playing = false; if (opts.onEnd) opts.onEnd(); return; }
        var it = seq[k++];
        if (opts.onTurn && (k === 1 || seq[k - 2].ti !== it.ti)) opts.onTurn(it.ti);
        var u = new window.SpeechSynthesisUtterance(it.s);
        u.lang = "en-GB"; u.rate = rate;
        var v = voices[it.spk]; if (v) { u.voice = v; u.lang = v.lang; }
        if (it.spk === "B" && voices.B === voices.A) u.pitch = 0.75;
        if (it.spk === "C" && (voices.C === voices.A || voices.C === voices.B)) u.pitch = 1.25;
        var done = false;
        function fin() { if (done) return; done = true; if (gen !== TTS.gen) return; setTimeout(next, it.last ? 450 : 120); }
        u.onend = fin; u.onerror = fin;
        // watchdog: some engines never fire onend (long utterance / paused tab)
        var guard = setTimeout(fin, Math.max(4000, it.s.length * 140 / rate));
        u.onend = function () { clearTimeout(guard); fin(); }; u.onerror = function () { clearTimeout(guard); fin(); };
        try { window.speechSynthesis.speak(u); } catch (e) { clearTimeout(guard); fin(); }
      })();
    }
  };
  if (TTS.ok) { try { window.speechSynthesis.onvoiceschanged = function () { /* voices list refreshes lazily */ }; } catch (e) {} }

  /* ---------------- question widgets ---------------- */
  var INSTR = {
    tfng: ["Do the following statements agree with the information given in the passage? Write TRUE if the statement agrees with the information, FALSE if it contradicts the information, NOT GIVEN if there is no information on this.",
           "هل تتفق العبارات مع النص؟ TRUE = موافقة · FALSE = مخالفة · NOT GIVEN = غير مذكور (لا يؤكد ولا ينفي)."],
    mcq: ["Choose the correct letter, A, B, C or D.", "اختر الحرف الصحيح."],
    gap: ["Complete the sentences below. Write NO MORE THAN {n} WORDS from the {src} for each answer.", "أكمل بكلمات {srcAr} (بحدّ أقصى {nAr} كلمة)."],
    heading: ["Choose the correct heading for each paragraph from the list of headings below.", "اختر العنوان المناسب لكل فقرة من القائمة (يوجد عنوانان زائدان)."],
    para: ["Which paragraph contains the following information? Write the correct letter, {range}.", "في أي فقرة توجد المعلومة التالية؟"]
  };
  function instrText(type, p, isListening) {
    var t = INSTR[type], n = 2;
    (p.questions || []).forEach(function (q) { if (q.type === "gap" && q.max_words) n = Math.max(n, q.max_words); });
    var labels = (p.paragraphs || []).map(function (x) { return x.label; });
    function f(s) { return s.replace("{n}", n === 1 ? "ONE" : n === 2 ? "TWO" : String(n)).replace("{nAr}", String(n)).replace("{src}", isListening ? "recording" : "passage")
      .replace("{srcAr}", isListening ? "من التسجيل" : "من النص").replace("{range}", labels.length ? labels[0] + "–" + labels[labels.length - 1] : "A–E"); }
    return [f(t[0]), f(t[1])];
  }

  // builds the widget for one question; returns { node, get(), lock() , set(v) }
  function widget(q, p, onChange) {
    var box = el("div", "rl-widget"), val = "";
    function emit() { if (onChange) onChange(); }
    if (q.type === "tfng") {
      var bs = [];
      ["TRUE", "FALSE", "NOT GIVEN"].forEach(function (o) {
        var b = el("button", "rl-opt", o); b.type = "button";
        b.onclick = function () { val = (val === o) ? "" : o; bs.forEach(function (x) { x.classList.toggle("sel", x.textContent === val); }); emit(); };
        bs.push(b); box.appendChild(b);
      });
      return { node: box, get: function () { return val; }, lock: function () { bs.forEach(function (b) { b.disabled = true; }); } };
    }
    if (q.type === "mcq") {
      var os = [];
      box.classList.add("rl-mcq");
      q.options.forEach(function (o, i) {
        var letter = "ABCD".charAt(i), b = el("button", "rl-opt rl-opt-wide ltr");
        b.type = "button"; b.appendChild(el("b", null, letter + ". ")); b.appendChild(document.createTextNode(String(o).replace(/^[A-D][.)]\s*/, "")));
        b.onclick = function () { val = (val === letter) ? "" : letter; os.forEach(function (x, j) { x.classList.toggle("sel", "ABCD".charAt(j) === val); }); emit(); };
        os.push(b); box.appendChild(b);
      });
      return { node: box, get: function () { return val; }, lock: function () { os.forEach(function (b) { b.disabled = true; }); } };
    }
    if (q.type === "gap") {
      var inp = el("input", "rl-gap ltr"); inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false;
      inp.setAttribute("autocapitalize", "off"); inp.setAttribute("autocorrect", "off");
      inp.oninput = function () { val = inp.value; emit(); };
      return { node: inp, get: function () { return val; }, lock: function () { inp.disabled = true; }, input: inp };
    }
    // heading / para -> select
    var sel = el("select", "rl-select ltr");
    sel.appendChild(el("option", null, "—")).value = "";
    var keys = q.type === "heading" ? Object.keys(p.headings || {}) : (p.paragraphs || []).map(function (x) { return x.label; });
    keys.forEach(function (k) { var o = el("option", null, k); o.value = k; sel.appendChild(o); });
    sel.onchange = function () { val = sel.value; emit(); };
    return { node: sel, get: function () { return val; }, lock: function () { sel.disabled = true; } };
  }

  /* render the question list of one unit; returns { node, widgets:{qid:w}, order:[q] } */
  function renderQuestions(p, startNo, isListening, onChange) {
    var root = el("div", "rl-questions"), widgets = {}, groups = [], cur = null;
    p.questions.forEach(function (q) {
      if (!cur || cur.type !== q.type) { cur = { type: q.type, qs: [] }; groups.push(cur); }
      cur.qs.push(q);
    });
    var no = startNo;
    groups.forEach(function (g) {
      var first = no, last = no + g.qs.length - 1;
      var gh = el("div", "rl-group");
      gh.appendChild(el("div", "rl-group-title", "Questions " + first + (last > first ? "–" + last : "")));
      var ins = instrText(g.type, p, isListening);
      gh.appendChild(el("div", "rl-instr ltr", ins[0]));
      gh.appendChild(el("div", "rl-instr-ar", ins[1]));
      if (g.type === "heading") {
        var hl = el("div", "rl-headings ltr");
        Object.keys(p.headings || {}).forEach(function (k) { hl.appendChild(el("div", null, k + "  " + p.headings[k])); });
        gh.appendChild(hl);
      }
      root.appendChild(gh);
      g.qs.forEach(function (q) {
        var row = el("div", "rl-q"); row.id = "rlq-" + p.id + "-" + q.id;
        var w = widget(q, p, onChange);
        var head = el("div", "rl-q-head");
        head.appendChild(el("span", "rl-qno", String(no)));
        if (q.type === "gap") {
          var line = el("div", "rl-q-text ltr"), parts = String(q.prompt).split("___");
          line.appendChild(document.createTextNode(parts[0] || "")); line.appendChild(w.node); line.appendChild(document.createTextNode(parts[1] || ""));
          head.appendChild(line); row.appendChild(head);
        } else if (q.type === "heading") {
          head.appendChild(el("div", "rl-q-text ltr", "Paragraph " + q.paragraph)); row.appendChild(head); row.appendChild(w.node);
        } else {
          head.appendChild(el("div", "rl-q-text ltr", q.prompt)); row.appendChild(head); row.appendChild(w.node);
        }
        q._no = no++;
        widgets[q.id] = w; root.appendChild(row);
      });
    });
    return { node: root, widgets: widgets, count: p.questions.length };
  }

  /* highlight an evidence substring inside a DOM element made of text (rebuilds with <mark>) */
  function markIn(node, originalText, evidence) {
    clear(node);
    var i = evidence ? originalText.indexOf(evidence) : -1;
    if (i < 0) { node.appendChild(document.createTextNode(originalText)); return false; }
    node.appendChild(document.createTextNode(originalText.slice(0, i)));
    var m = el("mark", "rl-mark", evidence); node.appendChild(m);
    node.appendChild(document.createTextNode(originalText.slice(i + evidence.length)));
    return m;
  }

  /* ---------------- run: Reading ---------------- */
  var running = null;   // { timer, tts }
  function stopAll() { if (running && running.timer) clearInterval(running.timer); running = null; TTS.stop(); }

  function startRun(host, kind, units, opts) {
    stopAll();
    var isL = kind === "listening", test = opts.mode === "test";
    var totalMin = opts.minutes || (isL ? 0 : 20 * units.length);
    var limit = totalMin * 60, t0 = Date.now(), submitted = false;
    var answers = {}, wid = [], startNo = 1, cur = 0, played = {}, audioDone = {};
    clear(host);
    var wrap = el("div", "rl-run");
    var bar = el("div", "rl-bar");
    var title = el("div", "rl-bar-title", (isL ? "🎧 " : "📖 ") + (test ? "امتحان" : "تدريب") + (units.length > 1 ? " — " + units.length + (isL ? " أقسام" : " نصوص") : " — " + units[0].title));
    var timerEl = el("div", "rl-timer ltr", limit ? mmss(limit) : "--:--");
    bar.appendChild(title); bar.appendChild(timerEl);
    wrap.appendChild(bar);
    var tabs = el("div", "rl-tabs");
    wrap.appendChild(tabs);
    var body = el("div", "rl-body");
    wrap.appendChild(body);
    var foot = el("div", "rl-foot");
    var status = el("div", "rl-status");
    var subBtn = btn("تسليم وتصحيح", "primary", function () { submit(false); });
    foot.appendChild(status);
    // listening exam: sections follow the recording — "next section" unlocks when the audio has ended
    var nextBtn = null;
    if (isL && test && units.length > 1) {
      nextBtn = btn("القسم التالي ⟵", "", function () { if (cur < units.length - 1) { showUnit(cur + 1); syncNext(); } });
      nextBtn.disabled = true; foot.appendChild(nextBtn);
    }
    foot.appendChild(subBtn);
    wrap.appendChild(foot);
    function syncNext() { if (!nextBtn) return; nextBtn.classList.toggle("hidden", cur >= units.length - 1); nextBtn.disabled = !audioDone[cur]; }
    host.appendChild(wrap);

    function answered() { var n = 0, tot = 0; wid.forEach(function (u) { Object.keys(u.widgets).forEach(function (k) { tot++; if (u.widgets[k].get()) n++; }); }); return { n: n, tot: tot }; }
    function paintStatus() { var a = answered(); status.textContent = "أجبت على " + a.n + " من " + a.tot; }

    // build every unit once, show one at a time
    units.forEach(function (p, ui) {
      var pane = el("div", "rl-unit" + (ui === 0 ? "" : " hidden"));
      var qs = renderQuestions(p, startNo, isL, paintStatus);
      startNo += qs.count;
      var u = { p: p, pane: pane, widgets: qs.widgets, paraEls: {}, turnEls: [] };
      if (!isL) {
        var split = el("div", "rl-split");
        var pass = el("div", "rl-passage");
        pass.appendChild(el("h3", "rl-ptitle ltr", p.title));
        p.paragraphs.forEach(function (para) {
          var row = el("div", "rl-para ltr"), lab = el("span", "rl-plabel", para.label), tx = el("span", "rl-ptext", para.text);
          row.appendChild(lab); row.appendChild(tx); pass.appendChild(row); u.paraEls[para.label] = { el: tx, text: para.text };
        });
        // phone: one long page, so give quick jumps between the passage and its questions
        var goQ = btn("⇣ إلى الأسئلة", "small rl-jump", function () { qs.node.scrollIntoView({ behavior: "smooth", block: "start" }); });
        var goP = btn("⇡ إلى النص", "small rl-jump", function () { pass.scrollIntoView({ behavior: "smooth", block: "start" }); });
        pass.insertBefore(goQ, pass.firstChild); qs.node.insertBefore(goP, qs.node.firstChild);
        split.appendChild(pass); split.appendChild(qs.node); pane.appendChild(split);
      } else {
        var pl = el("div", "rl-player");
        pl.appendChild(el("div", "rl-context", "🎧 قسم " + p.section + " — " + p.title));
        pl.appendChild(el("div", "rl-context-sub", p.context_ar || ""));
        u.player = buildPlayer(pl, p, test, function (done) { audioDone[ui] = done; paintAudio(ui); }, function () { played[ui] = true; });
        pane.appendChild(pl); pane.appendChild(qs.node);
      }
      wid.push(u); body.appendChild(pane);
    });
    function paintAudio() { syncNext(); }

    function showUnit(i) {
      cur = i;
      wid.forEach(function (u, k) { u.pane.classList.toggle("hidden", k !== i); });
      Array.prototype.forEach.call(tabs.children, function (b, k) { b.classList.toggle("sel", k === i); });
      window.scrollTo(0, 0);
    }
    if (units.length > 1) {
      units.forEach(function (p, i) {
        var tb = el("button", "rl-tab" + (i === 0 ? " sel" : ""), (isL ? "القسم " + p.section : "النص " + (i + 1))); tb.type = "button";
        tb.onclick = function () { if (isL && test && i !== cur) return; showUnit(i); };   // exam listening: sections follow the recording
        tabs.appendChild(tb);
      });
    } else tabs.classList.add("hidden");

    // timer
    function tick() {
      if (!document.body.contains(wrap)) { stopAll(); return; }
      var el_ = (Date.now() - t0) / 1000;
      if (limit) {
        var left = limit - el_;
        timerEl.textContent = left >= 0 ? mmss(left) : "+" + mmss(-left);
        timerEl.classList.toggle("danger", left <= 60);
        if (left <= 0 && test && !submitted) submit(true);
      } else timerEl.textContent = mmss(el_);
    }
    running = { timer: setInterval(tick, 500) };
    paintStatus();

    function submit(timedOut) {
      if (submitted) return;
      var a = answered();
      if (!timedOut && a.n < a.tot && !confirm("باقي " + (a.tot - a.n) + " سؤال بلا إجابة — تسلّم الآن؟")) return;
      submitted = true; stopAll();
      var used = Math.round((Date.now() - t0) / 1000);
      showResults(host, kind, wid, { test: test, timedOut: !!timedOut, usedSec: used, limit: limit, taskKey: opts.taskKey, taskMinutes: opts.minutes, again: opts.again });
    }
  }

  /* listening player (TTS) */
  function buildPlayer(root, sec, test, onAudio, onPlayed) {
    var box = el("div", "rl-controls"), msg = el("div", "rl-player-msg"), prog = el("div", "rl-player-prog ltr", "");
    var ctl = { replays: 0, started: false };
    if (!TTS.ok) {
      msg.textContent = "المتصفّح لا يدعم تحويل النص إلى صوت — افتح التطبيق من Chrome أو Safari، أو اقرأ النص في صفحة النتيجة.";
      root.appendChild(msg); return ctl;
    }
    var rate = 1, startedAt = 0;
    var playBtn = btn("▶ شغّل التسجيل", "primary", function () {
      if (test && ctl.started) return;
      ctl.started = true; onPlayed();
      playBtn.disabled = test; playBtn.textContent = test ? "🔊 جارٍ التشغيل (مرة واحدة)" : "🔊 جارٍ التشغيل…";
      prog.textContent = "";
      TTS.play(sec.turns, {
        rate: rate,
        onTurn: function (i) { prog.textContent = "المتحدّث " + sec.turns[i].s; },
        onEnd: function (err) {
          playBtn.disabled = false; playBtn.textContent = test ? "✓ انتهى التسجيل" : "↻ أعد التشغيل";
          if (test) playBtn.disabled = true;
          prog.textContent = err ? "" : "انتهى التسجيل" + (test ? " — راجع إجاباتك (٣٠ ثانية)" : "");
          if (onAudio) onAudio(true);
        }
      });
    });
    var stopBtn = btn("■ إيقاف", "small", function () { if (test) return; TTS.stop(); playBtn.disabled = false; playBtn.textContent = "▶ شغّل التسجيل"; prog.textContent = ""; });
    if (test) stopBtn.classList.add("hidden");
    var rateSel = el("select", "rl-select");
    [["0.85", "أبطأ"], ["1", "عادي"], ["1.1", "أسرع"]].forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; if (o[0] === "1") op.selected = true; rateSel.appendChild(op); });
    rateSel.onchange = function () { rate = Number(rateSel.value) || 1; };
    if (test) rateSel.classList.add("hidden");
    box.appendChild(playBtn); box.appendChild(stopBtn); box.appendChild(rateSel);
    root.appendChild(box); root.appendChild(prog);
    var vs = TTS.voices();
    if (!vs.length) msg.textContent = "لم أجد صوتًا إنجليزيًا على هذا الجهاز بعد (قد يحتاج ثانية ليُحمَّل). لو لم يتكلّم: ثبّت صوتًا إنجليزيًا من إعدادات الجهاز (Text-to-speech).";
    root.appendChild(msg);
    root.appendChild(el("div", "rl-note", test ? "وضع الامتحان: يُشغَّل التسجيل مرة واحدة فقط كما في الامتحان الحقيقي." : "وضع التدريب: يمكنك الإعادة وتغيير السرعة. الصوت اصطناعي — للتدرّب على الفهم، والامتحان الحقيقي بأصوات بشرية."));
    return ctl;
  }

  /* ---------------- results ---------------- */
  function showResults(host, kind, wid, ctx) {
    var isL = kind === "listening";
    clear(host);
    var wrap = el("div", "rl-results");
    var total = 0, score = 0, byUnit = [], errTypes = {}, refs = [], wrongList = [];
    wid.forEach(function (u) {
      var s = 0;
      u.p.questions.forEach(function (q) {
        var given = u.widgets[q.id].get(), r = check(q, given);
        q._given = given; q._ok = r.ok; q._near = r.near; total++;
        if (r.ok) { s++; score++; }
        else {
          var tag = r.near ? "إملاء" : (isL && u.p.section >= 3 ? "لم أفهم المتحدث (القسم 3/4)" : ERR_BY_TYPE[q.type]);
          errTypes[tag] = (errTypes[tag] || 0) + 1;
          wrongList.push({ u: u, q: q });
        }
      });
      byUnit.push({ p: u.p, score: s, of: u.p.questions.length });
      refs.push(u.p.id);
    });
    if (ctx.timedOut) errTypes["ضاع الوقت"] = 1;
    var raw40 = Math.round(score / total * 40), band = Tracker.rawToBand(isL ? "listening" : "reading", raw40);
    var kindRec = ctx.test && wid.length > 1 ? "test" : "practice";
    var ph = Plan.phaseFor(Plan.today());
    var rec = Store.addExam({ skill: isL ? "listening" : "reading", kind: kindRec, raw: raw40, total: 40, band: band, source: "in-app",
      testRef: Plan.today() + "|in-app", errorTypes: Object.keys(errTypes), refs: refs, score: score, of: total,
      wrong: wrongList.map(function (w) { return w.u.p.id + "/" + w.q.id; }), seconds: ctx.usedSec, diagnostic: ph.id === "diagnostic" && kindRec === "test" });
    if (ctx.taskKey) { var cur = Store.taskState(ctx.taskKey) || {}; Store.setTask(ctx.taskKey, { done: true, minutes: Math.max(cur.minutes || 0, Math.round(ctx.usedSec / 60)) || ctx.taskMinutes || 0 }); }

    var hero = el("div", "rl-hero");
    hero.appendChild(el("div", "rl-score ltr", score + " / " + total));
    hero.appendChild(el("div", "rl-band", "≈ Band " + fmtBand(band) + (wid.length > 1 || total >= 39 ? "" : "  (تقدير بالنسبة إلى ٤٠ سؤالًا)")));
    hero.appendChild(el("div", "rl-meta", "الزمن: " + mmss(ctx.usedSec) + (ctx.timedOut ? " — انتهى الوقت" : "") + " · حُفظت النتيجة في «التقدّم»"));
    wrap.appendChild(hero);
    if (byUnit.length > 1) {
      var bu = el("div", "rl-byunit");
      byUnit.forEach(function (b) { bu.appendChild(el("span", "tchip", b.p.title.slice(0, 28) + " " + b.score + "/" + b.of)); });
      wrap.appendChild(bu);
    }
    var ek = Object.keys(errTypes);
    if (ek.length) {
      wrap.appendChild(el("div", "rl-errs", "أين ضاعت الدرجات: " + ek.map(function (k) { return k + " (" + errTypes[k] + ")"; }).join(" · ")));
    }

    // review, per unit, with "where is the answer" highlighting
    wid.forEach(function (u, ui) {
      var sec = el("div", "pcard");
      sec.appendChild(el("h3", "pcard-title ltr", (isL ? "Section " + u.p.section + " — " : "") + u.p.title));
      var viewer = el("div", "rl-viewer ltr");
      if (!isL) {
        u.p.paragraphs.forEach(function (para) {
          var row = el("div", "rl-para"), lab = el("span", "rl-plabel", para.label), tx = el("span", "rl-ptext", para.text);
          row.appendChild(lab); row.appendChild(tx); viewer.appendChild(row); u.paraEls[para.label] = { el: tx, text: para.text, row: row };
        });
      } else {
        u.p.turns.forEach(function (t, ti) {
          var row = el("div", "rl-turn"), lab = el("span", "rl-spk rl-spk-" + t.s, t.s), tx = el("span", "rl-ptext", t.text);
          row.appendChild(lab); row.appendChild(tx); viewer.appendChild(row); u.turnEls[ti] = { el: tx, text: t.text, row: row };
        });
      }
      var tg = el("details", "rl-details"); tg.appendChild(el("summary", null, isL ? "📜 نص التسجيل" : "📄 النص مع إمكانية التظليل"));
      tg.appendChild(viewer); sec.appendChild(tg);

      u.p.questions.forEach(function (q) {
        var row = el("div", "rl-rev " + (q._ok ? "ok" : "bad"));
        var head = el("div", "rl-rev-head");
        head.appendChild(el("span", "rl-qno", String(q._no)));
        head.appendChild(el("span", "rl-rev-mark", q._ok ? "✓" : "✗"));
        head.appendChild(el("div", "rl-q-text ltr", q.type === "heading" ? "Paragraph " + q.paragraph + " — heading" : q.prompt));
        row.appendChild(head);
        var ans = el("div", "rl-rev-ans ltr");
        var corr = q.type === "heading" ? q.answer + "  " + (u.p.headings[q.answer] || "") : q.type === "mcq" ? q.answer + ". " + String(q.options["ABCD".indexOf(q.answer)]).replace(/^[A-D][.)]\s*/, "") : q.answer;
        ans.appendChild(el("span", null, "إجابتك: " + (q._given ? q._given : "—") + (q._near && !q._ok ? "  (قريبة — تهجئة؟)" : "")));
        if (!q._ok) ans.appendChild(el("span", "rl-corr", "  ·  الصحيح: " + corr));
        row.appendChild(ans);
        row.appendChild(el("div", "rl-why", q.why_ar || ""));
        var acts = el("div", "rl-rev-acts");
        if (q.evidence) acts.appendChild(btn("📍 أين الإجابة؟", "small", function () {
          // clear old marks in this unit, then mark this evidence
          var target = null;
          if (!isL) {
            Object.keys(u.paraEls).forEach(function (k) { markIn(u.paraEls[k].el, u.paraEls[k].text, ""); });
            Object.keys(u.paraEls).forEach(function (k) { var pe = u.paraEls[k]; if (!target && pe.text.indexOf(q.evidence) >= 0) target = markIn(pe.el, pe.text, q.evidence); });
          } else {
            u.turnEls.forEach(function (te) { markIn(te.el, te.text, ""); });
            u.turnEls.forEach(function (te) { if (!target && te.text.indexOf(q.evidence) >= 0) target = markIn(te.el, te.text, q.evidence); });
          }
          tg.open = true;
          if (target && target.scrollIntoView) setTimeout(function () { target.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60);
        }));
        else acts.appendChild(el("span", "rl-noev", "لا يوجد دليل في النص — هذا هو معنى NOT GIVEN"));
        if (!q._ok) acts.appendChild(discussBtn(u.p, q, kind));
        row.appendChild(acts);
        sec.appendChild(row);
      });
      wrap.appendChild(sec);
    });

    var nav = el("div", "row-btns");
    nav.appendChild(btn("↻ تدريب آخر", "primary", function () { if (ctx.again) ctx.again(); else window.App.go("rl", { tab: kind }); }));
    nav.appendChild(btn("📈 التقدّم", "", function () { window.App.go("progress"); }));
    nav.appendChild(btn("📅 اليوم", "", function () { window.App.go("today"); }));
    wrap.appendChild(nav);
    host.appendChild(wrap);
    window.scrollTo(0, 0);
  }

  // "explain my mistake" — same inline flow as the grammar drills (key form in place if no key yet)
  function discussBtn(p, q, kind) {
    var holder = el("div", "rl-discuss");
    var b = btn("💬 اشرح لي خطأي", "small chat-btn", function () {
      var item = { id: p.id + "/" + q.id, rule: kind === "listening" ? "listening_q" : "reading_q",
        rl: { skill: kind, title: p.title, type: q.type, prompt: q.type === "heading" ? "Which heading fits paragraph " + q.paragraph + "?" : q.prompt,
              options: q.options, headings: p.headings, correct: q.answer, given: q._given || "(no answer)", evidence: q.evidence || "", why: q.why_ar || "" },
        explanation: q.why_ar || "" };
      var chatHost = el("div", "chat-host"); holder.appendChild(chatHost);
      function open() { clear(chatHost); b.classList.add("hidden"); window.Chat.openForError(chatHost, item, q._given || "(no answer)", "", function () { b.classList.remove("hidden"); }); }
      if (window.AI && window.AI.enabled() && window.Chat) { open(); return; }
      if (window.PrepViews && window.PrepViews.aiSetup) { b.classList.add("hidden"); chatHost.appendChild(window.PrepViews.aiSetup(open)); }
      else window.App.go("plan");
    });
    holder.appendChild(b);
    return holder;
  }

  /* ---------------- hub ---------------- */
  function pickReadingTest() {
    var all = passages(), seen = function (p) { return seenInfo("reading", p.id).n; };
    var by = { A: [], B: [], C: [] };
    all.forEach(function (p) { (by[p.pattern] || by.A).push(p); });
    var out = [];
    ["A", "B", "C"].forEach(function (k) { var l = by[k].slice().sort(function (a, b) { return seen(a) - seen(b) || (a.unreviewed ? 1 : 0) - (b.unreviewed ? 1 : 0) || Math.random() - 0.5; }); if (l[0]) out.push(l[0]); });
    if (out.length < 3) all.slice().sort(function (a, b) { return seen(a) - seen(b); }).forEach(function (p) { if (out.length < 3 && out.indexOf(p) === -1) out.push(p); });
    return out;
  }
  function pickListeningTest() {
    var all = sections(), out = [];
    [1, 2, 3, 4].forEach(function (n) {
      var l = all.filter(function (s) { return s.section === n; }).sort(function (a, b) { return seenInfo("listening", a.id).n - seenInfo("listening", b.id).n || Math.random() - 0.5; });
      if (l[0]) out.push(l[0]);
    });
    return out;
  }
  function nextUnseen(list, skill) {
    var s = list.slice().sort(function (a, b) { return seenInfo(skill, a.id).n - seenInfo(skill, b.id).n; });
    return s[0] || null;
  }

  function hub(arg) {
    arg = arg || {};
    var view = window.App.view();
    var wrap = el("div", "page");
    wrap.appendChild(el("h2", "page-title", "📖 القراءة والاستماع"));
    wrap.appendChild(el("p", "muted-p", "نصوص وتسجيلات أصلية بنفس أنواع أسئلة الامتحان، تُصحَّح فورًا وتُحفظ نتيجتها في تقدّمك. للامتحان الكامل الحقيقي استخدم أيضًا اختبارات Cambridge الرسمية."));
    var tabs = el("div", "tabs"), body = el("div");
    var current = arg.tab === "listening" ? "listening" : "reading";
    function paint() {
      clear(tabs); clear(body);
      [["reading", "📖 القراءة"], ["listening", "🎧 الاستماع"]].forEach(function (t) {
        var b = el("button", "tab" + (t[0] === current ? " active" : ""), t[1]); b.type = "button";
        b.onclick = function () { current = t[0]; paint(); }; tabs.appendChild(b);
      });
      (current === "reading" ? readingHub : listeningHub)(body, arg);
    }
    wrap.appendChild(tabs); wrap.appendChild(body);
    view.appendChild(wrap);
    paint();
    if (arg.start) autoStart(view, arg);
  }

  function runner(kind, list, mode, arg) {
    var view = window.App.view(), host = el("div", "page");
    clear(view); view.appendChild(host);
    var min = kind === "reading" ? (mode === "test" ? 60 : 20) : 0;
    startRun(host, kind, list, { mode: mode, minutes: min, taskKey: arg && arg.taskKey, again: function () { window.App.go("rl", { tab: kind }); } });
    window.scrollTo(0, 0);
  }
  function autoStart(view, arg) {
    var kind = arg.tab === "listening" ? "listening" : "reading", list;
    if (arg.start === "test") list = kind === "reading" ? pickReadingTest() : pickListeningTest();
    else { var one = arg.id ? (kind === "reading" ? passages() : sections()).filter(function (x) { return x.id === arg.id; })[0] : nextUnseen(kind === "reading" ? passages() : sections(), kind); list = one ? [one] : []; }
    if (!list.length) return;
    runner(kind, list, arg.start === "test" ? "test" : "practice", arg);
  }

  function itemRow(kind, x, arg) {
    var info = seenInfo(kind, x.id), row = el("div", "rl-item");
    var left = el("div", "rl-item-main");
    left.appendChild(el("div", "rl-item-title ltr", x.title));
    var meta = kind === "reading" ? (x.topic || "") + " · " + ({ A: "T/F/NG + MCQ", B: "Headings + T/F/NG", C: "Paragraphs + MCQ" }[x.pattern] || "") : "Section " + x.section;
    left.appendChild(el("div", "rl-item-meta ltr", meta));
    if (x.unreviewed) left.appendChild(el("div", "rl-item-new", "جديد — لم يراجعه قارئ ثانٍ بعد؛ لو شككت في سؤال ابعته"));
    if (info.best) left.appendChild(el("div", "rl-item-best", "أفضل نتيجة: " + info.best.score + "/" + info.best.of + " · ≈ Band " + fmtBand(info.best.band) + " · " + info.n + " محاولة"));
    row.appendChild(left);
    row.appendChild(btn(info.n ? "↻ أعد" : "▶ ابدأ", "small", function () { runner(kind, [x], "practice", arg); }));
    return row;
  }

  function readingHub(host, arg) {
    var P = passages();
    if (!P.length) { host.appendChild(el("p", "muted-p", "لم تُحمَّل نصوص القراءة بعد.")); return; }
    var c = el("div", "pcard");
    c.appendChild(el("h3", "pcard-title", "ابدأ"));
    var next = nextUnseen(P, "reading");
    c.appendChild(btn("▶ النص التالي (٢٠ دقيقة · ١٣ سؤالًا)", "primary wide", function () { runner("reading", [next], "practice", arg); }));
    var test = pickReadingTest();
    if (test.length === 3) c.appendChild(btn("📝 امتحان قراءة كامل — ٣ نصوص · ٦٠ دقيقة (يُحتسب ضمن أهداف الأسبوع)", "wide", function () { runner("reading", test, "test", arg); }));
    c.appendChild(el("p", "muted-p small-p", "الامتحان الكامل يعرض نصًّا من كل نمط: أسئلة T/F/NG، وعناوين الفقرات، وأي فقرة تحوي المعلومة. إن انتهى الوقت يُسلَّم تلقائيًا."));
    host.appendChild(c);
    var done = P.filter(function (p) { return seenInfo("reading", p.id).n; }).length;
    var list = el("div", "pcard");
    list.appendChild(el("h3", "pcard-title", "كل النصوص (" + done + "/" + P.length + " أنجزت)"));
    P.forEach(function (p) { list.appendChild(itemRow("reading", p, arg)); });
    host.appendChild(list);
  }

  function listeningHub(host, arg) {
    var S = sections();
    if (!S.length) { host.appendChild(el("p", "muted-p", "لم تُحمَّل أقسام الاستماع بعد.")); return; }
    var c = el("div", "pcard");
    c.appendChild(el("h3", "pcard-title", "ابدأ"));
    if (!TTS.ok) c.appendChild(el("p", "rl-warn", "⚠ متصفّحك لا يدعم تحويل النص إلى صوت. افتح التطبيق من Chrome أو Safari."));
    var next = nextUnseen(S, "listening");
    c.appendChild(btn("▶ القسم التالي (تدريب — يمكن الإعادة)", "primary wide", function () { runner("listening", [next], "practice", arg); }));
    var test = pickListeningTest();
    if (test.length === 4) c.appendChild(btn("📝 امتحان استماع كامل — ٤ أقسام (يُسمَع مرة واحدة)", "wide", function () { runner("listening", test, "test", arg); }));
    host.appendChild(c);

    // voices
    var vc = el("div", "pcard");
    vc.appendChild(el("h3", "pcard-title", "🔊 الأصوات"));
    vc.appendChild(el("p", "muted-p small-p", "جودة الصوت تعتمد على جهازك. اختر أوضح صوتين إنجليزيين (يُفضَّل British) ثم جرّبهما."));
    var vs = TTS.voices(), prefs = loadPrefs();
    if (!vs.length) vc.appendChild(el("p", "muted-p", "لا توجد أصوات إنجليزية محمّلة بعد — افتح هذه الصفحة بعد ثوانٍ، أو ثبّت صوتًا إنجليزيًا من إعدادات الجهاز (Text-to-speech)."));
    var sels = {};
    [["A", "المتحدّث A"], ["B", "المتحدّث B"]].forEach(function (k) {
      var s = el("select", "rl-select ltr"); var o0 = el("option", null, "تلقائي"); o0.value = ""; s.appendChild(o0);
      vs.forEach(function (v) { var o = el("option", null, v.name + " (" + v.lang + ")"); o.value = v.voiceURI; if (prefs[k[0]] === v.voiceURI) o.selected = true; s.appendChild(o); });
      s.onchange = function () { var p = loadPrefs(); if (s.value) p[k[0]] = s.value; else delete p[k[0]]; savePrefs(p); };
      sels[k[0]] = s;
      var f = el("div", "field"); f.appendChild(el("label", null, k[1])); f.appendChild(s); vc.appendChild(f);
    });
    vc.appendChild(btn("▶ جرّب الصوتين", "small", function () {
      TTS.play([{ s: "A", text: "Good morning. How can I help you today?" }, { s: "B", text: "Hello. I'd like to book a place on the evening course, please." }], { rate: 1 });
    }));
    host.appendChild(vc);

    var done = S.filter(function (s) { return seenInfo("listening", s.id).n; }).length;
    var list = el("div", "pcard");
    list.appendChild(el("h3", "pcard-title", "كل الأقسام (" + done + "/" + S.length + " أنجزت)"));
    S.slice().sort(function (a, b) { return a.section - b.section; }).forEach(function (s) { list.appendChild(itemRow("listening", s, arg)); });
    host.appendChild(list);
  }

  // views_prep.js registers the "rl" route; this is its view function
  window.RL = { view: hub, stop: stopAll, tts: TTS, check: check };

  // the explain-my-mistake chat labels these pseudo-rules
  var baseLabel = window.ruleLabel;
  window.ruleLabel = function (id) {
    if (id === "reading_q") return "القراءة";
    if (id === "listening_q") return "الاستماع";
    return baseLabel ? baseLabel(id) : id;
  };
})();
