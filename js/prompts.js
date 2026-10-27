/* prompts.js — prompt builders + the JSON contracts shared by both AI routes:
     • in-app Gemini (ai.js, JSON mode with the schemas below), and
     • zero-cost "copy into Claude, paste the reply back" (parseJSON below).
   Both produce the same evaluation object, so the app never cares which
   route was used. Also: translation / visual / Socratic error-chat prompts. */
(function () {
  "use strict";

  var TAGS = ["ARTICLES", "VERB-FORM", "COPULA-AGREEMENT", "MEANING-REVERSAL", "CONNECTORS", "COLLOCATION", "PREPOSITION", "OTHER"];
  var MARK_OPEN = "<<<IELTS_JSON", MARK_CLOSE = "IELTS_JSON>>>";

  // Current meaning-reversal watchlist, auto-pulled from module data + user additions.
  function watchlistPairs() {
    var mod = window.moduleById ? window.moduleById("reversal_pairs") : null;
    var pairs = [];
    ((mod && mod.items) || []).forEach(function (i) {
      if (i.pair) pairs.push(i.pair.join("/"));
    });
    (window.Store && Store.addedPairs ? Store.addedPairs() : []).forEach(function (p) {
      if (p.pair) pairs.push(p.pair.join("/"));
    });
    var seen = {}, out = [];
    pairs.forEach(function (p) { if (!seen[p]) { seen[p] = 1; out.push(p); } });
    return out;
  }

  // Current active stage(s) from the roadmap, for examiner context.
  function currentStageLine() {
    var active = [];
    ((window.ROADMAP || {}).stages || []).forEach(function (s) {
      var status = window.Engine ? window.Engine.stageStatus(s) : s.status;
      if (status === "active") active.push(s.name_en);
    });
    return active.length ? active.join(" + ") : "Core grammar consolidation";
  }

  var PROFILE = 'CANDIDATE PROFILE: Arabic-L1 speaker, target band 7.0 in every skill (IELTS Academic, computer-delivered, Feb 2027), background in accounting/CMA.';

  var DESCRIPTORS = [
'BAND ANCHORS (paraphrased from the public IELTS Writing descriptors — score strictly against them):',
'  • Task (TR for Task 2 / TA for Task 1): 6 = all parts addressed but unevenly, position present but not always clear; 7 = all parts addressed, clear position throughout, ideas extended though some over-generalised; 8 = fully developed, well-supported position / key features clearly presented.',
'  • Coherence & Cohesion: 6 = logical but cohesive devices faulty or mechanical, paragraphing not always logical; 7 = logical progression, range of devices with some over/under-use, one clear topic per paragraph; 8 = natural sequencing and cohesion, well-managed paragraphing.',
'  • Lexical Resource: 6 = adequate range, some inaccuracy; 7 = sufficient range with flexibility, some less common items with occasional awkwardness, few spelling/word-form errors; 8 = wide, fluent, natural, rare slips.',
'  • Grammatical Range & Accuracy: 6 = mix of simple and complex, errors rarely impede; 7 = variety of complex structures, majority of sentences error-free, good control; 8 = wide range, most sentences error-free, only occasional slips.'
  ];

  function tagLines(pairs) {
    return [
'   [ARTICLES]         a/an/the/zero-article misuse (incl. "an advice", "I have car")',
'   [VERB-FORM]        wrong form after preposition/relative pronoun (e.g. "interested in to set")',
'   [COPULA-AGREEMENT] missing is/are, or "the company have" instead of "has"',
'   [MEANING-REVERSAL] confusable pair used with reversed meaning.',
'                      Current watchlist: ' + (pairs.length ? pairs.join(", ") : "employer/employee"),
'   [CONNECTORS]       because/although/if/when — comma placement, incomplete clauses',
'   [COLLOCATION]      unnatural word partnership (make/do/take…, verb+noun, adj+noun)',
'   [PREPOSITION]      wrong or missing preposition',
'   For anything else use [OTHER].'
    ];
  }

  var WRITING_CONTRACT_EXAMPLE = [
'{"task": 2,',
' "bands": {"task": 6.5, "coherence": 6.5, "lexical": 6.0, "grammar": 6.0, "overall": 6.5},',
' "errors": [{"tag": "ARTICLES", "quote": "exact words from the essay", "fix": "corrected words", "note_ar": "سبب قصير بالعربية"}],',
' "finance_bias": {"flag": false, "note_ar": ""},',
' "fixes_ar": ["الأولوية ١ …", "الأولوية ٢ …", "الأولوية ٣ …"],',
' "vocab_to_learn": [{"word": "mitigate", "gloss_ar": "يخفّف", "example_with_gap": "Governments must ___ the effects of air pollution.", "distractors": ["minimise", "mediate", "migrate"]}],',
' "summary_ar": "ملخّص من سطرين بالعربية"}'
  ];

  function contractBlock(exampleLines, forAI) {
    if (forAI) {
      return ['', 'OUTPUT: respond with ONE JSON object only (no prose, no markdown), exactly this shape:'].concat(exampleLines);
    }
    return ['', '=== OUTPUT CONTRACT (the app reads this part automatically) ===',
            'After your human-readable analysis, output the JSON object below between the two marker lines, and nothing after it:',
            MARK_OPEN].concat(exampleLines, [MARK_CLOSE]);
  }

  /* ---------------- Writing ---------------- */

  // opts: { task: 1|2, minutes, forAI }
  function writingPrompt(essay, taskPrompt, opts) {
    opts = opts || {};
    var task = opts.task === 1 ? 1 : 2;
    var pairs = watchlistPairs();
    var words = String(essay || "").trim().split(/\s+/).filter(Boolean).length;
    var head = [
'You are an experienced IELTS Academic examiner. Evaluate the Writing Task ' + task + ' response below.',
'',
PROFILE,
'CURRENT ROADMAP STAGE: ' + currentStageLine() + '.',
'WORD COUNT: ' + words + ' (minimum ' + (task === 1 ? 150 : 250) + ')' + (opts.minutes ? ' · WRITTEN IN: ' + opts.minutes + ' min (timed)' : '') + '.'
    ];
    if (taskPrompt) {
      head.push('THE TASK ' + task + ' QUESTION WAS:');
      head.push('"' + taskPrompt + '"');
      head.push('Judge Task ' + (task === 1 ? 'Achievement' : 'Response') + ' against THIS question.');
    }
    var body = head.concat([
'',
'=== TEXT TO EVALUATE ===',
essay,
'=== END OF TEXT ===',
''
    ], DESCRIPTORS, [
'',
'Do ALL of the following:',
'1) Band score (0–9, half bands) for EACH criterion — ' + (task === 1 ? 'Task Achievement' : 'Task Response') + ', Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy — plus the OVERALL band for this task.',
'2) Tag EVERY grammar/vocabulary error (quote the exact words) with one of these watchlist patterns:'
    ], tagLines(pairs), [
'3) Diagnostic integrity: flag any CMA/finance-topic bias that may be INFLATING Lexical Resource (strong only because it is finance jargon the candidate already knows, not transferable academic range).',
'4) Three concrete, prioritised fixes for the next essay.',
'5) Up to 5 general academic words the candidate misused or could upgrade to, each with a NEW gap sentence on a general (non-finance) topic and three same-class distractors — the app turns them into flashcards.',
'Be strict and specific. Arabic for note_ar / fixes_ar / summary_ar; English examples stay in English.'
    ], contractBlock(WRITING_CONTRACT_EXAMPLE, !!opts.forAI), [
'Rules: bands in 0.5 steps; "task" field = ' + task + '; tag ∈ ' + TAGS.join(" | ") + '; quotes verbatim from the essay.'
    ]);
    return body.join("\n");
  }

  /* ---------------- Speaking (transcript only — no audio, no pronunciation band) ---------------- */

  var SPEAKING_CONTRACT_EXAMPLE = [
'{"bands": {"fluency": 6.0, "lexical": 6.5, "grammar": 6.0, "overall": 6.0},',
' "errors": [{"tag": "COPULA-AGREEMENT", "quote": "exact words", "fix": "corrected words", "note_ar": "سبب قصير"}],',
' "fixes_ar": ["…", "…", "…"],',
' "summary_ar": "ملخّص قصير بالعربية"}'
  ];

  function speakingTranscriptPrompt(transcript, part, opts) {
    opts = opts || {};
    var pairs = watchlistPairs();
    return [
'You are an experienced IELTS Speaking examiner. Below is a TRANSCRIPT the candidate typed of what he said' + (part ? ' in Part ' + part : '') + '.',
'You cannot hear him, so DO NOT score Pronunciation: judge only Fluency & Coherence (from text: hesitation markers, self-correction, discourse markers, development), Lexical Resource, and Grammatical Range & Accuracy, and give an overall of those three.',
'',
PROFILE,
'',
'=== TRANSCRIPT ===',
transcript,
'=== END ===',
'',
'1) Band (0–9, half bands) for fluency, lexical, grammar, and the overall of the three.',
'2) Tag every error (quote exact words) with one of:'
    ].concat(tagLines(pairs), [
'3) Three prioritised fixes (Arabic), including one on the "answer + reason + example" fluency structure.',
'Arabic for note_ar / fixes_ar / summary_ar.'
    ], contractBlock(SPEAKING_CONTRACT_EXAMPLE, !!opts.forAI), [
'Rules: bands in 0.5 steps; tag ∈ ' + TAGS.join(" | ") + '.'
    ]).join("\n");
  }

  /* ---------------- Weekly coaching report ---------------- */

  var REPORT_CONTRACT_EXAMPLE = [
'{"summary_ar": "فقرة قصيرة عن الأسبوعين",',
' "margin_ar": "لكل مهارة: الفجوة عن 7.0 وماذا تعني",',
' "risks_ar": ["…", "…"],',
' "priorities_ar": [{"title": "…", "why": "…", "action": "…"}, {"title": "…", "why": "…", "action": "…"}, {"title": "…", "why": "…", "action": "…"}],',
' "rule_weights": {"articles": 1.0, "copula": 1.5},',
' "next_week_ar": ["تعديل ملموس على جدول الأسبوع القادم …", "…"],',
' "motivation_ar": "سطران"}'
  ];

  function weeklyReportPrompt(pack, opts) {
    opts = opts || {};
    var ruleIds = (window.RULES || []).map(function (r) { return r.id + " (" + r.label + ")"; }).join(", ");
    return [
'You are the IELTS coach of an Arabic-L1 candidate (target 7.0 in every skill, IELTS Academic, exam ' + (pack.exam_date || "TBD") + ', ' + pack.days_to_exam + ' days away, current phase: ' + pack.phase + ').',
'Below is his complete tracking data for the last ' + ((pack.period && pack.period.from) ? (pack.period.from + ' → ' + pack.period.to) : '14 days') + ' as JSON (bands per skill with trend and gap to 7.0, weekly planned vs logged minutes and targets, drill accuracy per grammar rule in calm vs under-load mode, essay error-tag frequency, recent essays).',
'',
'=== DATA ===',
JSON.stringify(pack, null, 1),
'=== END ===',
'',
'Write, in Arabic (English terms stay in English):',
'1) summary_ar — what actually happened these two weeks (be concrete, cite numbers).',
'2) margin_ar — per skill: gap to 7.0, whether the trend closes it before the exam, and the single biggest lever.',
'3) risks_ar — what could cost the 7.0 (e.g. a skill with no data, hours under plan, rules collapsing under load, finance-bias in vocabulary).',
'4) priorities_ar — exactly 3, each {title, why, action}, actionable within his weekly hours.',
'5) rule_weights — a multiplier 0.5–2.0 for any of these drill rules that deserve more or less share next week (omit the rest): ' + ruleIds + '.',
'6) next_week_ar — 2–4 concrete adjustments to next week\'s schedule (respect the plan\'s hours).',
'7) motivation_ar — two honest lines, no fluff.'
    ].concat(contractBlock(REPORT_CONTRACT_EXAMPLE, !!opts.forAI)).join("\n");
  }

  /* ---------------- paste-route parser + normalisers ---------------- */

  function tryParse(s) { try { return JSON.parse(String(s).trim()); } catch (e) { return null; } }

  // Markers first, then a ```json fence, then the outermost braces.
  function parseJSON(text) {
    text = String(text || "");
    var m = new RegExp(MARK_OPEN + "([\\s\\S]*?)" + MARK_CLOSE).exec(text);
    var cand = m ? m[1] : null;
    if (!cand) { var f = /```(?:json)?\s*([\s\S]*?)```/i.exec(text); if (f) cand = f[1]; }
    if (!cand) { var s = text.indexOf("{"), e = text.lastIndexOf("}"); if (s !== -1 && e > s) cand = text.slice(s, e + 1); }
    if (!cand) return null;
    var obj = tryParse(cand);
    if (obj) return obj;
    var s2 = cand.indexOf("{"), e2 = cand.lastIndexOf("}");
    return (s2 !== -1 && e2 > s2) ? tryParse(cand.slice(s2, e2 + 1)) : null;
  }

  function band(v) {
    var n = typeof v === "string" ? parseFloat(v) : v;
    if (typeof n !== "number" || !isFinite(n)) return null;
    n = Math.round(n * 2) / 2;
    return Math.max(0, Math.min(9, n));
  }
  function str(v, max) { return v == null ? "" : String(v).slice(0, max || 600); }
  function strArr(a, max) { return Array.isArray(a) ? a.filter(function (x) { return x != null && String(x).trim(); }).map(function (x) { return str(x, 400); }).slice(0, max || 10) : []; }
  function normTag(t) { t = String(t || "OTHER").toUpperCase().replace(/\s+/g, "-"); return TAGS.indexOf(t) === -1 ? "OTHER" : t; }
  function normErrors(arr) {
    return (Array.isArray(arr) ? arr : []).slice(0, 40).map(function (e) {
      e = e || {};
      return { tag: normTag(e.tag), quote: str(e.quote, 300), fix: str(e.fix, 300), note_ar: str(e.note_ar || e.note, 300) };
    }).filter(function (e) { return e.quote || e.fix; });
  }

  function normalizeWriting(obj, task) {
    if (!obj || typeof obj !== "object") return null;
    var b = obj.bands || {};
    var bands = {
      task: band(b.task != null ? b.task : (b.task_response != null ? b.task_response : b.task_achievement)),
      coherence: band(b.coherence != null ? b.coherence : b.coherence_cohesion),
      lexical: band(b.lexical != null ? b.lexical : b.lexical_resource),
      grammar: band(b.grammar != null ? b.grammar : b.grammatical_range_accuracy),
      overall: band(b.overall)
    };
    var crit = [bands.task, bands.coherence, bands.lexical, bands.grammar];
    if (!crit.every(function (x) { return x !== null; })) return null;
    if (bands.overall === null) {
      var avg = (crit[0] + crit[1] + crit[2] + crit[3]) / 4;
      bands.overall = Math.round(avg * 2) / 2;
    }
    var fb = obj.finance_bias || {};
    var vocab = (Array.isArray(obj.vocab_to_learn) ? obj.vocab_to_learn : []).slice(0, 5).map(function (v) {
      v = v || {};
      var ex = str(v.example_with_gap || v.example, 300);
      var w = str(v.word, 60).trim();
      return { word: w, gloss_ar: str(v.gloss_ar, 120), sentence_with_gap: ex, correct_answer: w,
               distractors: strArr(v.distractors, 3), explanation: str(v.gloss_ar, 120) };
    }).filter(function (v) { return v.word && /___/.test(v.sentence_with_gap); });
    return {
      task: task || (obj.task === 1 ? 1 : 2),
      bands: bands,
      errors: normErrors(obj.errors),
      finance_bias: { flag: !!fb.flag, note_ar: str(fb.note_ar || fb.note, 400) },
      fixes_ar: strArr(obj.fixes_ar || obj.fixes, 3),
      vocab_to_learn: vocab,
      summary_ar: str(obj.summary_ar || obj.summary, 800)
    };
  }

  function normalizeSpeaking(obj) {
    if (!obj || typeof obj !== "object") return null;
    var b = obj.bands || {};
    var bands = { fluency: band(b.fluency), lexical: band(b.lexical), grammar: band(b.grammar), overall: band(b.overall), pronunciation: null };
    if ([bands.fluency, bands.lexical, bands.grammar].some(function (x) { return x === null; })) return null;
    if (bands.overall === null) bands.overall = Math.round(((bands.fluency + bands.lexical + bands.grammar) / 3) * 2) / 2;
    return { bands: bands, errors: normErrors(obj.errors), fixes_ar: strArr(obj.fixes_ar || obj.fixes, 3), summary_ar: str(obj.summary_ar || obj.summary, 800) };
  }

  function normalizeReport(obj) {
    if (!obj || typeof obj !== "object") return null;
    if (!obj.summary_ar && !obj.priorities_ar) return null;
    var rw = {};
    Object.keys(obj.rule_weights || {}).forEach(function (k) {
      var v = Number(obj.rule_weights[k]);
      if (isFinite(v) && v > 0) rw[k] = Math.min(2, Math.max(0.5, v));
    });
    return {
      summary_ar: str(obj.summary_ar, 2000), margin_ar: str(obj.margin_ar, 2000),
      risks_ar: strArr(obj.risks_ar, 8),
      priorities_ar: (Array.isArray(obj.priorities_ar) ? obj.priorities_ar : []).slice(0, 5).map(function (p) {
        p = p || {}; return { title: str(p.title, 160), why: str(p.why, 500), action: str(p.action, 500) };
      }),
      rule_weights: rw,
      next_week_ar: strArr(obj.next_week_ar, 6),
      motivation_ar: str(obj.motivation_ar, 400)
    };
  }

  /* ---------------- Gemini response schemas (OpenAPI subset) ---------------- */

  var NUM = { type: "NUMBER" }, STR = { type: "STRING" };
  var errorItem = { type: "OBJECT", properties: { tag: { type: "STRING", enum: TAGS }, quote: STR, fix: STR, note_ar: STR }, required: ["tag", "quote", "fix"] };
  var schemas = {
    writing: {
      type: "OBJECT",
      properties: {
        task: { type: "INTEGER" },
        bands: { type: "OBJECT", properties: { task: NUM, coherence: NUM, lexical: NUM, grammar: NUM, overall: NUM }, required: ["task", "coherence", "lexical", "grammar", "overall"] },
        errors: { type: "ARRAY", items: errorItem },
        finance_bias: { type: "OBJECT", properties: { flag: { type: "BOOLEAN" }, note_ar: STR }, required: ["flag"] },
        fixes_ar: { type: "ARRAY", items: STR },
        vocab_to_learn: { type: "ARRAY", items: { type: "OBJECT", properties: { word: STR, gloss_ar: STR, example_with_gap: STR, distractors: { type: "ARRAY", items: STR } }, required: ["word", "gloss_ar", "example_with_gap", "distractors"] } },
        summary_ar: STR
      },
      required: ["bands", "errors", "fixes_ar", "summary_ar"]
    },
    speaking: {
      type: "OBJECT",
      properties: {
        bands: { type: "OBJECT", properties: { fluency: NUM, lexical: NUM, grammar: NUM, overall: NUM }, required: ["fluency", "lexical", "grammar", "overall"] },
        errors: { type: "ARRAY", items: errorItem },
        fixes_ar: { type: "ARRAY", items: STR },
        summary_ar: STR
      },
      required: ["bands", "errors", "fixes_ar", "summary_ar"]
    },
    report: {
      type: "OBJECT",
      properties: {
        summary_ar: STR, margin_ar: STR,
        risks_ar: { type: "ARRAY", items: STR },
        priorities_ar: { type: "ARRAY", items: { type: "OBJECT", properties: { title: STR, why: STR, action: STR }, required: ["title", "why", "action"] } },
        rule_weights: { type: "OBJECT", properties: { articles: NUM, verbform: NUM, copula: NUM, meaning_reversal: NUM, connectors: NUM, collocations: NUM, vocab_awl: NUM, word_stress: NUM, sentence_stress: NUM, ipa: NUM, schwa: NUM } },
        next_week_ar: { type: "ARRAY", items: STR },
        motivation_ar: STR
      },
      required: ["summary_ar", "margin_ar", "risks_ar", "priorities_ar", "next_week_ar", "motivation_ar"]
    }
  };

  /* ---------------- translation / visual / Socratic chat (unchanged) ---------------- */

  function translatePrompt(text, context) {
    return [
'Translate the following English text into clear, natural Modern Standard Arabic.',
'The reader is an Arabic-L1 IELTS/CMA learner, so also:',
'  • give a fluent Arabic translation,',
'  • then list any key/collocation phrases with a short gloss,',
'  • note 1–2 words that are easy to confuse or mistranslate.',
context ? ('\nContext (where this text came from): ' + context) : '',
'',
'=== ENGLISH TEXT ===',
text,
'=== END ==='
    ].join("\n");
  }

  function imagePrompt(topic) {
    return [
'Create a clear, minimal educational VISUAL (diagram / mind-map / labelled illustration)',
'to help an Arabic-L1 IELTS learner remember the following. Describe it as an image you',
'generate, OR output it as clean SVG I can paste into a webpage.',
'',
'Requirements:',
'  • Bilingual labels: English term + short Arabic gloss.',
'  • Keep it uncluttered, high-contrast, mobile-friendly.',
'  • If it is a word: show syllables, mark the STRESSED syllable, and the IPA.',
'  • If it is a grammar rule: show a simple decision tree or before/after example.',
'',
'TOPIC / WORD / RULE:',
topic
    ].join("\n");
  }

  // Human-readable description of any drill item type (for the error chat).
  function describeItem(item) {
    if (item.rule === "word_stress")
      return 'Word: "' + item.word + '" — mark the syllable with PRIMARY stress. Syllables: ' +
             item.syllables.join(" · ") + '. Correct: "' + item.syllables[item.correct_index].toUpperCase() +
             '" (IPA: ' + (item.ipa || "?") + ').';
    if (item.rule === "sentence_stress")
      return 'Sentence: "' + item.words.join(" ") + '" — mark the STRESSED (content) words. Correct: ' +
             item.stressed.map(function (i) { return item.words[i]; }).join(", ") + '.';
    if (item.rule === "schwa")
      return 'Word: "' + item.word + '" — find the syllable(s) with schwa /ə/. Syllables: ' +
             item.syllables.join(" · ") + '. Correct: ' +
             item.schwa.map(function (i) { return item.syllables[i]; }).join(", ") +
             ' (IPA: ' + (item.ipa || "?") + ').';
    if (item.rule === "ipa")
      return 'IPA question (' + item.direction + '): "' + item.prompt + '" — correct answer: "' +
             item.correct_answer + '". Options were: ' +
             [item.correct_answer].concat(item.distractors || []).join(", ") + '.';
    return 'Sentence: "' + item.sentence_with_gap + '" — fill the gap. Correct answer: "' +
           item.correct_answer + '". Options were: ' +
           [item.correct_answer].concat(item.distractors || []).join(", ") + '.';
  }

  // Socratic error-discussion chat: paste into Claude, converse until mastery.
  function errorChat(item, userAnswer, userReasoning) {
    return [
'أريد منك أن تدير معي حوارًا سقراطيًا حيًا (بالعربية) حول خطأ ارتكبته في تدريب IELTS،',
'حتى أصل إلى الفهم الكامل. أنا متحدث عربية أستعد لـ IELTS أكاديمي (هدفي باند 7.0).',
'',
'=== الخطأ ===',
'القاعدة المستهدفة: ' + (window.ruleLabel ? window.ruleLabel(item.rule) : item.rule),
'السؤال: ' + describeItem(item),
'إجابتي (الخاطئة): "' + userAnswer + '"',
'تفكيري وقت الإجابة (كتبته قبل أن أعرف الحل): "' + (userReasoning || "—") + '"',
'الشرح المختصر في التطبيق: ' + (item.explanation || "—"),
'',
'=== كيف تدير الحوار (مهم) ===',
'1) ابدأ بتشخيص سوء الفهم الجذري من "تفكيري" المكتوب أعلاه — لا تفترض؛ استنتج من كلامي.',
'2) حاورني بأسلوب سقراطي: سؤال واحد قصير في كل رسالة، وانتظر إجابتي. لا تُلقِ محاضرة.',
'3) اربط الخطأ بتداخل اللغة العربية تحديدًا إن كان هذا هو السبب (قواعد العربية تختلف هنا؟ كيف؟).',
'4) عندما أقترب من الفهم، اطلب مني أن أشرح القاعدة بكلماتي.',
'5) في النهاية اختبرني بـ 3 أمثلة جديدة من نفس النمط (ليست من السؤال الأصلي)،',
'   ولا تعتبر الحوار منتهيًا إلا إذا أجبتها كلها صحيحة مع تعليل سليم.',
'6) كل الأمثلة الإنجليزية تبقى بالإنجليزية، والشرح والحوار بالعربية.',
'',
'ابدأ الآن بسؤالك التشخيصي الأول.'
    ].join("\n");
  }

  function copy(text, btn) {
    function done() {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "✓ تم النسخ";
      setTimeout(function () { btn.textContent = old; }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallback(text); done(); });
    } else { fallback(text); done(); }
  }
  function fallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  window.Prompts = {
    TAGS: TAGS,
    writing: writingPrompt,
    speakingTranscript: speakingTranscriptPrompt,
    weeklyReport: weeklyReportPrompt,
    parseJSON: parseJSON,
    normalize: { writing: normalizeWriting, speaking: normalizeSpeaking, report: normalizeReport },
    schemas: schemas,
    translate: translatePrompt,
    image: imagePrompt,
    errorChat: errorChat,
    copy: copy
  };
})();
