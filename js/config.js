/* config.js — central rule registry + item aggregation. No framework. */
(function () {
  "use strict";

  // Each rule is tracked INDEPENDENTLY. Never bundle scores across rules.
  window.RULES = [
    // Grammar (the core 4 target error patterns)
    { id:"articles",         label:"الأدوات (a/an/the)",     group:"القواعد",   short:"الأدوات" },
    { id:"verbform",         label:"صيغة الفعل",             group:"القواعد",   short:"الفعل" },
    { id:"copula",           label:"الرابط والتطابق",        group:"القواعد",   short:"الرابط" },
    { id:"meaning_reversal", label:"مفردات معكوسة المعنى",   group:"القواعد",   short:"مفردات" },
    // Phonetic knowledge (text-only)
    { id:"word_stress",      label:"نبر الكلمة",             group:"الصوتيات",  short:"نبر الكلمة" },
    { id:"sentence_stress",  label:"نبر الجملة",             group:"الصوتيات",  short:"نبر الجملة" },
    { id:"ipa",              label:"رموز IPA",               group:"الصوتيات",  short:"IPA" },
    { id:"schwa",            label:"الشوا (schwa)",          group:"الصوتيات",  short:"schwa" },
    // Lexical resource
    { id:"collocations",     label:"المتلازمات اللفظية",     group:"المفردات",  short:"متلازمات" }
  ];

  window.RULE_MAP = {};
  window.RULES.forEach(function (r) { window.RULE_MAP[r.id] = r; });
  window.ruleLabel = function (id) { return (window.RULE_MAP[id] || {}).label || id; };

  // Gather every drill item from the data banks into one flat list.
  window.ALL_ITEMS = [].concat(
    window.BANK_GRAMMAR      || [],
    window.BANK_VOCAB        || [],
    window.BANK_WORD_STRESS  || [],
    window.BANK_SENTENCE_STRESS || [],
    window.BANK_IPA          || [],
    window.BANK_SCHWA        || [],
    window.BANK_COLLOCATIONS || []
  );

  // Default drill mode by rule when an item doesn't specify one.
  window.itemMode = function (item) {
    if (item.mode) return item.mode;
    return "mc"; // grammar / vocab / collocations are multiple-choice
  };

  window.itemsForRule = function (ruleId) {
    return window.ALL_ITEMS.filter(function (i) { return i.rule === ruleId; });
  };
})();
