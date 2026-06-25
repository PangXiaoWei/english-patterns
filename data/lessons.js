window.LESSONS = [
  {
    id: "subject-verb",
    level: "A2+",
    title: "英语句子先抓主语 + 动词",
    chineseTrigger: "谁 + 做什么",
    englishPattern: "Subject + Verb + Object / Place / Time",
    explanation: "中文可以省略主语，英语通常要先说清楚谁做、做什么，再放对象、地点和时间。",
    examples: [
      { en: "I study English every day.", zh: "我每天学习英语。", note: "I 是主语，study 是动作。" },
      { en: "I volunteer at City Mission on Fridays.", zh: "我每周五在 City Mission 做志愿者。", note: "地点和时间放在动作后面。" },
      { en: "The teacher explained the grammar.", zh: "老师解释了语法。", note: "先说谁，再说动作。" }
    ],
    commonMistakes: [{ wrong: "Today I want ask teacher.", right: "I want to ask the teacher today.", reason: "want 后面要用 to + 动词原形。" }],
    drills: [{ question: "我想今天问老师。", options: ["Today I want ask teacher.", "I want to ask the teacher today.", "I want asking teacher today."], answer: "I want to ask the teacher today.", explanation: "want to ask 是固定结构。" }],
    speakingTask: { prompt: "Say three things you do every week.", keywords: ["study", "volunteer", "call", "practise"] }
  },
  {
    id: "past-simple",
    level: "A2+",
    title: "过去发生的动作，动词要变过去式",
    chineseTrigger: "昨天 / 上周 / 具体过去时间 + 了",
    englishPattern: "Subject + past verb + object/place/time",
    explanation: "中文里的“去了、做了、打了电话”，英语通常用过去式表达。",
    examples: [
      { en: "I went to City Mission last Friday.", zh: "我上周五去了 City Mission。", note: "last Friday 是过去时间，go 变 went。" },
      { en: "I called Ben yesterday.", zh: "我昨天给 Ben 打了电话。", note: "call 变 called。" },
      { en: "I studied English last night.", zh: "我昨晚学了英语。", note: "study 变 studied。" }
    ],
    commonMistakes: [{ wrong: "I go to City Mission last Friday.", right: "I went to City Mission last Friday.", reason: "last Friday 已经是过去，go 要变 went。" }],
    drills: [{ question: "我昨天给 Ben 打了电话。", options: ["I call Ben yesterday.", "I called Ben yesterday.", "I have called Ben yesterday."], answer: "I called Ben yesterday.", explanation: "yesterday + 了 = 过去式。" }],
    speakingTask: { prompt: "Say three things you did last weekend.", keywords: ["went", "called", "studied", "volunteered"] }
  },
  {
    id: "was-were",
    level: "A2+",
    title: "过去的状态 / 当时在，用 was / were",
    chineseTrigger: "当时是 / 当时在 / 当时很...",
    englishPattern: "I/he/she/it + was; you/we/they + were",
    explanation: "过去不是动作，而是状态、地点、感觉时，常用 was / were。",
    examples: [
      { en: "I was at City Mission last Friday.", zh: "我上周五在 City Mission。", note: "在某地是状态。" },
      { en: "I was tired yesterday.", zh: "我昨天很累。", note: "感觉用 was。" },
      { en: "They were in class.", zh: "他们当时在上课。", note: "they 用 were。" }
    ],
    commonMistakes: [{ wrong: "I at City Mission yesterday.", right: "I was at City Mission yesterday.", reason: "英语句子需要动词，过去状态用 was。" }],
    drills: [{ question: "我昨天很累。", options: ["I tired yesterday.", "I was tired yesterday.", "I were tired yesterday."], answer: "I was tired yesterday.", explanation: "I + was。" }],
    speakingTask: { prompt: "Say where you were yesterday afternoon.", keywords: ["was", "at home", "in class", "tired"] }
  },
  {
    id: "past-continuous",
    level: "B1",
    title: "过去正在发生，用 was/were + ing",
    chineseTrigger: "当时正在...",
    englishPattern: "was / were + verb-ing",
    explanation: "如果想表达过去某个时间点正在进行的动作，用 was / were + ing。",
    examples: [
      { en: "I was volunteering when he called me.", zh: "他打电话时，我正在做志愿者。", note: "正在做，用 was volunteering。" },
      { en: "She was talking to the manager.", zh: "她当时正在和经理说话。", note: "talk 变 talking。" },
      { en: "They were working in the shop.", zh: "他们当时正在店里工作。", note: "they 用 were。" }
    ],
    commonMistakes: [{ wrong: "I was volunteer when he called me.", right: "I was volunteering when he called me.", reason: "was 后面的动作要加 ing。" }],
    drills: [{ question: "他打电话时，我正在学习。", options: ["I studied when he called me.", "I was studying when he called me.", "I have studied when he called me."], answer: "I was studying when he called me.", explanation: "当时正在 = was/were + ing。" }],
    speakingTask: { prompt: "Say what you were doing when someone called you.", keywords: ["was studying", "was working", "when he called"] }
  },
  {
    id: "present-perfect-experience",
    level: "B1",
    title: "做过 / 经历过，用 have/has + 过去分词",
    chineseTrigger: "过 / 有没有...过 / 从来没...过",
    englishPattern: "have / has + past participle",
    explanation: "“去了”是 went；“去过”是 have been。中文的“过”常触发现在完成时。",
    examples: [
      { en: "I've been to Japan.", zh: "我去过日本。", note: "去过 = have been。" },
      { en: "I've done volunteer work before.", zh: "我以前做过志愿者工作。", note: "做过 = have done。" },
      { en: "Have you ever eaten Indian food?", zh: "你吃过印度菜吗？", note: "吃过 = have eaten。" }
    ],
    commonMistakes: [{ wrong: "I went to Japan before.", right: "I've been to Japan before.", reason: "强调经历过，用 have been。" }],
    drills: [{ question: "我以前做过志愿者工作。", options: ["I did volunteer work before.", "I've done volunteer work before.", "I do volunteer work before."], answer: "I've done volunteer work before.", explanation: "做过 = have done。" }],
    speakingTask: { prompt: "Say three things you have done before.", keywords: ["I've been", "I've done", "I've eaten", "I've never"] }
  },
  {
    id: "to-verb",
    level: "A2+",
    title: "想要 / 需要 / 愿意做，用 to + 动词原形",
    chineseTrigger: "想做 / 需要做 / 愿意做 / 为了做",
    englishPattern: "want / need / would like / willing + to + verb",
    explanation: "want、need、would like 后面常接 to + 动词原形，不要加 ing。",
    examples: [
      { en: "I want to improve my speaking.", zh: "我想提高口语。", note: "want to improve。" },
      { en: "I need to practise English.", zh: "我需要练英语。", note: "need to practise。" },
      { en: "I'm willing to learn.", zh: "我愿意学习。", note: "willing to learn。" }
    ],
    commonMistakes: [{ wrong: "I want to improving my speaking.", right: "I want to improve my speaking.", reason: "to 后面用动词原形。" }],
    drills: [{ question: "我想提高口语。", options: ["I want improving my speaking.", "I want to improve my speaking.", "I want improve my speaking."], answer: "I want to improve my speaking.", explanation: "want to + 原形。" }],
    speakingTask: { prompt: "Say what you want to improve this month.", keywords: ["want to", "need to", "would like to"] }
  },
  {
    id: "ing-as-thing",
    level: "B1",
    title: "把动作当一件事，用 ing",
    chineseTrigger: "做这件事",
    englishPattern: "like/enjoy + ing; interested in + ing; thank you for + ing",
    explanation: "当动作像名词一样表示“一件事”，很多结构后面用 ing。",
    examples: [
      { en: "I like helping people.", zh: "我喜欢帮助别人。", note: "like + helping。" },
      { en: "I'm interested in learning practical English.", zh: "我对学习实用英语感兴趣。", note: "in 后面用 ing。" },
      { en: "Thank you for helping me.", zh: "谢谢你帮助我。", note: "for 后面用 ing。" }
    ],
    commonMistakes: [{ wrong: "I'm interested in learn English.", right: "I'm interested in learning English.", reason: "介词 in 后面用 ing。" }],
    drills: [{ question: "我喜欢帮助别人。", options: ["I like help people.", "I like helping people.", "I like to helping people."], answer: "I like helping people.", explanation: "like 后面可以用 ing。" }],
    speakingTask: { prompt: "Say three things you enjoy doing.", keywords: ["enjoy", "like", "interested in", "helping"] }
  },
  {
    id: "third-person-s",
    level: "A2+",
    title: "he / she / it 现在习惯动作加 s",
    chineseTrigger: "他 / 她 / 它 / 单数人名 现在经常...",
    englishPattern: "he / she / it / single noun + verb-s",
    explanation: "一般现在时里，he、she、it 或单数名词做主语时，动词通常加 s。",
    examples: [
      { en: "He likes coffee.", zh: "他喜欢咖啡。", note: "he + likes。" },
      { en: "She works in a shop.", zh: "她在商店工作。", note: "she + works。" },
      { en: "My mother lives in Nanjing.", zh: "我妈妈住在南京。", note: "单数主语 + lives。" }
    ],
    commonMistakes: [{ wrong: "Does he likes coffee?", right: "Does he like coffee?", reason: "does 已经带 s，后面动词回原形。" }],
    drills: [{ question: "她在商店工作。", options: ["She work in a shop.", "She works in a shop.", "She working in a shop."], answer: "She works in a shop.", explanation: "she + works。" }],
    speakingTask: { prompt: "Say three things one person in your life does every week.", keywords: ["works", "studies", "likes", "lives"] }
  },
  {
    id: "questions-do",
    level: "A2+",
    title: "问句发动机 do / does / did",
    chineseTrigger: "你做吗？他做吗？你做了吗？",
    englishPattern: "Do you + verb? Does he/she + verb? Did you + verb?",
    explanation: "一般问句常用 do / does / did 开头。did 已经表示过去，后面动词回原形。",
    examples: [
      { en: "Do you like coffee?", zh: "你喜欢咖啡吗？", note: "you 用 do。" },
      { en: "Does he work here?", zh: "他在这里工作吗？", note: "he 用 does，work 不加 s。" },
      { en: "Did you call Ben?", zh: "你给 Ben 打电话了吗？", note: "did 后面 call 用原形。" }
    ],
    commonMistakes: [{ wrong: "Did you went there?", right: "Did you go there?", reason: "did 已经表示过去，后面动词回原形。" }],
    drills: [{ question: "你昨天吃了什么？", options: ["What did you ate yesterday?", "What did you eat yesterday?", "What do you ate yesterday?"], answer: "What did you eat yesterday?", explanation: "did + eat。" }],
    speakingTask: { prompt: "Ask three questions about yesterday.", keywords: ["Did you", "What did you", "Where did you"] }
  },
  {
    id: "quantity",
    level: "B1",
    title: "数量词 too much / too many / enough / a few / a little",
    chineseTrigger: "太多 / 足够 / 几个 / 一点",
    englishPattern: "too many + 可数复数; too much + 不可数; a few + 可数; a little + 不可数",
    explanation: "先判断名词能不能数。questions 可以数，用 too many；work/time 不可数，用 too much。",
    examples: [
      { en: "I have too much work.", zh: "我有太多工作。", note: "work 不可数。" },
      { en: "I have too many questions.", zh: "我有太多问题。", note: "questions 可数复数。" },
      { en: "I need a little time.", zh: "我需要一点时间。", note: "time 不可数。" }
    ],
    commonMistakes: [{ wrong: "I have too many work.", right: "I have too much work.", reason: "work 不可数，用 much。" }],
    drills: [{ question: "我有太多问题。", options: ["I have too much questions.", "I have too many questions.", "I have enough questions."], answer: "I have too many questions.", explanation: "questions 可数复数，用 many。" }],
    speakingTask: { prompt: "Say what you have too much or too many of.", keywords: ["too much work", "too many questions", "enough time"] }
  },
  {
    id: "comparison",
    level: "B1",
    title: "比较级 / 最高级 / 一样 / 不同",
    chineseTrigger: "更 / 最 / 一样 / 相似 / 不同",
    englishPattern: "-er than; more ... than; the most ...; the same as; different from",
    explanation: "比较两个东西用 than；表达相同用 the same as；表达不同用 different from。",
    examples: [
      { en: "English is easier than German.", zh: "英语比德语容易。", note: "easier than。" },
      { en: "This is the most important thing.", zh: "这是最重要的事。", note: "the most important。" },
      { en: "My answer is different from your answer.", zh: "我的答案和你的不同。", note: "different from。" }
    ],
    commonMistakes: [{ wrong: "My answer is different with your answer.", right: "My answer is different from your answer.", reason: "different 搭配 from。" }],
    drills: [{ question: "我的答案和你的不同。", options: ["My answer is different with your answer.", "My answer is different from your answer.", "My answer different than your answer."], answer: "My answer is different from your answer.", explanation: "different from 是固定搭配。" }],
    speakingTask: { prompt: "Compare classroom English and real-life English.", keywords: ["faster than", "more difficult", "different from"] }
  },
  {
    id: "opinions",
    level: "B1+",
    title: "表达观点和原因",
    chineseTrigger: "我认为 / 对我来说 / 因为 / 但是 / 所以",
    englishPattern: "I think... For me,... because... but... so... although...",
    explanation: "口语到 B1 后，要能说观点、原因、转折和结果，不只是说事实。",
    examples: [
      { en: "I think speaking is more important than writing now.", zh: "我认为现在口语比写作更重要。", note: "I think 引出观点。" },
      { en: "I want to improve my speaking because I need real communication.", zh: "我想提高口语，因为我需要真实交流。", note: "because 给原因。" },
      { en: "Although grammar is difficult, I can understand it better with Chinese thinking.", zh: "虽然语法难，但用中文思维我能理解得更好。", note: "although 引出让步。" }
    ],
    commonMistakes: [{ wrong: "Because I need real communication, so I want improve speaking.", right: "I want to improve my speaking because I need real communication.", reason: "because 和 so 不要重复堆在同一句里；want 后面用 to。" }],
    drills: [{ question: "我想提高口语，因为我需要真实交流。", options: ["I want to improve my speaking because I need real communication.", "Because I need real communication so I want improve speaking.", "I want improving speaking because I need real communication."], answer: "I want to improve my speaking because I need real communication.", explanation: "want to + 原形；because 给原因。" }],
    speakingTask: { prompt: "Give your opinion about learning English.", keywords: ["I think", "For me", "because", "although"] }
  }
];
