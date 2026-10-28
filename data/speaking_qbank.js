/* ============================================================================
 * speaking_qbank.js — Speaking mock-test question bank (Parts 1 and 3).
 * ----------------------------------------------------------------------------
 * GENERAL-INTEREST topics ONLY. Finance / banking / tax / investment /
 * company-profit questions are deliberately EXCLUDED (same rule as
 * speaking_cards.js): Ahmed's specialist vocabulary would mask his real range.
 *
 * SPEAKING_PART1: [{ id:"p1-<slug>", title_ar, questions[4–5] }]
 *   Short, personal, everyday questions — the examiner picks 2–3 topics.
 * SPEAKING_PART3: { "<card id>": [4 questions] }
 *   One entry for EVERY card in speaking_cards.js (sc-01 … sc-30). The
 *   questions lift the card's theme to society level: compare, evaluate,
 *   predict, causes/effects. Add a card there → add its key here.
 * ========================================================================== */
window.SPEAKING_PART1 = [
  { "id": "p1-work", "title_ar": "العمل أو الدراسة",
    "questions": ["Do you work or are you a student?", "Why did you choose that job or subject?", "What do you like most about your work or studies?", "Is there anything you would like to change about it?", "Do you plan to do the same kind of work in the future?"] },
  { "id": "p1-hometown", "title_ar": "مدينتك",
    "questions": ["Where is your hometown?", "What do you like most about your hometown?", "Has your hometown changed much since you were a child?", "Is it a good place for young people to live?", "Would you like to live there in the future?"] },
  { "id": "p1-home", "title_ar": "السكن",
    "questions": ["Do you live in a house or a flat?", "Who do you live with?", "Which room do you spend the most time in?", "What would you like to change about your home?", "Do you plan to live there for a long time?"] },
  { "id": "p1-routine", "title_ar": "الروتين اليومي",
    "questions": ["What is your daily routine like?", "Do you usually do the same things every day?", "What is the busiest part of your day?", "Do you prefer mornings or evenings?", "Would you like to change anything about your routine?"] },
  { "id": "p1-hobbies", "title_ar": "الهوايات",
    "questions": ["What do you like to do in your free time?", "Have you had the same hobbies since you were a child?", "Do you prefer hobbies you do alone or with other people?", "Is there a new hobby you would like to try?", "Why do you think adults need hobbies?"] },
  { "id": "p1-reading", "title_ar": "القراءة",
    "questions": ["Do you like reading?", "What kind of books do you enjoy?", "Do you prefer reading on paper or on a screen?", "Did you read a lot when you were a child?", "When do you usually find time to read?"] },
  { "id": "p1-music", "title_ar": "الموسيقى",
    "questions": ["What kind of music do you like?", "When do you usually listen to music?", "Have your musical tastes changed since you were younger?", "Can you play a musical instrument?", "Do you prefer listening to music alone or with others?"] },
  { "id": "p1-weather", "title_ar": "الطقس",
    "questions": ["What's the weather usually like in your country?", "What kind of weather do you like most?", "Does the weather affect your mood?", "How often do you check the weather forecast?", "Which season do you like least, and why?"] },
  { "id": "p1-food", "title_ar": "الطعام",
    "questions": ["What is your favourite food?", "Do you prefer eating at home or eating out?", "Can you cook?", "Is there any food you disliked as a child but enjoy now?", "What is a traditional dish from your country?"] },
  { "id": "p1-travel", "title_ar": "السفر",
    "questions": ["Do you like travelling?", "Where did you go on your last holiday?", "Do you prefer travelling alone or with other people?", "Is there a place you would really like to visit?", "How do you usually plan a trip?"] },
  { "id": "p1-technology", "title_ar": "التكنولوجيا والهاتف",
    "questions": ["How often do you use your mobile phone?", "What do you mostly use your phone for?", "Could you live without your phone for a day?", "Do you think you spend too much time on screens?", "Is there an app you couldn't live without?"] },
  { "id": "p1-friends", "title_ar": "الأصدقاء",
    "questions": ["Do you have many friends?", "How often do you see your friends?", "What do you usually do together?", "Do you prefer having a few close friends or lots of friends?", "Is it easy to make new friends as an adult?"] },
  { "id": "p1-sport", "title_ar": "الرياضة والتمارين",
    "questions": ["Do you do any sport or exercise?", "What sports are popular in your country?", "Did you play any sports at school?", "Do you prefer watching sport or doing it?", "Would you like to try a new sport?"] },
  { "id": "p1-shopping", "title_ar": "التسوّق",
    "questions": ["Do you enjoy shopping?", "Do you prefer shopping online or in shops?", "Who do you usually go shopping with?", "What was the last thing you bought?", "Is there a shop you really like in your area?"] },
  { "id": "p1-transport", "title_ar": "المواصلات",
    "questions": ["How do you usually get around your city?", "Is public transport good where you live?", "Do you prefer driving or using public transport?", "How long does it take you to get to work?", "How could transport in your city be improved?"] },
  { "id": "p1-weekends", "title_ar": "عطلة نهاية الأسبوع",
    "questions": ["What do you usually do at weekends?", "Did you do anything special last weekend?", "Do you prefer busy or relaxing weekends?", "Are your weekends different now from when you were a child?", "What would your perfect weekend be like?"] }
];

