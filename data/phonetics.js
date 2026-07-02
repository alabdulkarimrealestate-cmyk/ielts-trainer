/* ============================================================================
 * phonetics.js  —  Phonetic-KNOWLEDGE drills (text-only, NO audio)
 * ----------------------------------------------------------------------------
 * Attacks the notation/cognitive side of prosody: stress, IPA, schwa.
 * NO microphone, NO audio, NO pronunciation scoring — that is ELSA's job.
 *
 * Four independently-tracked rules:
 *   word_stress      pick the syllable with PRIMARY stress   (mode: "mc")
 *   sentence_stress  toggle the stressed (content) words      (mode: "multi")
 *   ipa              map symbol <-> example word              (mode: "mc")
 *   schwa            pick the syllable holding the /ə/ schwa   (mode: "multi")
 *
 * Add items freely, keep the shape shown per section.
 * ==========================================================================*/

/* ---- 5a. WORD STRESS ---------------------------------------------------- */
/* syllables: lowercase parts. correct_index: which one takes PRIMARY stress. */
window.BANK_WORD_STRESS = [
  { id:"ws-1",  rule:"word_stress", mode:"mc", word:"photograph",   syllables:["pho","to","graph"],        correct_index:0, ipa:"/ˈfəʊ.tə.ɡrɑːf/", explanation:"PHO·to·graph ⇒ النبر على المقطع الأول." },
  { id:"ws-2",  rule:"word_stress", mode:"mc", word:"photography",  syllables:["pho","tog","ra","phy"],     correct_index:1, ipa:"/fəˈtɒɡ.rə.fi/", explanation:"pho·TOG·ra·phy ⇒ النبر ينتقل للمقطع الثاني عند إضافة -y." },
  { id:"ws-3",  rule:"word_stress", mode:"mc", word:"economy",      syllables:["e","co","no","my"],         correct_index:1, ipa:"/ɪˈkɒn.ə.mi/", explanation:"e·CON·o·my ⇒ النبر على الثاني." },
  { id:"ws-4",  rule:"word_stress", mode:"mc", word:"economic",     syllables:["e","co","no","mic"],        correct_index:2, ipa:"/ˌiː.kəˈnɒm.ɪk/", explanation:"e·co·NOM·ic ⇒ النبر على الثالث (قبل -ic)." },
  { id:"ws-5",  rule:"word_stress", mode:"mc", word:"finance",      syllables:["fi","nance"],               correct_index:0, ipa:"/ˈfaɪ.næns/", explanation:"FI·nance (اسم) ⇒ النبر على الأول." },
  { id:"ws-6",  rule:"word_stress", mode:"mc", word:"financial",    syllables:["fi","nan","cial"],          correct_index:1, ipa:"/faɪˈnæn.ʃəl/", explanation:"fi·NAN·cial ⇒ النبر على الثاني." },
  { id:"ws-7",  rule:"word_stress", mode:"mc", word:"accountant",   syllables:["ac","coun","tant"],         correct_index:1, ipa:"/əˈkaʊn.tənt/", explanation:"ac·COUN·tant ⇒ النبر على الثاني." },
  { id:"ws-8",  rule:"word_stress", mode:"mc", word:"management",   syllables:["man","age","ment"],         correct_index:0, ipa:"/ˈmæn.ɪdʒ.mənt/", explanation:"MAN·age·ment ⇒ النبر على الأول." },
  { id:"ws-9",  rule:"word_stress", mode:"mc", word:"development",  syllables:["de","vel","op","ment"],     correct_index:1, ipa:"/dɪˈvel.əp.mənt/", explanation:"de·VEL·op·ment ⇒ النبر على الثاني." },
  { id:"ws-10", rule:"word_stress", mode:"mc", word:"investment",   syllables:["in","vest","ment"],         correct_index:1, ipa:"/ɪnˈvest.mənt/", explanation:"in·VEST·ment ⇒ النبر على الثاني." },
  { id:"ws-11", rule:"word_stress", mode:"mc", word:"analysis",     syllables:["a","nal","y","sis"],        correct_index:1, ipa:"/əˈnæl.ə.sɪs/", explanation:"a·NAL·y·sis ⇒ النبر على الثاني." },
  { id:"ws-12", rule:"word_stress", mode:"mc", word:"analyse",      syllables:["an","a","lyse"],            correct_index:0, ipa:"/ˈæn.ə.laɪz/", explanation:"AN·a·lyse (الفعل) ⇒ النبر على الأول." },
  { id:"ws-13", rule:"word_stress", mode:"mc", word:"important",    syllables:["im","por","tant"],          correct_index:1, ipa:"/ɪmˈpɔː.tənt/", explanation:"im·POR·tant ⇒ النبر على الثاني." },
  { id:"ws-14", rule:"word_stress", mode:"mc", word:"available",    syllables:["a","vail","a","ble"],       correct_index:1, ipa:"/əˈveɪ.lə.bəl/", explanation:"a·VAIL·a·ble ⇒ النبر على الثاني." },
  { id:"ws-15", rule:"word_stress", mode:"mc", word:"opportunity",  syllables:["op","por","tu","ni","ty"],  correct_index:2, ipa:"/ˌɒp.əˈtʃuː.nə.ti/", explanation:"op·por·TU·ni·ty ⇒ النبر على الثالث." },
  { id:"ws-16", rule:"word_stress", mode:"mc", word:"environment",  syllables:["en","vi","ron","ment"],     correct_index:1, ipa:"/ɪnˈvaɪ.rən.mənt/", explanation:"en·VI·ron·ment ⇒ النبر على الثاني." },
  { id:"ws-17", rule:"word_stress", mode:"mc", word:"technology",   syllables:["tech","no","lo","gy"],      correct_index:1, ipa:"/tekˈnɒl.ə.dʒi/", explanation:"tech·NOL·o·gy ⇒ النبر على الثاني." },
  { id:"ws-18", rule:"word_stress", mode:"mc", word:"percentage",   syllables:["per","cent","age"],         correct_index:1, ipa:"/pəˈsen.tɪdʒ/", explanation:"per·CENT·age ⇒ النبر على الثاني." },
  { id:"ws-19", rule:"word_stress", mode:"mc", word:"statistics",   syllables:["sta","tis","tics"],         correct_index:1, ipa:"/stəˈtɪs.tɪks/", explanation:"sta·TIS·tics ⇒ النبر على الثاني." },
  { id:"ws-20", rule:"word_stress", mode:"mc", word:"advantage",    syllables:["ad","van","tage"],          correct_index:1, ipa:"/ədˈvɑːn.tɪdʒ/", explanation:"ad·VAN·tage ⇒ النبر على الثاني." },
  { id:"ws-21", rule:"word_stress", mode:"mc", word:"comfortable",  syllables:["com","fort","a","ble"],     correct_index:0, ipa:"/ˈkʌmf.tə.bəl/", explanation:"COM·fort·a·ble ⇒ النبر على الأول (والكلمة تُختصر لـ 3 مقاطع)." },
  { id:"ws-22", rule:"word_stress", mode:"mc", word:"necessary",    syllables:["nec","es","sa","ry"],       correct_index:0, ipa:"/ˈnes.ə.sər.i/", explanation:"NEC·es·sa·ry ⇒ النبر على الأول." },
  { id:"ws-23", rule:"word_stress", mode:"mc", word:"depreciation", syllables:["de","pre","ci","a","tion"], correct_index:3, ipa:"/dɪˌpriː.ʃiˈeɪ.ʃən/", explanation:"de·pre·ci·A·tion ⇒ كلمات -tion: النبر على المقطع قبل -tion." },
  { id:"ws-24", rule:"word_stress", mode:"mc", word:"liability",    syllables:["li","a","bil","i","ty"],    correct_index:2, ipa:"/ˌlaɪ.əˈbɪl.ə.ti/", explanation:"li·a·BIL·i·ty ⇒ النبر على الثالث." }
];

