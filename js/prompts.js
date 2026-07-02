/* prompts.js — zero-cost "generate a prompt to paste into Claude" builders.
   The app NEVER calls an AI API. It only produces text for the user to paste. */
(function () {
  "use strict";

  function writingPrompt(essay) {
    return [
'You are an experienced IELTS Academic examiner. Evaluate the essay/paragraph below.',
'',
'CANDIDATE PROFILE: Arabic-L1 speaker, target band 7.0, background in accounting/CMA.',
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
'2) Tag EVERY grammar/vocabulary error by which of these 4 watchlist patterns it hits',
'   (label each error explicitly):',
'   [ARTICLES]         a/an/the/zero-article misuse (incl. "an advice", "I have car")',
'   [VERB-FORM]        wrong form after preposition/relative pronoun (e.g. "interested in to set")',
'   [COPULA-AGREEMENT] missing is/are, or "the company have" instead of "has"',
'   [MEANING-REVERSAL] confusable pair used with reversed meaning (e.g. employer/employee)',
'   For any error outside these 4, tag it [OTHER].',
'',
'3) Diagnostic integrity check: flag any CMA/finance-topic bias that may be INFLATING the',
'   Lexical Resource score (i.e. strong vocabulary that is only strong because it is',
'   finance jargon the candidate already knows, not transferable academic range).',
'',
'4) Give 3 concrete, prioritised fixes the candidate should focus on next.',
'',
'Format: scores first as a table, then the tagged error list, then the integrity note,',
'then the 3 fixes. Be strict and specific — quote the exact words for each error.'
    ].join("\n");
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
    copy: copy
  };
})();
