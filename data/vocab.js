/* ============================================================================
 * vocab.js  —  Meaning-reversal vocabulary watchlist (rule: "meaning_reversal")
 * ----------------------------------------------------------------------------
 * USER-EXTENDABLE. Add confusable pairs here whenever you meet a new one.
 * Each entry becomes a drill: a sentence with a gap where only ONE of the pair
 * fits. The "pair" field powers a mini reference card too.
 *
 *   {
 *     id, rule:"meaning_reversal",
 *     pair:              [wordA, wordB]  (the two confusables)
 *     sentence_with_gap: sentence using ___
 *     correct_answer:    the word that fits
 *     distractors:       [the other word]  (usually the pair partner)
 *     explanation:       Arabic: what each word means / how to tell them apart
 *   }
 * ==========================================================================*/
window.BANK_VOCAB = [

  /* seed pair: employer vs employee */
  { id:"mr-1", rule:"meaning_reversal", pair:["employer","employee"], sentence_with_gap:"The ___ pays the salaries at the end of each month.", correct_answer:"employer", distractors:["employee"], explanation:"employer = صاحب العمل الذي يوظّف ويدفع. employee = الموظّف الذي يعمل ويتقاضى." },
  { id:"mr-2", rule:"meaning_reversal", pair:["employer","employee"], sentence_with_gap:"As an ___, I receive a monthly wage from the company.", correct_answer:"employee", distractors:["employer"], explanation:"employee = من يعمل لدى الشركة ويستلم راتبًا." },
  { id:"mr-3", rule:"meaning_reversal", pair:["employer","employee"], sentence_with_gap:"A good ___ provides fair working conditions for staff.", correct_answer:"employer", distractors:["employee"], explanation:"employer يوفّر ظروف العمل ⇒ صاحب العمل." },

  /* lend vs borrow */
  { id:"mr-4", rule:"meaning_reversal", pair:["lend","borrow"], sentence_with_gap:"The bank agreed to ___ us the money we needed.", correct_answer:"lend", distractors:["borrow"], explanation:"lend = يُعطي/يُقرض (المُقرِض). borrow = يأخذ/يقترض (المُقترِض)." },
  { id:"mr-5", rule:"meaning_reversal", pair:["lend","borrow"], sentence_with_gap:"I had to ___ money from a friend to pay the deposit.", correct_answer:"borrow", distractors:["lend"], explanation:"borrow = تأخذ من شخص آخر ⇒ يقترض." },

  /* credit vs debit */
  { id:"mr-6", rule:"meaning_reversal", pair:["credit","debit"], sentence_with_gap:"In double-entry, an increase in a liability is a ___ .", correct_answer:"credit", distractors:["debit"], explanation:"credit (دائن) يزيد الخصوم/الإيرادات. debit (مدين) يزيد الأصول/المصروفات." },
  { id:"mr-7", rule:"meaning_reversal", pair:["credit","debit"], sentence_with_gap:"An increase in an asset is recorded as a ___ .", correct_answer:"debit", distractors:["credit"], explanation:"زيادة الأصول تُسجّل مدينًا ⇒ debit." },

  /* asset vs liability */
  { id:"mr-8", rule:"meaning_reversal", pair:["asset","liability"], sentence_with_gap:"Cash in the bank is an ___ of the company.", correct_answer:"asset", distractors:["liability"], explanation:"asset = ما تملكه الشركة (أصل). liability = ما عليها من التزامات (خصم)." },
  { id:"mr-9", rule:"meaning_reversal", pair:["asset","liability"], sentence_with_gap:"A bank loan that must be repaid is a ___ .", correct_answer:"liability", distractors:["asset"], explanation:"القرض التزام يجب سداده ⇒ liability." },

  /* revenue vs expense */
  { id:"mr-10", rule:"meaning_reversal", pair:["revenue","expense"], sentence_with_gap:"Money earned from selling goods is ___ .", correct_answer:"revenue", distractors:["expense"], explanation:"revenue = الدخل الداخل من البيع. expense = التكلفة الخارجة." },
  { id:"mr-11", rule:"meaning_reversal", pair:["revenue","expense"], sentence_with_gap:"Rent paid for the office is an ___ .", correct_answer:"expense", distractors:["revenue"], explanation:"الإيجار مصروف خارج ⇒ expense." },

  /* profit vs loss */
  { id:"mr-12", rule:"meaning_reversal", pair:["profit","loss"], sentence_with_gap:"When revenue exceeds costs, the business makes a ___ .", correct_answer:"profit", distractors:["loss"], explanation:"إيراد > تكلفة ⇒ ربح (profit). العكس ⇒ خسارة (loss)." },

  /* supplier vs customer */
  { id:"mr-13", rule:"meaning_reversal", pair:["supplier","customer"], sentence_with_gap:"We buy our raw materials from a reliable ___ .", correct_answer:"supplier", distractors:["customer"], explanation:"supplier = المورّد الذي يبيع لك. customer = العميل الذي يشتري منك." },
  { id:"mr-14", rule:"meaning_reversal", pair:["supplier","customer"], sentence_with_gap:"Every ___ who buys from us gets a receipt.", correct_answer:"customer", distractors:["supplier"], explanation:"من يشتري منك ⇒ customer." },

  /* wholesale vs retail */
  { id:"mr-15", rule:"meaning_reversal", pair:["wholesale","retail"], sentence_with_gap:"Buying in bulk at a lower price is ___ .", correct_answer:"wholesale", distractors:["retail"], explanation:"wholesale = جملة (كميات كبيرة، سعر أقل). retail = تجزئة (للمستهلك)." },

  /* rise vs raise */
  { id:"mr-16", rule:"meaning_reversal", pair:["rise","raise"], sentence_with_gap:"Prices are expected to ___ next year.", correct_answer:"rise", distractors:["raise"], explanation:"rise = يرتفع بنفسه (لازم، بلا مفعول). raise = يرفع شيئًا (متعدٍ)." },
  { id:"mr-17", rule:"meaning_reversal", pair:["rise","raise"], sentence_with_gap:"The company decided to ___ its prices.", correct_answer:"raise", distractors:["rise"], explanation:"يرفع شيئًا (its prices) ⇒ raise (متعدٍ)." },

  /* affect vs effect */
  { id:"mr-18", rule:"meaning_reversal", pair:["affect","effect"], sentence_with_gap:"Higher interest rates ___ consumer spending.", correct_answer:"affect", distractors:["effect"], explanation:"affect فعل = يؤثّر في. effect اسم = الأثر/النتيجة." },
  { id:"mr-19", rule:"meaning_reversal", pair:["affect","effect"], sentence_with_gap:"The new policy had a positive ___ on sales.", correct_answer:"effect", distractors:["affect"], explanation:"بعد a/an وصفة ⇒ اسم ⇒ effect (الأثر)." },

  /* principal vs principle */
  { id:"mr-20", rule:"meaning_reversal", pair:["principal","principle"], sentence_with_gap:"You repay the loan ___ plus interest.", correct_answer:"principal", distractors:["principle"], explanation:"principal = أصل المبلغ (مالي). principle = مبدأ/قاعدة." },
  { id:"mr-21", rule:"meaning_reversal", pair:["principal","principle"], sentence_with_gap:"Honesty is a core ___ of good accounting.", correct_answer:"principle", distractors:["principal"], explanation:"مبدأ أخلاقي ⇒ principle." },

  /* economic vs economical */
  { id:"mr-22", rule:"meaning_reversal", pair:["economic","economical"], sentence_with_gap:"The government announced a new ___ policy.", correct_answer:"economic", distractors:["economical"], explanation:"economic = متعلّق بالاقتصاد. economical = موفّر/اقتصادي في التكلفة." },
  { id:"mr-23", rule:"meaning_reversal", pair:["economic","economical"], sentence_with_gap:"A small car is more ___ on fuel.", correct_answer:"economical", distractors:["economic"], explanation:"يوفّر التكلفة ⇒ economical." },

  /* gross vs net */
  { id:"mr-24", rule:"meaning_reversal", pair:["gross","net"], sentence_with_gap:"Salary before any deductions is the ___ amount.", correct_answer:"gross", distractors:["net"], explanation:"gross = إجمالي قبل الخصم. net = صافي بعد الخصم." },
  { id:"mr-25", rule:"meaning_reversal", pair:["gross","net"], sentence_with_gap:"After tax and deductions, you receive the ___ pay.", correct_answer:"net", distractors:["gross"], explanation:"بعد الخصومات ⇒ net (الصافي)." }

];
