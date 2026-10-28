/* ============================================================================
 * pron_units.js — Pronunciation Lab units (listen → record → AI score).
 * ----------------------------------------------------------------------------
 * 15 units aimed at Ahmed's Egyptian-Arabic L1 traps, in teaching order:
 *   consonants  p_b · f_v · th_voiceless · th_voiced · ng · clusters
 *   vowels      ih_iy · e_ae · ae_uh · er · o_sounds
 *   prosody     schwa_weak · word_stress · intonation · linking
 * Shape (every key required):
 *   { id, group, sound, ipa, title_ar, mouth_ar, trap_ar, pairs, words, sentences }
 *   pairs:     4–6 minimal pairs [focusWord, confusableWord] — the focus
 *              sound is in the FIRST word. [] for schwa_weak / intonation /
 *              linking; stress-shift families for word_stress.
 *   words:     exactly 8 × { w, ipa } — British IPA, Cambridge style
 *              (ˈ primary, ˌ secondary, "." syllable break). word_stress
 *              words also carry stress:"pho-TOG-ra-phy" (CAPS = stressed).
 *              In linking phrases "‿" marks where the words join.
 *   sentences: exactly 3 × { s, note_ar } — 6–12 words, focus ≥ 2 times.
 *              note_ar is "" for sound units and a how-to for prosody units.
 * mouth_ar = how to make the sound/pattern; trap_ar = the Arabic-speaker
 * mistake and why it costs marks.
 * ========================================================================== */
