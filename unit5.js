(function () {
  "use strict";

  const data = window.UNIT5_DATA;
  const root = document.getElementById("unit5App");
  if (!data || !root) return;

  const keys = {
    progress: "patternFlow.unit5.progress",
    knownWords: "patternFlow.knownWords",
    wrongAnswers: "patternFlow.wrongAnswers",
    voice: "patternFlow.voice",
    practiceScores: "patternFlow.practiceScores",
    preferences: "patternFlow.preferences",
    recordings: "patternFlow.unit5.recordings"
  };

  const steps = [
    ["quick", "快速理解"], ["vocabulary", "核心词汇"], ["learn", "句型与语法"],
    ["examples", "听与跟读"], ["practice", "控制练习"],
    ["realLife", "真实表达"], ["checkpoint", "自我检查"]
  ];

  const defaultProgress = {
    lessons: { "5A": [], "5B": [], "5C": [], "5D": [] },
    speaking: [],
    reviewBest: 0,
    challengeBest: 0,
    lastLocation: { page: "overview", lesson: "5A", step: "quick" },
    lastStudyDate: ""
  };

  const state = {
    page: "overview",
    lesson: "5A",
    step: "quick",
    progress: mergeProgress(readJSON(keys.progress, defaultProgress)),
    knownWords: readJSON(keys.knownWords, []),
    wrongAnswers: readJSON(keys.wrongAnswers, []),
    answers: {},
    referenceChoice: "",
    selectedSort: "",
    sortAssignments: {},
    listeningTextVisible: true,
    listeningSpeed: 0.9,
    followIndex: 0,
    followLoop: false,
    reviewFilter: "all",
    reviewQuestions: [],
    reviewSubmitted: false,
    challenge: null,
    roleplay: null,
    pitch: readJSON(keys.preferences, {}).unit5Pitch || {},
    savedPitchText: readJSON(keys.preferences, {}).unit5PitchText || "",
    productWritingText: "",
    writingText: "",
    vocabSearch: "",
    vocabCategory: "全部",
    vocabOnlyLearning: false,
    vocabRandomIds: [],
    currentRecordingId: ""
  };

  let mediaRecorder = null;
  let mediaStream = null;
  let recordingChunks = [];
  let recordingStartedAt = 0;
  let recordingTimer = null;
  const recordingUrls = new Map();
  let challengeTimer = null;
  let followToken = 0;

  function mergeProgress(saved) {
    return {
      ...defaultProgress,
      ...(saved || {}),
      lessons: { ...defaultProgress.lessons, ...(saved?.lessons || {}) },
      speaking: Array.isArray(saved?.speaking) ? saved.speaking : [],
      lastLocation: { ...defaultProgress.lastLocation, ...(saved?.lastLocation || {}) }
    };
  }

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : structuredCloneSafe(fallback);
    } catch {
      return structuredCloneSafe(fallback);
    }
  }

  function structuredCloneSafe(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function todayKey() {
    return new Date().toLocaleDateString("en-CA");
  }

  function saveProgress() {
    state.progress.lastLocation = { page: state.page, lesson: state.lesson, step: state.step };
    state.progress.lastStudyDate = todayKey();
    writeJSON(keys.progress, state.progress);
    writeJSON(keys.knownWords, state.knownWords);
    writeJSON(keys.wrongAnswers, state.wrongAnswers);
  }

  function markStep(lesson, step) {
    const list = state.progress.lessons[lesson] || [];
    if (!list.includes(step)) state.progress.lessons[lesson] = [...list, step];
    saveProgress();
  }

  function lessonPercent(id) {
    return Math.round(((state.progress.lessons[id] || []).length / steps.length) * 100);
  }

  function totalPercent() {
    const finished = Object.values(state.progress.lessons).reduce((sum, value) => sum + value.length, 0);
    return Math.round((finished / (steps.length * 4)) * 100);
  }

  function addWrong(question, chosen) {
    const existing = state.wrongAnswers.find(item => item.id === question.id);
    const next = {
      id: question.id,
      point: question.point,
      question: question.question,
      chosen,
      answer: question.answer,
      explanation: question.explanation,
      example: question.example,
      reviews: existing?.reviews || 0,
      correctStreak: 0,
      nextReview: todayKey(),
      updatedAt: new Date().toISOString()
    };
    state.wrongAnswers = [next, ...state.wrongAnswers.filter(item => item.id !== question.id)].slice(0, 120);
    saveProgress();
  }

  function audioButton(text, label = "播放", slow = false, className = "u5-audio") {
    return `<button type="button" class="${className}" data-u5-speak="${escapeAttr(text)}" data-u5-slow="${slow}">${label}</button>`;
  }

  function render() {
    root.innerHTML = `
      <section class="u5-shell">
        ${renderHeader()}
        <div class="u5-content">${renderPage()}</div>
      </section>
    `;
    populateVoiceSelect();
    updateChallengeClock();
  }

  function renderHeader() {
    return `
      <header class="u5-header">
        <div>
          <p class="eyebrow">A2+ COURSE MODULE</p>
          <h1>${data.title}</h1>
          <p>把语法、词汇、发音和真实输出连成一条学习路线。</p>
        </div>
        <div class="u5-header-actions">
          ${state.page !== "overview" ? `<button type="button" class="small-button" data-u5-page="overview">课程首页</button>` : ""}
          <label class="u5-voice-label">备用语音<select id="u5VoiceSelect" aria-label="选择备用英语语音"></select></label>
          <button type="button" class="small-button" data-u5-stop>停止朗读</button>
        </div>
        <div class="u5-total-progress" aria-label="Unit 5 总进度">
          <span style="width:${totalPercent()}%"></span>
        </div>
      </header>
    `;
  }

  function renderPage() {
    if (state.page === "vocabulary") return renderVocabularyExplorer();
    if (state.page === "review") return renderReview();
    if (state.page === "challenge") return renderChallenge();
    if (state.page === "lesson") return renderLesson();
    return renderOverview();
  }

  function renderOverview() {
    const next = nextBestAction();
    return `
      <section class="u5-summary-grid">
        <article><strong>${totalPercent()}%</strong><span>总进度</span></article>
        <article><strong>${state.knownWords.length}</strong><span>已掌握词汇</span></article>
        <article><strong>${Object.values(state.answers).filter(item => item?.choice).length}</strong><span>已完成练习</span></article>
        <article><strong>${state.wrongAnswers.length}</strong><span>Unit 5 错题</span></article>
        <article><strong>${data.estimatedMinutes} min</strong><span>预计学习时间</span></article>
      </section>

      <section class="u5-next-action">
        <div><span>最适合的下一步</span><h2>${escapeHtml(next.title)}</h2><p>${escapeHtml(next.reason)}</p></div>
        <button type="button" class="primary-button" data-u5-open="${next.lesson}" data-u5-step="${next.step}">继续学习</button>
      </section>

      <section class="u5-lesson-grid">
        ${data.lessons.map(lesson => `
          <article class="u5-lesson-card ${lesson.accent}">
            <div class="u5-card-top"><span>${lesson.id}</span><span>${lesson.minutes} min</span></div>
            <h2>${lesson.title}</h2>
            <p>${lesson.goal}</p>
            <div class="u5-card-progress"><span style="width:${lessonPercent(lesson.id)}%"></span></div>
            <div class="u5-card-footer"><strong>${lessonPercent(lesson.id)}%</strong><button type="button" data-u5-open="${lesson.id}" data-u5-step="${nextStepForLesson(lesson.id)}">${lessonPercent(lesson.id) ? "继续学习" : "开始学习"}</button></div>
          </article>
        `).join("")}
        <article class="u5-lesson-card review-card">
          <div class="u5-card-top"><span>REVIEW</span><span>15 questions</span></div>
          <h2>Chapter Review · 单元复习</h2><p>从 80 道原创题中随机训练，也可以只练一个知识点。</p>
          <div class="u5-card-footer"><strong>Best ${state.progress.reviewBest}%</strong><button type="button" data-u5-page="review">开始复习</button></div>
        </article>
        <article class="u5-lesson-card vocab-card">
          <div class="u5-card-top"><span>VOCABULARY</span><span>60+ words</span></div>
          <h2>Unit 5 词汇中心</h2><p>搜索、分类、随机复习，并只查看尚未掌握的词。</p>
          <div class="u5-card-footer"><strong>${state.knownWords.length} known</strong><button type="button" data-u5-page="vocabulary">打开词汇</button></div>
        </article>
        <article class="u5-lesson-card challenge-card">
          <div class="u5-card-top"><span>UNIT 5 CHALLENGE</span><span>${data.challenge.minutes} min</span></div>
          <h2>综合挑战</h2><p>Grammar, Vocabulary, Reading, Writing and Practical Use.</p>
          <div class="u5-card-footer"><strong>Best ${state.progress.challengeBest}%</strong><button type="button" data-u5-page="challenge">开始挑战</button></div>
        </article>
        <article class="u5-lesson-card review-card">
          <div class="u5-card-top"><span>WRONG ANSWERS</span><span>${state.wrongAnswers.length} items</span></div>
          <h2>错题复习</h2><p>按近期错误和正确次数安排复习频率。</p>
          <div class="u5-card-footer"><strong>${state.wrongAnswers.length}</strong><button type="button" data-u5-page="review" data-u5-wrong-only="true">复习错题</button></div>
        </article>
      </section>

      <section class="u5-language-note">
        <h2>英式与美式词汇都保留</h2>
        ${data.vocabularyNotes.map(pair => `<span>${pair[0]} / ${pair[1]} ${audioButton(`${pair[0]}. ${pair[1]}.`, "听")}</span>`).join("")}
      </section>
    `;
  }

  function nextStepForLesson(id) {
    const done = state.progress.lessons[id] || [];
    return steps.find(([key]) => !done.includes(key))?.[0] || "checkpoint";
  }

  function nextBestAction() {
    const lesson = data.lessons.find(item => lessonPercent(item.id) < 100);
    if (lesson) return { lesson: lesson.id, step: nextStepForLesson(lesson.id), title: `${lesson.id} ${lesson.title}`, reason: "继续上次未完成的步骤，避免一次学太多。" };
    if (state.wrongAnswers.length) return { lesson: "5A", step: "practice", title: "修复 Unit 5 错题", reason: `还有 ${state.wrongAnswers.length} 道错题值得再做一次。` };
    return { lesson: "5A", step: "realLife", title: "做一次 45 秒真实表达", reason: "把已经会认的内容转成真正能说出的英语。" };
  }

  function renderLesson() {
    const lesson = data.lessons.find(item => item.id === state.lesson);
    if (state.step !== "checkpoint") markStep(state.lesson, state.step);
    return `
      <section class="u5-lesson-heading">
        <div><span>${lesson.id} · ${data.level}</span><h2>${lesson.title}</h2><p>${lesson.goal}</p></div>
        <strong>${lessonPercent(lesson.id)}%</strong>
      </section>
      <nav class="u5-step-tabs" aria-label="课程学习步骤">
        ${steps.map(([key, label]) => `<button type="button" class="${state.step === key ? "active" : ""} ${(state.progress.lessons[state.lesson] || []).includes(key) ? "visited" : ""}" data-u5-step="${key}">${label}</button>`).join("")}
      </nav>
      <section class="u5-step-panel">${renderLessonStep()}</section>
      <div class="u5-step-nav">
        ${stepNavigationButton(-1)}${stepNavigationButton(1)}
      </div>
    `;
  }

  function stepNavigationButton(direction) {
    const index = steps.findIndex(([key]) => key === state.step);
    const next = steps[index + direction];
    if (!next) return "";
    return `<button type="button" class="${direction > 0 ? "primary-button" : "small-button"}" data-u5-step="${next[0]}">${direction > 0 ? "下一步" : "上一步"} · ${next[1]}</button>`;
  }

  function renderLessonStep() {
    if (state.step === "quick") return renderQuickStart();
    if (state.step === "practice") return renderPractice(false);
    if (state.step === "checkpoint") return renderPractice(true);
    const renderer = {
      "5A": { learn: render5ALearn, vocabulary: render5AVocabulary, examples: render5APronunciation, realLife: render5ASpeaking },
      "5B": { learn: render5BLearn, vocabulary: render5BVocabulary, examples: render5BPronunciation, realLife: render5BSpeaking },
      "5C": { learn: render5CLearn, vocabulary: render5CVocabulary, examples: render5CPronunciation, realLife: render5CSpeaking },
      "5D": { learn: render5DLearn, vocabulary: render5DVocabulary, examples: render5DPronunciation, realLife: render5DSpeaking }
    }[state.lesson]?.[state.step];
    return renderer ? renderer() : "";
  }

  function lessonData() {
    return ({ "5A": data.lessonA, "5B": data.lessonB, "5C": data.lessonC, "5D": data.lessonD })[state.lesson];
  }

  function renderQuickStart() {
    const item = lessonData().quickStart;
    return `
      <article class="u5-focus-card">
        <span>2–3 MINUTE WARM-UP</span>
        <h2>${item.question}</h2>
        <div class="u5-button-row">${audioButton(item.question, "听问题")}${audioButton(item.question, "慢速", true)}</div>
        <div class="u5-model-answer"><strong>参考回答</strong><p>${item.model}</p>${audioButton(item.model, "听回答")}</div>
        ${recordingPanel(`${state.lesson}-quick`, "先听，再用自己的信息回答。")}
      </article>
      <article class="u5-objective-card"><h3>本课目标</h3><div class="u5-chip-list">${lessonData().objectives.map(item => `<span>${item} ${audioButton(item, "听")}</span>`).join("")}</div></article>
    `;
  }

  function render5ALearn() {
    const d = data.lessonA;
    const selectedTarget = d.reference.targets[state.referenceChoice];
    const pronounExamples = [
      ["I / me / my / mine", "我作主语 / 我作宾语 / 我的 + 名词 / 我的东西", "I found a bag. Sam called me. My bag is blue. The blue one is mine."],
      ["you / you / your / yours", "你作主语或宾语 / 你的 + 名词 / 你的东西", "You found it. I called you. Your key is here. This one is yours."],
      ["he / him / his / his", "他作主语 / 他作宾语 / 他的 + 名词 / 他的东西", "He owns it. I asked him. His phone is new. The old one is his."],
      ["she / her / her / hers", "她作主语 / 她作宾语 / 她的 + 名词 / 她的东西", "She bought it. I helped her. Her bag is light. That bag is hers."],
      ["it / it / its", "它作主语或宾语 / 它的 + 名词", "It looks old. I cleaned it. Its handle is metal."],
      ["we / us / our / ours", "我们作主语 / 我们作宾语 / 我们的 + 名词 / 我们的东西", "We found it. Emma called us. Our table is here. This table is ours."],
      ["they / them / their / theirs", "他们作主语 / 他们作宾语 / 他们的 + 名词 / 他们的东西", "They sold it. I met them. Their shop is open. The boxes are theirs."]
    ];
    return `
      <div class="u5-two-column">
        <article class="u5-card"><h3>代词对照表</h3><div class="u5-pronoun-table"><div><b>主格</b><b>宾格</b><b>形容词性物主</b><b>名词性物主</b></div>${d.pronouns.map(row => `<div>${row.map(item => `<span>${item} ${item !== "—" ? audioButton(item, "听") : ""}</span>`).join("")}</div>`).join("")}</div></article>
        <article class="u5-card"><h3>指代高亮练习</h3><p>${d.reference.sentence}</p><div class="u5-button-row">${Object.keys(d.reference.targets).map(key => `<button type="button" data-u5-reference="${key}" class="${state.referenceChoice === key ? "active" : ""}">${key}</button>`).join("")}</div>${selectedTarget ? `<div class="u5-feedback good"><b>${state.referenceChoice}</b> 代替 <mark>${selectedTarget}</mark>。</div>` : `<p class="u5-muted">点击代词，查看它代替的人或物。</p>`}${audioButton(d.reference.sentence, "播放整句")}</article>
      </div>
      <article class="u5-card"><h3>每组代词在句子中的作用</h3><div class="u5-pronoun-examples">${pronounExamples.map(row => `<div><b>${row[0]}</b><span>${row[1]}</span><p>${row[2]} ${audioButton(row[2], "正常")}${audioButton(row[2], "慢速", true)}</p></div>`).join("")}</div></article>
      <article class="u5-card"><h3>所有关系视觉转换</h3><div class="u5-possession-flow"><div><span>PERSON</span><b>Emma</b></div><i>owns →</i><div><span>OBJECT</span><b>a bag</b></div><i>becomes →</i><div><span>POSSESSION</span><b>her bag / hers</b></div></div><div class="u5-structure-compare"><p>This is <u>Emma's</u> bag. ${audioButton("This is Emma's bag.", "听")}</p><p>→ This is <u>her bag</u>. <small>her + noun</small> ${audioButton("This is her bag.", "听")}</p><p>→ This bag is <u>hers</u>. <small>hers 独立使用</small> ${audioButton("This bag is hers.", "听")}</p></div></article>
      <article class="u5-card"><h3>Whose / Who's · There / Then</h3><div class="u5-mini-questions">${d.contrasts.map((item, index) => renderMiniQuestion(`contrast-${index}`, item.prompt, item.options, item.answer, item.zh)).join("")}</div></article>
      <article class="u5-card"><h3>This / That：不只表示距离</h3><div class="u5-three-logic"><div><b>当前 / 近处</b><p>This lamp here is mine.</p>${audioButton("This lamp here is mine.", "听")}</div><div><b>远处 / 过去</b><p>That shop across the street is open.</p>${audioButton("That shop across the street is open.", "听")}</div><div><b>指代前文</b><p>The owner lowered the price. This made the offer better.</p>${audioButton("The owner lowered the price. This made the offer better.", "听")}</div></div></article>
      ${renderReading(d.reading)}
    `;
  }

  function renderReading(reading) {
    return `<article class="u5-card u5-reading"><div class="u5-card-title"><div><span>ORIGINAL A2+ READING</span><h3>${reading.title}</h3></div>${audioButton(reading.paragraphs.join(" "), "全文播放")}</div>${reading.paragraphs.map(paragraph => `<p>${paragraph} ${audioButton(paragraph, "听本段")}</p>`).join("")}<div class="u5-reading-questions">${reading.questions.map(item => `<details><summary>${item.question} ${audioButton(item.question, "听题")}</summary><p>${item.answer} ${audioButton(item.answer, "听答案")}</p></details>`).join("")}</div></article>`;
  }

  function render5AVocabulary() {
    return renderWordCards(allUnitVocabulary().filter(item => item.lesson === "5A"));
  }

  const wordInfo = {
    job: ["/dʒɑːb/", "工作"], apartment: ["/əˈpɑːrtmənt/", "公寓"], song: ["/sɔːŋ/", "歌曲"], hour: ["/ˈaʊər/", "小时"], message: ["/ˈmesɪdʒ/", "消息"], word: ["/wɜːrd/", "单词"], battery: ["/ˈbætəri/", "电池"], suitcase: ["/ˈsuːtkeɪs/", "行李箱"], bus: ["/bʌs/", "公共汽车"], item: ["/ˈaɪtəm/", "物品"], chair: ["/tʃer/", "椅子"], bottle: ["/ˈbɑːtl/", "瓶子"], idea: ["/aɪˈdiːə/", "想法"], question: ["/ˈkwestʃən/", "问题"],
    work: ["/wɜːrk/", "工作"], money: ["/ˈmʌni/", "钱"], advice: ["/ədˈvaɪs/", "建议"], furniture: ["/ˈfɜːrnɪtʃər/", "家具"], luggage: ["/ˈlʌɡɪdʒ/", "行李"], traffic: ["/ˈtræfɪk/", "交通流量"], transport: ["/ˈtrænspɔːrt/", "交通运输"], accommodation: ["/əˌkɑːməˈdeɪʃən/", "住宿"], food: ["/fuːd/", "食物"], music: ["/ˈmjuːzɪk/", "音乐"], "free time": ["/ˌfriː ˈtaɪm/", "空闲时间"], "social media": ["/ˌsoʊʃəl ˈmiːdiə/", "社交媒体"], electricity: ["/ɪˌlekˈtrɪsəti/", "电力"], information: ["/ˌɪnfərˈmeɪʃən/", "信息"], equipment: ["/ɪˈkwɪpmənt/", "设备"], homework: ["/ˈhoʊmwɜːrk/", "家庭作业"],
    light: ["/laɪt/", "轻的"], heavy: ["/ˈhevi/", "重的"], thick: ["/θɪk/", "厚的"], thin: ["/θɪn/", "薄的"], soft: ["/sɔːft/", "柔软的"], hard: ["/hɑːrd/", "硬的"], strong: ["/strɔːŋ/", "结实的"], weak: ["/wiːk/", "薄弱的"], bright: ["/braɪt/", "明亮的"], dark: ["/dɑːrk/", "暗的"], wet: ["/wet/", "湿的"], dry: ["/draɪ/", "干的"], empty: ["/ˈempti/", "空的"], full: ["/fʊl/", "满的"], wide: ["/waɪd/", "宽的"], narrow: ["/ˈnæroʊ/", "窄的"], hot: ["/hɑːt/", "热的"], cool: ["/kuːl/", "凉的"], plastic: ["/ˈplæstɪk/", "塑料的"], metal: ["/ˈmetl/", "金属的"], cheap: ["/tʃiːp/", "便宜的"], expensive: ["/ɪkˈspensɪv/", "昂贵的"], simple: ["/ˈsɪmpl/", "简单的"], complicated: ["/ˈkɑːmplɪkeɪtɪd/", "复杂的"], comfortable: ["/ˈkʌmftərbəl/", "舒适的"], uncomfortable: ["/ʌnˈkʌmftərbəl/", "不舒适的"]
  };

  function allUnitVocabulary() {
    const lessonA = data.lessonA.vocabulary.map((item, index) => ({ id: `5A-${index}`, lesson: "5A", word: item[0], ipa: item[1], zh: item[2], pos: /^(spend|rent|increase|decrease|sell|buy)$/.test(item[0]) ? "verb" : "noun / adjective", category: "Money and Value", scenario: "shopping", example: item[3] }));
    const lessonB = [
      ...data.lessonB.countable.map((word, index) => ({ id: `5B-c-${index}`, lesson: "5B", word, ipa: wordInfo[word]?.[0] || "", zh: wordInfo[word]?.[1] || "可数名词", pos: "countable noun", category: "Countable Nouns", scenario: "daily life", example: `I need ${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}.` })),
      ...data.lessonB.uncountable.map((word, index) => ({ id: `5B-u-${index}`, lesson: "5B", word, ipa: wordInfo[word]?.[0] || "", zh: wordInfo[word]?.[1] || "不可数名词", pos: "uncountable noun", category: "Uncountable Nouns", scenario: "daily life", example: `We need some ${word}.` }))
    ];
    const lessonC = data.lessonC.adjectivePairs.flatMap((pair, index) => pair.map((word, side) => ({ id: `5C-${index}-${side}`, lesson: "5C", word, ipa: wordInfo[word]?.[0] || "", zh: wordInfo[word]?.[1] || "形容词", pos: "adjective", category: "Object Description", scenario: "product", opposite: pair[side ? 0 : 1], example: `The product is ${word}.` })));
    return [...lessonA, ...lessonB, ...lessonC];
  }

  function renderVocabularyExplorer() {
    const categories = ["全部", ...new Set(allUnitVocabulary().map(item => item.category))];
    let items = allUnitVocabulary().filter(item => state.vocabCategory === "全部" || item.category === state.vocabCategory);
    const query = state.vocabSearch.trim().toLowerCase();
    if (query) items = items.filter(item => [item.word, item.ipa, item.zh, item.example, item.category].some(value => String(value).toLowerCase().includes(query)));
    if (state.vocabOnlyLearning) items = items.filter(item => !state.knownWords.includes(item.id));
    if (state.vocabRandomIds.length) items = items.filter(item => state.vocabRandomIds.includes(item.id));
    return `<section class="u5-review-head"><div><span>UNIT 5 VOCABULARY</span><h2>词汇中心</h2><p>${allUnitVocabulary().length} 个核心词汇 · 已掌握 ${state.knownWords.length}</p></div><button type="button" class="small-button" data-u5-page="overview">课程首页</button></section><section class="u5-vocab-tools"><label>搜索<input id="u5VocabSearch" value="${escapeAttr(state.vocabSearch)}" placeholder="English / IPA / 中文 / example"></label><label>分类<select id="u5VocabCategory">${categories.map(item => `<option ${item === state.vocabCategory ? "selected" : ""}>${item}</option>`).join("")}</select></label><label class="u5-check-label"><input type="checkbox" id="u5OnlyLearning" ${state.vocabOnlyLearning ? "checked" : ""}> 只看未掌握</label><button type="button" class="small-button" data-u5-random-vocab>随机复习 10 个</button></section>${renderWordCards(items)}`;
  }

  function render5APronunciation() {
    return `<article class="u5-card"><h3>/s/ 与 /z/：看拼写，也听声带是否振动</h3><p class="u5-muted">/s/ 没有声带振动；/z/ 有声带振动。先慢速听，再正常跟读。</p><div class="u5-pron-grid">${data.lessonA.pronunciation.map(row => `<div><strong>${row[0]}</strong><span>${row[1]}</span><em>${row[2]}</em><div>${audioButton(row[0], "正常")}${audioButton(row[0], "慢速", true)}</div></div>`).join("")}</div></article>`;
  }

  function render5ASpeaking() {
    const d = data.lessonA.speaking;
    return `<article class="u5-focus-card"><span>FINAL SPEAKING</span><h2>${d.prompt}</h2>${audioButton(d.prompt, "听任务")}<div class="u5-mode-grid">${d.modes.map(mode => `<div><strong>${mode.seconds} 秒模式</strong><p>${mode.frame}</p>${audioButton(mode.frame, "听结构")}</div>`).join("")}</div>${recordingPanel("5A-speaking", "录完后回放一次，只检查是否说清楚了时间、物品、价格和意义。")}</article>`;
  }

  function render5BLearn() {
    const d = data.lessonB;
    const allNouns = [...d.countable, ...d.uncountable];
    return `
      <article class="u5-card"><div class="u5-card-title"><div><span>SORTING LAB</span><h3>可数 / 不可数名词分类</h3></div><button type="button" class="small-button" data-u5-reset-sort>重新分类</button></div><p class="u5-muted">可以拖入框中；键盘或手机上先点词，再点分类框。</p><div class="u5-sort-bank">${allNouns.filter(word => !state.sortAssignments[word]).map(word => `<div class="u5-sort-item"><button type="button" draggable="true" data-u5-sort-word="${word}" class="${state.selectedSort === word ? "selected" : ""}">${word}</button>${audioButton(word, "听")}</div>`).join("")}</div><div class="u5-sort-zones"><button type="button" data-u5-sort-zone="countable"><b>Countable</b><span>${Object.entries(state.sortAssignments).filter(([, value]) => value === "countable").map(([word]) => word).join(" · ") || "拖到这里"}</span></button><button type="button" data-u5-sort-zone="uncountable"><b>Uncountable</b><span>${Object.entries(state.sortAssignments).filter(([, value]) => value === "uncountable").map(([word]) => word).join(" · ") || "拖到这里"}</span></button></div>${renderSortFeedback()}</article>
      <article class="u5-card"><h3>数量词选择地图</h3><div class="u5-quantifier-grid">${d.quantifiers.map(row => `<div><h4>${row[0]} ${audioButton(row[0], "正常")}${audioButton(row[0], "慢速", true)}</h4><p>${row[1]}</p><p class="good-line">✓ ${row[2]} ${audioButton(row[2], "听例句")}</p><p class="bad-line">${row[3]}</p></div>`).join("")}</div></article>
      <article class="u5-card"><h3>中国学习者常见错误</h3><div class="u5-error-grid">${[["too much shoes", "too many shoes"], ["a few advice", "a little advice"], ["many furniture", "a lot of furniture"], ["an advice", "some advice / a piece of advice"], ["many luggage", "a lot of luggage"]].map(pair => `<div><span>✕ ${pair[0]}</span><b>✓ ${pair[1]}</b>${audioButton(pair[1], "播放正确表达")}</div>`).join("")}</div></article>
    `;
  }

  function renderSortFeedback() {
    const entries = Object.entries(state.sortAssignments);
    if (!entries.length) return "";
    const wrong = entries.filter(([word, zone]) => (data.lessonB.countable.includes(word) ? "countable" : "uncountable") !== zone);
    return `<div class="u5-feedback ${wrong.length ? "bad" : "good"}">${wrong.length ? `${wrong.map(([word]) => word).join("、")} 需要换一个分类。` : "目前的分类都正确。"}</div>`;
  }

  function render5BVocabulary() {
    return renderWordCards(allUnitVocabulary().filter(item => item.lesson === "5B"));
  }

  function render5BPronunciation() {
    const d = data.lessonB;
    return `
      <article class="u5-card"><h3>Weak Forms 弱读</h3><div class="u5-pron-grid">${d.weakForms.map(row => `<div><strong>${row[0]}</strong><span>${row[1]}</span><em>${row[2]}</em><div>${audioButton(row[0], "正常")}${audioButton(row[0], "慢速", true)}</div></div>`).join("")}</div></article>
      <article class="u5-card"><div class="u5-card-title"><div><span>GUIDED LISTEN AND REPEAT</span><h3>${d.listening.title}</h3></div><button type="button" class="small-button" data-u5-toggle-transcript>${state.listeningTextVisible ? "隐藏文本" : "显示文本"}</button></div><div class="u5-speed-control"><span>速度</span>${[0.7, 0.9, 1].map(rate => `<button type="button" class="${state.listeningSpeed === rate ? "active" : ""}" data-u5-listening-speed="${rate}">${rate}</button>`).join("")}<label>跟读停顿<select id="u5FollowPause"><option value="2">2 秒</option><option value="3" selected>3 秒</option><option value="4">4 秒</option></select></label><label><input type="checkbox" id="u5FollowLoop" ${state.followLoop ? "checked" : ""}> 逐句循环</label><button type="button" class="primary-button" data-u5-listen-all>全文播放</button><button type="button" class="small-button" data-u5-follow-read>自动跟读</button><button type="button" class="small-button" data-u5-follow-prev>上一句</button><button type="button" class="small-button" data-u5-follow-replay>重播当前句</button><button type="button" class="small-button" data-u5-follow-stop>停止</button></div><div class="u5-transcript ${state.listeningTextVisible ? "" : "hidden-text"}">${d.listening.lines.map((line, index) => `<p data-u5-follow-line="${index}"><b>${index + 1}</b><span>${line}</span>${audioButton(line, "逐句播放")}</p>`).join("")}</div><div class="u5-mini-questions">${d.listening.questions.map((item, index) => renderMiniQuestion(`listen-${index}`, item.question, item.options, item.answer, "重新听包含关键词的句子。" )).join("")}</div><div class="u5-dictation"><label>听写：${audioButton(d.listening.dictation, "播放", true)}<input type="text" aria-label="听写答案" data-u5-dictation placeholder="Type what you hear"></label><button type="button" class="small-button" data-u5-check-dictation>检查听写</button><p id="u5DictationFeedback"></p></div></article>
      ${renderReading(d.reading)}
    `;
  }

  function render5BSpeaking() {
    return `<div class="u5-two-column">${data.lessonB.speaking.map((prompt, index) => `<article class="u5-focus-card"><span>SPEAKING ${index + 1}</span><h2>${prompt}</h2>${audioButton(prompt, "听问题")}${recordingPanel(`5B-speaking-${index}`, "先给直接答案，再说一个原因和一个例子。")}</article>`).join("")}</div>`;
  }

  function render5CLearn() {
    const d = data.lessonC;
    return `<article class="u5-card"><h3>常用形容词对</h3><div class="u5-adjective-grid">${d.adjectivePairs.map(pair => `<div><button type="button" data-u5-speak="${pair[0]}">${pair[0]}</button><span>↔</span><button type="button" data-u5-speak="${pair[1]}">${pair[1]}</button></div>`).join("")}</div></article><article class="u5-card"><h3>Product Pitch 七步结构</h3><ol class="u5-timeline">${d.pitchSteps.map(step => `<li><b>${step[0]}</b><span>${step[1]}</span>${audioButton(step[1], "听")}</li>`).join("")}</ol></article>`;
  }

  function render5CVocabulary() {
    return renderWordCards(allUnitVocabulary().filter(item => item.lesson === "5C"));
  }

  function render5CPronunciation() {
    const lines = ["Do you have a problem with a heavy bag?", "Here's the answer.", "It has a strong, light frame.", "This means you can carry it comfortably.", "It's perfect for people who travel."];
    return `<article class="u5-card"><h3>产品介绍的重音与停顿</h3><p class="u5-muted">重读问题、产品、功能和好处。每个意思块之间做一个短停顿。</p><div class="u5-shadow-list">${lines.map(line => `<p><span>${line}</span>${audioButton(line, "正常")}${audioButton(line, "慢速", true)}</p>`).join("")}</div></article>`;
  }

  function render5CSpeaking() {
    const d = data.lessonC;
    const pitch = state.savedPitchText || buildPitch();
    const writingCount = countWords(state.productWritingText);
    return `<article class="u5-card u5-pitch-builder"><div class="u5-card-title"><div><span>PRODUCT PITCH BUILDER</span><h3>选择内容，自动生成完整产品介绍</h3></div><button type="button" class="small-button" data-u5-random-pitch>随机产品</button></div><div class="u5-builder-grid">${Object.entries(d.pitchChoices).map(([key, values]) => `<label>${pitchLabel(key)}<select data-u5-pitch="${key}">${values.map((value, index) => `<option value="${index}" ${Number(state.pitch[key] || 0) === index ? "selected" : ""}>${value}</option>`).join("")}</select></label>`).join("")}</div><label class="u5-edit-label">生成内容<textarea id="u5PitchText" rows="8">${escapeHtml(pitch)}</textarea></label><div class="u5-button-row">${audioButton(pitch, "正常播放")}${audioButton(pitch, "慢速播放", true)}<button type="button" class="small-button" data-u5-copy-pitch>复制</button><button type="button" class="small-button" data-u5-save-pitch>保存</button><button type="button" class="small-button" data-u5-clear-pitch>清空</button></div>${recordingPanel("5C-pitch", "目标 45–60 秒。录完后听一次，检查问题、功能、好处和推荐是否完整。")}</article><article class="u5-card"><h3>Write a short product description</h3><p>建议 70–100 词。结构：problem → feature → benefit → recommendation → price.</p><div class="u5-chip-list"><span>light / heavy</span><span>strong / weak</span><span>simple / complicated</span><span>comfortable / uncomfortable</span></div><label class="u5-edit-label">产品描述<textarea id="u5ProductWriting" rows="8" placeholder="Write 70–100 words...">${escapeHtml(state.productWritingText)}</textarea></label><p id="u5ProductWordCount" class="${writingCount >= 70 && writingCount <= 100 ? "good-text" : ""}">${writingCount} words</p><details><summary>查看原创参考答案</summary><p>This compact laptop stand is a simple solution for a low screen. It is made of strong, light metal and comes with an adjustable support. This means you can move the screen to a more comfortable height. The stand folds flat, so it is easy to carry in a travel bag. It is a good choice for people who work in different places. It comes in two sizes and three colours. The price starts at twenty-nine dollars. ${audioButton("This compact laptop stand is a simple solution for a low screen. It is made of strong, light metal and comes with an adjustable support. This means you can move the screen to a more comfortable height. The stand folds flat, so it is easy to carry in a travel bag. It is a good choice for people who work in different places. It comes in two sizes and three colours. The price starts at twenty-nine dollars.", "播放")}</p></details></article>`;
  }

  function pitchLabel(key) {
    return ({ problem: "Problem", product: "Product", feature: "Feature", material: "Material", size: "Size", benefit: "Benefit", audience: "Audience", price: "Price range", colours: "Colour" })[key] || key;
  }

  function buildPitch() {
    const c = data.lessonC.pitchChoices;
    const pick = key => c[key][Number(state.pitch[key] || 0) % c[key].length];
    return `Do you have a problem with ${pick("problem")}? Maybe your current product is not practical enough. Here is a simple solution: ${pick("product")}. It is ${pick("size")}, it has ${pick("feature")}, and it is made of ${pick("material")}. This means you can ${pick("benefit")}. It is a good choice for ${pick("audience")}. It is available in ${pick("colours")}, and it costs ${pick("price")}.`;
  }

  function render5DLearn() {
    const d = data.lessonD;
    return `<article class="u5-card"><h3>Borrow / Lend 动态方向图</h3><div class="u5-borrow-diagram"><div class="person">Emma</div><div class="moving-object"><span>lends a charger</span><i>→</i></div><div class="person">Daniel</div></div><p class="u5-example-line">Emma lent Daniel a charger. ${audioButton("Emma lent Daniel a charger.", "听")}</p><p class="u5-example-line">Daniel borrowed a charger from Emma. ${audioButton("Daniel borrowed a charger from Emma.", "听")}</p>${d.direction.map(line => `<p class="u5-example-line">${line} ${audioButton(line, "听")}</p>`).join("")}</article><article class="u5-card"><h3>同一件事，两种视角</h3>${d.comparisons.map(pair => `<div class="u5-compare-row"><p>${pair[0]} ${audioButton(pair[0], "听")}</p><span>⇄</span><p>${pair[1]} ${audioButton(pair[1], "听")}</p></div>`).join("")}</article><article class="u5-card"><h3>双宾语句型转换</h3>${d.transformations.map(pair => `<details><summary>${pair[0]} ${audioButton(pair[0], "听")}</summary><p>${pair[1]} ${audioButton(pair[1], "听答案")}</p></details>`).join("")}<div class="u5-two-column"><div class="u5-model-answer"><b>to 常用于</b><p>give · send · show · lend · offer · write</p>${audioButton("give to, send to, show to, lend to, offer to, write to", "听")}</div><div class="u5-model-answer"><b>for 常用于</b><p>buy · make · cook · get</p>${audioButton("buy for, make for, cook for, get for", "听")}</div></div></article>`;
  }

  function render5DVocabulary() {
    return renderWordCards(data.lessonD.doubleObjects.map((phrase, index) => ({ id: `5D-${index}`, word: phrase, ipa: "verb + person + thing", zh: "动词 + 人 + 物", example: `Could you ${phrase}?` })));
  }

  function render5DPronunciation() {
    return `<article class="u5-card"><h3>礼貌请求与自然回答</h3><div class="u5-shadow-list">${data.lessonD.dialogue.map(line => `<p><span>${line}</span>${audioButton(line, "正常")}${audioButton(line, "慢速", true)}</p>`).join("")}</div><button type="button" class="primary-button" data-u5-play-dialogue>播放整段对话</button></article>`;
  }

  function render5DSpeaking() {
    const r = state.roleplay || randomRoleplay();
    const d = data.lessonD;
    const count = countWords(state.writingText);
    return `<article class="u5-focus-card"><div class="u5-card-title"><div><span>RANDOM ROLEPLAY</span><h3>借东西角色扮演</h3></div><button type="button" class="small-button" data-u5-roleplay>换一个场景</button></div><div class="u5-roleplay-grid"><p><b>物品</b>${r.item}</p><p><b>人物</b>${r.person}</p><p><b>原因</b>${r.reason}</p><p><b>归还</b>${r.returnTime}</p><p><b>回答</b>${r.reply}</p><p><b>后续问题</b>${r.followUp}</p></div><p class="u5-roleplay-prompt">Ask ${r.person} to lend you a ${r.item} because ${r.reason}. Say when you will return it. Then respond and ask: “${r.followUp}”</p>${audioButton(`Can you lend me your ${r.item}? ${r.reason}. I can return it ${r.returnTime}. ${r.reply} ${r.followUp}`, "听示范")}${recordingPanel("5D-roleplay", "不要背全文。完成请求、原因、归还时间、回答和后续问题。")}</article><article class="u5-card"><h3>Writing · A time someone borrowed something</h3><p>${d.writing.prompt} · ${d.writing.min}–${d.writing.max} words</p><div class="u5-chip-list">${d.writing.structure.map(item => `<span>${item}</span>`).join("")}</div><label class="u5-edit-label">短篇写作<textarea id="u5Writing" rows="9" placeholder="Write your story here...">${escapeHtml(state.writingText)}</textarea></label><div class="u5-writing-tools"><strong class="${count >= d.writing.min && count <= d.writing.max ? "good-text" : ""}">${count} words</strong><span>${writingChecks(state.writingText)}</span></div><details><summary>查看原创参考答案</summary><p>${d.writing.model} ${audioButton(d.writing.model, "播放参考")}</p></details></article>`;
  }

  function randomRoleplay() {
    const d = data.lessonD.roleplay;
    return state.roleplay = { item: pick(d.items), person: pick(d.people), reason: pick(d.reasons), returnTime: pick(d.returns), reply: pick(d.replies), followUp: pick(d.followUps) };
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function countWords(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function writingChecks(text) {
    const lower = String(text || "").toLowerCase();
    const checks = [
      ["lend / borrow", /\b(lend|lent|borrow|borrowed)\b/.test(lower)],
      ["代词", /\b(i|me|my|he|him|she|her|they|them)\b/.test(lower)],
      ["过去式", /\b(was|were|lent|borrowed|needed|said|returned|bought|sent|forgot)\b/.test(lower)]
    ];
    return checks.map(([label, ok]) => `${ok ? "✓" : "○"} ${label}`).join(" · ");
  }

  function renderWordCards(rows) {
    return `<section class="u5-word-grid">${rows.map(item => { const mastered = state.knownWords.includes(item.id); return `<article class="u5-word-card ${mastered ? "mastered" : ""}"><div><span>${item.ipa}</span><button type="button" data-u5-known="${item.id}">${mastered ? "✓ 已掌握" : "标记掌握"}</button></div><h3>${item.word}</h3><p>${item.zh}</p><div class="u5-word-meta"><span>${item.pos || "word"}</span><span>${item.category || item.scenario || "Unit 5"}</span>${item.opposite ? `<span>反义词：${item.opposite}</span>` : ""}</div><p class="u5-word-example">${item.example}</p><div class="u5-button-row">${audioButton(item.word, "正常")}${audioButton(item.word, "慢速", true)}${audioButton(item.example, "例句")}</div></article>`; }).join("")}</section>`;
  }

  function renderPractice(checkpoint) {
    const count = checkpoint ? 5 : 6;
    const pool = data.reviewQuestions.filter(item => item.lesson === state.lesson);
    const key = `${state.lesson}-${checkpoint ? "checkpoint" : "practice"}`;
    if (!state.answers[`${key}-set`]) state.answers[`${key}-set`] = shuffle(pool).slice(0, count).map(item => item.id);
    const questions = state.answers[`${key}-set`].map(id => data.reviewQuestions.find(item => item.id === id)).filter(Boolean);
    const completed = questions.filter(item => state.answers[item.id]).length;
    const correct = questions.filter(item => state.answers[item.id]?.correct).length;
    const percent = questions.length ? Math.round(correct / questions.length * 100) : 0;
    return `<article class="u5-card"><div class="u5-card-title"><div><span>${checkpoint ? "SKILLS CHECK" : "FOCUSED PRACTICE"}</span><h3>${checkpoint ? "80% 即可完成本课" : "答题后立即看中文解释"}</h3></div><button type="button" class="small-button" data-u5-new-practice="${key}">换一组题</button></div><div class="u5-question-stack">${questions.map((item, index) => renderQuestion(item, index + 1)).join("")}</div>${checkpoint && completed === questions.length ? `<div class="u5-feedback ${percent >= 80 ? "good" : "bad"}"><b>${percent >= 80 ? "✓ 自我检查通过" : "还差一点"} · ${percent}%</b><p>${percent >= 80 ? "本课已达到完成标准。" : "先复习错题，再换一组题重试。"}</p></div>${percent >= 80 ? `<button type="button" class="primary-button" data-u5-complete-lesson="${state.lesson}">完成 ${state.lesson}</button>` : ""}` : ""}</article>`;
  }

  function renderQuestion(item, number) {
    const selected = state.answers[item.id]?.choice;
    const result = state.answers[item.id];
    return `<article class="u5-question" data-u5-question="${item.id}"><div class="u5-question-head"><span>${number}. ${item.point}</span>${audioButton(item.question, "听题")}</div><h4>${item.question}</h4><div class="u5-options">${item.options.map((option, index) => `<button type="button" data-u5-answer="${item.id}" data-u5-choice="${escapeAttr(option)}" class="${selected === option ? (result.correct ? "correct" : "wrong") : ""}" ${result ? "disabled" : ""}><b>${String.fromCharCode(65 + index)}</b>${option}</button>`).join("")}</div>${result ? `<div class="u5-feedback ${result.correct ? "good" : "bad"}"><b>${result.correct ? "正确" : `正确答案：${item.answer}`}</b><p>${item.explanation}</p><p>新例句：${item.example} ${audioButton(item.example, "播放")}</p></div>` : ""}</article>`;
  }

  function renderMiniQuestion(id, prompt, options, answer, explanation) {
    const result = state.answers[id];
    return `<div class="u5-mini-question"><p>${prompt} ${audioButton(prompt, "听")}</p><div>${options.map(option => `<button type="button" data-u5-mini="${id}" data-u5-mini-choice="${escapeAttr(option)}" data-u5-mini-answer="${escapeAttr(answer)}" data-u5-mini-explanation="${escapeAttr(explanation)}" class="${result?.choice === option ? (result.correct ? "correct" : "wrong") : ""}" ${result ? "disabled" : ""}>${option}</button>`).join("")}</div>${result ? `<span class="${result.correct ? "good-text" : "bad-text"}">${result.correct ? "正确" : `答案：${answer}`} · ${explanation}</span>` : ""}</div>`;
  }

  function recordingPanel(id, note) {
    const recording = recordingUrls.get(id);
    const active = state.currentRecordingId === id && mediaRecorder?.state === "recording";
    return `<div class="u5-recorder" data-u5-recorder="${id}"><p>${note}</p><div><button type="button" class="${active ? "recording" : ""}" data-u5-record-start="${id}" ${active ? "disabled" : ""}>开始录音</button><button type="button" data-u5-record-stop="${id}" ${active ? "" : "disabled"}>停止</button><button type="button" data-u5-record-play="${id}" ${recording ? "" : "disabled"}>回放</button><button type="button" data-u5-record-delete="${id}" ${recording ? "" : "disabled"}>删除</button><span id="u5RecordTime-${id}">${active ? "00:00" : recording?.duration || "00:00"}</span></div><small id="u5RecordStatus-${id}">${recording ? "录音仅保存在当前浏览器会话。" : "需要麦克风权限。"}</small></div>`;
  }

  function renderReview() {
    if (!state.reviewQuestions.length) startReview();
    const questions = state.reviewQuestions;
    const answered = questions.filter(item => state.answers[`review-${item.id}`]).length;
    const score = questions.filter(item => state.answers[`review-${item.id}`]?.correct).length;
    return `<section class="u5-review-head"><div><span>MIXED REVIEW</span><h2>15 题随机复习</h2><p>题库共 ${data.reviewQuestions.length} 道原创题。</p></div><div><label>知识点<select id="u5ReviewFilter"><option value="all">全部</option>${[...new Set(data.reviewQuestions.map(item => item.point))].map(point => `<option value="${point}" ${state.reviewFilter === point ? "selected" : ""}>${point}</option>`).join("")}</select></label><button type="button" class="small-button" data-u5-new-review>重新抽题</button></div></section>${state.reviewSubmitted ? `<section class="u5-score-banner"><strong>${Math.round(score / questions.length * 100)}%</strong><div><h3>${score} / ${questions.length}</h3><p>${reviewAdvice(questions)}</p></div></section>` : ""}<section class="u5-question-stack">${questions.map((item, index) => renderReviewQuestion(item, index + 1)).join("")}</section><div class="u5-submit-bar"><span>已答 ${answered} / ${questions.length}</span><button type="button" class="primary-button" data-u5-submit-review>提交并分类统计</button></div>${state.wrongAnswers.length ? `<section class="u5-card"><h3>Unit 5 Wrong Answer Review</h3><p>当前保存 ${state.wrongAnswers.length} 道。点击“只重做错题”会优先抽取它们。</p><button type="button" class="small-button" data-u5-redo-wrong>只重做错题</button></section>` : ""}`;
  }

  function startReview(source) {
    const pool = source || (state.reviewFilter === "all" ? data.reviewQuestions : data.reviewQuestions.filter(item => item.point === state.reviewFilter));
    state.reviewQuestions = shuffle(pool).slice(0, Math.min(15, pool.length));
    state.reviewSubmitted = false;
    state.reviewQuestions.forEach(item => delete state.answers[`review-${item.id}`]);
  }

  function renderReviewQuestion(item, number) {
    const key = `review-${item.id}`;
    const result = state.answers[key];
    return `<article class="u5-question"><div class="u5-question-head"><span>${number}. ${item.lesson} · ${item.point}</span>${audioButton(item.question, "听题")}</div><h4>${item.question}</h4><div class="u5-options">${item.options.map((option, index) => `<button type="button" data-u5-review-answer="${item.id}" data-u5-choice="${escapeAttr(option)}" class="${result?.choice === option ? (result.correct ? "correct" : "wrong") : ""}" ${state.reviewSubmitted ? "disabled" : ""}><b>${String.fromCharCode(65 + index)}</b>${option}</button>`).join("")}</div>${state.reviewSubmitted ? `<div class="u5-feedback ${result?.correct ? "good" : "bad"}"><b>${result?.correct ? "正确" : `你的答案：${result?.choice || "未作答"} · 正确：${item.answer}`}</b><p>${item.explanation}</p><p>${item.example} ${audioButton(item.example, "播放")}</p></div>` : ""}</article>`;
  }

  function reviewAdvice(questions) {
    const wrong = questions.filter(item => !state.answers[`review-${item.id}`]?.correct);
    if (!wrong.length) return "所有知识点都很稳。下一步做 Unit 5 Challenge。";
    const counts = wrong.reduce((all, item) => ({ ...all, [item.point]: (all[item.point] || 0) + 1 }), {});
    const weakest = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    return `下一步最适合练：${weakest}。错题已经保存，可以稍后重做。`;
  }

  function renderChallenge() {
    if (!state.challenge) startChallenge();
    const session = state.challenge;
    const autoScore = challengeAutoScore();
    const practical = data.reviewQuestions.filter(item => item.point === "practical-use").slice(0, 3);
    return `<section class="u5-challenge-head"><div><span>UNIT 5 CHALLENGE</span><h2>综合挑战</h2><p>原创自我检测，包含语法词汇、阅读写作和实用表达。</p></div><div class="u5-clock" id="u5ChallengeClock">${formatSeconds(session.remaining)}</div></section>${session.submitted ? `<section class="u5-score-banner"><strong>${autoScore.percent}%</strong><div><h3>自动检查 ${autoScore.correct} / ${autoScore.total}</h3><p>写作按结构和字数自行检查，不计入自动结果。</p></div></section>` : ""}<section class="u5-challenge-part"><h3>Part 1 · Grammar and Vocabulary</h3><div class="u5-question-stack">${session.questions.map((item, index) => renderChallengeQuestion(item, index + 1)).join("")}</div></section><section class="u5-challenge-part"><h3>Part 2 · Reading and Writing</h3><article class="u5-card"><h4>Reading</h4><p>${data.challenge.reading.text} ${audioButton(data.challenge.reading.text, "播放文章")}</p>${renderMiniQuestion("challenge-reading", data.challenge.reading.question, data.challenge.reading.options, data.challenge.reading.answer, "回到原文查找共享设备的目的。")}</article><article class="u5-card"><h4>Writing · 85–100 words</h4><p>${data.challenge.writingPrompt} ${audioButton(data.challenge.writingPrompt, "听任务")}</p><textarea id="u5ChallengeWriting" rows="9" aria-label="综合挑战写作" placeholder="Write here...">${escapeHtml(session.writing || "")}</textarea><p id="u5ChallengeWordCount">${countWords(session.writing)} words</p></article></section><section class="u5-challenge-part"><h3>Part 3 · Practical Use</h3><div class="u5-question-stack">${practical.map((item, index) => renderChallengeQuestion(item, session.questions.length + index + 1)).join("")}</div></section><div class="u5-submit-bar"><span>${session.submitted ? "挑战已完成" : "未完成部分也可以提交"}</span><button type="button" class="primary-button" data-u5-submit-challenge>${session.submitted ? "重新练习" : "提交综合挑战"}</button></div>`;
  }

  function startChallenge() {
    clearInterval(challengeTimer);
    delete state.answers["challenge-reading"];
    const questions = shuffle(data.reviewQuestions.filter(item => item.point !== "practical-use")).slice(0, 17);
    state.challenge = { questions, answers: {}, writing: "", remaining: data.challenge.minutes * 60, submitted: false };
    challengeTimer = setInterval(() => {
      if (!state.challenge || state.challenge.submitted) return;
      state.challenge.remaining -= 1;
      updateChallengeClock();
      if (state.challenge.remaining <= 0) submitChallenge();
    }, 1000);
  }

  function renderChallengeQuestion(item, number) {
    const result = state.challenge.answers[item.id];
    return `<article class="u5-question"><div class="u5-question-head"><span>${number}. ${item.point}</span>${audioButton(item.question, "听题")}</div><h4>${item.question}</h4><div class="u5-options">${item.options.map((option, index) => `<button type="button" data-u5-challenge-answer="${item.id}" data-u5-choice="${escapeAttr(option)}" class="${result?.choice === option ? (result.correct ? "correct" : "wrong") : ""}" ${state.challenge.submitted ? "disabled" : ""}><b>${String.fromCharCode(65 + index)}</b>${option}</button>`).join("")}</div>${state.challenge.submitted ? `<div class="u5-feedback ${result?.correct ? "good" : "bad"}"><b>${result?.correct ? "✓ 正确" : `✕ 正确答案：${item.answer}`}</b><p>${item.explanation}</p><p>${item.example} ${audioButton(item.example, "播放")}</p></div>` : ""}</article>`;
  }

  function challengeAutoScore() {
    if (!state.challenge) return { correct: 0, total: 0, percent: 0 };
    const practical = data.reviewQuestions.filter(item => item.point === "practical-use").slice(0, 3);
    const all = [...state.challenge.questions, ...practical];
    const correct = all.filter(item => state.challenge.answers[item.id]?.correct).length + (state.answers["challenge-reading"]?.correct ? 1 : 0);
    const total = all.length + 1;
    return { correct, total, percent: Math.round(correct / total * 100) };
  }

  function submitChallenge() {
    if (!state.challenge) return;
    state.challenge.submitted = true;
    clearInterval(challengeTimer);
    const practical = data.reviewQuestions.filter(item => item.point === "practical-use").slice(0, 3);
    [...state.challenge.questions, ...practical].forEach(item => {
      const answer = state.challenge.answers[item.id];
      if (!answer?.correct) addWrong(item, answer?.choice || "未作答");
    });
    const score = challengeAutoScore().percent;
    state.progress.challengeBest = Math.max(state.progress.challengeBest, score);
    saveProgress();
    render();
  }

  function updateChallengeClock() {
    const clock = document.getElementById("u5ChallengeClock");
    if (clock && state.challenge) clock.textContent = formatSeconds(state.challenge.remaining);
  }

  function formatSeconds(seconds) {
    const safe = Math.max(0, Number(seconds || 0));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function populateVoiceSelect() {
    const select = document.getElementById("u5VoiceSelect");
    if (!select || !("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices().filter(voice => /^en/i.test(voice.lang));
    const saved = localStorage.getItem(keys.voice) || "";
    select.innerHTML = `<option value="">自动美式语音</option>${voices.map(voice => `<option value="${escapeAttr(voice.name)}" ${saved === voice.name ? "selected" : ""}>${voice.name} · ${voice.lang}</option>`).join("")}`;
  }

  async function speakText(text, slow, button) {
    if (window.EnglishAudio) {
      button?.classList.add("playing");
      try { return await window.EnglishAudio.playAudioOrTTS({ text, slow }); }
      finally { button?.classList.remove("playing"); }
    }
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.name === voiceName) || voices.find(voice => /^en[-_]US$/i.test(voice.lang)) || voices.find(voice => /^en/i.test(voice.lang));
    utterance.lang = utterance.voice?.lang || "en-US";
    utterance.rate = slow ? 0.68 : 0.9;
    speechSynthesis.speak(utterance);
  }

  async function startRecording(id) {
    const status = document.getElementById(`u5RecordStatus-${id}`);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      if (status) status.textContent = "当前打开方式不能录音。请使用 localhost、Live Server 或项目开发服务器。";
      return;
    }
    try {
      stopAllAudio();
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingChunks = [];
      mediaRecorder = new MediaRecorder(mediaStream);
      state.currentRecordingId = id;
      recordingStartedAt = Date.now();
      mediaRecorder.ondataavailable = event => { if (event.data.size) recordingChunks.push(event.data); };
      mediaRecorder.onstop = () => finishRecording(id);
      mediaRecorder.start();
      recordingTimer = setInterval(() => {
        const target = document.getElementById(`u5RecordTime-${id}`);
        if (target) target.textContent = formatSeconds(Math.floor((Date.now() - recordingStartedAt) / 1000));
      }, 250);
      render();
    } catch {
      if (status) status.textContent = "没有获得麦克风权限。请在浏览器地址栏允许麦克风后重试。";
    }
  }

  function stopRecording() {
    if (mediaRecorder?.state === "recording") mediaRecorder.stop();
  }

  function finishRecording(id) {
    clearInterval(recordingTimer);
    mediaStream?.getTracks().forEach(track => track.stop());
    const blob = new Blob(recordingChunks, { type: mediaRecorder?.mimeType || "audio/webm" });
    const previous = recordingUrls.get(id);
    if (previous?.url) URL.revokeObjectURL(previous.url);
    const duration = formatSeconds(Math.max(1, Math.round((Date.now() - recordingStartedAt) / 1000)));
    recordingUrls.set(id, { url: URL.createObjectURL(blob), duration });
    state.currentRecordingId = "";
    const metadata = readJSON(keys.recordings, {});
    metadata[id] = { duration, recordedAt: new Date().toISOString() };
    writeJSON(keys.recordings, metadata);
    if (!state.progress.speaking.includes(id)) state.progress.speaking.push(id);
    saveProgress();
    render();
  }

  function stopAllAudio() {
    followToken += 1;
    window.EnglishAudio?.stopAudio?.();
    try { speechSynthesis.cancel(); } catch {}
    root.querySelectorAll("[data-u5-follow-line]").forEach(line => line.classList.remove("current-line"));
  }

  async function startFollowRead(startIndex = state.followIndex) {
    const lines = data.lessonB.listening.lines;
    const token = ++followToken;
    let index = Math.max(0, Math.min(startIndex, lines.length - 1));
    do {
      for (; index < lines.length; index += 1) {
        if (token !== followToken) return;
        state.followIndex = index;
        root.querySelectorAll("[data-u5-follow-line]").forEach(line => line.classList.toggle("current-line", Number(line.dataset.u5FollowLine) === index));
        await speakText(lines[index], state.listeningSpeed <= 0.7);
        if (token !== followToken) return;
        const pause = Number(document.getElementById("u5FollowPause")?.value || 3) * 1000;
        await new Promise(resolve => setTimeout(resolve, pause));
      }
      index = 0;
    } while (state.followLoop && token === followToken);
    root.querySelectorAll("[data-u5-follow-line]").forEach(line => line.classList.remove("current-line"));
  }

  function handleClick(event) {
    const page = event.target.closest("[data-u5-page]");
    if (page) {
      if (page.dataset.u5Page === "challenge" && state.challenge?.submitted) state.challenge = null;
      state.page = page.dataset.u5Page;
      if (state.page === "review" && page.dataset.u5WrongOnly === "true") {
        const pool = state.wrongAnswers.map(item => data.reviewQuestions.find(question => question.id === item.id)).filter(Boolean);
        startReview(pool.length ? pool : undefined);
      }
      saveProgress();
      render();
      return;
    }

    const open = event.target.closest("[data-u5-open]");
    if (open) {
      state.page = "lesson";
      state.lesson = open.dataset.u5Open;
      state.step = open.dataset.u5Step || "quick";
      saveProgress();
      render();
      return;
    }

    const step = event.target.closest("[data-u5-step]");
    if (step) { state.step = step.dataset.u5Step; saveProgress(); render(); return; }

    const stop = event.target.closest("[data-u5-stop]");
    if (stop) { stopAllAudio(); return; }

    const speak = event.target.closest("[data-u5-speak]");
    if (speak) {
      speakText(speak.dataset.u5Speak, speak.dataset.u5Slow === "true", speak);
      return;
    }

    const reference = event.target.closest("[data-u5-reference]");
    if (reference) { state.referenceChoice = reference.dataset.u5Reference; render(); return; }

    const mini = event.target.closest("[data-u5-mini]");
    if (mini) {
      const choice = mini.dataset.u5MiniChoice;
      state.answers[mini.dataset.u5Mini] = { choice, correct: choice === mini.dataset.u5MiniAnswer };
      render();
      return;
    }

    const answer = event.target.closest("[data-u5-answer]");
    if (answer) {
      const question = data.reviewQuestions.find(item => item.id === answer.dataset.u5Answer);
      const choice = answer.dataset.u5Choice;
      state.answers[question.id] = { choice, correct: choice === question.answer };
      if (choice !== question.answer) addWrong(question, choice);
      render();
      return;
    }

    const known = event.target.closest("[data-u5-known]");
    if (known) {
      const id = known.dataset.u5Known;
      state.knownWords = state.knownWords.includes(id) ? state.knownWords.filter(item => item !== id) : [...state.knownWords, id];
      saveProgress(); render(); return;
    }

    if (event.target.closest("[data-u5-random-vocab]")) {
      state.vocabSearch = "";
      state.vocabCategory = "全部";
      state.vocabRandomIds = shuffle(allUnitVocabulary()).slice(0, 10).map(item => item.id);
      render();
      return;
    }

    const sortWord = event.target.closest("[data-u5-sort-word]");
    if (sortWord && !event.target.closest("[data-u5-speak]")) { state.selectedSort = sortWord.dataset.u5SortWord; render(); return; }

    const sortZone = event.target.closest("[data-u5-sort-zone]");
    if (sortZone && state.selectedSort) { state.sortAssignments[state.selectedSort] = sortZone.dataset.u5SortZone; state.selectedSort = ""; render(); return; }

    if (event.target.closest("[data-u5-reset-sort]")) { state.sortAssignments = {}; state.selectedSort = ""; render(); return; }

    const speed = event.target.closest("[data-u5-listening-speed]");
    if (speed) { state.listeningSpeed = Number(speed.dataset.u5ListeningSpeed); render(); return; }
    if (event.target.closest("[data-u5-toggle-transcript]")) { state.listeningTextVisible = !state.listeningTextVisible; render(); return; }
    if (event.target.closest("[data-u5-listen-all]")) { speakText(data.lessonB.listening.lines.join(" "), state.listeningSpeed <= 0.7, event.target); return; }
    if (event.target.closest("[data-u5-follow-read]")) { startFollowRead(0); return; }
    if (event.target.closest("[data-u5-follow-prev]")) { stopAllAudio(); state.followIndex = Math.max(0, state.followIndex - 1); startFollowRead(state.followIndex); return; }
    if (event.target.closest("[data-u5-follow-replay]")) { stopAllAudio(); startFollowRead(state.followIndex); return; }
    if (event.target.closest("[data-u5-follow-stop]")) { stopAllAudio(); return; }
    if (event.target.closest("[data-u5-check-dictation]")) { checkDictation(); return; }

    if (event.target.closest("[data-u5-random-pitch]")) {
      Object.entries(data.lessonC.pitchChoices).forEach(([key, values]) => { state.pitch[key] = Math.floor(Math.random() * values.length); });
      render(); return;
    }
    if (event.target.closest("[data-u5-copy-pitch]")) { navigator.clipboard?.writeText(document.getElementById("u5PitchText")?.value || buildPitch()); return; }
    if (event.target.closest("[data-u5-save-pitch]")) {
      state.savedPitchText = document.getElementById("u5PitchText")?.value || buildPitch();
      const preferences = readJSON(keys.preferences, {});
      preferences.unit5Pitch = state.pitch;
      preferences.unit5PitchText = state.savedPitchText;
      writeJSON(keys.preferences, preferences);
      render(); return;
    }
    if (event.target.closest("[data-u5-clear-pitch]")) {
      state.savedPitchText = "";
      state.pitch = {};
      const preferences = readJSON(keys.preferences, {});
      delete preferences.unit5Pitch;
      delete preferences.unit5PitchText;
      writeJSON(keys.preferences, preferences);
      render(); return;
    }
    if (event.target.closest("[data-u5-roleplay]")) { state.roleplay = null; randomRoleplay(); render(); return; }
    if (event.target.closest("[data-u5-play-dialogue]")) { speakText(data.lessonD.dialogue.join(" "), false, event.target); return; }

    const start = event.target.closest("[data-u5-record-start]");
    if (start) { startRecording(start.dataset.u5RecordStart); return; }
    if (event.target.closest("[data-u5-record-stop]")) { stopRecording(); return; }
    const play = event.target.closest("[data-u5-record-play]");
    if (play) { const item = recordingUrls.get(play.dataset.u5RecordPlay); if (item) new Audio(item.url).play().catch(() => {}); return; }
    const remove = event.target.closest("[data-u5-record-delete]");
    if (remove) { const item = recordingUrls.get(remove.dataset.u5RecordDelete); if (item?.url) URL.revokeObjectURL(item.url); recordingUrls.delete(remove.dataset.u5RecordDelete); render(); return; }

    const newPractice = event.target.closest("[data-u5-new-practice]");
    if (newPractice) { delete state.answers[`${newPractice.dataset.u5NewPractice}-set`]; render(); return; }
    const complete = event.target.closest("[data-u5-complete-lesson]");
    if (complete) { state.progress.lessons[complete.dataset.u5CompleteLesson] = steps.map(([key]) => key); saveProgress(); state.page = "overview"; render(); return; }

    if (event.target.closest("[data-u5-new-review]")) { startReview(); render(); return; }
    const reviewAnswer = event.target.closest("[data-u5-review-answer]");
    if (reviewAnswer) {
      const item = data.reviewQuestions.find(q => q.id === reviewAnswer.dataset.u5ReviewAnswer);
      const choice = reviewAnswer.dataset.u5Choice;
      state.answers[`review-${item.id}`] = { choice, correct: choice === item.answer };
      render(); return;
    }
    if (event.target.closest("[data-u5-submit-review]")) { submitReview(); return; }
    if (event.target.closest("[data-u5-redo-wrong]")) { const pool = state.wrongAnswers.map(wrong => data.reviewQuestions.find(q => q.id === wrong.id)).filter(Boolean); startReview(pool); render(); return; }

    const challengeAnswer = event.target.closest("[data-u5-challenge-answer]");
    if (challengeAnswer && !state.challenge.submitted) {
      const item = data.reviewQuestions.find(q => q.id === challengeAnswer.dataset.u5ChallengeAnswer);
      const choice = challengeAnswer.dataset.u5Choice;
      state.challenge.answers[item.id] = { choice, correct: choice === item.answer };
      render(); return;
    }
    if (event.target.closest("[data-u5-submit-challenge]")) { if (state.challenge.submitted) { state.challenge = null; startChallenge(); render(); } else submitChallenge(); }
  }

  function submitReview() {
    state.reviewSubmitted = true;
    state.reviewQuestions.forEach(item => {
      const result = state.answers[`review-${item.id}`];
      if (!result?.correct) addWrong(item, result?.choice || "未作答");
      else {
        const saved = state.wrongAnswers.find(wrong => wrong.id === item.id);
        if (saved) {
          saved.correctStreak = Number(saved.correctStreak || 0) + 1;
          saved.reviews = Number(saved.reviews || 0) + 1;
          const next = new Date();
          next.setDate(next.getDate() + (saved.correctStreak >= 2 ? 7 : 2));
          saved.nextReview = next.toLocaleDateString("en-CA");
        }
      }
    });
    const correct = state.reviewQuestions.filter(item => state.answers[`review-${item.id}`]?.correct).length;
    state.progress.reviewBest = Math.max(state.progress.reviewBest, Math.round(correct / state.reviewQuestions.length * 100));
    const scores = readJSON(keys.practiceScores, []);
    scores.unshift({ date: new Date().toISOString(), score: Math.round(correct / state.reviewQuestions.length * 100), filter: state.reviewFilter });
    writeJSON(keys.practiceScores, scores.slice(0, 60));
    saveProgress();
    render();
  }

  function checkDictation() {
    const input = root.querySelector("[data-u5-dictation]");
    const feedback = document.getElementById("u5DictationFeedback");
    if (!input || !feedback) return;
    const normalize = value => String(value).toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
    const correct = normalize(input.value) === normalize(data.lessonB.listening.dictation);
    feedback.className = correct ? "good-text" : "bad-text";
    feedback.textContent = correct ? "完全正确。" : `参考：${data.lessonB.listening.dictation}`;
  }

  function handleInput(event) {
    if (event.target.id === "u5VocabSearch") {
      state.vocabSearch = event.target.value;
      state.vocabRandomIds = [];
      render();
      requestAnimationFrame(() => {
        const input = document.getElementById("u5VocabSearch");
        input?.focus();
        input?.setSelectionRange(state.vocabSearch.length, state.vocabSearch.length);
      });
      return;
    }
    if (event.target.id === "u5Writing") { state.writingText = event.target.value; saveProgress(); renderWritingToolsOnly(); }
    if (event.target.id === "u5ProductWriting") {
      state.productWritingText = event.target.value;
      const counter = document.getElementById("u5ProductWordCount");
      const count = countWords(state.productWritingText);
      if (counter) { counter.textContent = `${count} words`; counter.classList.toggle("good-text", count >= 70 && count <= 100); }
    }
    if (event.target.id === "u5ChallengeWriting" && state.challenge) {
      state.challenge.writing = event.target.value;
      const counter = document.getElementById("u5ChallengeWordCount");
      if (counter) counter.textContent = `${countWords(state.challenge.writing)} words`;
    }
  }

  function renderWritingToolsOnly() {
    const target = root.querySelector(".u5-writing-tools");
    if (target) target.innerHTML = `<strong class="${countWords(state.writingText) >= 85 && countWords(state.writingText) <= 100 ? "good-text" : ""}">${countWords(state.writingText)} words</strong><span>${writingChecks(state.writingText)}</span>`;
  }

  function handleChange(event) {
    if (event.target.id === "u5VocabCategory") { state.vocabCategory = event.target.value; state.vocabRandomIds = []; render(); return; }
    if (event.target.id === "u5OnlyLearning") { state.vocabOnlyLearning = event.target.checked; render(); return; }
    if (event.target.id === "u5FollowLoop") { state.followLoop = event.target.checked; return; }
    if (event.target.id === "u5VoiceSelect") { localStorage.setItem(keys.voice, event.target.value); return; }
    if (event.target.id === "u5ReviewFilter") { state.reviewFilter = event.target.value; startReview(); render(); return; }
    if (event.target.matches("[data-u5-pitch]")) { state.pitch[event.target.dataset.u5Pitch] = Number(event.target.value); state.savedPitchText = ""; render(); }
  }

  function handleDragStart(event) {
    const item = event.target.closest("[data-u5-sort-word]");
    if (item) event.dataTransfer?.setData("text/plain", item.dataset.u5SortWord);
  }

  function handleDragOver(event) {
    if (event.target.closest("[data-u5-sort-zone]")) event.preventDefault();
  }

  function handleDrop(event) {
    const zone = event.target.closest("[data-u5-sort-zone]");
    if (!zone) return;
    event.preventDefault();
    const word = event.dataTransfer?.getData("text/plain");
    if (word) { state.sortAssignments[word] = zone.dataset.u5SortZone; render(); }
  }

  function handleKeyboard(event) {
    if (state.page !== "lesson" && state.page !== "review" && state.page !== "challenge") return;
    if (/INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    const index = ["a", "b", "c", "d", "1", "2", "3", "4"].indexOf(event.key.toLowerCase()) % 4;
    if (index < 0) return;
    const question = [...root.querySelectorAll(".u5-question")].find(node => !node.querySelector("button:disabled"));
    const option = question?.querySelectorAll(".u5-options button")[index];
    if (option) { event.preventDefault(); option.click(); }
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleChange);
  root.addEventListener("dragstart", handleDragStart);
  root.addEventListener("dragover", handleDragOver);
  root.addEventListener("drop", handleDrop);
  document.addEventListener("keydown", handleKeyboard);
  if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", populateVoiceSelect);
  window.addEventListener("hashchange", () => { if (location.hash !== "#courses") stopAllAudio(); });

  render();

  window.PatternFlowUnit5 = {
    open(lesson = "5A", step = "quick") {
      state.page = "lesson";
      state.lesson = lesson;
      state.step = step;
      saveProgress();
      render();
    },
    openPage(page = "overview") {
      state.page = page;
      if (page === "review") {
        const pool = state.wrongAnswers.map(item => data.reviewQuestions.find(question => question.id === item.id)).filter(Boolean);
        startReview(pool.length ? pool : undefined);
      }
      render();
    },
    refresh: render
  };
})();
