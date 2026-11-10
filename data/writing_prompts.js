/* ============================================================================
 * writing_prompts.js — Task 2 prompt bank.  DATA FILE — add prompts freely.
 * ----------------------------------------------------------------------------
 * GENERAL-INTEREST topics ONLY. Finance / accounting / business are
 * deliberately EXCLUDED: Ahmed's specialist vocabulary inflates Lexical
 * Resource scores on those topics and masks his real range.
 * ========================================================================== */
window.WRITING_PROMPTS = [
  /* -------- education -------- */
  { topic: "education", text: "Some people believe that university education should be free for all students. Others think students should pay for their own studies. Discuss both views and give your own opinion." },
  { topic: "education", text: "In some countries, children start school at a very young age. What are the advantages and disadvantages of starting school early?" },
  { topic: "education", text: "Some argue that practical skills like cooking and repairing should be taught in schools. To what extent do you agree or disagree?" },
  { topic: "education", text: "Online learning is becoming more common at all levels of education. Do the benefits of this development outweigh the drawbacks?" },

  /* -------- environment -------- */
  { topic: "environment", text: "Some people think environmental problems should be solved by governments, while others believe individuals are responsible. Discuss both views and give your opinion." },
  { topic: "environment", text: "Many cities are becoming more polluted and crowded. What are the causes of this, and what measures could be taken to solve these problems?" },
  { topic: "environment", text: "Some believe that banning plastic bags is the best way to protect the environment. To what extent do you agree or disagree?" },
  { topic: "environment", text: "Climate change is now a major concern worldwide. What effects does it have on society, and how can people adapt to it?" },

  /* -------- technology -------- */
  { topic: "technology", text: "Some people think that modern technology is making people more sociable, while others believe it makes them less sociable. Discuss both views and give your opinion." },
  { topic: "technology", text: "Children today spend a lot of time on smartphones and tablets. What problems does this cause, and what solutions can you suggest?" },
  { topic: "technology", text: "Artificial intelligence is increasingly used to do jobs that humans used to do. Do the advantages of this outweigh the disadvantages?" },
  { topic: "technology", text: "Some people believe that printed books will disappear because of digital reading. To what extent do you agree or disagree?" },

  /* -------- health -------- */
  { topic: "health", text: "In many countries, people are living longer than before. What are the reasons for this, and what challenges does it bring to society?" },
  { topic: "health", text: "Some people think governments should tax unhealthy foods to encourage healthy eating. To what extent do you agree or disagree?" },
  { topic: "health", text: "Prevention is better than cure. Some believe health budgets should focus on preventing illness rather than treating it. Discuss both views and give your opinion." },
  { topic: "health", text: "Many people today do not get enough physical exercise. What are the causes of this, and what can be done about it?" },

  /* -------- society -------- */
  { topic: "society", text: "In many countries, the gap between the rich and the poor is growing. What problems does this cause, and how can these problems be reduced?" },
  { topic: "society", text: "Some people believe that older family members should live with their adult children. Others think they should live independently. Discuss both views and give your opinion." },
  { topic: "society", text: "Many young people today move to big cities for work. What are the effects of this trend on both the cities and the places people leave behind?" },
  { topic: "society", text: "Some think that volunteering should be a compulsory part of every young person's life. To what extent do you agree or disagree?" },

  /* -------- culture -------- */
  { topic: "culture", text: "Some people believe that globalisation is causing local cultures and traditions to disappear. To what extent do you agree or disagree?" },
  { topic: "culture", text: "In some countries, museums and art galleries are free to visit. Others charge an entrance fee. Which do you think is better, and why?" },
  { topic: "culture", text: "Learning a foreign language is becoming increasingly important. What are the benefits of learning a new language beyond communication?" },
  { topic: "culture", text: "Some people prefer to spend their holidays in their own country, while others like to travel abroad. Discuss both preferences and give your own opinion." }
];

/* ============================================================================
 * Task 1 prompt bank — data given as TEXT because the app has no chart images.
 * data_rows[0] is the header and "|" separates columns, so every prompt can be
 * rendered as a simple table. type is one of: line, bar, table, pie, process, map.
 * Same GENERAL-INTEREST rule as above — no money / finance figures.
 * ========================================================================== */