window.SPEAKING_PART3 = {
  "sc-01": ["What qualities make someone a good teacher?", "How has the role of teachers changed since the internet became widespread?", "Who has more influence on children, teachers or parents?", "Do you think technology will ever replace teachers in the classroom?"],
  "sc-02": ["How have families in your country changed over the last few decades?", "Do people spend less time with their families now than in the past? Why?", "What are the advantages and disadvantages of living with extended family?", "What role should grandparents play in bringing up children?"],
  "sc-03": ["Why do some friendships last a lifetime while others don't?", "Is it easier for children or adults to make friends?", "How has social media changed the nature of friendship?", "Can online friends ever be as close as friends you meet in person?"],
  "sc-04": ["Why are people so interested in the lives of celebrities?", "Do famous people have a responsibility to be good role models?", "How is being famous today different from being famous in the past?", "Should celebrities have the right to a completely private life?"],
  "sc-05": ["Why do people like visiting historical places?", "What effects can mass tourism have on local communities?", "Who should be responsible for protecting historical sites?", "Do you think virtual tours could ever replace real travel?"],
  "sc-06": ["Why is it becoming harder to find quiet places in cities?", "Do people need more time alone nowadays than in the past?", "How does constant noise affect people's health and concentration?", "Should cities create more quiet public spaces, such as libraries and gardens?"],
  "sc-07": ["What makes a city a good place to live?", "Why do so many young people move from the countryside to big cities?", "What problems does rapid population growth cause in cities?", "How do you think cities will change over the next fifty years?"],
  "sc-08": ["Why are parks important in cities?", "Should land in cities be used for parks or for new housing?", "Do people today spend less time in nature than previous generations did?", "How can people be encouraged to spend more time outdoors?"],
  "sc-09": ["Why do people keep objects that have sentimental value?", "Do you think people today own too many things?", "How have the things young people want to own changed over time?", "Is it better to repair old things or replace them with new ones?"],
  "sc-10": ["Why do people give gifts on special occasions?", "Is a homemade gift more meaningful than one bought in a shop?", "How do gift-giving customs differ between cultures?", "Do people place too much importance on expensive gifts nowadays?"],
  "sc-11": ["How has technology changed the way people communicate?", "Why do some older people find it harder to adapt to new technology?", "Do you think people rely too much on technology nowadays?", "What technological developments do you expect to see in the next twenty years?"],
  "sc-12": ["Why do some people care so much about fashion?", "Should schools and workplaces require people to wear uniforms?", "How have clothing styles in your country changed over the past generation?", "What are the environmental effects of cheap, fast fashion?"],
  "sc-13": ["Why are celebrations important in people's lives?", "Are traditional celebrations becoming less popular among young people?", "Have big celebrations such as weddings become too extravagant?", "How might the way people celebrate change in the future?"],
  "sc-14": ["Why do people enjoy watching live sports events?", "Do major events like the World Cup bring real benefits to the host country?", "How has television changed the way people experience sport?", "Why do some sports attract far more fans than others?"],
  "sc-15": ["Why is it important to keep traditional festivals alive?", "How have festivals in your country changed compared with the past?", "Is globalisation making festivals around the world more similar?", "Should children learn about the festivals of other cultures at school?"],
  "sc-16": ["Why are some people more willing than others to help strangers?", "Do people help their neighbours less than they did in the past?", "Should schools encourage students to do volunteer work?", "Who should be mainly responsible for caring for elderly people, families or the state?"],
  "sc-17": ["What are the most common problems people face when travelling?", "Is it better to plan a trip carefully or to be spontaneous?", "Has technology made travelling easier or more stressful?", "Do you think people will travel more or less in the future? Why?"],
  "sc-18": ["Why is punctuality more important in some cultures than in others?", "In what situations is it acceptable to be late?", "How do modern technologies help people manage their time?", "Do people today have more or less free time than in the past?"],
  "sc-19": ["Why do some people find change difficult to accept?", "What are the biggest changes that young people go through today?", "Is rapid change generally positive or negative for society?", "How has your country changed over the last twenty years?"],
  "sc-20": ["How do people usually share good news nowadays?", "Why do news programmes focus more on bad news than good news?", "Do people trust the news less than they used to?", "Should the media have a responsibility to report more positive stories?"],
  "sc-21": ["Is it easier for children or adults to learn new skills?", "Which skills will be most important for young people in the future?", "Should schools focus more on practical skills than on academic subjects?", "Can people learn a skill as well online as with a teacher in person?"],
  "sc-22": ["Why do many people stop exercising as they get older?", "What can governments do to encourage people to be more active?", "Are team sports better for children than individual sports?", "How has modern life made people less physically active?"],
  "sc-23": ["How are children's hobbies today different from those of previous generations?", "Should parents choose their children's hobbies?", "Do children spend too much time on screens instead of real hobbies?", "Can a hobby turn into a career? What are the advantages and risks?"],
  "sc-24": ["Why do some people find it hard to live a healthy lifestyle?", "Who is more responsible for people's health, individuals or the government?", "Should advertising unhealthy food to children be banned?", "How do you think people's health will change in the future?"],
  "sc-25": ["Do people read less than they did in the past? Why?", "What are the advantages of reading a book compared with watching its film?", "Will e-books eventually replace printed books?", "How can parents encourage children to read more?"],
  "sc-26": ["Why do people enjoy watching films so much?", "Can films change the way people think about social issues?", "Is it better to watch a film at the cinema or at home?", "Do films from other countries help people understand different cultures?"],
  "sc-27": ["How has the internet changed the way people get information?", "Do social media apps do more harm than good?", "Should there be age limits for using social media?", "How much should people worry about their privacy online?"],
  "sc-28": ["Why do people of different generations like different kinds of music?", "Should music be a compulsory subject at school?", "How has the internet changed the way people listen to music?", "Can music bring people from different cultures together?"],
  "sc-29": ["Why is it important for young people to set goals?", "What kinds of goals do people in your country usually have?", "Does success depend more on hard work or on luck?", "How do people's goals change as they get older?"],
  "sc-30": ["Who do young people usually turn to for advice when making decisions?", "Is it better to make important decisions alone or with others?", "Do young people today have more choices than their parents did?", "Should parents make important decisions for their teenage children?"]
};
