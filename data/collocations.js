/* ============================================================================
 * collocations.js  —  Collocations (rule: "collocations")  +  browsable reference
 * ----------------------------------------------------------------------------
 * Curated from *Cambridge English Collocations in Use (Intermediate)*
 * (McCarthy & O'Dell), grounded in the book's actual units, enriched with
 * finance/CMA context for IELTS Lexical Resource. USER-EXTENDABLE.
 *
 * Two exports:
 *   BANK_COLLOCATIONS  — drill items (reason-before-reveal, mode "mc")
 *       { id, rule:"collocations", sentence_with_gap, correct_answer,
 *         distractors[], explanation }
 *   REF_COLLOCATIONS   — flat reference list you can browse/search in-app
 *       { phrase, meaning_ar, example, topic }
 * ==========================================================================*/

window.BANK_COLLOCATIONS = [
  { id:"col-1",  rule:"collocations", sentence_with_gap:"You have to ___ a choice about your career soon.", correct_answer:"make", distractors:["do","take","have"], explanation:"make a choice (وليس do a choice). نستخدم make مع القرارات والاختيارات." },
  { id:"col-2",  rule:"collocations", sentence_with_gap:"I need to ___ some research before the meeting.", correct_answer:"do", distractors:["make","take","have"], explanation:"do research (وليس make research)." },
  { id:"col-3",  rule:"collocations", sentence_with_gap:"He made a ___ mistake in the calculation.", correct_answer:"serious", distractors:["big","strong","heavy"], explanation:"a serious mistake تصريف طبيعي؛ big مقبول لكن serious أقوى وأدق." },
  { id:"col-4",  rule:"collocations", sentence_with_gap:"The company decided to ___ a new product.", correct_answer:"launch", distractors:["open","start up","set"], explanation:"launch a product = يطلق منتجًا (تعبير أعمال ثابت)." },
  { id:"col-5",  rule:"collocations", sentence_with_gap:"They plan to ___ up a business abroad.", correct_answer:"set", distractors:["make","do","take"], explanation:"set up a business = يؤسّس شركة." },
  { id:"col-6",  rule:"collocations", sentence_with_gap:"We must ___ action before it is too late.", correct_answer:"take", distractors:["make","do","have"], explanation:"take action (وليس make/do action)." },
  { id:"col-7",  rule:"collocations", sentence_with_gap:"The manager will ___ a decision tomorrow.", correct_answer:"make", distractors:["take","do","give"], explanation:"make a decision (في الإنجليزية البريطانية والأمريكية)." },
  { id:"col-8",  rule:"collocations", sentence_with_gap:"It was a ___ decision — everyone agreed.", correct_answer:"unanimous", distractors:["united","common","single"], explanation:"a unanimous decision = بالإجماع." },
  { id:"col-9",  rule:"collocations", sentence_with_gap:"Let's not ___ off the decision any longer.", correct_answer:"put", distractors:["take","make","give"], explanation:"put off = يؤجّل. put off a decision." },
  { id:"col-10", rule:"collocations", sentence_with_gap:"This is the opportunity of a ___ .", correct_answer:"lifetime", distractors:["life","century","moment"], explanation:"the opportunity of a lifetime = فرصة العمر." },
  { id:"col-11", rule:"collocations", sentence_with_gap:"She has a ___ desire to succeed in finance.", correct_answer:"burning", distractors:["hot","strong","heavy"], explanation:"a burning desire = رغبة مُلحّة (تعبير ثابت)." },
  { id:"col-12", rule:"collocations", sentence_with_gap:"The CEO ___ denied the corruption claims.", correct_answer:"strongly", distractors:["heavily","hardly","deeply"], explanation:"strongly deny = ينفي بشدّة." },
  { id:"col-13", rule:"collocations", sentence_with_gap:"New evidence has ___ doubt on the report.", correct_answer:"cast", distractors:["made","put","thrown"], explanation:"cast doubt on = يلقي الشكّ على." },
  { id:"col-14", rule:"collocations", sentence_with_gap:"The auditors ___ serious doubts about the figures.", correct_answer:"have", distractors:["make","do","give"], explanation:"have doubts (about) = لديه شكوك." },
  { id:"col-15", rule:"collocations", sentence_with_gap:"We should ___ great importance to accuracy.", correct_answer:"attach", distractors:["give","make","put"], explanation:"attach importance to = يولي أهمية لـ (تعبير رسمي)." },
  { id:"col-16", rule:"collocations", sentence_with_gap:"The performance ___ a standing ovation.", correct_answer:"received", distractors:["took","made","gave"], explanation:"receive a standing ovation = يحظى بتصفيق حارّ." },
  { id:"col-17", rule:"collocations", sentence_with_gap:"His boss is always ___ his praises.", correct_answer:"singing", distractors:["saying","telling","speaking"], explanation:"sing someone's praises = يُثني كثيرًا على أحدهم." },
  { id:"col-18", rule:"collocations", sentence_with_gap:"The two sides finally ___ a compromise.", correct_answer:"reached", distractors:["made","did","took"], explanation:"reach a compromise/agreement = يتوصّل إلى." },
  { id:"col-19", rule:"collocations", sentence_with_gap:"Interest rates were ___ raised by the central bank.", correct_answer:"sharply", distractors:["strongly","highly","heavily"], explanation:"sharply raised/increased = رُفعت بحدّة." },
  { id:"col-20", rule:"collocations", sentence_with_gap:"Prices ___ after the announcement.", correct_answer:"soared", distractors:["climbed up","raised","grew up"], explanation:"prices soar = ترتفع بشدّة (تعبير أعمال قوي)." },
  { id:"col-21", rule:"collocations", sentence_with_gap:"The firm needs to ___ costs to stay competitive.", correct_answer:"cut", distractors:["lower down","make","do"], explanation:"cut costs = يخفّض التكاليف." },
  { id:"col-22", rule:"collocations", sentence_with_gap:"They ___ a heavy fine for late payment.", correct_answer:"paid", distractors:["made","did","gave"], explanation:"pay a fine؛ a heavy fine = غرامة كبيرة (وليس big fine)." },
  { id:"col-23", rule:"collocations", sentence_with_gap:"Let me ___ the options before we decide.", correct_answer:"consider", distractors:["think about of","make","do"], explanation:"consider the options أرقى من think about." },
  { id:"col-24", rule:"collocations", sentence_with_gap:"We invested a ___ amount of capital.", correct_answer:"substantial", distractors:["big","large amount","strong"], explanation:"a substantial amount أرقى من a big amount." },
  { id:"col-25", rule:"collocations", sentence_with_gap:"The two companies decided to ___ a partnership.", correct_answer:"form", distractors:["make","do","open"], explanation:"form a partnership = يشكّل شراكة." },
  { id:"col-26", rule:"collocations", sentence_with_gap:"He handed in his ___ after ten years.", correct_answer:"notice", distractors:["notification","resign","quit"], explanation:"hand in your notice = يقدّم استقالته." },
  { id:"col-27", rule:"collocations", sentence_with_gap:"The board will ___ talks with the union.", correct_answer:"hold", distractors:["do","make","take"], explanation:"hold talks = يعقد محادثات." },
  { id:"col-28", rule:"collocations", sentence_with_gap:"Auditors must ___ out a thorough review.", correct_answer:"carry", distractors:["make","do","take"], explanation:"carry out research/a review = يُجري." }
];