window.WRITING_PROMPTS_T1 = [
  { "id": "t1-01", "type": "table",
    "text": "The table below shows the percentage of households with internet access in four countries in 2005, 2015 and 2025. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Country | 2005 | 2015 | 2025", "Country A | 25% | 62% | 91%", "Country B | 40% | 78% | 95%", "Country C | 8% | 35% | 70%", "Country D | 55% | 85% | 97%"] },
  { "id": "t1-02", "type": "line",
    "text": "The line graph below shows the number of international tourists, in millions, visiting three countries between 1995 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Year | Country A | Country B | Country C", "1995 | 12 | 20 | 5", "2000 | 15 | 22 | 8", "2005 | 21 | 23 | 14", "2010 | 26 | 24 | 22", "2015 | 30 | 23 | 31", "2020 | 33 | 22 | 38"] },
  { "id": "t1-03", "type": "bar",
    "text": "The bar chart below shows the average number of hours per week that people in three age groups spent on different leisure activities in one country in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Activity | Aged 18-30 | Aged 31-50 | Aged 51 and over", "Watching television | 8 | 11 | 16", "Using the internet | 20 | 14 | 6", "Sport and exercise | 6 | 4 | 3", "Reading | 2 | 4 | 7", "Socialising with friends | 9 | 6 | 5"] },
  { "id": "t1-04", "type": "pie",
    "text": "The pie chart below shows how people in a large city travelled to work in 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Mode of transport | Share", "Car | 42%", "Bus | 20%", "Train or metro | 18%", "Walking | 10%", "Bicycle | 8%", "Other | 2%"] },
  { "id": "t1-05", "type": "process",
    "text": "The diagram below shows the process of recycling glass bottles. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Step | Description", "1 | Used glass bottles are collected from household recycling bins and public collection points", "2 | The bottles are transported by lorry to a recycling plant", "3 | At the plant the bottles are sorted by colour and washed to remove labels and dirt", "4 | The clean glass is crushed into small pieces known as cullet", "5 | The cullet is mixed with a small amount of new sand and melted in a furnace at about 1500 degrees Celsius", "6 | The molten glass is poured into moulds and shaped into new bottles", "7 | The new bottles are cooled, filled with drinks and delivered to shops, where the cycle begins again"] },
  { "id": "t1-06", "type": "map",
    "text": "The maps below show the layout of a small coastal town called Seaview in 1990 and in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Period | Layout", "Before (1990) | A fishing harbour on the south coast with a row of fishing cottages behind it; farmland covering the north of the town; a single main road running from east to west; a small school and a church in the centre; dense forest along the east side", "After (2020) | The harbour has been converted into a marina for leisure boats, with a hotel and restaurants along the seafront; the farmland has been replaced by a housing estate and a supermarket; a ring road and a large car park have been added to the main road; the school has been extended while the church remains unchanged; half of the forest has been cleared for a golf course and the rest remains"] },
  { "id": "t1-07", "type": "line",
    "text": "The line graph below shows the number of students enrolled in four subjects at one university between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Year | Engineering | Medicine | Computer science | History", "2000 | 1000 | 750 | 300 | 1100", "2005 | 1100 | 800 | 500 | 1000", "2010 | 1200 | 800 | 900 | 900", "2015 | 1350 | 850 | 1500 | 700", "2020 | 1500 | 900 | 2100 | 500"] },
  { "id": "t1-08", "type": "table",
    "text": "The table below shows the percentage of electricity generated from different sources in one country in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    "data_rows": ["Source | 2000 | 2020", "Coal | 45% | 18%", "Natural gas | 25% | 30%", "Nuclear | 15% | 12%", "Hydroelectric | 10% | 15%", "Wind and solar | 5% | 25%"] }
];

