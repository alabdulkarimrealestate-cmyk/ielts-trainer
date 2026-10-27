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
