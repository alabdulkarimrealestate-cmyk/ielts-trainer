/* diagrams.js — offline SVG visual aids for each rule (knowledge layer). */
(function () {
  "use strict";
  var C = {
    ink:"var(--ink)", muted:"var(--muted)", good:"var(--good)", bad:"var(--bad)",
    acc:"var(--accent)", card:"var(--card)", line:"var(--line)"
  };

  var DIAGRAMS = {
    articles:
      '<svg viewBox="0 0 320 220" xmlns="http://www.w3.org/2000/svg" class="diagram">' +
      '<text x="160" y="22" text-anchor="middle" fill="'+C.ink+'" font-size="14" font-weight="700">شجرة اختيار الأداة</text>' +
      '<rect x="110" y="34" width="100" height="30" rx="8" fill="'+C.acc+'" opacity="0.15" stroke="'+C.acc+'"/>' +
      '<text x="160" y="54" text-anchor="middle" fill="'+C.ink+'" font-size="12">اسم مفرد معدود؟</text>' +
      '<line x1="130" y1="64" x2="70" y2="90" stroke="'+C.line+'"/>' +
      '<line x1="190" y1="64" x2="250" y2="90" stroke="'+C.line+'"/>' +
      '<text x="95" y="80" fill="'+C.muted+'" font-size="10">نعم</text>' +
      '<text x="215" y="80" fill="'+C.muted+'" font-size="10">لا (غير معدود/جمع)</text>' +
      '<rect x="20" y="90" width="110" height="30" rx="8" fill="'+C.card+'" stroke="'+C.line+'"/>' +
      '<text x="75" y="110" text-anchor="middle" fill="'+C.ink+'" font-size="11">محدَّد/معروف؟</text>' +
      '<rect x="195" y="90" width="110" height="30" rx="8" fill="'+C.card+'" stroke="'+C.line+'"/>' +
      '<text x="250" y="110" text-anchor="middle" fill="'+C.ink+'" font-size="11">بدون أداة (∅)</text>' +
      '<line x1="55" y1="120" x2="40" y2="150" stroke="'+C.line+'"/>' +
      '<line x1="95" y1="120" x2="110" y2="150" stroke="'+C.line+'"/>' +
      '<rect x="10" y="150" width="70" height="28" rx="8" fill="'+C.good+'" opacity="0.15" stroke="'+C.good+'"/>' +
      '<text x="45" y="169" text-anchor="middle" fill="'+C.ink+'" font-size="11">the</text>' +
      '<rect x="90" y="150" width="90" height="28" rx="8" fill="'+C.good+'" opacity="0.15" stroke="'+C.good+'"/>' +
      '<text x="135" y="169" text-anchor="middle" fill="'+C.ink+'" font-size="11">a / an</text>' +
      '<text x="160" y="200" text-anchor="middle" fill="'+C.muted+'" font-size="10">of + اسم مُحدِّد ⟵ the (capital of France)</text>' +
      '<text x="160" y="214" text-anchor="middle" fill="'+C.bad+'" font-size="10">advice غير معدود ⟵ لا an ولا جمع</text>' +
      '</svg>',

    word_stress:
      '<svg viewBox="0 0 320 150" xmlns="http://www.w3.org/2000/svg" class="diagram">' +
      '<text x="160" y="20" text-anchor="middle" fill="'+C.ink+'" font-size="14" font-weight="700">النبر يغيّر الكلمة</text>' +
      '<circle cx="60" cy="70" r="20" fill="'+C.acc+'"/><circle cx="110" cy="80" r="11" fill="'+C.line+'"/><circle cx="150" cy="80" r="11" fill="'+C.line+'"/>' +
      '<text x="105" y="118" text-anchor="middle" fill="'+C.ink+'" font-size="12" class="ltr">PHO·to·graph</text>' +
      '<circle cx="205" cy="80" r="11" fill="'+C.line+'"/><circle cx="245" cy="70" r="20" fill="'+C.acc+'"/><circle cx="290" cy="80" r="11" fill="'+C.line+'"/>' +
      '<text x="250" y="118" text-anchor="middle" fill="'+C.ink+'" font-size="12" class="ltr">pho·TOG·ra·phy</text>' +
      '<text x="160" y="142" text-anchor="middle" fill="'+C.muted+'" font-size="10">الدائرة الكبيرة = المقطع المنبور (أعلى + أطول + أوضح)</text>' +
      '</svg>',

    sentence_stress:
      '<svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg" class="diagram">' +
      '<text x="160" y="20" text-anchor="middle" fill="'+C.ink+'" font-size="14" font-weight="700">إيقاع الجملة (stress-timed)</text>' +
      '<text x="20" y="70" fill="'+C.muted+'" font-size="12" class="ltr">I</text>' +
      '<text x="45" y="60" fill="'+C.ink+'" font-size="16" font-weight="700" class="ltr">NEED</text>' +
      '<text x="110" y="70" fill="'+C.muted+'" font-size="12" class="ltr">the</text>' +
      '<text x="140" y="58" fill="'+C.ink+'" font-size="16" font-weight="700" class="ltr">RE·port</text>' +
      '<text x="215" y="70" fill="'+C.muted+'" font-size="12" class="ltr">by</text>' +
      '<text x="245" y="56" fill="'+C.ink+'" font-size="16" font-weight="700" class="ltr">MON·day</text>' +
      '<path d="M20 80 Q45 55 70 80 T120 82 Q145 52 175 80 T235 80 Q265 50 300 80" fill="none" stroke="'+C.acc+'" stroke-width="2"/>' +
      '<text x="160" y="112" text-anchor="middle" fill="'+C.muted+'" font-size="10">كلمات المحتوى تعلو، الوظيفية تُخفَّف — لا تنطق كل مقطع بنفس القوة</text>' +
      '<text x="160" y="126" text-anchor="middle" fill="'+C.bad+'" font-size="10">خطأ العربية: syllable-timed (كل مقطع متساوٍ)</text>' +
      '</svg>',

    schwa:
      '<svg viewBox="0 0 320 140" xmlns="http://www.w3.org/2000/svg" class="diagram">' +
      '<text x="160" y="20" text-anchor="middle" fill="'+C.ink+'" font-size="14" font-weight="700">الشوا /ə/ = الصوت المختزل</text>' +
      '<text x="160" y="60" text-anchor="middle" fill="'+C.ink+'" font-size="22" class="ltr">b<tspan fill="'+C.acc+'">ə</tspan>·NA·N<tspan fill="'+C.acc+'">ə</tspan></text>' +
      '<text x="160" y="86" text-anchor="middle" fill="'+C.muted+'" font-size="12" class="ltr">/bəˈnɑː.nə/  →  banana</text>' +
      '<text x="160" y="116" text-anchor="middle" fill="'+C.muted+'" font-size="10">المقاطع غير المنبورة تنهار إلى /ə/ قصيرة غامضة</text>' +
      '<text x="160" y="132" text-anchor="middle" fill="'+C.good+'" font-size="10">أشيع صوت في الإنجليزية — إتقانه يكسر الرتابة</text>' +
      '</svg>'
  };

  window.Diagrams = {
    has: function (ruleId) { return !!DIAGRAMS[ruleId]; },
    get: function (ruleId) { return DIAGRAMS[ruleId] || ""; },
    all: function () { return DIAGRAMS; }
  };
})();
