(function () {
  window.PATTERN_FLOW_DATA = {
    brand: {
      name: "PatternFlow",
      subtitle: "English Patterns and Speaking Practice",
      description: "An independent English self-study platform for vocabulary, grammar, reading, writing and practical speaking."
    },
    speakingPrompts: [
      { id: "daily-1", category: "日常生活", question: "What is one small thing that makes your day easier?", keywords: ["usually", "helps me", "because"], model: "A simple daily plan makes my day easier. I write down three important tasks, so I can focus and avoid feeling too busy." },
      { id: "work-1", category: "工作沟通", question: "How do you ask for help when an instruction is not clear?", keywords: ["Could you", "show me", "one more time"], model: "I usually say, ‘Could you show me that one more time?’ Then I repeat the instruction to check that I understand it." },
      { id: "shop-1", category: "购物", question: "What do you check before you buy a second-hand item?", keywords: ["condition", "price", "works"], model: "I check the condition and compare the price. If it is an electronic item, I also ask if I can test it first." },
      { id: "borrow-1", category: "借东西", question: "Have you ever borrowed something and forgotten to return it?", keywords: ["borrowed", "remembered", "returned"], model: "Yes, I once borrowed a book and kept it for too long. I remembered it a week later, returned it, and apologised." },
      { id: "experience-1", category: "描述经历", question: "Tell me about a useful thing you found unexpectedly.", keywords: ["found", "looked", "useful"], model: "I found a small desk lamp in a local shop. It looked old, but it worked well and was perfect for reading." },
      { id: "opinion-1", category: "表达观点", question: "Do you think modern life is too fast?", keywords: ["I think", "too much", "need more"], model: "I think modern life can feel too fast. People receive too many messages and often need more quiet time." },
      { id: "product-1", category: "产品介绍", question: "Recommend a useful product for someone who works at a desk.", keywords: ["It has", "This means", "perfect for"], model: "I recommend a simple laptop stand. It is light and adjustable, so you can place the screen at a more comfortable height." },
      { id: "community-1", category: "社区交流", question: "What makes a community space useful?", keywords: ["people can", "safe", "share"], model: "A useful community space is safe and welcoming. People can meet, learn new skills, and share useful information." },
      { id: "travel-1", category: "旅行", question: "What do you always put in your travel bag?", keywords: ["always", "in case", "easy to"], model: "I always carry a water bottle, a charger, and a light jacket. They are useful and easy to pack." },
      { id: "support-1", category: "技术支持", question: "How would you explain that an app is not working?", keywords: ["won't open", "keeps", "tried"], model: "The app won’t open and it keeps showing the same message. I’ve already restarted the device, but the problem is still there." },
      { id: "daily-2", category: "日常生活", question: "What would you change in your morning routine?", keywords: ["would like", "instead of", "more time"], model: "I would like to check my phone later and eat breakfast first. That would give me more quiet time in the morning." },
      { id: "work-2", category: "工作沟通", question: "How do you confirm that you understood a task?", keywords: ["So", "first", "is that right"], model: "I say, ‘So first I update the file, and then I send it to you. Is that right?’" },
      { id: "shop-2", category: "购物", question: "Describe a product that was good value for money.", keywords: ["cost", "quality", "still"], model: "I bought a simple backpack at a fair price. It was strong, comfortable, and it still looks good after a year." },
      { id: "borrow-2", category: "借东西", question: "What rules make borrowing and lending easier?", keywords: ["return", "on time", "take care"], model: "People should agree on a return time and take care of the item. A short reminder can also help." },
      { id: "opinion-2", category: "表达观点", question: "Do people have enough free time?", keywords: ["not enough", "work", "balance"], model: "Many people do not have enough free time because work and daily tasks take too long. A better balance is important." }
    ],
    dailySentences: [
      "Could you say that again a little more slowly?",
      "I need a little more time to think about it.",
      "This one is mine, and that one is hers.",
      "There are too many messages on my phone.",
      "Could you lend me your charger for an hour?",
      "It is light, strong, and easy to carry.",
      "I found it in a second-hand shop last weekend.",
      "This means you can finish the task more easily."
    ],
    studioPrivacyTerms: [
      [112, 101, 97, 114, 115, 111, 110],
      [115, 112, 101, 97, 107, 111, 117, 116],
      [115, 99, 104, 111, 111, 108, 32, 116, 101, 115, 116],
      [111, 102, 102, 105, 99, 105, 97, 108, 32, 116, 101, 115, 116],
      [101, 120, 97, 109, 32, 112, 97, 112, 101, 114],
      [112, 97, 115, 116, 32, 112, 97, 112, 101, 114],
      [109, 111, 99, 107, 32, 116, 101, 115, 116],
      [99, 105, 116, 121, 32, 109, 105, 115, 115, 105, 111, 110],
      [115, 116, 117, 100, 101, 110, 116, 32, 118, 105, 115, 97],
      [104, 111, 109, 101, 115, 116, 97, 121],
      [112, 104, 111, 110, 101, 32, 110, 117, 109, 98, 101, 114],
      [101, 109, 97, 105, 108, 32, 97, 100, 100, 114, 101, 115, 115]
    ].map(points => String.fromCharCode(...points))
  };
})();