/* -------- added 2026-11-10: 30 more Task 2 prompts (6 per question form) -------- */
window.WRITING_PROMPTS = window.WRITING_PROMPTS.concat([
  {"topic": "education", "type": "opinion", "text": "Some educators argue that art, music and drama should be given as much time in the school timetable as mathematics and science. To what extent do you agree or disagree?"},
  {"topic": "crime_law", "type": "opinion", "text": "It is sometimes suggested that people who commit minor crimes should do unpaid community work instead of being sent to prison. To what extent do you agree or disagree?"},
  {"topic": "media", "type": "opinion", "text": "Some people believe that reading or watching the news every day is an essential part of being a responsible citizen. To what extent do you agree or disagree?"},
  {"topic": "science", "type": "opinion", "text": "Some people believe that scientific research should only be carried out if it is likely to have an immediate practical benefit. To what extent do you agree or disagree?"},
  {"topic": "cities_transport", "type": "opinion", "text": "Some people think that private cars should be banned from city centres so that the streets can be used only by pedestrians, cyclists and public transport. To what extent do you agree or disagree?"},
  {"topic": "work_leisure", "type": "opinion", "text": "Some people think that free time should always be used productively, for example to learn a new skill, rather than simply to relax. To what extent do you agree or disagree?"},
  {"topic": "technology", "type": "discussion", "text": "Some people believe that self-driving vehicles will make roads safer and travel easier. Others worry that drivers will lose important skills and that the technology cannot be trusted. Discuss both views and give your own opinion."},
  {"topic": "environment", "type": "discussion", "text": "Some people think that the best way to protect wild animals is to create national parks and nature reserves. Others believe it is more effective to teach local communities how to live alongside wildlife. Discuss both views and give your own opinion."},
  {"topic": "health", "type": "discussion", "text": "Some people think that it is the school's job to teach children how to eat well and stay healthy. Others believe this is the responsibility of parents. Discuss both views and give your own opinion."},
  {"topic": "society", "type": "discussion", "text": "Some people believe that children who grow up with brothers and sisters are happier and more sociable than only children. Others think that only children benefit from more attention and fewer conflicts at home. Discuss both views and give your own opinion."},
  {"topic": "ageing", "type": "discussion", "text": "Some people think that workers should retire at a fixed age to make room for younger people. Others believe that people should be allowed to keep working for as long as they wish. Discuss both views and give your own opinion."},
  {"topic": "culture_tourism", "type": "discussion", "text": "Some people think that tourists should be required to respect the customs and traditions of the places they visit. Others believe that visitors should be free to behave as they would at home. Discuss both views and give your own opinion."},
  {"topic": "environment", "type": "problem_solution", "text": "In many parts of the world, fresh water is becoming scarce. What are the main causes of this problem, and what can be done to address it?"},
  {"topic": "cities_transport", "type": "problem_solution", "text": "Many cities suffer from constant noise from traffic, building sites and nightlife. What problems does this cause for residents, and how could cities reduce it?"},
  {"topic": "education", "type": "problem_solution", "text": "In many schools, students find it hard to concentrate in lessons, and teachers report increasing behaviour problems. What do you think are the causes, and what could be done to improve the situation?"},
  {"topic": "health", "type": "problem_solution", "text": "Many people in modern societies sleep less than they need to. What are the main causes of this, and what can be done about it?"},
  {"topic": "crime_law", "type": "problem_solution", "text": "Vandalism and graffiti damage public property in many cities. Why do you think young people commit these acts, and how could the problem be reduced?"},
  {"topic": "work_leisure", "type": "problem_solution", "text": "Many people have very little free time because of long working hours and long journeys to work. What problems can this cause, and how might they be reduced?"},
  {"topic": "media", "type": "two_part", "text": "Many people now get their news from social media rather than from newspapers or television. Why is this happening, and is it a positive or negative development?"},
  {"topic": "ageing", "type": "two_part", "text": "More and more older people take up new hobbies or learn new skills after they retire. Why do you think this is happening, and is it a positive development?"},
  {"topic": "society", "type": "two_part", "text": "Families today eat meals together less often than they did in the past. Why do you think this is, and does it matter?"},
  {"topic": "work_leisure", "type": "two_part", "text": "Many people prefer to watch sport on television rather than play it themselves. Why do you think this is, and is it a problem?"},
  {"topic": "science", "type": "two_part", "text": "Scientists are making rapid progress in areas such as genetics and robotics. Why do some people feel uneasy about these developments, and do you think their concerns are justified?"},
  {"topic": "technology", "type": "two_part", "text": "Many people now use their mobile phones to photograph everything they see instead of simply enjoying the moment. Why do people do this, and is it a positive or negative trend?"},
  {"topic": "technology", "type": "advantages_disadvantages", "text": "More and more people use voice assistants and smart devices in their homes to control lighting, heating and entertainment. Do the advantages of this development outweigh the disadvantages?"},
  {"topic": "health", "type": "advantages_disadvantages", "text": "Some hospitals and clinics now offer consultations by video call so that patients do not need to travel. What are the advantages and disadvantages of this development?"},
  {"topic": "culture_tourism", "type": "advantages_disadvantages", "text": "Many historic towns now welcome very large numbers of tourists every year. What are the advantages and disadvantages of this for local residents?"},
  {"topic": "education", "type": "advantages_disadvantages", "text": "Some schools now place students of different ages in the same class instead of grouping them by age. What are the advantages and disadvantages of this approach?"},
  {"topic": "environment", "type": "advantages_disadvantages", "text": "Many people now choose to buy second-hand clothes, furniture and electronic goods instead of new ones. Do the advantages of this trend outweigh the disadvantages?"},
  {"topic": "cities_transport", "type": "advantages_disadvantages", "text": "Many people choose to live in high-rise apartment blocks in city centres rather than in houses with gardens in the suburbs. What are the advantages and disadvantages of high-rise living?"}
]);

