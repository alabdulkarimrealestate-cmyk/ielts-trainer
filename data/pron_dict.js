/* ============================================================================
 * pron_dict.js  —  Personal Pronunciation Dictionary (5e, flashcard mode)
 * ----------------------------------------------------------------------------
 * USER-EXTENDABLE. Add any word you keep mispronouncing.
 *   {
 *     word, ipa, arabic_approximation, stress_pattern, finance_context
 *   }
 * arabic_approximation: a rough Arabic spelling to anchor the sound (NOT audio).
 * stress_pattern: mark the stressed syllable in CAPS, e.g. "de-PRE-ci-A-tion".
 * ==========================================================================*/
window.PRON_DICT = [
  { word:"depreciation", ipa:"/dɪˌpriː.ʃiˈeɪ.ʃən/", arabic_approximation:"دِبْـريـشِيـإيْـشِن", stress_pattern:"de-pre-ci-A-tion", finance_context:"Annual depreciation reduces the asset's book value." },
  { word:"asset",        ipa:"/ˈæs.et/",            arabic_approximation:"آسِـت",            stress_pattern:"AS-set",            finance_context:"Cash is a current asset on the balance sheet." },
  { word:"liability",    ipa:"/ˌlaɪ.əˈbɪl.ə.ti/",   arabic_approximation:"لايـَبِـلِـتي",     stress_pattern:"li-a-BIL-i-ty",     finance_context:"A loan is a long-term liability." },
  { word:"revenue",      ipa:"/ˈrev.ən.juː/",       arabic_approximation:"رِڤِـنْـيو",        stress_pattern:"REV-e-nue",         finance_context:"Total revenue rose by 12% this year." },
  { word:"accrual",      ipa:"/əˈkruː.əl/",         arabic_approximation:"أكـرووَل",         stress_pattern:"ac-CRU-al",         finance_context:"Under the accrual basis, revenue is recorded when earned." },
  { word:"equity",       ipa:"/ˈek.wɪ.ti/",         arabic_approximation:"إكـوِتي",          stress_pattern:"EQ-ui-ty",          finance_context:"Shareholders' equity equals assets minus liabilities." },
  { word:"budget",       ipa:"/ˈbʌdʒ.ɪt/",          arabic_approximation:"بَـدجِـت",         stress_pattern:"BUDG-et",           finance_context:"We exceeded the marketing budget last quarter." },
  { word:"variance",     ipa:"/ˈveə.ri.əns/",       arabic_approximation:"ڤيـريـَنس",        stress_pattern:"VA-ri-ance",        finance_context:"The cost variance was unfavourable this month." },
  { word:"audit",        ipa:"/ˈɔː.dɪt/",           arabic_approximation:"أوْدِت",           stress_pattern:"AU-dit",            finance_context:"The external audit begins next week." },
  { word:"invoice",      ipa:"/ˈɪn.vɔɪs/",          arabic_approximation:"إنـڤويْس",         stress_pattern:"IN-voice",          finance_context:"Please issue the invoice to the client today." },
  { word:"receivable",   ipa:"/rɪˈsiː.və.bəl/",     arabic_approximation:"رِسيـڤَـبِل",      stress_pattern:"re-CEIV-a-ble",     finance_context:"Accounts receivable are collected within 30 days." },
  { word:"leverage",     ipa:"/ˈliː.vər.ɪdʒ/",      arabic_approximation:"ليـڤِـرِدج",       stress_pattern:"LEV-er-age",        finance_context:"High financial leverage increases risk." },
  { word:"amortisation", ipa:"/əˌmɔː.taɪˈzeɪ.ʃən/", arabic_approximation:"أمورتايـزيْـشِن",  stress_pattern:"a-mor-ti-SA-tion",  finance_context:"Amortisation spreads an intangible's cost over time." },
  { word:"threshold",    ipa:"/ˈθreʃ.həʊld/",       arabic_approximation:"ثـرِشْـهولد",      stress_pattern:"THRESH-old",        finance_context:"Materiality threshold determines what auditors report." },
  { word:"ratio",        ipa:"/ˈreɪ.ʃi.əʊ/",        arabic_approximation:"ريْـشيـو",         stress_pattern:"RA-ti-o",           finance_context:"The current ratio measures short-term liquidity." }
];