/* ---- 5b. SENTENCE STRESS ------------------------------------------------ */
/* words: the sentence split into words. stressed: indices of STRESSED words
   (content words: nouns, main verbs, adjectives, adverbs, negatives). */
window.BANK_SENTENCE_STRESS = [
  { id:"ss-1", rule:"sentence_stress", mode:"multi", words:["I","need","the","report","by","Monday"], stressed:[1,3,5], explanation:"الكلمات المحتوى (need, report, Monday) تُنبَر؛ الوظيفية (I, the, by) تُخفَّف." },
  { id:"ss-2", rule:"sentence_stress", mode:"multi", words:["She","works","in","a","big","bank"], stressed:[1,4,5], explanation:"works, big, bank محتوى ⇒ نبر. she/in/a وظيفية ⇒ خفيفة." },
  { id:"ss-3", rule:"sentence_stress", mode:"multi", words:["We","are","going","to","the","office"], stressed:[2,5], explanation:"going و office فقط تُنبَران؛ الباقي وظيفي." },
  { id:"ss-4", rule:"sentence_stress", mode:"multi", words:["The","profits","increased","last","year"], stressed:[1,2,3,4], explanation:"profits, increased, last, year كلها محتوى ⇒ نبر. the وظيفية." },
  { id:"ss-5", rule:"sentence_stress", mode:"multi", words:["Can","you","send","me","the","invoice"], stressed:[2,5], explanation:"send و invoice تُنبَران؛ can/you/me/the خفيفة." },
  { id:"ss-6", rule:"sentence_stress", mode:"multi", words:["I","don't","agree","with","the","plan"], stressed:[1,2,5], explanation:"النفي don't يُنبَر دائمًا + agree + plan. النفي مهم للمعنى." },
  { id:"ss-7", rule:"sentence_stress", mode:"multi", words:["He","has","a","meeting","this","afternoon"], stressed:[3,4,5], explanation:"meeting, this, afternoon محتوى ⇒ نبر." },
  { id:"ss-8", rule:"sentence_stress", mode:"multi", words:["Our","company","made","a","good","profit"], stressed:[1,2,4,5], explanation:"company, made, good, profit محتوى ⇒ نبر. our/a وظيفية." },
  { id:"ss-9", rule:"sentence_stress", mode:"multi", words:["Please","check","the","numbers","carefully"], stressed:[1,3,4], explanation:"check, numbers, carefully محتوى ⇒ نبر." },
  { id:"ss-10", rule:"sentence_stress", mode:"multi", words:["They","will","finish","the","audit","soon"], stressed:[2,4,5], explanation:"finish, audit, soon محتوى. will/they/the خفيفة." },
  { id:"ss-11", rule:"sentence_stress", mode:"multi", words:["I","think","it's","a","great","idea"], stressed:[1,4,5], explanation:"think, great, idea محتوى ⇒ نبر." },
  { id:"ss-12", rule:"sentence_stress", mode:"multi", words:["The","market","is","growing","very","fast"], stressed:[1,3,4,5], explanation:"market, growing, very, fast محتوى ⇒ نبر." },
  { id:"ss-13", rule:"sentence_stress", mode:"multi", words:["We","should","reduce","our","costs"], stressed:[2,4], explanation:"reduce و costs تُنبَران؛ we/should/our خفيفة." },
  { id:"ss-14", rule:"sentence_stress", mode:"multi", words:["What","time","does","the","train","leave"], stressed:[0,1,4,5], explanation:"في السؤال: what, time, train, leave محتوى ⇒ نبر." },
  { id:"ss-15", rule:"sentence_stress", mode:"multi", words:["I","have","never","seen","such","results"], stressed:[2,3,5], explanation:"never (نفي) + seen + results تُنبَر بقوة." },
  { id:"ss-16", rule:"sentence_stress", mode:"multi", words:["The","new","system","saves","a","lot","of","time"], stressed:[1,2,3,5,7], explanation:"new, system, saves, lot, time محتوى ⇒ نبر." },
  { id:"ss-17", rule:"sentence_stress", mode:"multi", words:["She","is","the","best","accountant","here"], stressed:[3,4,5], explanation:"best, accountant, here محتوى ⇒ نبر." },
  { id:"ss-18", rule:"sentence_stress", mode:"multi", words:["Could","you","explain","the","difference"], stressed:[2,4], explanation:"explain و difference تُنبَران؛ could/you/the خفيفة." },
  { id:"ss-19", rule:"sentence_stress", mode:"multi", words:["I","was","working","when","you","called"], stressed:[2,5], explanation:"working و called تُنبَران؛ باقي الكلمات وظيفية." },
  { id:"ss-20", rule:"sentence_stress", mode:"multi", words:["This","is","exactly","what","I","wanted"], stressed:[2,5], explanation:"exactly و wanted تُنبَران بقوة لإيصال المعنى." },
  { id:"ss-21", rule:"sentence_stress", mode:"multi", words:["The","cash","flow","looks","healthy","this","quarter"], stressed:[1,2,3,4,5,6], explanation:"cash, flow, looks, healthy, this, quarter كلها محتوى ⇒ نبر." },
  { id:"ss-22", rule:"sentence_stress", mode:"multi", words:["I","can't","find","the","original","file"], stressed:[1,2,4,5], explanation:"can't (نفي) + find + original + file تُنبَر." }
];

