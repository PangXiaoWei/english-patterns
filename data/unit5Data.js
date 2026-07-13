(function () {
  const q = (id, lesson, point, question, options, answer, explanation, example) => ({
    id: `u5-${id}`,
    lesson,
    point,
    question,
    options,
    answer,
    explanation,
    example
  });

  const reviewQuestions = [
    q(1, "5A", "pronouns", "This watch belongs to me. It is ___.", ["my", "mine", "me", "I"], "mine", "名词没有再次出现时，用名词性物主代词 mine。", "That blue bag is mine."),
    q(2, "5A", "pronouns", "Mia called Sam, but he didn't hear ___.", ["she", "her", "hers", "their"], "her", "动词 hear 后需要宾格 her。", "I saw her near the shop."),
    q(3, "5A", "pronouns", "We brought ___ own bags to the charity shop.", ["we", "us", "our", "ours"], "our", "名词 bags 前使用形容词性物主代词 our。", "Our bags are by the door."),
    q(4, "5A", "pronouns", "The keys are Ben's. They are ___.", ["him", "his", "he", "their"], "his", "单独表示‘他的东西’时用 his。", "The silver keys are his."),
    q(5, "5A", "pronouns", "Could you show ___ the receipt?", ["I", "my", "me", "mine"], "me", "show 后的人使用宾格 me。", "Please show me the label."),
    q(6, "5A", "pronouns", "That isn't our table. ___ is near the window.", ["Our", "Us", "Ours", "We"], "Ours", "代替 our table，用 Ours。", "Ours is the small one."),

    q(7, "5A", "whose-who's", "___ jacket is this?", ["Who", "Who's", "Whose", "Who is"], "Whose", "Whose 询问物品属于谁。", "Whose phone is on the desk?"),
    q(8, "5A", "whose-who's", "___ coming to the auction with us?", ["Whose", "Who's", "Who", "Whom"], "Who's", "Who's 是 who is 的缩写。", "Who's waiting outside?"),
    q(9, "5A", "whose-who's", "Do you know ___ bag was left here?", ["who's", "whose", "who", "who is"], "whose", "名词 bag 前用 whose 表示‘谁的’。", "I wonder whose coat this is."),
    q(10, "5A", "whose-who's", "___ the manager of this shop?", ["Whose", "Who's", "Who his", "Whos"], "Who's", "句意是‘谁是经理’，所以用 Who's。", "Who's responsible for the sale?"),
    q(11, "5A", "whose-who's", "___ offer did they accept?", ["Who's", "Whose", "Who is", "Who"], "Whose", "offer 是名词，前面用 whose。", "Whose idea was it?"),
    q(12, "5A", "whose-who's", "Tell me ___ using the computer now.", ["whose", "who's", "who", "whom"], "who's", "who's using = who is using。", "Who's using the meeting room?"),

    q(13, "5A", "there-then", "We looked at the shelf, but nothing was ___.", ["their", "then", "there", "they're"], "there", "there 表示地点‘那里’。", "Your parcel is over there."),
    q(14, "5A", "there-then", "First check the price, and ___ make an offer.", ["there", "their", "then", "than"], "then", "then 表示动作先后‘然后’。", "Finish the form, then send it."),
    q(15, "5A", "there-then", "Is ___ a label on the box?", ["then", "there", "their", "they"], "there", "There is 用来说明某物存在。", "There is a note inside."),
    q(16, "5A", "there-then", "Back ___, the shop only accepted cash.", ["there", "then", "than", "they're"], "then", "back then 表示‘那时候’。", "Life was quieter back then."),
    q(17, "5A", "there-then", "Put the chair over ___.", ["then", "there", "they're", "their"], "there", "over there 表示‘在那边’。", "The checkout is over there."),
    q(18, "5A", "there-then", "We paid, and ___ we carried the table home.", ["there", "than", "then", "their"], "then", "then 连接先后发生的事情。", "I called first, then I visited."),

    q(19, "5A", "money-value", "The shop asked $40, but I made a lower ___.", ["cost", "offer", "rent", "saving"], "offer", "offer 是买家提出的价格。", "They accepted my offer."),
    q(20, "5A", "money-value", "This old camera is rare and very ___.", ["value", "valuable", "price", "costly price"], "valuable", "valuable 是形容词，表示有价值的。", "The painting may be valuable."),
    q(21, "5A", "money-value", "The ticket ___ $18.", ["spends", "rents", "costs", "values"], "costs", "物品作主语时用 cost 表示价格。", "The repair costs $50."),
    q(22, "5A", "money-value", "I put part of my pay into ___.", ["savings", "prices", "offers", "auctions"], "savings", "savings 指存下来的钱。", "My savings paid for the laptop."),
    q(23, "5A", "money-value", "That seems like a ___ price for a used desk.", ["fair", "valuable", "saving", "rent"], "fair", "a fair price 表示价格合理。", "We agreed on a fair price."),
    q(24, "5A", "money-value", "They sold the signed book at an ___.", ["accommodation", "auction", "offer", "increase"], "auction", "auction 是拍卖。", "The lamp went to auction."),

    q(25, "5B", "countability", "I need some ___ about the bus route.", ["advices", "advice", "an advice", "advicees"], "advice", "advice 不可数，不能加 s 或直接用 an。", "She gave me some useful advice."),
    q(26, "5B", "countability", "There are three ___ in my suitcase.", ["luggage", "item", "items", "furniture"], "items", "item 是可数名词，three 后用复数。", "Please check all the items."),
    q(27, "5B", "countability", "The ___ is very heavy today.", ["traffics", "traffic", "a traffic", "traffic cars"], "traffic", "traffic 是不可数名词。", "Traffic is slow this morning."),
    q(28, "5B", "countability", "I received five ___ this morning.", ["message", "messages", "social media", "mail"], "messages", "message 可数，five 后用复数。", "I replied to two messages."),
    q(29, "5B", "countability", "We bought some second-hand ___.", ["furnitures", "furniture", "a furniture", "furniture itemses"], "furniture", "furniture 是不可数名词。", "The furniture is in good condition."),
    q(30, "5B", "countability", "The battery lasts about six ___.", ["hour", "hours", "time", "electricity"], "hours", "hour 是可数名词，six 后用复数。", "It takes two hours."),

    q(31, "5B", "quantifiers", "How ___ time do we have?", ["many", "much", "a few", "several"], "much", "time 在这里不可数，疑问句用 much。", "How much free time do you have?"),
    q(32, "5B", "quantifiers", "There are too ___ apps on my phone.", ["much", "many", "little", "a little"], "many", "apps 可数复数，用 too many。", "I get too many notifications."),
    q(33, "5B", "quantifiers", "I only have ___ money with me.", ["a few", "many", "a little", "few"], "a little", "money 不可数，用 a little 表示少量但还有一些。", "I have a little cash."),
    q(34, "5B", "quantifiers", "We need ___ chairs for the visitors.", ["a few", "a little", "much", "any money"], "a few", "chairs 可数复数，用 a few。", "I invited a few friends."),
    q(35, "5B", "quantifiers", "Is there ___ food left?", ["some", "any", "many", "a few"], "any", "一般疑问句中常用 any。", "Do you have any questions?"),
    q(36, "5B", "quantifiers", "We have ___ information to begin the task.", ["enough", "too many", "a few", "many"], "enough", "information 不可数，enough 可放在名词前。", "We have enough time."),

    q(37, "5C", "adjectives", "This travel bag is easy to carry because it is ___.", ["heavy", "light", "thick", "wide"], "light", "light 在这里表示重量轻。", "The case is strong but light."),
    q(38, "5C", "adjectives", "The screen is hard to see because it is too ___.", ["bright", "soft", "dark", "dry"], "dark", "看不清屏幕可能因为屏幕太暗。", "Turn it up; the screen is dark."),
    q(39, "5C", "adjectives", "This shelf can hold 50 kilos. It is very ___.", ["weak", "strong", "soft", "thin"], "strong", "能承受较大重量说明 strong。", "The metal frame is strong."),
    q(40, "5C", "adjectives", "The box has nothing in it. It is ___.", ["full", "empty", "wide", "wet"], "empty", "empty 表示里面是空的。", "The bottle is almost empty."),
    q(41, "5C", "adjectives", "The path is too ___ for two bikes.", ["wide", "narrow", "bright", "cool"], "narrow", "narrow 表示狭窄。", "The doorway is quite narrow."),
    q(42, "5C", "adjectives", "This towel isn't wet. It is completely ___.", ["dry", "hard", "cool", "plastic"], "dry", "dry 与 wet 相反。", "Keep the equipment dry."),

    q(43, "5C", "product-description", "Choose the best opening for a product pitch.", ["Do you have a problem with a heavy bag?", "This means the bag.", "It costs because.", "Maybe perfect you."], "Do you have a problem with a heavy bag?", "先从用户的问题开始，听起来最自然。", "Do you have a problem with a slow charger?"),
    q(44, "5C", "product-description", "It has a larger battery, ___ you can work longer.", ["but", "so", "because of", "whose"], "so", "so 引出功能带来的好处。", "It folds flat, so you can store it easily."),
    q(45, "5C", "product-description", "The bottle is made ___ metal.", ["from at", "of", "for", "by to"], "of", "看得出原材料时常用 be made of。", "The frame is made of metal."),
    q(46, "5C", "product-description", "It comes ___ three colours.", ["at", "on", "in", "to"], "in", "comes in + 颜色/尺寸表示有某些款式。", "It comes in black and blue."),
    q(47, "5C", "product-description", "This keyboard is perfect ___ people who travel.", ["to", "at", "for", "of"], "for", "perfect for + 人或用途。", "It's perfect for small desks."),
    q(48, "5C", "product-description", "Which sentence describes a benefit?", ["It has two USB ports.", "It is made of plastic.", "So you can charge two devices together.", "It comes in grey."], "So you can charge two devices together.", "benefit 说明这个功能对用户有什么用。", "So you can finish the job faster."),

    q(49, "5D", "borrow-lend", "Can I ___ your charger for an hour?", ["lend", "borrow", "offer", "rent to"], "borrow", "borrow 表示从别人那里借入。", "Can I borrow your pen?"),
    q(50, "5D", "borrow-lend", "Could you ___ me your umbrella?", ["borrow", "lend", "borrow from", "lent"], "lend", "lend 表示把东西借给别人。", "Could you lend me a cable?"),
    q(51, "5D", "borrow-lend", "I borrowed a toolkit ___ my neighbour.", ["to", "for", "from", "at"], "from", "borrow something from someone。", "I borrowed a book from Mia."),
    q(52, "5D", "borrow-lend", "Sam lent his tablet ___ me.", ["from", "to", "for", "by"], "to", "lend something to someone。", "She lent her notes to me."),
    q(53, "5D", "borrow-lend", "My colleague ___ me a headset yesterday.", ["borrowed", "lent", "lends from", "borrows to"], "lent", "别人把东西借给我，用 lent me。", "A friend lent me a camera."),
    q(54, "5D", "borrow-lend", "I need to give back the book I ___.", ["lent him", "borrowed", "offered", "cost"], "borrowed", "自己借入并要归还，用 borrowed。", "I returned the laptop I borrowed."),

    q(55, "5D", "two-objects", "She sent ___ yesterday.", ["me a message", "a message me", "to me a message", "me to a message"], "me a message", "send 可以使用 send + 人 + 物 的双宾语结构。", "Please send me the details."),
    q(56, "5D", "two-objects", "They offered ___.", ["a job me", "me a job", "to me a job", "me to job"], "me a job", "offer + 人 + 物。", "The company offered her a role."),
    q(57, "5D", "two-objects", "She bought coffee ___ me.", ["to", "from", "for", "at"], "for", "buy something for someone。", "I bought lunch for my friend."),
    q(58, "5D", "two-objects", "Could you show the photo ___ us?", ["for", "from", "to", "with"], "to", "show something to someone。", "He showed the email to me."),
    q(59, "5D", "two-objects", "My trainer taught ___.", ["English me", "me English", "to me English", "me to English"], "me English", "teach + 人 + 内容。", "She taught us a useful phrase."),
    q(60, "5D", "two-objects", "Please write ___.", ["me an email", "an email me", "to me an email", "me to email"], "me an email", "write + 人 + 物，也可说 write an email to me。", "Write me a short note."),
    q(61, "5A", "possessive-forms", "This is Emma's bag. It is ___ bag.", ["her", "hers", "she", "him"], "her", "her 后面可以直接接名词 bag。", "This is her notebook."),
    q(62, "5A", "possessive-forms", "This bag belongs to Emma. It is ___.", ["her", "hers", "she", "its"], "hers", "hers 独立使用，后面不再加名词。", "The blue umbrella is hers."),
    q(63, "5A", "possessive-forms", "We brought our tickets, but Sam forgot ___.", ["his", "him", "he", "her"], "his", "his 可独立代替 his ticket。", "I have my key, and he has his."),
    q(64, "5A", "possessive-forms", "The shop changed ___ opening hours.", ["it", "its", "it's", "it is"], "its", "its 表示‘它的’，后面接名词。", "The device is in its box."),
    q(65, "5A", "this-that", "___ lamp here is brighter than the one by the door.", ["This", "That", "Those", "Then"], "This", "this 指说话者身边的单数物品。", "This chair is comfortable."),
    q(66, "5A", "this-that", "Can you see ___ sign across the street?", ["this", "that", "these", "there"], "that", "that 指距离较远的单数事物。", "That building has a small shop."),
    q(67, "5A", "this-that", "The owner lowered the price. ___ made the offer more attractive.", ["This", "These", "There", "Then"], "This", "this 可以指代前面刚提到的整件事情。", "The battery lasts all day. This is very useful."),
    q(68, "5A", "this-that", "I remember ___ day because I found something special.", ["that", "this here", "there", "then"], "that", "that 常指已经过去或较远的时间和事情。", "That was a useful experience."),
    q(69, "5A", "reading", "What is the main idea of ‘A Box with a Quiet History’?", ["A box carried a forgotten local story.", "Leo became very rich.", "The shop closed after the sale.", "The photographs were modern."], "A box carried a forgotten local story.", "主旨是旧物保存了被遗忘的故事。", "An ordinary object can carry an important story."),
    q(70, "5A", "reading", "In the reading, what does ‘them’ refer to in ‘showed them the photographs’?", ["the archive staff", "the magazines", "the metal corners", "the prices"], "the archive staff", "them 指前面提到的 archive staff。", "Leo showed them the old photographs."),
    q(71, "5A", "reading", "Why did Leo give the photographs to the archive?", ["They could keep and share them safely.", "He disliked old photographs.", "The shop asked for them back.", "He wanted a new box."], "They could keep and share them safely.", "文章说明档案馆可以安全保存并制作电子副本。", "The archive could protect the photographs."),
    q(72, "5A", "reading", "In the reading, ‘historical value’ is closest to ___.", ["importance from the past", "a low shop price", "a modern design", "a repair cost"], "importance from the past", "historical value 指与过去和历史有关的重要性。", "The note has historical value for the town."),
    q(73, "5B", "writing", "Choose the clearest topic sentence.", ["Modern life can feel too fast for many people.", "Many and much are words.", "Fast because phones.", "People life too much."], "Modern life can feel too fast for many people.", "主题句要完整、清楚地引出观点。", "A slower routine can reduce daily stress."),
    q(74, "5B", "writing", "Choose the best supporting sentence for a slow-living paragraph.", ["I turn off notifications during dinner.", "Dinner notification very.", "A few traffic is slow.", "There are much phones."], "I turn off notifications during dinner.", "具体习惯可以有效支持慢生活观点。", "I leave my phone in another room while I read."),
    q(75, "5C", "writing", "Which sentence clearly connects a feature to a benefit?", ["It has soft straps, so it is comfortable to carry.", "It has straps because product.", "Soft straps are price.", "It comes benefit."], "It has soft straps, so it is comfortable to carry.", "用 so 说明功能带来的好处。", "It folds flat, so it is easy to store."),
    q(76, "5C", "writing", "Choose the most natural final recommendation.", ["It is a good choice for people who travel.", "Good choice people travel it.", "You buying this must.", "It is choice to travelling."], "It is a good choice for people who travel.", "推荐语要说明适合的人或场景。", "It is perfect for a small desk."),
    q(77, "5D", "practical-use", "Emma has a charger. Daniel needs it. Which sentence describes the direction correctly?", ["Emma lends the charger to Daniel.", "Emma borrows the charger from Daniel.", "Daniel lends Emma from the charger.", "The charger borrows Daniel."], "Emma lends the charger to Daniel.", "物品从 Emma 移向 Daniel，所以 Emma lends。", "Daniel borrows the charger from Emma."),
    q(78, "5D", "practical-use", "Choose the most polite request.", ["Could you lend me your pen for a minute?", "Give pen now.", "I borrow you pen.", "You must lend."], "Could you lend me your pen for a minute?", "Could you... 是清楚而礼貌的请求。", "Can I borrow your umbrella until this evening?"),
    q(79, "5D", "practical-use", "Which reply includes a clear return time?", ["No problem. I will return it tomorrow morning.", "Maybe item.", "I returned because.", "Borrow is good."], "No problem. I will return it tomorrow morning.", "借用时说明归还时间能减少误会。", "I can bring it back before lunch."),
    q(80, "5D", "practical-use", "Which follow-up question is useful after lending an item?", ["When do you need to use it until?", "Whose is lend?", "How many advice?", "Did you borrowing?"], "When do you need to use it until?", "确认借用时长是实用的后续问题。", "Can you return it before Friday?"),
  ];

  window.UNIT5_DATA = {
    id: "unit-5-things",
    title: "Unit 5 – Things",
    level: "A2+",
    description: "An independent A2+ English self-study module for vocabulary, grammar, reading, writing and practical speaking.",
    estimatedMinutes: 220,
    lessons: [
      { id: "5A", title: "Hidden Value", goal: "Describe ownership, value and an object with a special story.", minutes: 50, accent: "blue" },
      { id: "5B", title: "Living at a Slower Pace", goal: "Use countable nouns and quantifiers to discuss time and daily life.", minutes: 55, accent: "teal" },
      { id: "5C", title: "Describe and Recommend a Product", goal: "Build a clear, natural A2+ product recommendation.", minutes: 45, accent: "amber" },
      { id: "5D", title: "Borrowing, Lending and Giving", goal: "Ask politely and use two-object verbs in everyday situations.", minutes: 55, accent: "rose" }
    ],
    lessonA: {
      objectives: ["money and value vocabulary", "possessive and object pronouns", "whose / who's", "there / then", "/s/ and /z/", "tell a lucky-find story"],
      quickStart: { question: "What can make an ordinary object valuable to someone?", model: "An ordinary object can be valuable because of its story, its owner, or a special memory." },
      pronouns: [
        ["I", "me", "my", "mine"], ["you", "you", "your", "yours"], ["he", "him", "his", "his"],
        ["she", "her", "her", "hers"], ["it", "it", "its", "—"], ["we", "us", "our", "ours"], ["they", "them", "their", "theirs"]
      ],
      reference: {
        sentence: "Maya picked up an old camera. She checked it carefully before buying it.",
        targets: { She: "Maya", it: "the old camera" }
      },
      contrasts: [
        { prompt: "___ phone is ringing?", options: ["Whose", "Who's"], answer: "Whose", zh: "询问‘谁的手机’，名词前用 whose。" },
        { prompt: "___ waiting near the counter?", options: ["Whose", "Who's"], answer: "Who's", zh: "Who's = who is。" },
        { prompt: "The receipt is over ___.", options: ["there", "then"], answer: "there", zh: "there 表示地点。" },
        { prompt: "Check the label, and ___ pay.", options: ["there", "then"], answer: "then", zh: "then 表示先后顺序。" }
      ],
      vocabulary: [
        ["price", "/praɪs/", "价格", "What's the price of this lamp?"],
        ["cost", "/kɔːst/", "花费；价钱", "The repair cost more than the chair."],
        ["value", "/ˈvæljuː/", "价值", "The watch has a value of about $80."],
        ["valuable", "/ˈvæljuəbl/", "有价值的", "The old poster may be valuable."],
        ["fair price", "/feə praɪs/", "合理价格", "That is a fair price for a used table."],
        ["offer", "/ˈɒfə/", "报价", "I made an offer of $25."],
        ["savings", "/ˈseɪvɪŋz/", "积蓄", "I used some savings to buy it."],
        ["spend", "/spend/", "花费", "I don't want to spend too much."],
        ["rent", "/rent/", "租用", "We rent the equipment by the day."],
        ["increase", "/ɪnˈkriːs/", "增加", "The price may increase next month."],
        ["auction", "/ˈɔːkʃn/", "拍卖", "They sold the camera at an auction."],
        ["decrease", "/dɪˈkriːs/", "减少；下降", "The price may decrease after the weekend."],
        ["cheap", "/tʃiːp/", "便宜的", "The frame was cheap but strong."],
        ["expensive", "/ɪkˈspensɪv/", "昂贵的", "A new one would be expensive."],
        ["second-hand", "/ˌsekənd ˈhænd/", "二手的", "Maya bought a second-hand chair."],
        ["owner", "/ˈoʊnər/", "主人；所有者", "The owner kept the original receipt."],
        ["sell", "/sel/", "出售", "They plan to sell the old desk."],
        ["buy", "/baɪ/", "购买", "I decided to buy the lamp."],
        ["local shop", "/ˈloʊkəl ʃɑːp/", "本地商店", "I found the lamp in a local shop."]
      ],
      pronunciation: [
        ["this", "/ðɪs/", "final /s/"], ["whose", "/huːz/", "final /z/"], ["price", "/praɪs/", "final /s/"],
        ["savings", "/ˈseɪvɪŋz/", "final /z/"], ["costs", "/kɑːsts/", "final /s/ cluster"], ["offers", "/ˈɔːfərz/", "final /z/"],
        ["rents", "/rents/", "final /s/"], ["spends", "/spendz/", "final /z/"]
      ],
      reading: {
        title: "A Box with a Quiet History",
        paragraphs: [
          "On a rainy Saturday, Leo visited a small second-hand shop near the bus station. He wasn't looking for anything special. He only wanted a cheap shelf for his apartment. At the back of the shop, there was a wooden box under a pile of old magazines. Its lid was dusty, but the metal corners were still bright.",
          "Leo asked the shop assistant, ‘Whose box is this?’ She didn't know. It had arrived with some donated furniture. The price was twelve dollars, so Leo made an offer of ten. The assistant accepted it. When Leo got home, he cleaned the box and found a small envelope inside. There were six black-and-white photographs and a note from 1964.",
          "The note mentioned a local theatre group. Leo searched online and found that one person in the photographs was a well-known costume designer. He contacted a community archive and showed them the photographs. They weren't worth a huge amount of money, but they had real historical value. The archive offered to keep them safely and create digital copies.",
          "Leo gave the original photographs to the archive, but he kept the box. For him, the best part wasn't making money. It was finding a forgotten story and helping other people see it again. The box now sits beside his desk, and it reminds him to look carefully at ordinary things. He also visits the archive sometimes and enjoys seeing the photographs used in small community displays. Sometimes a lucky find is valuable because of the story it carries, not because of its price."
        ],
        questions: [
          { question: "Main idea: Why was the box a special find?", answer: "It carried a forgotten local story." },
          { question: "True or false: Leo entered the shop to find valuable photographs.", answer: "False. He wanted a cheap shelf." },
          { question: "Information match: What was inside the box?", answer: "Six photographs and a note from 1964." },
          { question: "Pronoun reference: Who does ‘them’ refer to when Leo showed them the photographs?", answer: "The people at the community archive." },
          { question: "Word meaning: What does ‘historical value’ mean here?", answer: "Importance connected with the past." }
        ]
      },
      speaking: {
        prompt: "Describe an object that is valuable to someone.",
        modes: [
          { seconds: 20, frame: "This object belongs to ___. It is valuable because ___. It looks ___." },
          { seconds: 45, frame: "Name the owner → describe the object → explain its story → compare price and value → say why it matters." }
        ]
      }
    },
    lessonB: {
      objectives: ["countable and uncountable nouns", "quantifiers", "weak forms", "Slow Living and Slow Learning"],
      quickStart: { question: "What part of your day feels too fast?", model: "My mornings feel too fast because I check too many messages before breakfast." },
      countable: ["job", "apartment", "song", "hour", "message", "word", "battery", "suitcase", "bus", "item", "chair", "bottle", "idea", "question"],
      uncountable: ["work", "money", "advice", "furniture", "luggage", "traffic", "transport", "accommodation", "food", "music", "free time", "social media", "electricity", "information", "equipment", "homework"],
      quantifiers: [
        ["many / much", "many + 可数复数；much + 不可数", "We don't have much time.", "× many time"],
        ["a few / a little", "a few + 可数；a little + 不可数", "I have a little free time.", "× a few money"],
        ["too many / too much", "数量过多，带负面感觉", "There is too much traffic.", "× too many traffic"],
        ["some / any", "肯定句常用 some；疑问和否定常用 any", "Do you have any advice?", "× an advice"],
        ["enough", "足够；放在名词前", "We have enough food.", "× foods enough"],
        ["a lot of / lots of", "可数和不可数都能使用", "She gets a lot of messages.", "× a lot messages"],
        ["a bit of", "少量 + 不可数名词，语气自然", "I need a bit of advice.", "× a bit chairs"],
        ["no", "no + 名词，动词保持肯定形式", "There is no traffic today.", "× There isn't no traffic."]
      ],
      weakForms: [
        ["a lot of", "ə ˈlɒt əv", "of 常弱读为 /əv/"], ["lots of", "ˈlɒts əv", "of 弱读"],
        ["a bit of", "ə ˈbɪt əv", "a 和 of 都变轻"], ["a little", "ə ˈlɪtl", "a 弱读 /ə/"], ["some", "səm", "非强调时常读 /səm/"], ["enough", "ɪˈnʌf", "首音节轻读，重音在第二音节"]
      ],
      listening: {
        title: "Slow Learning Is Still Real Learning",
        lines: [
          "People often think faster learning is always better.",
          "They watch many short videos, save lots of notes, and move quickly to the next topic.",
          "But the brain needs a little quiet time to connect new information with old knowledge.",
          "Slow learning means choosing fewer things and practising them more carefully.",
          "You might learn five useful phrases, say them aloud, and use them again the next day.",
          "This can feel slower, but it often creates stronger memories and more confident speaking.",
          "The goal isn't to study for many hours. The goal is to give important ideas enough attention."
        ],
        questions: [
          { question: "What does the brain need?", options: ["More apps", "A little quiet time", "Too much information"], answer: "A little quiet time" },
          { question: "What is one slow-learning example?", options: ["Saving many videos", "Learning five phrases carefully", "Studying all night"], answer: "Learning five phrases carefully" },
          { question: "What is the main goal?", options: ["More hours", "Faster reading", "Enough attention"], answer: "Enough attention" }
        ],
        dictation: "Slow learning gives important ideas enough attention."
      },
      reading: {
        title: "A Quieter Hour Every Evening",
        paragraphs: [
          "Emma works in a busy office and used to carry the speed of her day into the evening. She answered messages while making dinner, watched short videos while eating, and checked social media before going to bed. She had a lot of information, but she did not have much quiet time. Her evenings felt full, yet she often could not remember what she had watched or read.",
          "One Monday, Emma tried a simple experiment. She called it her quieter hour. From seven to eight, she put her phone in a drawer and chose one slow activity. Sometimes she cooked a new meal. On other evenings, she read a few pages of a book, repaired a small item, or listened to some music without doing anything else.",
          "At first, the hour felt unusually long. Emma wanted to check her messages after only ten minutes. After a week, however, she noticed a change. She slept better and had a little more energy in the morning. She also remembered more of what she read because she gave it enough attention. There was no complicated system and no long list of rules.",
          "Emma still uses her phone and enjoys busy days. Her goal is not to make every part of life slow. She simply wants a better balance between activity and rest. The quieter hour gives her enough space to finish one thing carefully. It also reminds her that free time does not need to be filled with lots of information to be useful."
        ],
        questions: [
          { question: "What is the main idea?", answer: "One quiet hour helped Emma create a better balance." },
          { question: "True or false: Emma stopped using her phone completely.", answer: "False." },
          { question: "Find one quantifier used with an uncountable noun.", answer: "much quiet time / a little more energy / enough attention" },
          { question: "What would you do during a quieter hour?", answer: "Open answer." }
        ]
      },
      speaking: ["Is modern life too fast?", "Do people have enough free time?", "What would you change in your daily routine?"]
    },
    lessonC: {
      objectives: ["common adjective pairs", "features and benefits", "short product presentation", "natural recommendation language"],
      quickStart: { question: "What product makes your daily life easier?", model: "My insulated cup is useful because it keeps drinks hot for hours." },
      adjectivePairs: [["light", "heavy"], ["thick", "thin"], ["soft", "hard"], ["strong", "weak"], ["bright", "dark"], ["wet", "dry"], ["empty", "full"], ["wide", "narrow"], ["hot", "cool"], ["plastic", "metal"], ["cheap", "expensive"], ["simple", "complicated"], ["comfortable", "uncomfortable"]],
      pitchChoices: {
        problem: ["a phone battery that runs out too quickly", "a heavy bag on the bus", "an uncomfortable office chair", "cold coffee during a long task"],
        product: ["a water bottle", "an office chair", "a desk lamp", "headphones", "a backpack", "a phone stand", "a travel bag", "a kitchen tool", "a small speaker", "a laptop stand"],
        feature: ["a large battery and two charging ports", "soft straps and a strong, light frame", "three support levels and a washable cover", "a tight lid and a double metal wall"],
        material: ["recycled plastic", "water-resistant fabric", "soft foam", "stainless steel"],
        size: ["small", "medium", "large", "compact and easy to store"],
        benefit: ["charge two devices at the same time", "carry your things without hurting your shoulders", "sit more comfortably for longer", "keep your drink hot for several hours"],
        audience: ["people who travel", "students and commuters", "people who work at a desk", "anyone with a busy day"],
        price: ["$24", "$39", "$45", "$28"],
        colours: ["black, blue and silver", "green, grey and red", "black and grey", "blue, white and red"]
      },
      pitchSteps: [
        ["Problem", "Do you have a problem with...?"], ["Situation", "Maybe your..."], ["Solution", "Here is a simple solution..."],
        ["Feature", "It has... / It is made of... / It comes with... / It comes in..."], ["Benefit", "This means... / So you can... / It helps you..."],
        ["Recommendation", "It is useful for... / It is a good choice for... / It is perfect for..."], ["Price and options", "It costs... / It comes in two sizes. / It is available in three colours."]
      ],
      speaking: { prompt: "Introduce a real product in 45–60 seconds.", ideas: ["phone", "insulated cup", "office chair", "headphones", "computer tool"] }
    },
    lessonD: {
      objectives: ["borrow vs lend", "verbs with two objects", "polite requests", "write about lending something"],
      quickStart: { question: "What do people often borrow from you?", model: "People sometimes borrow my charger, but I usually need it back the same day." },
      direction: ["Someone lends something to me.", "I borrow something from someone."],
      comparisons: [
        ["My friend lent me a laptop.", "I borrowed a laptop from my friend."],
        ["Nina lent her notes to Kai.", "Kai borrowed Nina's notes."]
      ],
      doubleObjects: ["lend me your phone", "give me some advice", "show me the photo", "send me a message", "buy me coffee", "teach me English", "offer me a job", "write me an email", "pass me the salt", "bring me some water"],
      transformations: [
        ["I lent my sister some money.", "I lent some money to my sister."],
        ["She bought me coffee.", "She bought coffee for me."],
        ["He sent us the details.", "He sent the details to us."],
        ["They offered Mia a job.", "They offered a job to Mia."]
      ],
      dialogue: [
        "Can you lend me your charger?", "Sure, but I need it back this evening.",
        "Sorry, I'm using it at the moment.", "Have you ever lent something and not got it back?"
      ],
      roleplay: {
        items: ["charger", "umbrella", "pen", "headphones", "book", "bicycle", "laptop stand", "travel bag", "jacket", "kitchen tool"],
        people: ["a classmate", "a colleague", "a neighbour", "a friend"],
        reasons: ["your battery is almost empty", "it has started raining", "you need it for a short task", "yours is being repaired"],
        returns: ["this afternoon", "this evening", "tomorrow morning", "before the weekend"],
        replies: ["Sure, no problem.", "Yes, but I need it back soon.", "Sorry, I'm using it right now.", "I can lend it to you after lunch."],
        followUps: ["Can you return it before dinner?", "Will you need it for long?", "Could you keep it dry?", "Can you send me a reminder?"]
      },
      writing: {
        prompt: "A time someone borrowed something.",
        min: 85,
        max: 90,
        structure: ["When and where", "Who needed what", "What you said", "What happened next", "How you felt"],
        model: "Last month, a colleague needed a laptop charger during an afternoon task. I lent her mine because her battery was almost empty. She said she would return it before we left. Later, I needed to join an online meeting, but I forgot that she still had it. I sent her a message, and she brought it back straight away. She also bought me a coffee to say thank you. Everything was fine, but now I always ask when an item will be returned. It makes borrowing and lending much easier for everyone."
      }
    },
    reviewQuestions,
    challenge: {
      minutes: 35,
      reading: {
        text: "A community workshop started a tool library so people didn't need to buy equipment they only used once or twice. Members can borrow drills, garden tools and repair kits for a week. The service saves money and reduces waste. At first, some tools came back late, so the team introduced reminder messages and a simple return calendar. Now most items return on time, and more people are offering useful equipment to the library.",
        question: "Why did the workshop start the tool library?",
        options: ["To sell old equipment", "To help people share equipment", "To teach product design", "To increase shop prices"],
        answer: "To help people share equipment"
      },
      writingPrompt: "Write 85–100 words about an item you bought, found, borrowed or lent. Explain what happened and why the item mattered.",
      practicalPrompts: ["Choose a polite request for borrowing an item.", "Choose a clear product recommendation.", "Choose the correct return-time reply."]
    },
    vocabularyNotes: [["lorry", "truck"], ["flat", "apartment"], ["holiday", "vacation"], ["shop", "store"]]
  };
})();
