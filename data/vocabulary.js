(function () {
  const wordPath = text => `public/audio/en-us/words/${slugify(text)}.mp3`;
  const phrasePath = text => `public/audio/en-us/phrases/${slugify(text)}.mp3`;
  const examplePath = id => `public/audio/en-us/examples/${id}-1.mp3`;
  const pairPath = text => `public/audio/en-us/minimal-pairs/${slugify(text)}.mp3`;

  function slugify(value) {
    return String(value)
      .toLowerCase()
      .replace(/\//g, "-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  const seeds = [
    ["accept", "word", "Core Verbs", "A2", 1, "接受", "to say yes to something", "I accepted the volunteer shift.", "我接受了这个志愿者班次。", "accept an offer", ["verb", "daily", "work"]],
    ["improve", "word", "Core Verbs", "A2", 1, "提高", "to make something better", "I want to improve my speaking.", "我想提高我的口语。", "improve my speaking", ["verb", "speaking"]],
    ["explain", "word", "Core Verbs", "A2", 1, "解释", "to make something clear", "Can you explain this again?", "你能再解释一遍吗？", "explain the problem", ["classroom", "support"]],
    ["repeat", "word", "Classroom English", "A2", 1, "重复", "to say something again", "Could you repeat that, please?", "你能重复一遍吗？", "repeat that", ["classroom", "speaking"]],
    ["permission", "word", "IT Support English", "B1", 1, "权限", "the right to do something", "I do not have permission to open this file.", "我没有权限打开这个文件。", "file permission", ["it", "support"]],
    ["restart", "word", "IT Support English", "A2", 1, "重启", "to start again", "Please restart the computer and try again.", "请重启电脑再试一次。", "restart the computer", ["it", "support"]],
    ["reliable", "word", "Job Search English", "B1", 1, "可靠的", "someone people can trust", "I am reliable and I always arrive on time.", "我很可靠，而且总是准时到。", "a reliable worker", ["job", "work"]],
    ["available", "word", "Job Search English", "A2", 1, "有空的；可用的", "free or ready to use", "I am available on Friday afternoon.", "我周五下午有空。", "available on Friday", ["job", "daily"]],
    ["appointment", "word", "Health & Feelings", "A2", 1, "预约", "a planned meeting", "I would like to make an appointment.", "我想预约。", "make an appointment", ["health", "daily"]],
    ["receipt", "word", "Shopping & Supermarket", "A2", 1, "收据", "a paper that shows what you paid", "Can I have a receipt, please?", "可以给我一张收据吗？", "get a receipt", ["shopping", "payment"]],
    ["refund", "word", "Shopping & Supermarket", "B1", 2, "退款", "money returned to you", "I would like to ask for a refund.", "我想申请退款。", "ask for a refund", ["shopping", "payment"]],
    ["balance", "word", "Bank & Payment", "A2", 2, "余额", "the amount of money left", "Can you check my balance?", "你能帮我查一下余额吗？", "check my balance", ["bank", "payment"]],
    ["platform", "word", "Transport & Directions", "A2", 2, "站台", "where you wait for a train", "Which platform does the train leave from?", "这趟火车从哪个站台出发？", "which platform", ["transport"]],
    ["dizzy", "word", "Health & Feelings", "A2", 2, "头晕的", "feeling like you may fall", "I feel dizzy today.", "我今天感觉头晕。", "feel dizzy", ["health"]],
    ["comfortable", "word", "Homestay English", "A2", 2, "舒服的", "feeling good and relaxed", "The room is clean and comfortable.", "这个房间干净又舒服。", "comfortable room", ["home", "daily"]],
    ["check in", "phrase", "Phrasal Verbs", "A2", 1, "登记；报到", "to arrive and report your presence", "I need to check in at the front desk.", "我需要在前台登记。", "check in at the front desk", ["travel", "daily"]],
    ["look after", "phrase", "Phrasal Verbs", "A2", 1, "照顾", "to take care of someone or something", "I can look after the front desk for ten minutes.", "我可以帮忙看十分钟前台。", "look after the desk", ["work", "volunteer"]],
    ["fill out", "phrase", "Classroom English", "A2", 1, "填写", "to complete a form", "Please fill out this form.", "请填写这张表格。", "fill out a form", ["classroom", "work"]],
    ["log in", "phrase", "Computer & Network", "A2", 1, "登录", "to enter a computer system", "I cannot log in to my account.", "我无法登录我的账户。", "log in to my account", ["it", "support"]],
    ["set up", "phrase", "IT Support English", "A2", 1, "设置；安装", "to make something ready to use", "I can help you set up the printer.", "我可以帮你设置打印机。", "set up the printer", ["it", "support"]],
    ["run into", "phrase", "Workplace English", "B1", 2, "遇到问题", "to meet a problem", "I ran into a problem with the update.", "我在更新时遇到了一个问题。", "run into a problem", ["work", "it"]],
    ["Could you say that again?", "sentence", "Useful Sentence Patterns", "A2", 1, "你能再说一遍吗？", "ask someone to repeat", "Could you say that again, please?", "你能再说一遍吗？", "say that again", ["classroom", "daily"]],
    ["I am not sure how to say this.", "sentence", "Useful Sentence Patterns", "A2", 1, "我不确定这个怎么说。", "useful when you cannot express an idea", "I am not sure how to say this in English.", "我不确定这个用英语怎么说。", "not sure how to say", ["speaking"]],
    ["Could you show me an example?", "sentence", "Classroom English", "A2", 1, "你能给我看一个例子吗？", "ask for an example", "Could you show me an example?", "你能给我看一个例子吗？", "show me an example", ["classroom"]],
    ["The WiFi is not working.", "sentence", "IT Support English", "A2", 1, "无线网络不能用。", "report a network problem", "The WiFi is not working on my laptop.", "我的笔记本电脑连不上无线网络。", "WiFi not working", ["it", "network"]],
    ["I would like to apply for this role.", "sentence", "Job Search English", "B1", 1, "我想申请这个职位。", "job application expression", "I would like to apply for this role.", "我想申请这个职位。", "apply for this role", ["job"]],
    ["I can help at the counter.", "sentence", "Volunteer English", "A2", 1, "我可以在柜台帮忙。", "volunteer task expression", "I can help at the counter today.", "我今天可以在柜台帮忙。", "help at the counter", ["volunteer"]],
    ["Where can I find this item?", "sentence", "Shopping & Supermarket", "A2", 1, "我在哪里可以找到这个商品？", "ask where something is", "Where can I find this item?", "我在哪里可以找到这个商品？", "find this item", ["shopping"]],
    ["I need to report a problem.", "sentence", "Workplace English", "A2", 1, "我需要报告一个问题。", "tell someone there is an issue", "I need to report a problem with the system.", "我需要报告系统的一个问题。", "report a problem", ["work", "it"]],
    ["Could I pay by card?", "sentence", "Bank & Payment", "A2", 1, "我可以刷卡支付吗？", "ask about card payment", "Could I pay by card?", "我可以刷卡支付吗？", "pay by card", ["payment"]]
  ];

  window.VOCABULARY = seeds.map(([text, type, category, level, priority, chinese, simpleDefinition, example, exampleChinese, shortPhrase, tags]) => {
    const id = slugify(text);
    return {
      id,
      type,
      text,
      category,
      level,
      priority,
      chinese,
      simpleDefinition,
      example,
      exampleChinese,
      shortPhrase,
      audio: {
        word: type === "phrase" ? phrasePath(text) : wordPath(text),
        example: examplePath(id)
      },
      tts: { wordText: text, exampleText: example },
      accent: "en-US",
      tags,
      commonMistake: "",
      minimalPair: "",
      mastered: false
    };
  });

  window.MINIMAL_PAIRS = [
    ["work", "walk", "短 /ɜːr/ 和 /ɔː/ 的区别", "I work in the morning.", "I walk to the bus stop."],
    ["live", "leave", "短 /ɪ/ 和长 /iː/ 的区别", "I live near the school.", "I leave at eight."],
    ["ship", "sheep", "短 /ɪ/ 和长 /iː/ 的区别", "The ship is big.", "The sheep is white."],
    ["full", "fool", "短 /ʊ/ 和长 /uː/ 的区别", "The bag is full.", "Do not act like a fool."],
    ["bed", "bad", "/e/ 和 /æ/ 的区别", "The bed is clean.", "The weather is bad."],
    ["sit", "seat", "短 /ɪ/ 和长 /iː/ 的区别", "Please sit here.", "This seat is free."],
    ["bit", "beat", "短 /ɪ/ 和长 /iː/ 的区别", "Wait a bit.", "We can beat this problem."],
    ["pull", "pool", "短 /ʊ/ 和长 /uː/ 的区别", "Pull the door.", "The pool is open."],
    ["rice", "rise", "清 /s/ 和浊 /z/ 的区别", "I bought rice.", "Prices may rise."],
    ["light", "right", "l 和 r 的区别", "Turn on the light.", "You are right."],
    ["very", "wary", "v 和 w 的区别", "It is very useful.", "Be wary of scams."],
    ["thin", "sin", "th 和 s 的区别", "The paper is thin.", "Lying is a sin."],
    ["think", "sink", "th 和 s 的区别", "I think so.", "The cup is in the sink."],
    ["three", "tree", "th 和 t 的区别", "I need three tickets.", "The tree is tall."],
    ["cheap", "chip", "长 /iː/ 和短 /ɪ/ 的区别", "This is cheap.", "The chip is broken."],
    ["cap", "cup", "/æ/ 和 /ʌ/ 的区别", "He wears a cap.", "This cup is clean."],
    ["not", "note", "短元音和双元音的区别", "It is not ready.", "Please write a note."],
    ["cut", "cart", "/ʌ/ 和 /ɑːr/ 的区别", "Cut the paper.", "Push the cart."],
    ["world", "word", "卷舌和辅音组合", "The world is changing.", "This word is useful."],
    ["clothes", "close", "th 弱读和 close 的区别", "These clothes are clean.", "Please close the door."]
  ].map(([a, b, chinese, exampleA, exampleB]) => ({
    id: `${slugify(a)}-${slugify(b)}`,
    category: "Minimal Pairs",
    wordA: a,
    wordB: b,
    chinese,
    exampleA,
    exampleB,
    audioA: pairPath(a),
    audioB: pairPath(b),
    ttsA: a,
    ttsB: b
  }));
})();
