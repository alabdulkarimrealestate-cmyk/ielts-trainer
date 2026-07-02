/* prompts.js — zero-cost "generate a prompt to paste into Claude" builders.
   The app NEVER calls an AI API. It only produces text for the user to paste. */
(function () {
  "use strict";

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
    // dedupe
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

  function writingPrompt(essay, taskPrompt) {
    var pairs = watchlistPairs();
    var head = [
'You are an experienced IELTS Academic examiner. Evaluate the essay/paragraph below.',
'',
'CANDIDATE PROFILE: Arabic-L1 speaker, target band 7.0, background in accounting/CMA.',
'CURRENT ROADMAP STAGE: ' + currentStageLine() + '.'
    ];
    if (taskPrompt) {
      head.push('THE TASK 2 QUESTION WAS:');
      head.push('"' + taskPrompt + '"');
      head.push('Judge Task Response against THIS question.');
    }
    return head.concat([
'',
'=== TEXT TO EVALUATE ===',
essay,
'=== END OF TEXT ===',
'',
'Do ALL of the following:',
'',
'1) Give a band score (0–9, half-bands allowed) for EACH of the 4 IELTS criteria,',
'   plus an OVERALL band:',
'   • Task Response',
'   • Coherence & Cohesion',
'   • Lexical Resource',
'   • Grammatical Range & Accuracy',
'',
'2) Tag EVERY grammar/vocabulary error by which of these watchlist patterns it hits',
'   (label each error explicitly):',
'   [ARTICLES]         a/an/the/zero-article misuse (incl. "an advice", "I have car")',
'   [VERB-FORM]        wrong form after preposition/relative pronoun (e.g. "interested in to set")',
'   [COPULA-AGREEMENT] missing is/are, or "the company have" instead of "has"',
'   [MEANING-REVERSAL] confusable pair used with reversed meaning.',
'                      Current watchlist: ' + (pairs.length ? pairs.join(", ") : "employer/employee"),
'   [CONNECTORS]       because/although/if/when — comma placement, incomplete clauses',
'   For any error outside these, tag it [OTHER].',
'',
'3) Diagnostic integrity check: flag any CMA/finance-topic bias that may be INFLATING the',
'   Lexical Resource score (i.e. strong vocabulary that is only strong because it is',
'   finance jargon the candidate already knows, not transferable academic range).',
'',
'4) Give 3 concrete, prioritised fixes the candidate should focus on next.',
'',
'Format: scores first as a table, then the tagged error list, then the integrity note,',
'then the 3 fixes. Be strict and specific — quote the exact words for each error.'
    ]).join("\n");
  }

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
    writing: writingPrompt,
    translate: translatePrompt,
    image: imagePrompt,
    errorChat: errorChat,
    copy: copy
  };
})();