/* -------- added 2026-11-10: 12 more Task 1 prompts (invented, internally consistent data) -------- */
window.WRITING_PROMPTS_T1 = window.WRITING_PROMPTS_T1.concat([
  {"id": "t1-09", "type": "table", "text": "The table below shows the percentage of adults in three countries who visited each of five types of cultural venue at least once during 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Type of venue | Country A | Country B | Country C", "Cinema | 54% | 61% | 38%", "Museum | 33% | 28% | 41%", "Public library | 29% | 47% | 22%", "Theatre | 18% | 15% | 26%", "Live music event | 36% | 40% | 19%"]},
  {"id": "t1-10", "type": "table", "text": "The table below shows the percentage of people in five age groups who owned a smartphone in 2012, 2018 and 2024. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Age group | 2012 | 2018 | 2024", "18-24 | 62% | 94% | 99%", "25-34 | 55% | 91% | 98%", "35-49 | 38% | 82% | 96%", "50-64 | 19% | 60% | 88%", "65 and over | 6% | 29% | 64%"]},
  {"id": "t1-11", "type": "table", "text": "The table below shows the average number of passengers, in thousands, who used four forms of public transport in one city each day in 1995, 2005 and 2015. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Form of transport | 1995 | 2005 | 2015", "Bus | 520 | 480 | 410", "Metro | 210 | 340 | 560", "Tram | 90 | 85 | 130", "Ferry | 30 | 28 | 25"]},
  {"id": "t1-12", "type": "line", "text": "The line graph below shows the percentage of the population living in urban areas in three countries between 1960 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Year | Country A | Country B | Country C", "1960 | 35 | 18 | 70", "1975 | 48 | 25 | 76", "1990 | 62 | 37 | 80", "2005 | 74 | 51 | 83", "2020 | 82 | 66 | 85"]},
  {"id": "t1-13", "type": "line", "text": "The line graph below shows the average number of minutes per day that adults in one country spent using three types of media between 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Year | Television | Internet | Radio", "2000 | 165 | 10 | 60", "2005 | 170 | 35 | 55", "2010 | 168 | 75 | 50", "2015 | 150 | 120 | 42", "2020 | 125 | 170 | 38"]},
  {"id": "t1-14", "type": "line", "text": "The line graph below shows how much household waste, in kilograms per person per year, was recycled, sent to landfill or incinerated in one country between 1980 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Year | Recycled | Landfill | Incinerated", "1980 | 10 | 340 | 20", "1990 | 30 | 320 | 50", "2000 | 70 | 270 | 60", "2010 | 140 | 190 | 80", "2020 | 200 | 110 | 95"]},
  {"id": "t1-15", "type": "bar", "text": "The bar chart below shows the percentage of students at one university who used each of five ways of travelling to the campus in 2010 and 2022. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Way of travelling | 2010 | 2022", "Walking | 22% | 25%", "Cycling | 8% | 17%", "Bus | 30% | 24%", "Car | 35% | 28%", "Train | 5% | 6%"]},
  {"id": "t1-16", "type": "bar", "text": "The bar chart below shows the percentage of adults in three countries who took part in each of five free-time activities at least once a week. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Activity | Country A | Country B | Country C", "Walking or jogging | 58% | 45% | 63%", "Playing a team sport | 20% | 31% | 14%", "Gardening | 35% | 18% | 40%", "Cooking for pleasure | 42% | 50% | 33%", "Playing a musical instrument | 12% | 9% | 16%"]},
  {"id": "t1-17", "type": "bar", "text": "The bar chart below shows the percentage of total energy use that came from renewable sources in five countries in 2000 and 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Country | 2000 | 2020", "Country A | 12% | 30%", "Country B | 5% | 22%", "Country C | 28% | 41%", "Country D | 2% | 9%", "Country E | 18% | 19%"]},
  {"id": "t1-18", "type": "pie", "text": "The pie charts below show how households in one country used energy in 2000 and in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Use of energy | 2000 | 2020", "Space heating | 52% | 44%", "Water heating | 18% | 17%", "Lighting | 10% | 6%", "Cooking | 8% | 6%", "Electrical appliances and devices | 12% | 27%"]},
  {"id": "t1-19", "type": "pie", "text": "The pie charts below show the main way in which adults in one country got their daily news in 2005 and in 2023. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Main source of news | 2005 | 2023", "Television | 48% | 22%", "Newspapers | 24% | 8%", "Radio | 14% | 9%", "Websites and apps | 8% | 38%", "Social media | 6% | 23%"]},
  {"id": "t1-20", "type": "pie", "text": "The pie charts below show the main reason why visitors came to one region in 2000 and in 2020. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.", "data_rows": ["Main reason for visit | 2000 | 2020", "Beaches and swimming | 35% | 24%", "Historic sites | 25% | 28%", "Walking and nature | 15% | 26%", "Food and festivals | 10% | 14%", "Visiting family and friends | 15% | 8%"]}
]);