/* ---- 5c. IPA RECOGNITION ------------------------------------------------ */
/* direction: "symbol_to_word" (given /iː/, pick the word) or the reverse. */
window.BANK_IPA = [
  { id:"ipa-1",  rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/iː/", correct_answer:"sheep", distractors:["ship","shape","shop"], explanation:"/iː/ = ياء طويلة كما في sheep. قارنها بـ /ɪ/ القصيرة في ship." },
  { id:"ipa-2",  rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/ɪ/", correct_answer:"ship", distractors:["sheep","sheet","seat"], explanation:"/ɪ/ = ياء قصيرة مرتخية كما في ship." },
  { id:"ipa-3",  rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"cat", correct_answer:"/æ/", distractors:["/ɑː/","/ʌ/","/e/"], explanation:"a في cat = /æ/ (فتحة أمامية عريضة)." },
  { id:"ipa-4",  rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"car", correct_answer:"/ɑː/", distractors:["/æ/","/ʌ/","/ɔː/"], explanation:"ar في car = /ɑː/ (فتحة خلفية طويلة)." },
  { id:"ipa-5",  rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"cup", correct_answer:"/ʌ/", distractors:["/æ/","/ɑː/","/ʊ/"], explanation:"u في cup = /ʌ/ (صوت وسطي قصير)." },
  { id:"ipa-6",  rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/ʊ/", correct_answer:"book", distractors:["boot","boat","bought"], explanation:"/ʊ/ = واو قصيرة كما في book. قارنها بـ /uː/ الطويلة في boot." },
  { id:"ipa-7",  rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/uː/", correct_answer:"boot", distractors:["book","but","boat"], explanation:"/uː/ = واو طويلة كما في boot." },
  { id:"ipa-8",  rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"thin", correct_answer:"/θ/", distractors:["/ð/","/s/","/t/"], explanation:"th في thin = /θ/ (مهموس، اللسان بين الأسنان). ليست /s/." },
  { id:"ipa-9",  rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"this", correct_answer:"/ð/", distractors:["/θ/","/z/","/d/"], explanation:"th في this = /ð/ (مجهور). قارنها بـ /θ/ المهموسة في thin." },
  { id:"ipa-10", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"pleasure", correct_answer:"/ʒ/", distractors:["/ʃ/","/dʒ/","/z/"], explanation:"s في pleasure = /ʒ/ (مجهور). قارنها بـ /ʃ/ في ship." },
  { id:"ipa-11", rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/ʃ/", correct_answer:"ship", distractors:["chip","sip","jeep"], explanation:"/ʃ/ = 'ش' كما في ship." },
  { id:"ipa-12", rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/tʃ/", correct_answer:"chip", distractors:["ship","tip","jeep"], explanation:"/tʃ/ = 'تش' كما في chip." },
  { id:"ipa-13", rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/dʒ/", correct_answer:"jeep", distractors:["cheap","sheep","yield"], explanation:"/dʒ/ = 'ج' كما في jeep." },
  { id:"ipa-14", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"bird", correct_answer:"/ɜː/", distractors:["/ə/","/ɑː/","/ɔː/"], explanation:"ir في bird = /ɜː/ (صوت وسطي طويل)." },
  { id:"ipa-15", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"more", correct_answer:"/ɔː/", distractors:["/ɒ/","/ɜː/","/əʊ/"], explanation:"ore في more = /ɔː/ (صوت خلفي مدوّر طويل)." },
  { id:"ipa-16", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"hot", correct_answer:"/ɒ/", distractors:["/ɔː/","/ʌ/","/əʊ/"], explanation:"o في hot = /ɒ/ (فتحة خلفية قصيرة)." },
  { id:"ipa-17", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"day", correct_answer:"/eɪ/", distractors:["/aɪ/","/e/","/aʊ/"], explanation:"ay في day = /eɪ/ (صوت مركّب)." },
  { id:"ipa-18", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"buy", correct_answer:"/aɪ/", distractors:["/eɪ/","/ɔɪ/","/aʊ/"], explanation:"uy في buy = /aɪ/ (صوت مركّب)." },
  { id:"ipa-19", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"go", correct_answer:"/əʊ/", distractors:["/ɔː/","/aʊ/","/ɒ/"], explanation:"o في go = /əʊ/ (بريطاني). ليست /oʊ/ فقط." },
  { id:"ipa-20", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"now", correct_answer:"/aʊ/", distractors:["/əʊ/","/aɪ/","/ɔː/"], explanation:"ow في now = /aʊ/ (صوت مركّب)." },
  { id:"ipa-21", rule:"ipa", mode:"mc", direction:"symbol_to_word", prompt:"/ə/", correct_answer:"about", distractors:["cat","car","cup"], explanation:"/ə/ = schwa، الصوت المختزل في a من about." },
  { id:"ipa-22", rule:"ipa", mode:"mc", direction:"word_to_symbol", prompt:"van", correct_answer:"/v/", distractors:["/f/","/w/","/b/"], explanation:"v في van = /v/ (احتكاكي شفوي أسناني مجهور). ليست /f/ ولا /w/." }
];

/* ---- 5d. SCHWA SPOTTING ------------------------------------------------- */
/* syllables: lowercase parts. schwa: indices of syllables holding /ə/. */
window.BANK_SCHWA = [
  { id:"sc-1",  rule:"schwa", mode:"multi", word:"about",     syllables:["a","bout"],           schwa:[0], ipa:"/əˈbaʊt/", explanation:"a غير المنبورة تُختزل إلى schwa /ə/: /əˈbaʊt/." },
  { id:"sc-2",  rule:"schwa", mode:"multi", word:"banana",    syllables:["ba","na","na"],       schwa:[0,2], ipa:"/bəˈnɑː.nə/", explanation:"المقطعان غير المنبورين (الأول والأخير) = schwa: /bəˈnɑːnə/." },
  { id:"sc-3",  rule:"schwa", mode:"multi", word:"computer",  syllables:["com","pu","ter"],     schwa:[0,2], ipa:"/kəmˈpjuː.tər/", explanation:"com و ter مختزلان: /kəmˈpjuːtər/." },
  { id:"sc-4",  rule:"schwa", mode:"multi", word:"problem",   syllables:["prob","lem"],         schwa:[1], ipa:"/ˈprɒb.ləm/", explanation:"lem غير منبورة ⇒ schwa: /ˈprɒbləm/." },
  { id:"sc-5",  rule:"schwa", mode:"multi", word:"support",   syllables:["sup","port"],         schwa:[0], ipa:"/səˈpɔːt/", explanation:"sup غير منبورة ⇒ schwa: /səˈpɔːt/." },
  { id:"sc-6",  rule:"schwa", mode:"multi", word:"customer",  syllables:["cus","to","mer"],     schwa:[1,2], ipa:"/ˈkʌs.tə.mər/", explanation:"to و mer مختزلان: /ˈkʌstəmər/." },
  { id:"sc-7",  rule:"schwa", mode:"multi", word:"account",   syllables:["ac","count"],         schwa:[0], ipa:"/əˈkaʊnt/", explanation:"ac غير منبورة ⇒ schwa: /əˈkaʊnt/." },
  { id:"sc-8",  rule:"schwa", mode:"multi", word:"salary",    syllables:["sa","la","ry"],       schwa:[1], ipa:"/ˈsæl.ər.i/", explanation:"la غير منبورة ⇒ schwa: /ˈsælər.i/." },
  { id:"sc-9",  rule:"schwa", mode:"multi", word:"performance",syllables:["per","for","mance"], schwa:[0,2], ipa:"/pəˈfɔː.məns/", explanation:"per و mance مختزلان: /pəˈfɔːməns/." },
  { id:"sc-10", rule:"schwa", mode:"multi", word:"machine",   syllables:["ma","chine"],         schwa:[0], ipa:"/məˈʃiːn/", explanation:"ma غير منبورة ⇒ schwa: /məˈʃiːn/." },
  { id:"sc-11", rule:"schwa", mode:"multi", word:"agenda",    syllables:["a","gen","da"],       schwa:[0,2], ipa:"/əˈdʒen.də/", explanation:"a الأولى والأخيرة = schwa: /əˈdʒendə/." },
  { id:"sc-12", rule:"schwa", mode:"multi", word:"category",  syllables:["cat","e","go","ry"],  schwa:[1], ipa:"/ˈkæt.ə.ɡər.i/", explanation:"e غير المنبورة = schwa: /ˈkætəɡər.i/." },
  { id:"sc-13", rule:"schwa", mode:"multi", word:"purpose",   syllables:["pur","pose"],         schwa:[1], ipa:"/ˈpɜː.pəs/", explanation:"pose غير منبورة تُختزل ⇒ schwa: /ˈpɜːpəs/." },
  { id:"sc-14", rule:"schwa", mode:"multi", word:"correct",   syllables:["cor","rect"],         schwa:[0], ipa:"/kəˈrekt/", explanation:"cor غير منبورة ⇒ schwa: /kəˈrekt/." },
  { id:"sc-15", rule:"schwa", mode:"multi", word:"reason",    syllables:["rea","son"],          schwa:[1], ipa:"/ˈriː.zən/", explanation:"son غير منبورة ⇒ schwa: /ˈriːzən/." },
  { id:"sc-16", rule:"schwa", mode:"multi", word:"balance",   syllables:["bal","ance"],         schwa:[1], ipa:"/ˈbæl.əns/", explanation:"ance = schwa: /ˈbæləns/." },
  { id:"sc-17", rule:"schwa", mode:"multi", word:"decision",  syllables:["de","ci","sion"],     schwa:[0,2], ipa:"/dɪˈsɪʒ.ən/", explanation:"sion = schwa: /dɪˈsɪʒən/ (de قريبة من /ɪ/)." },
  { id:"sc-18", rule:"schwa", mode:"multi", word:"achievement", syllables:["a","chieve","ment"], schwa:[0,2], ipa:"/əˈtʃiːv.mənt/", explanation:"achievement: a و ment = schwa: /əˈtʃiːvmənt/." },
  { id:"sc-19", rule:"schwa", mode:"multi", word:"benefit",   syllables:["ben","e","fit"],      schwa:[1], ipa:"/ˈben.ɪ.fɪt/", explanation:"المقطع الأوسط مختزل قرب schwa: /ˈbenɪfɪt/." },
  { id:"sc-20", rule:"schwa", mode:"multi", word:"forward",   syllables:["for","ward"],         schwa:[1], ipa:"/ˈfɔː.wəd/", explanation:"ward = schwa: /ˈfɔːwəd/." },
  { id:"sc-21", rule:"schwa", mode:"multi", word:"summary",   syllables:["sum","ma","ry"],      schwa:[1], ipa:"/ˈsʌm.ər.i/", explanation:"ma غير منبورة ⇒ schwa: /ˈsʌmər.i/." },
  { id:"sc-22", rule:"schwa", mode:"multi", word:"official",  syllables:["of","fi","cial"],     schwa:[0,2], ipa:"/əˈfɪʃ.əl/", explanation:"of و cial مختزلان: /əˈfɪʃəl/." }
];
