/* ============================================================================
 * grammar.js  —  Grammar drill bank (3 independently-tracked rules)
 * ----------------------------------------------------------------------------
 * This is a DATA file. It is plain JSON wrapped in one line of JS so the app
 * opens with a double-click (no server needed). To add/edit items, just edit
 * the array below. Keep the shape of each item:
 *
 *   {
 *     id:                unique string, prefix by rule (art-21, vf-21, cop-21)
 *     rule:              "articles" | "verbform" | "copula"
 *     sentence_with_gap: English sentence, use ___ for the blank
 *     correct_answer:    the exact string that fills the gap
 *     distractors:       array of wrong options (for multiple-choice mode)
 *     explanation:       short Arabic explanation shown after reveal
 *   }
 *
 * English text stays LTR. Explanations are Arabic (RTL).
 * ==========================================================================*/
window.BANK_GRAMMAR = [

  /* ==== RULE 1: ARTICLES (a / an / the / zero) ==================== */
  /* Failure point (a): singular countable needs an article */
  { id:"art-1", rule:"articles", sentence_with_gap:"I have ___ car.", correct_answer:"a", distractors:["the","an","(no article)"], explanation:"اسم مفرد معدود يحتاج أداة. أول ذكر غير محدّد ⇒ a. (خطأ شائع: I have car)." },
  { id:"art-2", rule:"articles", sentence_with_gap:"She is ___ engineer.", correct_answer:"an", distractors:["a","the","(no article)"], explanation:"مفرد معدود، والكلمة تبدأ بصوت متحرك (e) ⇒ an." },
  { id:"art-3", rule:"articles", sentence_with_gap:"He wants to be ___ accountant.", correct_answer:"an", distractors:["a","the","(no article)"], explanation:"المهن المفردة تأخذ أداة، وصوت (a) في accountant متحرك ⇒ an." },
  { id:"art-4", rule:"articles", sentence_with_gap:"I need ___ pen to sign this.", correct_answer:"a", distractors:["an","the","(no article)"], explanation:"مفرد معدود غير محدّد ⇒ a. (خطأ شائع: I need pen)." },
  { id:"art-5", rule:"articles", sentence_with_gap:"There is ___ mistake in the report.", correct_answer:"a", distractors:["an","the","(no article)"], explanation:"مفرد معدود، أول ذكر ⇒ a." },
  { id:"art-6", rule:"articles", sentence_with_gap:"We rented ___ apartment near the office.", correct_answer:"an", distractors:["a","the","(no article)"], explanation:"صوت (a) متحرك ⇒ an." },

  /* Failure point (b): 'advice' is uncountable — NO 'an' */
  { id:"art-7", rule:"articles", sentence_with_gap:"Can you give me some ___ ?", correct_answer:"advice", distractors:["an advice","advices","the advices"], explanation:"advice غير معدود: لا an ولا جمع. الصح: some advice أو a piece of advice." },
  { id:"art-8", rule:"articles", sentence_with_gap:"He gave me ___ piece of advice.", correct_answer:"a", distractors:["an","the","(no article)"], explanation:"نعدّ advice بـ a piece of advice — الأداة على piece وليست على advice." },
  { id:"art-9", rule:"articles", sentence_with_gap:"I need ___ about my taxes.", correct_answer:"advice", distractors:["an advice","a advice","the advice"], explanation:"advice اسم غير معدود ⇒ بدون أداة نكرة. (خطأ شائع: an advice)." },
  { id:"art-10", rule:"articles", sentence_with_gap:"Her ___ was very useful.", correct_answer:"advice", distractors:["advices","an advice","advice's"], explanation:"غير معدود ⇒ لا جمع. نقول advice وليس advices." },
  { id:"art-11", rule:"articles", sentence_with_gap:"That was ___ information.", correct_answer:"useful", distractors:["an useful","a useful","the informations"], explanation:"information غير معدود مثل advice: لا an ولا جمع. الصفة تسبقه مباشرة." },

  /* Confirmed win: of + noun → identifying → 'the' */
  { id:"art-12", rule:"articles", sentence_with_gap:"Paris is ___ capital of France.", correct_answer:"the", distractors:["a","an","(no article)"], explanation:"of + اسم محدِّد ⇒ الاسم معرّف ⇒ the. قاعدتك المؤكّدة." },
  { id:"art-13", rule:"articles", sentence_with_gap:"He is ___ head of the department.", correct_answer:"the", distractors:["a","an","(no article)"], explanation:"of the department يحدّد الشخص ⇒ the head." },
  { id:"art-14", rule:"articles", sentence_with_gap:"This is ___ end of the chapter.", correct_answer:"the", distractors:["a","an","(no article)"], explanation:"of the chapter يحدّد ⇒ the end." },
  { id:"art-15", rule:"articles", sentence_with_gap:"Cash is ___ backbone of the business.", correct_answer:"the", distractors:["a","an","(no article)"], explanation:"of the business يعرّف ⇒ the backbone." },
  { id:"art-16", rule:"articles", sentence_with_gap:"She calculated ___ cost of the project.", correct_answer:"the", distractors:["a","an","(no article)"], explanation:"of the project يحدّد ⇒ the cost." },

  /* the: second mention / unique / known */
  { id:"art-17", rule:"articles", sentence_with_gap:"I bought a laptop. ___ laptop was expensive.", correct_answer:"The", distractors:["A","An","(no article)"], explanation:"ذكر ثانٍ لشيء معروف ⇒ the." },
  { id:"art-18", rule:"articles", sentence_with_gap:"Please close ___ door.", correct_answer:"the", distractors:["a","an","(no article)"], explanation:"باب محدّد يعرفه الطرفان ⇒ the." },
  { id:"art-19", rule:"articles", sentence_with_gap:"___ sun rises in the east.", correct_answer:"The", distractors:["A","An","(no article)"], explanation:"شيء فريد ⇒ the sun." },

  /* zero article: uncountable / plural general / abstract */
  { id:"art-20", rule:"articles", sentence_with_gap:"___ honesty is important in business.", correct_answer:"(no article)", distractors:["The","A","An"], explanation:"اسم مجرّد بمعنى عام ⇒ بدون أداة." },
  { id:"art-21", rule:"articles", sentence_with_gap:"I like ___ coffee in the morning.", correct_answer:"(no article)", distractors:["a","an","the"], explanation:"غير معدود بمعنى عام ⇒ بدون أداة." },
  { id:"art-22", rule:"articles", sentence_with_gap:"___ accountants analyse financial data.", correct_answer:"(no article)", distractors:["The","A","An"], explanation:"جمع بمعنى عام (كل المحاسبين) ⇒ بدون أداة." },
  { id:"art-23", rule:"articles", sentence_with_gap:"She studies ___ economics at university.", correct_answer:"(no article)", distractors:["the","an","a"], explanation:"أسماء المواد الدراسية غير معدودة ⇒ بدون أداة." },
  { id:"art-24", rule:"articles", sentence_with_gap:"He earns money by giving ___ .", correct_answer:"advice", distractors:["an advice","advices","a advice"], explanation:"تعزيز: advice دائمًا بدون أداة نكرة وبدون جمع." },

  /* ==== RULE 2: VERB FORM after prepositions & relative pronouns ==== */
  /* gerund after preposition */
  { id:"vf-1", rule:"verbform", sentence_with_gap:"I am interested in ___ up my own business.", correct_answer:"setting", distractors:["set","to set","sets"], explanation:"بعد حرف الجر (in) نستخدم الـ gerund ⇒ setting." },
  { id:"vf-2", rule:"verbform", sentence_with_gap:"She is good at ___ problems quickly.", correct_answer:"solving", distractors:["solve","to solve","solves"], explanation:"بعد حرف الجر (at) ⇒ gerund ⇒ solving." },
  { id:"vf-3", rule:"verbform", sentence_with_gap:"Thank you for ___ me the report.", correct_answer:"sending", distractors:["send","to send","sent"], explanation:"بعد for (حرف جر) ⇒ gerund ⇒ sending." },
  { id:"vf-4", rule:"verbform", sentence_with_gap:"He left without ___ goodbye.", correct_answer:"saying", distractors:["say","to say","said"], explanation:"بعد without ⇒ gerund ⇒ saying." },
  { id:"vf-5", rule:"verbform", sentence_with_gap:"They succeeded in ___ their targets.", correct_answer:"meeting", distractors:["meet","to meet","met"], explanation:"بعد in ⇒ gerund ⇒ meeting." },
  { id:"vf-6", rule:"verbform", sentence_with_gap:"I look forward to ___ from you.", correct_answer:"hearing", distractors:["hear","to hear","heard"], explanation:"في look forward to، الـ to هنا حرف جر ⇒ gerund ⇒ hearing (خطأ شائع: to hear)." },
  { id:"vf-7", rule:"verbform", sentence_with_gap:"She is capable of ___ the whole team.", correct_answer:"managing", distractors:["manage","to manage","manages"], explanation:"بعد of ⇒ gerund ⇒ managing." },
  { id:"vf-8", rule:"verbform", sentence_with_gap:"We are committed to ___ quality service.", correct_answer:"providing", distractors:["provide","to provide","provides"], explanation:"committed to + gerund (to هنا حرف جر) ⇒ providing." },
  { id:"vf-9", rule:"verbform", sentence_with_gap:"He apologised for ___ late.", correct_answer:"being", distractors:["be","to be","is"], explanation:"بعد for ⇒ gerund ⇒ being." },
  { id:"vf-10", rule:"verbform", sentence_with_gap:"Before ___ the contract, read it carefully.", correct_answer:"signing", distractors:["sign","to sign","signed"], explanation:"بعد before كحرف جر ⇒ gerund ⇒ signing." },

  /* verb agreement after relative pronoun (who/that/which) */
  { id:"vf-11", rule:"verbform", sentence_with_gap:"People who ___ hard usually succeed.", correct_answer:"work", distractors:["works","working","to work"], explanation:"الاسم قبل who جمع (people) ⇒ الفعل بدون s ⇒ work." },
  { id:"vf-12", rule:"verbform", sentence_with_gap:"A manager who ___ the team well is valued.", correct_answer:"leads", distractors:["lead","leading","to lead"], explanation:"a manager مفرد ⇒ leads." },
  { id:"vf-13", rule:"verbform", sentence_with_gap:"Investors who ___ risks can lose money.", correct_answer:"take", distractors:["takes","taking","to take"], explanation:"investors جمع ⇒ take بدون s." },
  { id:"vf-14", rule:"verbform", sentence_with_gap:"The report that ___ on my desk is old.", correct_answer:"is", distractors:["are","be","being"], explanation:"the report مفرد ⇒ is." },
  { id:"vf-15", rule:"verbform", sentence_with_gap:"Employees who ___ overtime get extra pay.", correct_answer:"work", distractors:["works","working","worked"], explanation:"employees جمع ⇒ work." },
  { id:"vf-16", rule:"verbform", sentence_with_gap:"A company that ___ its customers grows.", correct_answer:"respects", distractors:["respect","respecting","to respect"], explanation:"a company مفرد ⇒ respects." },
  { id:"vf-17", rule:"verbform", sentence_with_gap:"People who ___ that hard work pays off are often right.", correct_answer:"believe", distractors:["believes","believing","to believe"], explanation:"people جمع ⇒ believe." },
  { id:"vf-18", rule:"verbform", sentence_with_gap:"The factors that ___ the price are complex.", correct_answer:"affect", distractors:["affects","affecting","to affect"], explanation:"the factors جمع ⇒ affect." },

  /* infinitive vs gerund after certain verbs (bonus) */
  { id:"vf-19", rule:"verbform", sentence_with_gap:"We decided ___ the project.", correct_answer:"to postpone", distractors:["postponing","postpone","postponed"], explanation:"decide + to + مصدر ⇒ to postpone." },
  { id:"vf-20", rule:"verbform", sentence_with_gap:"I enjoy ___ financial reports.", correct_answer:"reading", distractors:["to read","read","reads"], explanation:"enjoy + gerund ⇒ reading." },
  { id:"vf-21", rule:"verbform", sentence_with_gap:"She insisted on ___ the invoice herself.", correct_answer:"checking", distractors:["check","to check","checks"], explanation:"insist on + gerund ⇒ checking." },
  { id:"vf-22", rule:"verbform", sentence_with_gap:"They aim at ___ costs this year.", correct_answer:"reducing", distractors:["reduce","to reduce","reduces"], explanation:"aim at + gerund ⇒ reducing." },

  /* ==== RULE 3: COPULA + 3rd-person-singular agreement ============ */
  { id:"cop-1", rule:"copula", sentence_with_gap:"The company ___ growing quickly.", correct_answer:"is", distractors:["are","be","being"], explanation:"company اسم مفرد ⇒ is (لا نحذف copula)." },
  { id:"cop-2", rule:"copula", sentence_with_gap:"The employees ___ satisfied with the plan.", correct_answer:"are", distractors:["is","be","was"], explanation:"employees جمع ⇒ are." },
  { id:"cop-3", rule:"copula", sentence_with_gap:"The company ___ a strong balance sheet.", correct_answer:"has", distractors:["have","having","had have"], explanation:"company مفرد ⇒ has (وليس have)." },
  { id:"cop-4", rule:"copula", sentence_with_gap:"He ___ responsible for the audit.", correct_answer:"is", distractors:["are","be","being"], explanation:"he مفرد ⇒ is. لا نحذف الرابط." },
  { id:"cop-5", rule:"copula", sentence_with_gap:"The results ___ better than expected.", correct_answer:"are", distractors:["is","was","be"], explanation:"results جمع ⇒ are." },
  { id:"cop-6", rule:"copula", sentence_with_gap:"Our team ___ working on the budget now.", correct_answer:"is", distractors:["are","be","been"], explanation:"team تُعامل مفردًا هنا ⇒ is." },
  { id:"cop-7", rule:"copula", sentence_with_gap:"The manager ___ every report carefully.", correct_answer:"reviews", distractors:["review","reviewing","are review"], explanation:"the manager مفرد ⇒ reviews (فعل بـ s)." },
  { id:"cop-8", rule:"copula", sentence_with_gap:"She ___ the numbers before each meeting.", correct_answer:"checks", distractors:["check","checking","are check"], explanation:"she مفرد ⇒ checks." },
  { id:"cop-9", rule:"copula", sentence_with_gap:"The profit margin ___ very thin this year.", correct_answer:"is", distractors:["are","be","being"], explanation:"margin مفرد ⇒ is." },
  { id:"cop-10", rule:"copula", sentence_with_gap:"The costs ___ rising every quarter.", correct_answer:"are", distractors:["is","was","be"], explanation:"costs جمع ⇒ are." },
  { id:"cop-11", rule:"copula", sentence_with_gap:"This method ___ time and money.", correct_answer:"saves", distractors:["save","saving","are save"], explanation:"this method مفرد ⇒ saves." },
  { id:"cop-12", rule:"copula", sentence_with_gap:"The board ___ made its decision.", correct_answer:"has", distractors:["have","having","are"], explanation:"the board (ككيان) مفرد ⇒ has." },
  { id:"cop-13", rule:"copula", sentence_with_gap:"There ___ several errors in the ledger.", correct_answer:"are", distractors:["is","was","be"], explanation:"errors جمع ⇒ there are." },
  { id:"cop-14", rule:"copula", sentence_with_gap:"There ___ a discrepancy in the accounts.", correct_answer:"is", distractors:["are","were","be"], explanation:"discrepancy مفرد ⇒ there is." },
  { id:"cop-15", rule:"copula", sentence_with_gap:"My colleague ___ fluent in three languages.", correct_answer:"is", distractors:["are","be","am"], explanation:"colleague مفرد ⇒ is." },
  { id:"cop-16", rule:"copula", sentence_with_gap:"The clients ___ waiting in the meeting room.", correct_answer:"are", distractors:["is","was","be"], explanation:"clients جمع ⇒ are." },
  { id:"cop-17", rule:"copula", sentence_with_gap:"Each department ___ its own budget.", correct_answer:"has", distractors:["have","having","are"], explanation:"each + مفرد ⇒ has." },
  { id:"cop-18", rule:"copula", sentence_with_gap:"The data ___ stored on the server.", correct_answer:"is", distractors:["are","be","being"], explanation:"في الأعمال تُعامل data غالبًا مفردًا ⇒ is (مقبول). التركيز: لا تحذف الرابط." },
  { id:"cop-19", rule:"copula", sentence_with_gap:"The new system ___ everyone a lot of time.", correct_answer:"saves", distractors:["save","saving","are save"], explanation:"system مفرد ⇒ saves." },
  { id:"cop-20", rule:"copula", sentence_with_gap:"Prices ___ expected to fall next year.", correct_answer:"are", distractors:["is","was","be"], explanation:"prices جمع ⇒ are." },
  { id:"cop-21", rule:"copula", sentence_with_gap:"The auditor ___ every transaction.", correct_answer:"examines", distractors:["examine","examining","are examine"], explanation:"the auditor مفرد ⇒ examines." },
  { id:"cop-22", rule:"copula", sentence_with_gap:"Our competitors ___ lowering their prices.", correct_answer:"are", distractors:["is","was","be"], explanation:"competitors جمع ⇒ are." }

];
