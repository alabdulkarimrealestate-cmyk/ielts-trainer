/* speak.js — the "تكلّم" screen: pronunciation lab (pron.js) + a full IELTS
   Speaking mock test with an AI examiner that LISTENS. Each part's recordings
   go to Gemini in one request (audio + the questions asked); it returns the
   four official criteria (pronunciation judged from the audio), verbatim
   transcripts, mispronounced words, tagged errors and a better answer.
   Results feed Store.speaking (kind "ai-audio") → the Progress speaking band.
   Question banks: data/speaking_qbank.js (Part 1/3), data/speaking_cards.js (Part 2). */
(function () {
  "use strict";

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function btn(label, cls, fn) { var b = el("button", "btn " + (cls || ""), label); b.type = "button"; b.onclick = fn; return b; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmtB(b) { return (b == null || !isFinite(b)) ? "—" : (Math.round(b * 2) / 2).toFixed(1); }
  function bandClass(b) { return b == null ? "" : b >= 7 ? "good" : b >= 6.5 ? "warn" : "bad"; }

  var CRIT_AR = { fluency: "الطلاقة والتماسك", lexical: "الثروة اللغوية", grammar: "القواعد", pronunciation: "النطق", overall: "الإجمالي" };
  var PART_MAX = { 1: 45, 2: 120, 3: 75 };
  var FALLBACK_P1 = [{ id: "p1-work", title_ar: "العمل", questions: ["Do you work or are you a student?", "What do you like most about your job?", "Is there anything you would like to change about your work?", "Do you plan to keep doing the same kind of work in the future?"] }];
  var FALLBACK_P3 = ["Why do you think people have different opinions about this topic?", "How has this changed compared with the past?", "What could governments do to improve the situation?", "Do you think this will be more or less important in the future? Why?"];

  /* ================= AI ================= */

  var NUM = { type: "NUMBER" }, STR = { type: "STRING" };
  function schema() {
    var tags = (window.Prompts && window.Prompts.TAGS) || ["OTHER"];
    return {
      type: "OBJECT",
      properties: {
        answers: { type: "ARRAY", items: { type: "OBJECT", properties: { index: { type: "INTEGER" }, transcript: STR }, required: ["index", "transcript"] } },
        bands: { type: "OBJECT", properties: { fluency: NUM, lexical: NUM, grammar: NUM, pronunciation: NUM, overall: NUM }, required: ["fluency", "lexical", "grammar", "pronunciation", "overall"] },
        pronunciation_issues: { type: "ARRAY", items: { type: "OBJECT", properties: { word: STR, heard_as: STR, tip_ar: STR }, required: ["word"] } },
        errors: { type: "ARRAY", items: { type: "OBJECT", properties: { tag: { type: "STRING", enum: tags }, quote: STR, fix: STR, note_ar: STR }, required: ["tag", "quote", "fix"] } },
        strengths_ar: { type: "ARRAY", items: STR },
        fixes_ar: { type: "ARRAY", items: STR },
        better_answer: { type: "OBJECT", properties: { index: { type: "INTEGER" }, text: STR }, required: ["text"] },
        summary_ar: STR
      },
      required: ["answers", "bands", "pronunciation_issues", "errors", "fixes_ar", "summary_ar"]
    };
  }

  function instructions(partNo, card) {
    var lines = [
'You are a certified IELTS Speaking examiner. You will HEAR the candidate\'s recorded answers for Part ' + partNo + ' of the IELTS Speaking test. Each audio clip below is preceded by the question that was asked.',
'Candidate: Egyptian Arabic L1, accountant, target band 7.0 in every skill.'
    ];
    if (partNo === 2 && card) lines.push('The cue card was: "' + card.text + '" — bullets: ' + (card.bullets || []).join("; ") + '. He had 1 minute to prepare and should speak for 1–2 minutes without help.');
    if (partNo === 1) lines.push('Part 1 = short, natural answers about familiar topics (2–4 sentences each is ideal).');
    if (partNo === 3) lines.push('Part 3 = abstract discussion: he should develop opinions with reasons, examples, comparisons and speculation.');
    return lines.concat([
'Score strictly from what you HEAR, using the public band descriptors (paraphrased):',
'• Fluency & Coherence: 6 = willing to speak at length but loses coherence at times, some hesitation/repetition; 7 = speaks at length without noticeable effort, some language-related hesitation, flexible connectives; 8 = fluent, only occasional repetition or self-correction, hesitation is content-related.',
'• Lexical Resource: 6 = wide enough to discuss topics at length, paraphrases with mixed success; 7 = flexible, some less common and idiomatic items, some inappropriate choices; 8 = wide and precise, uses idiomatic language skilfully, rare slips.',
'• Grammatical Range & Accuracy: 6 = mix of simple and complex forms, frequent errors in complex ones but rarely impede; 7 = a range of complex structures used flexibly, frequently error-free sentences; 8 = wide range used flexibly, the majority of sentences error-free.',
'• Pronunciation (from the audio): 6 = a range of features with mixed control, generally understood though some mispronunciations reduce clarity; 7 = all positive features of 6 and some of 8; 8 = wide range of features, sustained flexible use, easy to understand throughout, L1 accent has minimal effect. Listen for individual sounds (p/b, f/v, θ/ð, vowels), word stress, sentence stress, intonation, chunking.',
'If an answer is silent, cut off, or far too short, reflect it in Fluency and mention it.',
'Return:',
'1) answers: a VERBATIM transcript of each answer (index 1-based; keep "uh", "um", false starts and repetitions).',
'2) bands (0–9, half bands): fluency, lexical, grammar, pronunciation, overall (= their average to the nearest half band).',
'3) pronunciation_issues: up to 8 specific words he mispronounced — word, heard_as (how it sounded, e.g. "sink"), tip_ar (how to fix, Arabic, short).',
'4) errors: grammar/vocabulary errors quoted from the transcript with the fix, tagged ' + ((window.Prompts && window.Prompts.TAGS) || []).join("|") + ', note_ar.',
'5) strengths_ar: 2–3 things he did well. 6) fixes_ar: exactly 3 prioritised actions for next time.',
'7) better_answer: for his WEAKEST answer, a natural band-7.5 version in English that keeps HIS ideas (index = that answer\'s number).',
'8) summary_ar: 2–3 sentences.',
'Arabic for every *_ar field; English for transcripts, quotes and the better answer. JSON only.'
    ]).join("\n");
  }

  function band(v) { var n = Number(v); if (!isFinite(n)) return null; return Math.max(0, Math.min(9, Math.round(n * 2) / 2)); }
  function s(v, n) { return v == null ? "" : String(v).slice(0, n || 400); }
  function normalize(obj) {
    if (!obj || typeof obj !== "object") return null;
    var b = obj.bands || {};
    var bands = { fluency: band(b.fluency), lexical: band(b.lexical), grammar: band(b.grammar), pronunciation: band(b.pronunciation), overall: band(b.overall) };
    if (["fluency", "lexical", "grammar", "pronunciation"].some(function (k) { return bands[k] == null; })) return null;
    if (bands.overall == null) bands.overall = band((bands.fluency + bands.lexical + bands.grammar + bands.pronunciation) / 4);
    var tags = (window.Prompts && window.Prompts.TAGS) || [];
    return {
      bands: bands,
      answers: (obj.answers || []).slice(0, 12).map(function (a) { a = a || {}; return { index: Number(a.index) || 0, transcript: s(a.transcript, 3000) }; }),
      pronunciation_issues: (obj.pronunciation_issues || []).slice(0, 10).map(function (p) { p = p || {}; return { word: s(p.word, 40), heard_as: s(p.heard_as, 60), tip_ar: s(p.tip_ar, 200) }; }).filter(function (p) { return p.word; }),
      errors: (obj.errors || []).slice(0, 30).map(function (e) { e = e || {}; var t = String(e.tag || "OTHER").toUpperCase(); return { tag: tags.indexOf(t) === -1 ? "OTHER" : t, quote: s(e.quote, 300), fix: s(e.fix, 300), note_ar: s(e.note_ar, 300) }; }).filter(function (e) { return e.quote || e.fix; }),
      strengths_ar: (obj.strengths_ar || []).slice(0, 4).map(function (x) { return s(x, 300); }),
      fixes_ar: (obj.fixes_ar || []).slice(0, 3).map(function (x) { return s(x, 300); }),
      better_answer: obj.better_answer && obj.better_answer.text ? { index: Number(obj.better_answer.index) || 0, text: s(obj.better_answer.text, 2500) } : null,
      summary_ar: s(obj.summary_ar, 900)
    };
  }

  function evaluatePart(partNo, qs, card) {
    var parts = [{ text: instructions(partNo, card) }];
    var answered = 0;
    qs.forEach(function (q, i) {
      parts.push({ text: "Answer " + (i + 1) + " — the question was: \"" + q.q + "\"" + (q.rec ? "" : " (the candidate SKIPPED this question — no audio)") });
      if (q.rec) { parts.push({ inlineData: { mimeType: q.rec.mime, data: q.rec.base64 } }); answered++; }
    });
    if (!answered) return Promise.reject({ ar: "لم تُسجَّل أي إجابة في هذا الجزء." });
    return window.AI.generateJSON(parts, schema(), { temperature: 0.2, maxOutputTokens: 8192 }).then(function (obj) {
      var r = normalize(obj);
      if (!r) throw { ar: "ردّ Gemini لا يحوي درجات صالحة — أعد المحاولة." };
      r.model = obj.__model;
      return r;
    });
  }

  /* ================= rendering a result ================= */

  function bandsTable(b) {
    var t = el("table", "band-table");
    ["fluency", "lexical", "grammar", "pronunciation", "overall"].forEach(function (k) {
      var tr = el("tr");
      tr.appendChild(el("td", k === "overall" ? "bold" : null, CRIT_AR[k]));
      tr.appendChild(el("td", "band-cell ltr " + bandClass(b[k]), fmtB(b[k])));
      t.appendChild(tr);
    });
    return t;
  }

  function resultCard(r, qs, title) {
    var c = el("div", "result-card");
    c.appendChild(el("div", "result-head", title + " · " + fmtB(r.bands.overall) + (r.bands.overall >= 7 ? " ✓ عند الهدف" : " — الهدف 7.0")));
    c.appendChild(bandsTable(r.bands));
    if (r.summary_ar) c.appendChild(el("p", "eval-summary", r.summary_ar));
    if (r.strengths_ar.length) { c.appendChild(el("h4", "eval-h", "ما أحسنت فيه")); var ul = el("ul", "rep-list"); r.strengths_ar.forEach(function (x) { ul.appendChild(el("li", null, x)); }); c.appendChild(ul); }
    if (r.pronunciation_issues.length) {
      c.appendChild(el("h4", "eval-h", "كلمات نطقتها بشكل غير واضح (أُضيفت إلى «كلماتي للمراجعة»)"));
      r.pronunciation_issues.forEach(function (p) {
        var row = el("div", "err-row");
        var top = el("div", "ltr");
        top.appendChild(el("b", null, p.word));
        if (p.heard_as) top.appendChild(document.createTextNode("  →  heard as «" + p.heard_as + "»"));
        row.appendChild(top);
        if (p.tip_ar) row.appendChild(el("div", "err-note", p.tip_ar));
        var lb = btn("🔊", "small", function () { window.Chat && window.Chat.speak(p.word, null, { rate: 0.75 }); });
        lb.classList.add("inline-listen"); row.appendChild(lb);
        c.appendChild(row);
      });
    }
    if (r.errors.length) {
      var labels = (window.PLAN || {}).error_tag_labels_ar || {};
      c.appendChild(el("h4", "eval-h", "أخطاء القواعد والمفردات (" + r.errors.length + ")"));
      r.errors.forEach(function (e) {
        var row = el("div", "err-row");
        row.appendChild(el("span", "err-tag", labels[e.tag] || e.tag));
        if (e.quote) row.appendChild(el("div", "err-quote ltr", "✗ " + e.quote));
        if (e.fix) row.appendChild(el("div", "err-fix ltr", "✓ " + e.fix));
        if (e.note_ar) row.appendChild(el("div", "err-note", e.note_ar));
        c.appendChild(row);
      });
    }
    if (r.better_answer) {
      var q = qs && r.better_answer.index ? qs[r.better_answer.index - 1] : null;
      c.appendChild(el("h4", "eval-h", "إجابة نموذجية (Band 7.5) بأفكارك" + (q ? " — السؤال " + r.better_answer.index : "")));
      var ba = el("div", "better-answer ltr", r.better_answer.text); c.appendChild(ba);
      c.appendChild(btn("🔊 استمع لها", "small", function () { window.Chat && window.Chat.speak(r.better_answer.text, null, { rate: 0.9 }); }));
    }
    if (r.fixes_ar.length) { c.appendChild(el("h4", "eval-h", "أولوياتك للمرة القادمة")); var ol = el("ol", "eval-fixes"); r.fixes_ar.forEach(function (x) { ol.appendChild(el("li", null, x)); }); c.appendChild(ol); }
    if (r.answers.length) {
      var det = el("details", "rep-wrap"); det.appendChild(el("summary", null, "📝 ماذا قلت بالضبط (النص المكتوب)"));
      r.answers.forEach(function (a) {
        var q2 = qs && qs[a.index - 1];
        if (q2) det.appendChild(el("div", "tr-q ltr", "Q" + a.index + ": " + q2.q));
        det.appendChild(el("div", "tr-a ltr", a.transcript || "—"));
      });
      c.appendChild(det);
    }
    return c;
  }

  /* ================= the mock test ================= */

  function partQuestions(partNo, card, p1Topics) {
    if (partNo === 1) {
      var out = [];
      p1Topics.forEach(function (t, ti) { (ti === 0 ? t.questions : t.questions.slice(0, 3)).forEach(function (q) { out.push({ q: q, topic: t.title_ar }); }); });
      return out;
    }
    if (partNo === 2) return [{ q: card.text + " — " + (card.bullets || []).join("; "), card: card }];
    var bank = (window.SPEAKING_PART3 || {})[card.id] || FALLBACK_P3;
    return bank.slice(0, 4).map(function (q) { return { q: q }; });
  }

  function runMock(host, mode, arg) {
    arg = arg || {};
    var partsSeq = mode === "full" ? [1, 2, 3] : [Number(mode)];
    var cards = window.SPEAKING_CARDS || [];
    var card = (arg.cardId && cards.filter(function (c) { return c.id === arg.cardId; })[0]) || (cards.length ? pick(cards) : { id: "x", text: "Describe a place you like to visit.", bullets: ["where it is", "when you go there", "what you do there", "and explain why you like it"] });
    var p1Bank = (window.SPEAKING_PART1 && window.SPEAKING_PART1.length) ? window.SPEAKING_PART1 : FALLBACK_P1;
    var p1Topics = shuffle(p1Bank).slice(0, mode === "full" ? 2 : 1);
    var results = [], partIdx = 0, t0 = Date.now();

    function runPart() {
      var partNo = partsSeq[partIdx];
      var qs = partQuestions(partNo, card, p1Topics);
      clear(host);
      var head = el("div", "mock-head");
      head.appendChild(el("h2", "page-title", "🎤 Speaking — Part " + partNo + (mode === "full" ? " (" + (partIdx + 1) + "/3)" : "")));
      head.appendChild(el("p", "muted-p", partNo === 1 ? "أسئلة قصيرة عن حياتك — أجب بـ ٢–٤ جمل (حتى ٤٥ ثانية)." :
        partNo === 2 ? "دقيقة تحضير ثم تتكلّم وحدك حتى دقيقتين — حاول أن تتجاوز دقيقة ونصف." :
        "نقاش عام: رأي + سبب + مثال + مقارنة (حتى ٧٥ ثانية لكل سؤال)."));
      host.appendChild(head);
      var slot = el("div"); host.appendChild(slot);
      if (partNo === 2) part2(slot, qs, function () { evaluate(partNo, qs); });
      else askLoop(slot, partNo, qs, 0, function () { evaluate(partNo, qs); });
    }

    function examinerBubble(text) {
      var b = el("div", "examiner");
      b.appendChild(el("div", "ex-who", "🧑‍🏫 Examiner"));
      b.appendChild(el("div", "ex-q ltr", text));
      var rp = btn("🔊 أعد السؤال", "small ghost", function () { window.Chat && window.Chat.speak(text, null, { rate: 0.95 }); });
      b.appendChild(rp);
      return b;
    }

    function askLoop(slot, partNo, qs, i, done) {
      if (i >= qs.length) return done();
      clear(slot);
      slot.appendChild(el("div", "prog-txt", "سؤال " + (i + 1) + " من " + qs.length + (qs[i].topic ? " · " + qs[i].topic : "")));
      slot.appendChild(examinerBubble(qs[i].q));
      if (window.Chat) window.Chat.speak(qs[i].q, null, { rate: 0.95 });
      var mine = el("div", "mine-row hidden");
      var nav = el("div", "row-btns");
      var mic = window.Pron.micWidget({
        maxSec: PART_MAX[partNo], autoStopSilence: 4,
        hint: "اضغط وأجب — يتوقف تلقائيًا بعد ٤ ثوانٍ صمت (أقصى " + PART_MAX[partNo] + " ثانية)",
        onDone: function (rec, m) {
          qs[i].rec = rec;
          clear(mine); mine.classList.remove("hidden");
          var a = document.createElement("audio"); a.controls = true; a.src = rec.url; mine.appendChild(el("span", "mine-lbl", "إجابتك (" + Math.round(rec.duration) + " ث):")); mine.appendChild(a);
          m.reset(rec.heard ? "✓ سُجِّلت — التالي، أو أعد التسجيل" : "⚠ لم أسمع كلامًا واضحًا — أعد التسجيل");
          clear(nav);
          nav.appendChild(btn(i === qs.length - 1 ? "إنهاء الجزء وتقييمه ✓" : "السؤال التالي ⟵", "primary", function () { askLoop(slot, partNo, qs, i + 1, done); }));
        }
      });
      slot.appendChild(mic.node); slot.appendChild(mine);
      nav.appendChild(btn("تخطَّ هذا السؤال", "small ghost", function () { qs[i].rec = null; askLoop(slot, partNo, qs, i + 1, done); }));
      slot.appendChild(nav);
    }

    function part2(slot, qs, done) {
      clear(slot);
      var c = card;
      var cc = el("div", "cue-card");
      cc.appendChild(el("div", "cue-text ltr", c.text));
      var ul = el("ul", "cue-bullets ltr"); (c.bullets || []).forEach(function (b) { ul.appendChild(el("li", null, b)); }); cc.appendChild(ul);
      slot.appendChild(cc);
      var timer = el("div", "timer-big ltr", "1:00"); var phase = el("div", "timer-phase", "⏳ وقت التحضير — دوّن كلمات مفتاحية");
      slot.appendChild(phase); slot.appendChild(timer);
      var notes = el("textarea", "big-input"); notes.rows = 3; notes.dir = "auto"; notes.placeholder = "ملاحظاتك (كلمات مفتاحية فقط)…";
      slot.appendChild(notes);
      var startNow = btn("أنا جاهز — ابدأ الكلام الآن", "wide", function () { clearInterval(tm); speakPhase(); });
      slot.appendChild(startNow);
      if (window.Chat) window.Chat.speak("You have one minute to prepare. " + c.text, null, { rate: 0.95 });
      var left = 60;
      var tm = setInterval(function () {
        left--; timer.textContent = "0:" + (left < 10 ? "0" : "") + Math.max(0, left);
        if (left <= 0) { clearInterval(tm); if (window.Chat) window.Chat.speak("Please start speaking now.", null, {}); speakPhase(); }
      }, 1000);
      function speakPhase() {
        if (!slot.isConnected) return;
        phase.textContent = "🎙 اضغط الميكروفون وتكلّم حتى دقيقتين"; timer.textContent = "";
        startNow.remove();
        var mine = el("div", "mine-row hidden"), nav = el("div", "row-btns");
        var mic = window.Pron.micWidget({
          maxSec: PART_MAX[2], autoStopSilence: 7,
          hint: "اضغط وتكلّم — اضغط مرة أخرى عند الانتهاء (الهدف ١:٣٠–٢:٠٠)",
          onDone: function (rec, m) {
            qs[0].rec = rec;
            clear(mine); mine.classList.remove("hidden");
            var a = document.createElement("audio"); a.controls = true; a.src = rec.url;
            var d = Math.round(rec.duration);
            mine.appendChild(el("span", "mine-lbl " + (d >= 90 ? "good" : d >= 60 ? "warn" : "bad"), "تكلّمت " + Math.floor(d / 60) + ":" + (d % 60 < 10 ? "0" : "") + (d % 60) + (d < 60 ? " — قصير جدًا" : d < 90 ? " — حاول أطول" : " ✓")));
            mine.appendChild(a);
            m.reset("أعد التسجيل إن أردت، أو قيّم");
            clear(nav); nav.appendChild(btn("قيّم إجابتي ✓", "primary", done));
          }
        });
        slot.appendChild(mic.node); slot.appendChild(mine); slot.appendChild(nav);
      }
    }

    function evaluate(partNo, qs) {
      clear(host);
      host.appendChild(el("h2", "page-title", "🎤 Part " + partNo + " — التقييم"));
      if (!window.AI || !window.AI.enabled()) {
        host.appendChild(el("p", "muted-p", "فعّل مفتاح Gemini من «الخطة» ليستمع الممتحن لإجاباتك ويقيّمها. يمكنك الاستماع لتسجيلاتك الآن:"));
        qs.forEach(function (q, i) { if (!q.rec) return; host.appendChild(el("div", "tr-q ltr", "Q" + (i + 1) + ": " + q.q)); var a = document.createElement("audio"); a.controls = true; a.src = q.rec.url; host.appendChild(a); });
        host.appendChild(btn("فعّل Gemini", "primary wide", function () { window.App.go("plan"); }));
        return;
      }
      var wait = el("div", "pron-msg listening", "🎧 الممتحن يستمع إلى " + qs.filter(function (q) { return q.rec; }).length + " إجابة… (٢٠–٦٠ ثانية)");
      host.appendChild(wait);
      evaluatePart(partNo, qs, card).then(function (r) {
        results.push({ part: partNo, r: r, qs: qs.map(function (q) { return { q: q.q }; }) });
        clear(host);
        host.appendChild(resultCard(r, qs, "Part " + partNo));
        if (r.pronunciation_issues.length) Store.addPronWords(r.pronunciation_issues.map(function (p) { return { w: p.word, note_ar: p.tip_ar, source: "mock" }; }));
        partIdx++;
        if (partIdx < partsSeq.length) host.appendChild(btn("التالي: Part " + partsSeq[partIdx] + " ⟵", "primary wide", runPart));
        else finish();
      }).catch(function (e) {
        clear(host);
        host.appendChild(el("div", "pron-msg err", "⚠ " + ((e && (e.ar || e.message)) || "تعذّر التقييم")));
        host.appendChild(btn("أعد إرسال التسجيلات", "primary wide", function () { evaluate(partNo, qs); }));
        host.appendChild(btn("أعد هذا الجزء", "wide", runPart));
      });
    }

    function finish() {
      var keys = ["fluency", "lexical", "grammar", "pronunciation"], comb = {};
      keys.forEach(function (k) { comb[k] = band(results.reduce(function (s2, x) { return s2 + x.r.bands[k]; }, 0) / results.length); });
      comb.overall = band((comb.fluency + comb.lexical + comb.grammar + comb.pronunciation) / 4);
      Store.addSpeaking({
        kind: "ai-audio", mode: String(mode), bands: comb, diagnostic: false,
        notes: results.map(function (x) { return "Part " + x.part + ": " + fmtB(x.r.bands.overall); }).join(" · "),
        eval: { parts: results.map(function (x) { return { part: x.part, bands: x.r.bands, summary_ar: x.r.summary_ar, fixes_ar: x.r.fixes_ar,
                                                         transcript: x.r.answers.map(function (a) { return a.transcript; }).join("\n").slice(0, 2500) }; }),
                card: mode !== "1" ? card.id : undefined }
      });
      var mins = Math.max(1, Math.round((Date.now() - t0) / 60000));
      if (arg.taskKey) { var cur = Store.taskState(arg.taskKey) || {}; Store.setTask(arg.taskKey, { done: true, minutes: Math.max(cur.minutes || 0, mins) }); }
      if (mode === "full" && window.Plan && window.Plan.phaseFor().id === "diagnostic" && !(Store.taskState("diagnostic|diag_speak_rec") || {}).done)
        Store.setTask("diagnostic|diag_speak_rec", { done: true, minutes: mins });
      var fin = el("div", "pcard");
      fin.appendChild(el("h3", "pcard-title", results.length > 1 ? "النتيجة الإجمالية للامتحان المحاكى" : "حُفظت النتيجة"));
      if (results.length > 1) fin.appendChild(bandsTable(comb));
      fin.appendChild(el("p", "muted-p", "تقدير من Gemini بعد الاستماع — يظهر في «التقدّم» ضمن Speaking. تقييم مدرّس italki يبقى المرجع الأدق."));
      var row = el("div", "row-btns");
      row.appendChild(btn("امتحان آخر", "primary", function () { mockHome(host, {}); }));
      row.appendChild(btn("مختبر النطق — كلماتي", "", function () { window.App.go("speak", { tab: "lab", unit: "my_words" }); }));
      row.appendChild(btn("التقدّم", "", function () { window.App.go("progress"); }));
      fin.appendChild(row);
      host.appendChild(fin);
    }

    runPart();
  }

  function mockHome(host, arg) {
    arg = arg || {};
    clear(host);
    if (!window.AI || !window.AI.enabled()) {
      var n = el("div", "export-reminder", "🔑 فعّل مفتاح Gemini من «الخطة» ليستمع الممتحن لإجاباتك ويقيّمها.");
      n.onclick = function () { window.App.go("plan"); }; host.appendChild(n);
    }
    var intro = el("div", "pcard");
    intro.appendChild(el("h3", "pcard-title", "🎤 امتحان Speaking محاكى — ممتحن يسمعك"));
    intro.appendChild(el("p", "muted-p", "يقرأ الممتحن الأسئلة بصوت عالٍ، تجيب بصوتك، ثم يُقيَّم كل جزء بالمعايير الأربعة — منها النطق من تسجيلك الحقيقي — مع نص ما قلته وإجابة نموذجية بأفكارك."));
    var grid = el("div", "mock-grid");
    [["1", "Part 1", "أسئلة عن حياتك · ٤–٥ د"], ["2", "Part 2", "بطاقة: دقيقة تحضير + دقيقتان"], ["3", "Part 3", "نقاش عام · ٤–٥ د"], ["full", "امتحان كامل", "الأجزاء الثلاثة · ١١–١٤ د"]].forEach(function (m) {
      var b = el("button", "mock-btn" + (m[0] === "full" ? " full" : "")); b.type = "button";
      b.appendChild(el("div", "mb-t", m[1])); b.appendChild(el("div", "mb-s", m[2]));
      b.onclick = function () { runMock(host, m[0], arg); };
      grid.appendChild(b);
    });
    intro.appendChild(grid);
    host.appendChild(intro);
    var past = Store.speaking().filter(function (x) { return x.kind === "ai-audio"; }).slice(-6).reverse();
    if (past.length) {
      var pc = el("div", "pcard"); pc.appendChild(el("h3", "pcard-title", "آخر امتحاناتك المحاكاة"));
      past.forEach(function (x) {
        var row = el("div", "hist-row");
        row.appendChild(el("span", "hist-date ltr", x.date));
        row.appendChild(el("span", "hist-txt", (x.mode === "full" ? "امتحان كامل" : "Part " + x.mode) + " → " + fmtB(x.bands.overall) +
          " (FC " + fmtB(x.bands.fluency) + " · LR " + fmtB(x.bands.lexical) + " · GRA " + fmtB(x.bands.grammar) + " · P " + fmtB(x.bands.pronunciation) + ")"));
        pc.appendChild(row);
      });
      host.appendChild(pc);
    }
    host.appendChild(el("p", "muted-p small-p", "التسجيلات تُرسل إلى Google للتقييم ولا تُحفظ في التطبيق — يُحفظ التقييم والنص فقط."));
  }

  /* ================= the screen ================= */

  function speakView(arg) {
    arg = arg || {};
    var view = window.App.view();
    var wrap = el("div", "page");
    var tabs = el("div", "seg");
    var body = el("div");
    var current = arg.tab || (arg.mode ? "mock" : "lab");
    function paint() {
      clear(tabs);
      [["lab", "🎙 مختبر النطق"], ["mock", "🎤 امتحان المحادثة"]].forEach(function (t) {
        var b = el("button", "seg-btn" + (current === t[0] ? " active" : ""), t[1]); b.type = "button";
        b.onclick = function () { if (window.Recorder) window.Recorder.cancel(); current = t[0]; arg = {}; paint(); };
        tabs.appendChild(b);
      });
      clear(body);
      if (current === "lab") {
        if (arg.unit) window.Pron.practiceUnit(body, arg.unit, arg);
        else window.Pron.labHome(body, arg);
      } else {
        if (arg.mode) runMock(body, arg.mode, arg);
        else mockHome(body, arg);
      }
    }
    wrap.appendChild(tabs); wrap.appendChild(body);
    view.appendChild(wrap);
    paint();
  }

  window.Speak = { view: speakView, mockHome: mockHome, runMock: runMock, _normalize: normalize, _instructions: instructions };
})();