/* Browsable reference (searchable list, no drilling) */
window.REF_COLLOCATIONS = [
  { phrase:"make a choice",              meaning_ar:"يتّخذ اختيارًا",          example:"You must make a choice about your future.", topic:"Everyday verbs" },
  { phrase:"make a decision",            meaning_ar:"يتّخذ قرارًا",            example:"The board made a decision quickly.",        topic:"Decisions" },
  { phrase:"do research",                meaning_ar:"يُجري بحثًا",             example:"She did research on market trends.",         topic:"Study" },
  { phrase:"carry out research",         meaning_ar:"يُنفّذ/يُجري بحثًا",      example:"We carried out research last year.",         topic:"Academic" },
  { phrase:"take action",                meaning_ar:"يتّخذ إجراءً",            example:"Managers must take action now.",             topic:"Everyday verbs" },
  { phrase:"set up a business",          meaning_ar:"يؤسّس شركة",              example:"He set up a business at 25.",                topic:"Business" },
  { phrase:"launch a product",           meaning_ar:"يُطلق منتجًا",            example:"They launched a product in May.",            topic:"Business" },
  { phrase:"a rival company",            meaning_ar:"شركة منافِسة",            example:"A rival company copied our idea.",           topic:"Business" },
  { phrase:"unanimous decision",         meaning_ar:"قرار بالإجماع",           example:"It was a unanimous decision.",               topic:"Decisions" },
  { phrase:"put off a decision",         meaning_ar:"يؤجّل قرارًا",            example:"Don't put off the decision.",                topic:"Decisions" },
  { phrase:"the opportunity of a lifetime", meaning_ar:"فرصة العمر",           example:"This job is the opportunity of a lifetime.", topic:"Chances" },
  { phrase:"a burning desire",           meaning_ar:"رغبة مُلحّة",             example:"She has a burning desire to lead.",          topic:"Feelings" },
  { phrase:"strongly deny",              meaning_ar:"ينفي بشدّة",              example:"He strongly denied the claims.",             topic:"Statements" },
  { phrase:"cast doubt on",              meaning_ar:"يُلقي الشكّ على",         example:"The data cast doubt on the plan.",           topic:"Beliefs" },
  { phrase:"have doubts about",          meaning_ar:"لديه شكوك حول",           example:"I have doubts about the forecast.",          topic:"Beliefs" },
  { phrase:"attach importance to",       meaning_ar:"يُولي أهمية لـ",          example:"We attach importance to ethics.",            topic:"Beliefs" },
  { phrase:"reach a compromise",         meaning_ar:"يتوصّل إلى تسوية",        example:"They reached a compromise.",                 topic:"Agreeing" },
  { phrase:"heavy fine",                 meaning_ar:"غرامة كبيرة",             example:"They paid a heavy fine.",                    topic:"Laws" },
  { phrase:"break the law",              meaning_ar:"يخرق القانون",            example:"He broke the law knowingly.",                topic:"Laws" },
  { phrase:"prices soar",                meaning_ar:"الأسعار ترتفع بشدّة",     example:"Oil prices soared overnight.",               topic:"Money" },
  { phrase:"cut costs",                  meaning_ar:"يخفّض التكاليف",          example:"The firm cut costs sharply.",                topic:"Money" },
  { phrase:"squander money",             meaning_ar:"يُبدّد المال",            example:"He squandered his savings.",                 topic:"Money" },
  { phrase:"a substantial amount",       meaning_ar:"مبلغ كبير",               example:"They raised a substantial amount.",          topic:"Quantity" },
  { phrase:"consider the options",       meaning_ar:"يدرس الخيارات",           example:"Let's consider the options.",                topic:"Decisions" },
  { phrase:"hand in your notice",        meaning_ar:"يُقدّم استقالته",         example:"She handed in her notice.",                  topic:"Work" },
  { phrase:"hold talks",                 meaning_ar:"يعقد محادثات",            example:"The two sides held talks.",                  topic:"News" },
  { phrase:"key factor",                 meaning_ar:"عامل رئيسي",              example:"Price is a key factor.",                     topic:"Academic" },
  { phrase:"challenge a theory",         meaning_ar:"يُشكّك في نظرية",         example:"The study challenges a theory.",             topic:"Academic" },
  { phrase:"sing someone's praises",     meaning_ar:"يُثني كثيرًا على أحدهم",  example:"Her boss sings her praises.",                topic:"Praise" },
  { phrase:"a standing ovation",         meaning_ar:"تصفيق حارّ وقوفًا",       example:"They got a standing ovation.",               topic:"Praise" }
];
