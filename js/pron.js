/* pron.js — the pronunciation lab (ELSA-style): listen to a model, record,
   Gemini LISTENS to the recording and scores it — 0-100 overall, per word,
   the unit's focus sound, stress/intonation — with an Arabic tip.
   Units (sounds Arabic speakers find hard) live in data/pron_units.js.
   Attempts are saved as scores only (Store.pron); audio is never stored.
   Weak words go to Store.pronWords ("كلماتي للمراجعة") and leave it once
   they score well. */
(function () {
  "use strict";

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function btn(label, cls, fn) { var b = el("button", "btn " + (cls || ""), label); b.type = "button"; b.onclick = fn; return b; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function units() { return window.PRON_UNITS || []; }
  function unitById(id) { if (id === "my_words") return myWordsUnit(); return units().filter(function (u) { return u.id === id; })[0] || null; }

  var GROUP_AR = { consonants: "الأصوات الساكنة", vowels: "الحركات (الأصوات المتحرّكة)", prosody: "الإيقاع: النبر والتنغيم والربط" };
  var KIND_AR = { pair: "زوج متشابه", word: "كلمة", sentence: "جملة" };

  function scoreClass(s) { return s == null ? "" : s >= 80 ? "good" : s >= 60 ? "warn" : "bad"; }
  function ring(pct) { return window.Dashboard ? window.Dashboard.ring(pct == null ? null : Math.round(pct)) : ""; }

  /* ================= AI assessment ================= */

  var NUM = { type: "NUMBER" }, STR = { type: "STRING" };
  var SCHEMA = {
    type: "OBJECT",
    properties: {
      silent: { type: "BOOLEAN" },
      heard: STR,
      overall: NUM,
      words: { type: "ARRAY", items: { type: "OBJECT", properties: { word: STR, score: NUM, note_ar: STR }, required: ["word", "score"] } },
      focus: { type: "OBJECT", properties: { score: NUM, note_ar: STR }, required: ["score"] },
      stress_ok: { type: "BOOLEAN" },
      prosody_note_ar: STR,
      tip_ar: STR
    },
    required: ["silent", "heard", "overall", "words", "focus", "tip_ar"]
  };

  function taskLine(item) {
    if (item.kind === "pair") return 'The learner should say TWO words, one after the other: "' + item.words[0] + '" then "' + item.words[1] +
      '". This is a minimal pair: the point is that the two words sound clearly DIFFERENT. Score each word on whether its distinguishing sound was produced correctly.';
    if (item.kind === "word") return 'The learner should say the single word "' + item.target + '"' + (item.ipa ? " " + item.ipa : "") +
      (item.stress ? " (stress: " + item.stress + ")" : "") + ".";
    return 'The learner should read this sentence aloud: "' + item.target + '". Judge every word, and also sentence stress, rhythm (weak forms) and intonation.' +
      (item.note_ar ? " Target pattern for this sentence (Arabic note): " + item.note_ar : "");
  }

  function promptFor(item, unit) {
    return [
'You are a strict English pronunciation assessor (like ELSA Speak) for an Egyptian-Arabic speaker preparing for IELTS. Target: clear, intelligible British/General English; a slight accent is fine.',
'Listen to the audio and judge ONLY what you actually hear.',
taskLine(item),
unit && unit.sound !== undefined ? ('Focus of this exercise: ' + (unit.ipa || "") + ' — ' + (unit.title_ar || unit.id) + '. Typical mistake (Arabic note): ' + (unit.trap_ar || "—")) : 'Focus: overall clarity of every sound and the word stress.',
'Typical Arabic-speaker substitutions to listen for: p→b, v→f, θ→s or t, ð→z or d, ŋ→ŋg, a vowel inserted before or inside consonant clusters (e-street, s-pring → si-pring), ɪ/iː merged, e/æ merged, ɜː→ɔː or e, full vowels instead of schwa, stress on the wrong syllable, flat intonation.',
'Scores 0–100: 90+ native-like · 75–89 clear with a minor accent · 60–74 noticeable error but understandable · below 60 a sound or stress error that changes or blurs the word.',
'For every target word give its score and, if it is not fine, a SHORT Arabic note saying exactly what went wrong (which sound became which, an extra vowel, the wrong stressed syllable). Leave note_ar empty for good words.',
'focus.score = how well the focus sound/pattern was produced across the recording; focus.note_ar = one short Arabic sentence.',
'heard = an orthographic transcription of exactly what you heard, spelled to show the error (e.g. "sink" for think, "estreet" for street).',
'If the audio is silent, mostly noise, or a different text was said: silent=true, overall=0, and explain in tip_ar.',
'tip_ar = ONE concrete, physical tip in Arabic (tongue, lips, voice, length, stress) for the next attempt. All *_ar fields are Arabic and short (shown on a phone); English words stay in English.'
    ].join("\n");
  }

  function clampScore(v) { v = Number(v); if (!isFinite(v)) return null; if (v > 0 && v <= 1) v = v * 100; return Math.max(0, Math.min(100, Math.round(v))); }
  function str(v, n) { return v == null ? "" : String(v).slice(0, n || 300); }

  function normalize(obj) {
    if (!obj || typeof obj !== "object") return null;
    var silent = !!obj.silent;
    var words = (Array.isArray(obj.words) ? obj.words : []).slice(0, 40).map(function (w) {
      w = w || {}; return { word: str(w.word, 40), score: clampScore(w.score), note_ar: str(w.note_ar, 200) };
    }).filter(function (w) { return w.word; });
    var overall = silent ? 0 : clampScore(obj.overall);
    if (overall == null && words.length) overall = Math.round(words.reduce(function (a, w) { return a + (w.score || 0); }, 0) / words.length);
    if (overall == null) return null;
    var f = obj.focus || {};
    return {
      silent: silent, heard: str(obj.heard, 400), overall: overall, words: words,
      focus: { score: silent ? 0 : clampScore(f.score), note_ar: str(f.note_ar, 250) },
      stress_ok: obj.stress_ok !== false, prosody_note_ar: str(obj.prosody_note_ar, 300), tip_ar: str(obj.tip_ar, 300)
    };
  }

  function assess(rec, item, unit) {
    var parts = [{ text: promptFor(item, unit) }, { inlineData: { mimeType: rec.mime || "audio/wav", data: rec.base64 } }];
    return window.AI.generateJSON(parts, SCHEMA, { temperature: 0, maxOutputTokens: 4096 }).then(function (obj) {
      var r = normalize(obj);
      if (!r) { var e = new Error("parse"); e.ar = "لم أفهم ردّ Gemini — أعد المحاولة."; throw e; }
      r.model = obj.__model;
      return r;
    });
  }

  /* ================= stats ================= */

  function attemptsFor(unitId) { return Store.pron().filter(function (a) { return a.unit === unitId; }); }
  function unitStats(unitId) {
    var all = attemptsFor(unitId);
    if (!all.length) return { n: 0, avg: null, last: null };
    var last5 = all.slice(-5);
    var avg = last5.reduce(function (s, a) { return s + (a.focus != null ? a.focus : a.overall); }, 0) / last5.length;
    return { n: all.length, avg: Math.round(avg), last: all[all.length - 1].date };
  }
  function overallStats() {
    var last = Store.pron().slice(-20);
    if (!last.length) return { n: 0, avg: null };
    return { n: Store.pron().length, avg: Math.round(last.reduce(function (s, a) { return s + a.overall; }, 0) / last.length) };
  }
  // unpractised units first (curriculum order), then the weakest.
  function recommendedUnit() {
    var us = units();
    for (var i = 0; i < us.length; i++) if (!unitStats(us[i].id).n) return us[i];
    var scored = us.map(function (u) { return { u: u, s: unitStats(u.id) }; }).sort(function (a, b) { return a.s.avg - b.s.avg; });
    return scored.length ? scored[0].u : null;
  }
  function weakestUnits(n) {
    return units().map(function (u) { return { unit: u, stats: unitStats(u.id) }; })
      .filter(function (x) { return x.stats.n; }).sort(function (a, b) { return a.stats.avg - b.stats.avg; }).slice(0, n || 3);
  }

  /* ================= model voice ================= */

  function listen(item, slow) {
    var text = item.kind === "pair" ? item.words[0] + ". … " + item.words[1] + "." : item.target;
    if (window.Chat) window.Chat.speak(text, null, { rate: slow ? 0.6 : 0.85 });
  }

  /* ================= mic widget ================= */

  // opts: { maxSec, autoStopSilence, onDone(rec), hint }
  function micWidget(opts) {
    var wrap = el("div", "mic-wrap");
    var b = el("button", "mic-big"); b.type = "button"; b.setAttribute("aria-label", "سجّل");
    b.appendChild(el("span", "mic-ic", "🎙"));
    var time = el("div", "mic-time ltr", "");
    var hint = el("div", "mic-hint", opts.hint || "اضغط وتكلّم — واضغط مرة أخرى للإيقاف");
    wrap.appendChild(b); wrap.appendChild(time); wrap.appendChild(hint);
    var state = "idle";
    function set(s) { state = s; wrap.className = "mic-wrap " + s; }
    function fmt(t) { t = Math.floor(t); return Math.floor(t / 60) + ":" + (t % 60 < 10 ? "0" : "") + (t % 60); }
    b.onclick = function () {
      if (state === "recording") { window.Recorder.stop(); return; }
      if (state === "busy") return;
      if (window.Chat) window.Chat.stop();
      set("recording"); hint.textContent = "أسجّل… تكلّم الآن";
      time.textContent = "0:00";
      window.Recorder.start({
        maxSec: opts.maxSec || 10, autoStopSilence: opts.autoStopSilence,
        onLevel: function (l) { b.style.setProperty("--lvl", l.toFixed(2)); },
        onTick: function (t) { time.textContent = fmt(t) + (opts.maxSec ? " / " + fmt(opts.maxSec) : ""); }
      }).then(function (rec) {
        b.style.setProperty("--lvl", 0); set("busy");
        if (!rec.heard) hint.textContent = "لم ألتقط صوتًا واضحًا — اقترب من الميكروفون.";
        opts.onDone(rec, api);
      }).catch(function (e) {
        b.style.setProperty("--lvl", 0); set("idle"); time.textContent = "";
        hint.textContent = "⚠ " + ((e && e.ar) || "تعذّر التسجيل");
      });
    };
    var api = { node: wrap, reset: function (h) { set("idle"); time.textContent = ""; hint.textContent = h || "اضغط وتكلّم — واضغط مرة أخرى للإيقاف"; },
                setHint: function (h) { hint.textContent = h; } };
    set("idle");
    if (!window.Recorder || !window.Recorder.supported()) { b.disabled = true; hint.textContent = "⚠ " + (window.Recorder ? window.Recorder.unsupportedReason() : "التسجيل غير متاح"); }
    return api;
  }

  /* ================= one item ================= */

  // onScored(result|null, attempt|null) when the user moves on.
  function itemCard(item, unit, handlers) {
    handlers = handlers || {};
    var card = el("div", "pron-card");
    card.appendChild(el("span", "kind-chip", KIND_AR[item.kind] || ""));
    var tgt = el("div", "pron-target ltr");
    if (item.kind === "pair") { tgt.appendChild(el("span", "pw", item.words[0])); tgt.appendChild(el("span", "pair-sep", "↔")); tgt.appendChild(el("span", "pw", item.words[1])); }
    else tgt.textContent = item.target;
    card.appendChild(tgt);
    var sub = [];
    if (item.ipa) sub.push(item.ipa);
    if (item.stress) sub.push(item.stress);
    if (sub.length) card.appendChild(el("div", "pron-ipa ltr", sub.join("   ·   ")));
    if (item.note_ar) card.appendChild(el("div", "pron-note", item.note_ar));

    var lrow = el("div", "listen-row");
    lrow.appendChild(btn("🔊 استمع", "small", function () { listen(item, false); }));
    lrow.appendChild(btn("🐢 ببطء", "small", function () { listen(item, true); }));
    card.appendChild(lrow);

    var res = el("div", "pron-result");
    var mine = el("div", "mine-row hidden");
    var lastRec = null, lastAttempt = null, lastResult = null;

    var mic = micWidget({
      maxSec: item.kind === "sentence" ? 15 : item.kind === "pair" ? 8 : 6,
      autoStopSilence: item.kind === "sentence" ? 2.2 : 1.5,
      onDone: function (rec) { lastRec = rec; showMine(rec); run(); }
    });
    card.appendChild(mic.node);
    card.appendChild(mine);
    card.appendChild(res);

    function showMine(rec) {
      clear(mine); mine.classList.remove("hidden");
      var a = document.createElement("audio"); a.controls = true; a.src = rec.url; a.preload = "auto";
      mine.appendChild(el("span", "mine-lbl", "تسجيلك:")); mine.appendChild(a);
    }

    function run() {
      clear(res);
      if (!window.AI || !window.AI.enabled()) {
        res.appendChild(el("div", "pron-msg", "قارن تسجيلك بالنموذج 🔊 بنفسك — أو فعّل مفتاح Gemini من «الخطة» ليسمعك ويقيّمك."));
        mic.reset("سجّل مرة أخرى");
        nextRow(null);
        return;
      }
      var wait = el("div", "pron-msg listening", "🎧 Gemini يستمع إليك…"); res.appendChild(wait);
      assess(lastRec, item, unit).then(function (r) {
        lastResult = r;
        lastAttempt = Store.addPron({
          unit: unit ? unit.id : "free", kind: item.kind, target: item.target,
          overall: r.overall, focus: r.focus.score, heard: r.heard,
          words: r.words.map(function (w) { return { w: w.word, s: w.score }; })
        });
        // weak words → review list; mastered review words leave it
        var weak = r.words.filter(function (w) { return w.score != null && w.score < 65 && /^[A-Za-z'-]+$/.test(w.word); })
          .map(function (w) { return { w: w.word, note_ar: w.note_ar, source: "lab" }; });
        if (weak.length) Store.addPronWords(weak);
        r.words.forEach(function (w) { if (w.score != null && w.score >= 85) Store.removePronWord(w.word); });
        render(r);
      }).catch(function (e) {
        clear(res);
        res.appendChild(el("div", "pron-msg err", "⚠ " + ((e && (e.ar || e.message)) || "تعذّر التقييم")));
        res.appendChild(btn("أعد إرسال التسجيل نفسه", "small", run));
        mic.reset("أو سجّل من جديد");
        nextRow(null);
      });
    }

    function render(r) {
      clear(res);
      var top = el("div", "pron-score-row");
      var sc = el("div", "score-ring"); sc.innerHTML = ring(r.overall); top.appendChild(sc);
      var side = el("div", "score-side");
      side.appendChild(el("div", "score-lbl " + scoreClass(r.overall),
        r.silent ? "لم أسمع النص المطلوب" : r.overall >= 85 ? "ممتاز 👏" : r.overall >= 70 ? "جيد — قريب جدًا" : r.overall >= 55 ? "مفهوم مع أخطاء واضحة" : "يحتاج إعادة"));
      if (unit && r.focus && r.focus.score != null && unit.ipa)
        side.appendChild(el("div", "focus-line " + scoreClass(r.focus.score), "الصوت " + unit.ipa + ": " + r.focus.score + "/100" + (r.focus.note_ar ? " — " + r.focus.note_ar : "")));
      top.appendChild(side);
      res.appendChild(top);

      if (r.words.length) {
        var chips = el("div", "word-chips ltr");
        r.words.forEach(function (w) {
          var c = el("span", "wchip " + scoreClass(w.score));
          c.appendChild(el("span", "ww", w.word));
          if (w.score != null) c.appendChild(el("span", "ws", String(w.score)));
          chips.appendChild(c);
        });
        res.appendChild(chips);
        r.words.filter(function (w) { return w.note_ar; }).forEach(function (w) {
          var n = el("div", "word-note"); n.appendChild(el("b", "ltr", w.word + ": ")); n.appendChild(document.createTextNode(w.note_ar)); res.appendChild(n);
        });
      }
      if (r.heard) { var h = el("div", "heard-line"); h.appendChild(document.createTextNode("سمعتُ: ")); h.appendChild(el("span", "ltr", "«" + r.heard + "»")); res.appendChild(h); }
      if (r.prosody_note_ar) res.appendChild(el("div", "prosody-note", (r.stress_ok ? "🎵 " : "⚠ النبر: ") + r.prosody_note_ar));
      if (r.tip_ar) res.appendChild(el("div", "tip-box", "💡 " + r.tip_ar));
      mic.reset("🔁 حاول مرة أخرى لتحسين الدرجة");
      nextRow(r);
    }

    function nextRow(r) {
      if (!handlers.onNext) return;
      var row = el("div", "row-btns");
      row.appendChild(btn(handlers.nextLabel || "التالي ⟵", "primary", function () { handlers.onNext(lastResult, lastAttempt); }));
      res.appendChild(row);
    }

    if (!handlers.onNext) return card;
    var skip = el("div", "skip-row");
    skip.appendChild(btn("تخطَّ", "small ghost", function () { handlers.onNext(null, null); }));
    card.appendChild(skip);
    return card;
  }

  /* ================= rounds ================= */

  function itemsFor(unit) {
    var items = [];
    if (unit.id === "my_words") {
      (unit.words || []).forEach(function (w) { items.push({ kind: "word", target: w.w, ipa: w.ipa || "", stress: w.stress || "" }); });
      return items;
    }
    var pairs = shuffle(unit.pairs || []).slice(0, 2);
    pairs.forEach(function (p) { items.push({ kind: "pair", target: p[0] + " … " + p[1], words: [p[0], p[1]] }); });
    var nWords = pairs.length ? 4 : 5, nSent = pairs.length ? 2 : 3;
    shuffle(unit.words || []).slice(0, nWords).forEach(function (w) { items.push({ kind: "word", target: w.w, ipa: w.ipa || "", stress: w.stress || "" }); });
    shuffle(unit.sentences || []).slice(0, nSent).forEach(function (s) { items.push({ kind: "sentence", target: s.s, note_ar: s.note_ar || "" }); });
    return items;
  }

  // Review list as a pseudo-unit: recent weak words + a few from the personal pronunciation dictionary.
  function myWordsUnit() {
    var dict = (window.PRON_DICT || []).concat(Store.addedDict ? Store.addedDict() : []);
    var ipaOf = {}; dict.forEach(function (d) { if (d.word) ipaOf[String(d.word).toLowerCase()] = d; });
    var words = Store.pronWords().slice().reverse().slice(0, 6).map(function (x) {
      var d = ipaOf[x.w] || {}; return { w: x.w, ipa: x.ipa || d.ipa || "", stress: d.stress_pattern || "" };
    });
    shuffle(dict).forEach(function (d) {
      if (words.length >= 8 || !d.word) return;
      if (words.some(function (w) { return w.w === String(d.word).toLowerCase(); })) return;
      words.push({ w: d.word, ipa: d.ipa || "", stress: d.stress_pattern || "" });
    });
    return { id: "my_words", group: "review", title_ar: "كلماتي للمراجعة", sound: "", ipa: "", mouth_ar: "", trap_ar: "", words: words, pairs: [], sentences: [] };
  }

  function practiceUnit(host, unitId, opts) {
    opts = opts || {};
    var unit = unitById(unitId);
    clear(host);
    if (!unit) { host.appendChild(el("p", "muted-p", "الوحدة غير موجودة (تأكد من data/pron_units.js).")); return; }
    var items = itemsFor(unit);
    if (!items.length) { host.appendChild(el("p", "muted-p", "لا توجد كلمات للمراجعة بعد — ستظهر هنا الكلمات التي تتعثّر فيها.")); return; }

    var head = el("div", "unit-head");
    head.appendChild(el("h2", "page-title", unit.title_ar + (unit.ipa ? "  " : "")));
    if (unit.mouth_ar || unit.trap_ar) {
      var how = el("details", "how-box"); how.open = !unitStats(unit.id).n;
      how.appendChild(el("summary", null, "👄 كيف تنطقه؟ وما الفخ؟"));
      if (unit.mouth_ar) how.appendChild(el("p", "how-p", "👄 " + unit.mouth_ar));
      if (unit.trap_ar) how.appendChild(el("p", "how-p trap", "⚠ " + unit.trap_ar));
      head.appendChild(how);
    }
    host.appendChild(head);
    var prog = el("div", "progress"); host.appendChild(prog);
    var slot = el("div"); host.appendChild(slot);

    var i = 0, scores = [], focus = [], weakWords = {};
    var t0 = Date.now();
    function step() {
      if (i >= items.length) return summary();
      var pct = Math.round(i / items.length * 100);
      prog.innerHTML = '<div class="prog-txt">' + (i + 1) + " / " + items.length + '</div><div class="prog-bar"><span style="width:' + pct + '%"></span></div>';
      clear(slot);
      slot.appendChild(itemCard(items[i], unit, {
        nextLabel: i === items.length - 1 ? "إنهاء الجولة ✓" : "التالي ⟵",
        onNext: function (r) {
          if (r) {
            scores.push(r.overall); if (r.focus && r.focus.score != null) focus.push(r.focus.score);
            r.words.forEach(function (w) { if (w.score != null && w.score < 70) weakWords[w.word] = w.score; });
          }
          i++; window.scrollTo(0, 0); step();
        }
      }));
    }
    function avg(a) { return a.length ? Math.round(a.reduce(function (s, x) { return s + x; }, 0) / a.length) : null; }
    function summary() {
      prog.innerHTML = "";
      clear(slot);
      var c = el("div", "pcard");
      c.appendChild(el("h3", "pcard-title", "ملخّص الجولة — " + unit.title_ar));
      var top = el("div", "pron-score-row");
      var r1 = el("div", "score-ring"); r1.innerHTML = ring(avg(scores)); top.appendChild(r1);
      var side = el("div", "score-side");
      side.appendChild(el("div", "score-lbl", scores.length ? "متوسط الجولة: " + avg(scores) + "/100" : "لم تُقيَّم أي محاولة"));
      if (focus.length && unit.ipa) side.appendChild(el("div", "focus-line " + scoreClass(avg(focus)), "الصوت " + unit.ipa + ": " + avg(focus) + "/100"));
      var st = unitStats(unit.id);
      if (st.n) side.appendChild(el("div", "muted-p", "مستوى الوحدة (آخر ٥ محاولات): " + st.avg + "/100"));
      top.appendChild(side); c.appendChild(top);
      var ww = Object.keys(weakWords);
      if (ww.length) {
        c.appendChild(el("div", "eval-h", "كلمات تحتاج تكرارًا (أُضيفت إلى «كلماتي للمراجعة»):"));
        var chips = el("div", "word-chips ltr");
        ww.forEach(function (w) { var x = el("span", "wchip " + scoreClass(weakWords[w])); x.appendChild(el("span", "ww", w)); x.appendChild(el("span", "ws", String(weakWords[w]))); chips.appendChild(x); });
        c.appendChild(chips);
      }
      var row = el("div", "row-btns");
      row.appendChild(btn("🔁 جولة أخرى", "primary", function () { practiceUnit(host, unit.id, opts); }));
      row.appendChild(btn("المختبر", "", function () { labHome(host, opts); }));
      c.appendChild(row);
      slot.appendChild(c);
      if (opts.taskKey) {
        var cur = Store.taskState(opts.taskKey) || {};
        Store.setTask(opts.taskKey, { done: true, minutes: Math.max(cur.minutes || 0, Math.round((Date.now() - t0) / 60000)) || opts.minutes || 0 });
      }
    }
    step();
  }

  /* ================= lab home ================= */

  function labHome(host, opts) {
    opts = opts || {};
    clear(host);
    if (!units().length) { host.appendChild(el("p", "muted-p", "بنك الوحدات لم يُحمَّل (data/pron_units.js).")); return; }
    if (!window.AI || !window.AI.enabled()) {
      var n = el("div", "export-reminder", "🔑 فعّل مفتاح Gemini من «الخطة» ليسمعك ويقيّم نطقك. بدونه تستطيع التسجيل والمقارنة بالنموذج بنفسك.");
      n.onclick = function () { window.App.go("plan"); }; host.appendChild(n);
    }
    var ov = overallStats(), rec = recommendedUnit();
    var hero = el("div", "pron-hero");
    var hr = el("div", "score-ring"); hr.innerHTML = ring(ov.avg); hero.appendChild(hr);
    var hs = el("div", "score-side");
    hs.appendChild(el("div", "hero-lbl", "مستوى نطقك (آخر ٢٠ محاولة)"));
    hs.appendChild(el("div", "muted-p", ov.n ? ov.n + " محاولة مقيَّمة حتى الآن" : "ابدأ أول جولة — ٨ تمارين قصيرة (٥–٧ دقائق)"));
    if (rec) hs.appendChild(btn("▶ تمرين اليوم: " + rec.title_ar, "primary", function () { practiceUnit(host, rec.id, opts); }));
    hero.appendChild(hs);
    host.appendChild(hero);

    var nReview = Store.pronWords().length;
    host.appendChild(btn("📝 كلماتي للمراجعة" + (nReview ? " (" + nReview + ")" : " + كلمات قاموسك"), "wide", function () { practiceUnit(host, "my_words", opts); }));

    ["consonants", "vowels", "prosody"].forEach(function (g) {
      var list = units().filter(function (u) { return u.group === g; });
      if (!list.length) return;
      host.appendChild(el("h3", "grp-title", GROUP_AR[g]));
      var grid = el("div", "unit-grid");
      list.forEach(function (u) {
        var st = unitStats(u.id);
        var b = el("button", "unit-card"); b.type = "button";
        var r = el("div", "unit-ring"); r.innerHTML = ring(st.avg); b.appendChild(r);
        var t = el("div", "unit-txt");
        t.appendChild(el("div", "unit-ipa ltr", u.ipa || ""));
        t.appendChild(el("div", "unit-title", u.title_ar));
        t.appendChild(el("div", "unit-meta", st.n ? st.n + " محاولة · آخرها " + st.last : "لم تبدأ"));
        b.appendChild(t);
        b.onclick = function () { practiceUnit(host, u.id, opts); };
        grid.appendChild(b);
      });
      host.appendChild(grid);
    });
    host.appendChild(el("p", "muted-p small-p", "التقييم من Gemini بعد الاستماع لتسجيلك؛ دقّته في الأصوات المفردة أقل من تطبيقات متخصصة، لكنه يلتقط بوضوح أخطاء المتحدث العربي الشائعة. التسجيل يُرسل إلى Google للتقييم ولا يُحفظ في التطبيق."));
  }

  /* ================= quick check from a drill card ================= */

  // spec: { target, ipa, stress, unitId, kind }
  function quickAssess(host, spec) {
    clear(host);
    var unit = spec.unitId ? unitById(spec.unitId) : null;
    var kind = spec.kind || (/\s/.test(spec.target) ? "sentence" : "word");
    host.appendChild(itemCard({ kind: kind, target: spec.target, ipa: spec.ipa || "", stress: spec.stress || "", note_ar: spec.note_ar || "" }, unit, {}));
  }

  window.Pron = {
    labHome: labHome, practiceUnit: practiceUnit, quickAssess: quickAssess,
    unitStats: unitStats, overallStats: overallStats, recommendedUnit: recommendedUnit, weakestUnits: weakestUnits,
    units: units, unitById: unitById, micWidget: micWidget, scoreClass: scoreClass,
    _normalize: normalize, _prompt: promptFor
  };
})();