window.PRON_UNITS = [
  { "id": "p_b", "group": "consonants", "sound": "p", "ipa": "/p/",
    "title_ar": "صوت /p/ مقابل /b/ كما في park و bark",
    "mouth_ar": "أطبق الشفتين ثم افتحهما بدفعة هواء قوية دون اهتزاز في الحنجرة. ضع ورقة أمام فمك: مع /p/ تتحرك الورقة، ومع /b/ لا تتحرك تقريبًا.",
    "trap_ar": "العربية ليس فيها /p/ فيُنطق باءً: park تصبح bark و pear تصبح bear — فيسمع الممتحن كلمة أخرى تمامًا.",
    "pairs": [["park", "bark"], ["pear", "bear"], ["pin", "bin"], ["pull", "bull"], ["cap", "cab"], ["rope", "robe"]],
    "words": [
      { "w": "people", "ipa": "/ˈpiː.pəl/" },
      { "w": "public", "ipa": "/ˈpʌb.lɪk/" },
      { "w": "pollution", "ipa": "/pəˈluː.ʃən/" },
      { "w": "population", "ipa": "/ˌpɒp.jəˈleɪ.ʃən/" },
      { "w": "opportunity", "ipa": "/ˌɒp.əˈtʃuː.nə.ti/" },
      { "w": "passport", "ipa": "/ˈpɑːs.pɔːt/" },
      { "w": "paper", "ipa": "/ˈpeɪ.pər/" },
      { "w": "payment", "ipa": "/ˈpeɪ.mənt/" }
    ],
    "sentences": [
      { "s": "People park their cars in the public car park.", "note_ar": "" },
      { "s": "Pollution is a big problem in most capital cities.", "note_ar": "" },
      { "s": "Please put your passport in the blue bag.", "note_ar": "" }
    ] },

  { "id": "f_v", "group": "consonants", "sound": "v", "ipa": "/v/",
    "title_ar": "صوت /v/ مقابل /f/ كما في van و fan",
    "mouth_ar": "ضع الأسنان العليا على الشفة السفلى بخفة كما في الفاء، لكن شغّل الحنجرة. ضع يدك على رقبتك: مع /v/ تشعر باهتزاز، ومع /f/ لا اهتزاز.",
    "trap_ar": "العربية ليس فيها /v/ فتتحوّل إلى فاء: very تصبح ferry و vast تصبح fast، وفي آخر الكلمة save تُسمع safe — فيتغيّر المعنى.",
    "pairs": [["van", "fan"], ["very", "ferry"], ["vast", "fast"], ["view", "few"], ["save", "safe"], ["leave", "leaf"]],
    "words": [
      { "w": "environment", "ipa": "/ɪnˈvaɪ.rən.mənt/" },
      { "w": "university", "ipa": "/ˌjuː.nɪˈvɜː.sə.ti/" },
      { "w": "government", "ipa": "/ˈɡʌv.ən.mənt/" },
      { "w": "village", "ipa": "/ˈvɪl.ɪdʒ/" },
      { "w": "vehicle", "ipa": "/ˈvɪə.kəl/" },
      { "w": "develop", "ipa": "/dɪˈvel.əp/" },
      { "w": "travel", "ipa": "/ˈtræv.əl/" },
      { "w": "invoice", "ipa": "/ˈɪn.vɔɪs/" }
    ],
    "sentences": [
      { "s": "The village has very few vehicles on the road.", "note_ar": "" },
      { "s": "Universities should give students a voice in every decision.", "note_ar": "" },
      { "s": "Five of us travelled by van to visit the valley.", "note_ar": "" }
    ] },

  { "id": "th_voiceless", "group": "consonants", "sound": "θ", "ipa": "/θ/",
    "title_ar": "صوت /θ/ كما في think",
    "mouth_ar": "طرف اللسان بين الأسنان الأمامية بخفة، وادفع الهواء بلا صوت من الحنجرة — مثل الثاء العربية تمامًا.",
    "trap_ar": "في العامية المصرية تتحوّل الثاء إلى سين أو تاء: think تصبح sink أو tink — وهذا يغيّر المعنى.",
    "pairs": [["think", "sink"], ["thank", "tank"], ["path", "pass"], ["mouth", "mouse"], ["three", "tree"]],
    "words": [
      { "w": "thousand", "ipa": "/ˈθaʊ.zənd/" },
      { "w": "thirty", "ipa": "/ˈθɜː.ti/" },
      { "w": "theory", "ipa": "/ˈθɪə.ri/" },
      { "w": "method", "ipa": "/ˈmeθ.əd/" },
      { "w": "health", "ipa": "/helθ/" },
      { "w": "growth", "ipa": "/ɡrəʊθ/" },
      { "w": "month", "ipa": "/mʌnθ/" },
      { "w": "worth", "ipa": "/wɜːθ/" }
    ],
    "sentences": [
      { "s": "I think the growth this month was healthy.", "note_ar": "" },
      { "s": "Three thousand athletes ran the marathon through the city.", "note_ar": "" },
      { "s": "Thank you for both of the thoughtful birthday gifts.", "note_ar": "" }
    ] },

  { "id": "th_voiced", "group": "consonants", "sound": "ð", "ipa": "/ð/",
    "title_ar": "صوت /ð/ كما في this",
    "mouth_ar": "نفس وضع /θ/: طرف اللسان بين الأسنان الأمامية بخفة، لكن مع اهتزاز الحنجرة — مثل الذال العربية تمامًا.",
    "trap_ar": "في العامية المصرية تتحوّل الذال إلى زاي أو دال: this تصبح zis أو dis و they تصبح day — وهذه الكلمات تتكرر في كل جملة تقريبًا فيلاحظها الممتحن فورًا.",
    "pairs": [["they", "day"], ["then", "den"], ["there", "dare"], ["those", "doze"], ["though", "dough"], ["breathe", "breeze"]],
    "words": [
      { "w": "weather", "ipa": "/ˈweð.ər/" },
      { "w": "together", "ipa": "/təˈɡeð.ər/" },
      { "w": "although", "ipa": "/ɔːlˈðəʊ/" },
      { "w": "therefore", "ipa": "/ˈðeə.fɔːr/" },
      { "w": "rather", "ipa": "/ˈrɑː.ðər/" },
      { "w": "breathe", "ipa": "/briːð/" },
      { "w": "clothes", "ipa": "/kləʊðz/" },
      { "w": "southern", "ipa": "/ˈsʌð.ən/" }
    ],
    "sentences": [
      { "s": "They said the weather there is better than this.", "note_ar": "" },
      { "s": "My mother and father always travel together.", "note_ar": "" },
      { "s": "Although the clothes were cheap, I'd rather buy those.", "note_ar": "" }
    ] },

  { "id": "ng", "group": "consonants", "sound": "ŋ", "ipa": "/ŋ/",
    "title_ar": "صوت /ŋ/ كما في sing — بلا /g/ زائدة",
    "mouth_ar": "ارفع مؤخرة اللسان لتلامس أقصى سقف الحلق (وضع /k/ و /g/ نفسه) وأخرج الصوت من الأنف. ثم توقّف وأنت في هذا الوضع دون أن تفتح بصوت /g/.",
    "trap_ar": "المتحدث المصري يضيف /g/ بعد ng: sing تصبح sing-g و thinking تصبح thinkin-g، أو يحوّلها إلى /n/ — والصواب البريطاني رنين أنفي فقط بلا /g/ في آخر الكلمة.",
    "pairs": [["sing", "sin"], ["thing", "thin"], ["wing", "win"], ["rang", "ran"], ["sung", "sun"]],
    "words": [
      { "w": "morning", "ipa": "/ˈmɔː.nɪŋ/" },
      { "w": "learning", "ipa": "/ˈlɜː.nɪŋ/" },
      { "w": "singing", "ipa": "/ˈsɪŋ.ɪŋ/" },
      { "w": "young", "ipa": "/jʌŋ/" },
      { "w": "strong", "ipa": "/strɒŋ/" },
      { "w": "belonging", "ipa": "/bɪˈlɒŋ.ɪŋ/" },
      { "w": "building", "ipa": "/ˈbɪl.dɪŋ/" },
      { "w": "accounting", "ipa": "/əˈkaʊn.tɪŋ/" }
    ],
    "sentences": [
      { "s": "Young people are spending a long time shopping online.", "note_ar": "" },
      { "s": "Learning something new every morning keeps the brain strong.", "note_ar": "" },
      { "s": "She was singing along while we were cooking.", "note_ar": "" }
    ] },

  { "id": "clusters", "group": "consonants", "sound": "str", "ipa": "/str/ /spr/ /ksts/ /skt/",
    "title_ar": "العناقيد الساكنة بلا حرف علة زائد: street لا estreet",
    "mouth_ar": "انطق الساكنين أو الثلاثة متتابعة في نفَس واحد دون أي حركة بينها، وابدأ بالـ /s/ نفسها مباشرة بلا همزة قبلها: s-t-r-eet.",
    "trap_ar": "العربية لا تبدأ الكلمة بساكنين، فيضيف المتحدث المصري همزة قبلها (estreet، esprin) أو حركة بينها (texts تصبح tex-ets) — فتزيد المقاطع وقد تتحوّل الكلمة إلى أخرى: sport تُسمع support.",
    "pairs": [["sport", "support"], ["state", "estate"], ["steam", "esteem"], ["blow", "below"], ["claps", "collapse"], ["prayed", "parade"]],
    "words": [
      { "w": "street", "ipa": "/striːt/" },
      { "w": "spring", "ipa": "/sprɪŋ/" },
      { "w": "screen", "ipa": "/skriːn/" },
      { "w": "strength", "ipa": "/streŋθ/" },
      { "w": "texts", "ipa": "/teksts/" },
      { "w": "months", "ipa": "/mʌnθs/" },
      { "w": "asked", "ipa": "/ɑːskt/" },
      { "w": "statement", "ipa": "/ˈsteɪt.mənt/" }
    ],
    "sentences": [
      { "s": "Students walked down the street in the spring.", "note_ar": "" },
      { "s": "She asked for the texts from the last six months.", "note_ar": "" },
      { "s": "The strict school stopped children from using screens.", "note_ar": "" }
    ] },

  { "id": "ih_iy", "group": "vowels", "sound": "ɪ", "ipa": "/ɪ/",
    "title_ar": "/ɪ/ القصيرة مقابل /iː/ الطويلة: ship و sheep",
    "mouth_ar": "/ɪ/ قصيرة ومرتخية: الفم مفتوح قليلًا واللسان أخفض قليلًا، كسرة سريعة بلا مدّ. أما /iː/ فطويلة ومشدودة: اسحب الشفتين كالابتسامة ومُدّ الصوت.",
    "trap_ar": "المتحدث العربي يعطي الصوتين الطول نفسه أو يحوّل /ɪ/ إلى ياء ممدودة، فتُسمع live كأنها leave و fill كأنها feel — وهذا يغيّر المعنى في كلمات يومية كثيرة.",
    "pairs": [["ship", "sheep"], ["live", "leave"], ["fill", "feel"], ["sit", "seat"], ["chip", "cheap"], ["bit", "beat"]],
    "words": [
      { "w": "city", "ipa": "/ˈsɪt.i/" },
      { "w": "minute", "ipa": "/ˈmɪn.ɪt/" },
      { "w": "English", "ipa": "/ˈɪŋ.ɡlɪʃ/" },
      { "w": "ticket", "ipa": "/ˈtɪk.ɪt/" },
      { "w": "women", "ipa": "/ˈwɪm.ɪn/" },
      { "w": "fitness", "ipa": "/ˈfɪt.nəs/" },
      { "w": "business", "ipa": "/ˈbɪz.nɪs/" },
      { "w": "receipt", "ipa": "/rɪˈsiːt/" }
    ],
    "sentences": [
      { "s": "Please fill in this form if you feel ill.", "note_ar": "" },
      { "s": "His sister lives in a big city in the east.", "note_ar": "" },
      { "s": "Did he eat the fish and chips in the street?", "note_ar": "" }
    ] },

  { "id": "e_ae", "group": "vowels", "sound": "e", "ipa": "/e/",
    "title_ar": "/e/ مقابل /æ/: bed و bad",
    "mouth_ar": "/e/: الفك نصف مفتوح واللسان في منتصف الفم، صوت قصير قريب من «إِ» المفتوحة. /æ/: أنزل الفك أكثر بوضوح وافرد زاويتي الفم للجانبين، كأنك تقول «آه» بفم عريض.",
    "trap_ar": "الفتحة العربية تقع بين الصوتين فتخلط bed و bad، وكثيرًا ما تُمدّ /e/ إلى «إيـ» طويلة — وخطأ men و man يحوّل الجمع إلى مفرد أمام الممتحن.",
    "pairs": [["bed", "bad"], ["men", "man"], ["said", "sad"], ["set", "sat"], ["lend", "land"], ["head", "had"]],
    "words": [
      { "w": "education", "ipa": "/ˌedʒ.uˈkeɪ.ʃən/" },
      { "w": "energy", "ipa": "/ˈen.ə.dʒi/" },
      { "w": "technology", "ipa": "/tekˈnɒl.ə.dʒi/" },
      { "w": "medicine", "ipa": "/ˈmed.ɪ.sən/" },
      { "w": "question", "ipa": "/ˈkwes.tʃən/" },
      { "w": "seven", "ipa": "/ˈsev.ən/" },
      { "w": "expensive", "ipa": "/ɪkˈspen.sɪv/" },
      { "w": "credit", "ipa": "/ˈkred.ɪt/" }
    ],
    "sentences": [
      { "s": "Let's spend less energy on the next step.", "note_ar": "" },
      { "s": "Get ready, the test starts at ten past seven.", "note_ar": "" },
      { "s": "Her friend said the red bag was very expensive.", "note_ar": "" }
    ] },

  { "id": "ae_uh", "group": "vowels", "sound": "æ", "ipa": "/æ/",
    "title_ar": "/æ/ مقابل /ʌ/: cat و cut",
    "mouth_ar": "/æ/: افتح الفك جيدًا وافرد الشفتين للجانبين واللسان منخفض في مقدمة الفم. /ʌ/: فم نصف مفتوح ومرتخٍ واللسان في المنتصف، صوت قصير مكتوم في وسط الفم.",
    "trap_ar": "الفتحة العربية تُستخدم للصوتين، فتتشابه cat و cut و hat و hut، ويُنطق /ʌ/ في money و country و mother كأنه «أو» بسبب كتابته بحرف o.",
    "pairs": [["cat", "cut"], ["hat", "hut"], ["match", "much"], ["bag", "bug"], ["ran", "run"], ["cap", "cup"]],
    "words": [
      { "w": "family", "ipa": "/ˈfæm.əl.i/" },
      { "w": "language", "ipa": "/ˈlæŋ.ɡwɪdʒ/" },
      { "w": "traffic", "ipa": "/ˈtræf.ɪk/" },
      { "w": "national", "ipa": "/ˈnæʃ.ən.əl/" },
      { "w": "happy", "ipa": "/ˈhæp.i/" },
      { "w": "campus", "ipa": "/ˈkæm.pəs/" },
      { "w": "average", "ipa": "/ˈæv.ər.ɪdʒ/" },
      { "w": "balance", "ipa": "/ˈbæl.əns/" }
    ],
    "sentences": [
      { "s": "My family had lunch at a small cafe.", "note_ar": "" },
      { "s": "Bad traffic made us run to catch the bus.", "note_ar": "" },
      { "s": "I'm happy my brother got a hundred in maths.", "note_ar": "" }
    ] },

  { "id": "er", "group": "vowels", "sound": "ɜː", "ipa": "/ɜː/",
    "title_ar": "صوت /ɜː/ كما في bird و work",
    "mouth_ar": "الشفتان مرتخيتان غير مستديرتين، واللسان مسطّح في منتصف الفم، ومُدّ الصوت دون نطق الراء في البريطانية. هو صوت طويل مكتوم بين الكسرة والضمة.",
    "trap_ar": "بسبب الإملاء ينطق المتحدث العربي work كأنها walk و word كأنها ward و burn كأنها barn، أو يضيف راءً واضحة — و work/walk من أشهر الأخطاء عند الحديث عن العمل.",
    "pairs": [["work", "walk"], ["word", "ward"], ["burn", "barn"], ["firm", "farm"], ["hurt", "heart"], ["shirt", "short"]],
    "words": [
      { "w": "world", "ipa": "/wɜːld/" },
      { "w": "earth", "ipa": "/ɜːθ/" },
      { "w": "early", "ipa": "/ˈɜː.li/" },
      { "w": "person", "ipa": "/ˈpɜː.sən/" },
      { "w": "service", "ipa": "/ˈsɜː.vɪs/" },
      { "w": "research", "ipa": "/rɪˈsɜːtʃ/" },
      { "w": "learn", "ipa": "/lɜːn/" },
      { "w": "journal", "ipa": "/ˈdʒɜː.nəl/" }
    ],
    "sentences": [
      { "s": "I work near the park, so I walk to work.", "note_ar": "" },
      { "s": "Thirty nurses work early shifts at the hospital.", "note_ar": "" },
      { "s": "Her research turned out to be the world's first.", "note_ar": "" }
    ] },

  { "id": "o_sounds", "group": "vowels", "sound": "ɒ", "ipa": "/ɒ/ /ɔː/ /əʊ/",
    "title_ar": "ثلاثة أصوات للحرف o: cot و caught و coat",
    "mouth_ar": "/ɒ/ قصيرة بفك مفتوح وشفتين مستديرتين قليلًا، و /ɔː/ طويلة بشفتين مستديرتين ومشدودتين أكثر. أما /əʊ/ فصوت منزلق: ابدأ بفم مرتخٍ ثم ضمّ الشفتين نحو «و».",
    "trap_ar": "المتحدث العربي ينطق الثلاثة واوًا طويلة «أو» بسبب حرف o، فتختلط want بـ won't و cost بـ coast — و want/won't تعطي عكس المعنى تمامًا.",
    "pairs": [["want", "won't"], ["cost", "coast"], ["cot", "caught"], ["not", "note"], ["shot", "short"], ["got", "goat"]],
    "words": [
      { "w": "knowledge", "ipa": "/ˈnɒl.ɪdʒ/" },
      { "w": "hospital", "ipa": "/ˈhɒs.pɪ.təl/" },
      { "w": "stock", "ipa": "/stɒk/" },
      { "w": "abroad", "ipa": "/əˈbrɔːd/" },
      { "w": "daughter", "ipa": "/ˈdɔː.tər/" },
      { "w": "normal", "ipa": "/ˈnɔː.məl/" },
      { "w": "phone", "ipa": "/fəʊn/" },
      { "w": "global", "ipa": "/ˈɡləʊ.bəl/" }
    ],
    "sentences": [
      { "s": "I want to stop, but I won't stop now.", "note_ar": "" },
      { "s": "The coat cost a lot more than I thought.", "note_ar": "" },
      { "s": "Call the hospital before you go home.", "note_ar": "" }
    ] },

  { "id": "schwa_weak", "group": "prosody", "sound": "ə", "ipa": "/ə/",
    "title_ar": "الشوا /ə/ والصيغ الضعيفة: to و for و of و can و and",
    "mouth_ar": "/ə/ أضعف صوت في الإنجليزية: أرخِ الفم واللسان تمامًا وانطق «أ» قصيرة جدًا بلا جهد. الكلمات الوظيفية غير المؤكَّدة تُنطق به: to=/tə/، for=/fə/، of=/əv/، can=/kən/، and=/ən/.",
    "trap_ar": "المتحدث العربي ينطق كل كلمة بقوتها الكاملة كما تُكتب (tuu، foor، kaan)، فيصبح الإيقاع متقطعًا وآليًا ويخسر نقاطًا في الطلاقة والنطق معًا.",
    "pairs": [],
    "words": [
      { "w": "about", "ipa": "/əˈbaʊt/" },
      { "w": "today", "ipa": "/təˈdeɪ/" },
      { "w": "problem", "ipa": "/ˈprɒb.ləm/" },
      { "w": "support", "ipa": "/səˈpɔːt/" },
      { "w": "computer", "ipa": "/kəmˈpjuː.tər/" },
      { "w": "information", "ipa": "/ˌɪn.fəˈmeɪ.ʃən/" },
      { "w": "percentage", "ipa": "/pəˈsen.tɪdʒ/" },
      { "w": "account", "ipa": "/əˈkaʊnt/" }
    ],
    "sentences": [
      { "s": "I want to go for a walk.", "note_ar": "to تُنطق /tə/ و for تُنطق /fə/ و a تُنطق /ə/ — النبر فقط على want و go و walk." },
      { "s": "I'd like a cup of tea and a piece of cake.", "note_ar": "of تُنطق /əv/ و and تُنطق /ən/ و a تُنطق /ə/: a cup of tea ← /ə ˈkʌp əv ˈtiː/." },
      { "s": "We can meet at six for lunch.", "note_ar": "can في الإثبات تُنطق /kən/ ضعيفة، و at تُنطق /ət/ و for تُنطق /fə/ — لا تقل /kæn/ إلا للتأكيد أو في آخر الجملة." }
    ] },

  { "id": "word_stress", "group": "prosody", "sound": "ˈ", "ipa": "/ˈ/ /ˌ/",
    "title_ar": "نبر الكلمة وانتقاله داخل العائلة: PHO-to-graph و pho-TOG-ra-phy",
    "mouth_ar": "المقطع المنبور أعلى وأطول وأوضح، وباقي المقاطع تضعف غالبًا إلى /ə/. عند إضافة لاحقة مثل -y أو -ic أو -ical ينتقل النبر، فتتغيّر حروف العلة في الكلمة كلها.",
    "trap_ar": "المتحدث العربي يضع النبر على المقطع الطويل الأخير أو يعطي كل المقاطع القوة نفسها (pho-to-GRA-phy)، والنبر الخاطئ يجعل المستمع لا يتعرّف على الكلمة حتى لو كانت أصواتها صحيحة.",
    "pairs": [["photograph", "photography"], ["economy", "economic"], ["politics", "political"], ["democracy", "democratic"], ["analyse", "analysis"]],
    "words": [
      { "w": "photograph", "ipa": "/ˈfəʊ.tə.ɡrɑːf/", "stress": "PHO-to-graph" },
      { "w": "photography", "ipa": "/fəˈtɒɡ.rə.fi/", "stress": "pho-TOG-ra-phy" },
      { "w": "economy", "ipa": "/iˈkɒn.ə.mi/", "stress": "e-CON-o-my" },
      { "w": "economic", "ipa": "/ˌiː.kəˈnɒm.ɪk/", "stress": "e-co-NOM-ic" },
      { "w": "interesting", "ipa": "/ˈɪn.trə.stɪŋ/", "stress": "IN-tres-ting" },
      { "w": "comfortable", "ipa": "/ˈkʌmf.tə.bəl/", "stress": "COMF-ta-ble" },
      { "w": "advertisement", "ipa": "/ədˈvɜː.tɪs.mənt/", "stress": "ad-VER-tise-ment" },
      { "w": "analysis", "ipa": "/əˈnæl.ə.sɪs/", "stress": "a-NAL-y-sis" }
    ],
    "sentences": [
      { "s": "My photographs improved after a photography course.", "note_ar": "PHO-to-graphs: النبر على المقطع الأول، لكن pho-TOG-ra-phy: ينتقل النبر إلى المقطع الثاني وتضعف pho إلى /fə/." },
      { "s": "The economy grew, but economic problems remain.", "note_ar": "e-CON-o-my ثم e-co-NOM-ic: اللاحقة -ic تنقل النبر إلى المقطع الذي قبلها مباشرة." },
      { "s": "They record every match and keep a record of scores.", "note_ar": "record الأولى فعل: re-CORD /rɪˈkɔːd/، والثانية اسم: REC-ord /ˈrek.ɔːd/ — مكان النبر يحدد نوع الكلمة." }
    ] },

  { "id": "intonation", "group": "prosody", "sound": "↘↗", "ipa": "↘ ↗",
    "title_ar": "التنغيم: هبوط وصعود ونغمة القوائم والتأكيد",
    "mouth_ar": "حرّك نغمة صوتك على آخر كلمة مهمة: تهبط ↘ في الجمل الخبرية وأسئلة wh-، وتصعد ↗ في أسئلة نعم/لا وعلى عناصر القائمة قبل الأخير. وللمقارنة شدّد الكلمة المتقابلة بصوت أعلى وأطول.",
    "trap_ar": "المتحدث العربي يميل إلى نغمة مسطّحة واحدة أو هبوط حادّ في كل جملة، فيبدو كلامه مملًّا أو غاضبًا دون قصد — والممتحن يقيّم التنغيم ضمن معيار النطق.",
    "pairs": [],
    "words": [
      { "w": "really", "ipa": "/ˈrɪə.li/" },
      { "w": "actually", "ipa": "/ˈæk.tʃu.ə.li/" },
      { "w": "definitely", "ipa": "/ˈdef.ɪ.nət.li/" },
      { "w": "absolutely", "ipa": "/ˌæb.səˈluːt.li/" },
      { "w": "obviously", "ipa": "/ˈɒb.vi.əs.li/" },
      { "w": "however", "ipa": "/haʊˈev.ər/" },
      { "w": "honestly", "ipa": "/ˈɒn.ɪst.li/" },
      { "w": "personally", "ipa": "/ˈpɜː.sən.əl.i/" }
    ],
    "sentences": [
      { "s": "Have you been to London? Where did you stay?", "note_ar": "سؤال نعم/لا: النغمة تصعد في آخره ↗ على London، وسؤال wh-: النغمة تهبط في آخره ↘ على stay." },
      { "s": "I enjoy reading, cooking, and playing football.", "note_ar": "قائمة: النغمة تصعد ↗ على reading و cooking، وتهبط ↘ على football لتعلن نهاية القائمة." },
      { "s": "I didn't say Tuesday, I said Thursday.", "note_ar": "تأكيد تقابلي: انطق Thursday بصوت أعلى وأطول مع هبوط واضح ↘، لأنها المعلومة المصحَّحة." }
    ] },

  { "id": "linking", "group": "prosody", "sound": "‿", "ipa": "‿",
    "title_ar": "ربط الكلمات: turn it off و next time",
    "mouth_ar": "إذا انتهت كلمة بساكن وبدأت التالية بحرف علة، انقل الساكن إلى الكلمة التالية بلا توقف (an‿apple = a-napple). وإذا تكرر الساكن نفسه (bus‿stop) انطقه مرة واحدة أطول قليلًا.",
    "trap_ar": "المتحدث العربي يفصل الكلمات بوقفة أو همزة قبل كل حرف علة (turn ʔit ʔoff)، فيصبح الكلام متقطعًا كأنه كلمات منفصلة، وهذا يخفض تقييم الطلاقة والنطق معًا.",
    "pairs": [],
    "words": [
      { "w": "turn it off", "ipa": "/ˌtɜːn‿ɪt‿ˈɒf/" },
      { "w": "pick it up", "ipa": "/ˌpɪk‿ɪt‿ˈʌp/" },
      { "w": "an apple", "ipa": "/ən‿ˈæp.əl/" },
      { "w": "find out", "ipa": "/ˌfaɪnd‿ˈaʊt/" },
      { "w": "look after", "ipa": "/ˌlʊk‿ˈɑːf.tər/" },
      { "w": "next time", "ipa": "/ˌnekst‿ˈtaɪm/" },
      { "w": "bus stop", "ipa": "/ˈbʌs‿ˌstɒp/" },
      { "w": "social life", "ipa": "/ˌsəʊ.ʃəl‿ˈlaɪf/" }
    ],
    "sentences": [
      { "s": "Please turn it off and pick it up later.", "note_ar": "turn‿it‿off تُنطق كأنها كلمة واحدة: tur-ni-toff، و pick‿it‿up: pi-ki-tup." },
      { "s": "I ate an apple at the bus stop.", "note_ar": "ate‿an‿apple تُنطق: ei-ta-na-pple بلا همزات، وفي bus‿stop انطق s مرة واحدة ممدودة." },
      { "s": "Next time, we should find out about it earlier.", "note_ar": "next‿time: انطق t مرة واحدة فقط، و find‿out‿about‿it تُنطق متصلة: fain-dau-ta-bau-tit." }
    ] }
];
