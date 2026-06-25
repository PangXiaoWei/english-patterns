const $ = id => document.getElementById(id);
const data = {
  lessons: window.LESSONS || [],
  verbs: window.VERBS || [],
  scenarios: window.SCENARIOS || [],
  pronunciation: window.PRONUNCIATION || [],
  tests: window.TESTS || [],
  writing: window.WRITING_PROMPTS || []
};

const store = {
  progress: "awei.switch.progress.v1",
  mistakes: "awei.switch.mistakes.v1"
};

const state = {
  view: "home",
  lessonIndex: 0,
  lessonMode: "learn",
  verbIndex: 0,
  scenarioIndex: 0,
  scenarioLevel: "A2",
  testIndex: 0,
  voiceRate: 0.72,
  voices: [],
  progress: readJSON(store.progress, { date: todayKey(), learned: 0 }),
  mistakes: readJSON(store.mistakes, [])
};

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function normalize(text) {
  return String(text).trim().toLowerCase().replace(/[?.!,']/g, "").replace(/\s+/g, " ");
}

function saveProgress(message = "") {
  if (state.progress.date !== todayKey()) state.progress = { date: todayKey(), learned: 0 };
  writeJSON(store.progress, state.progress);
  $("learnedCount").textContent = state.progress.learned;
  $("progressBar").style.width = `${Math.min(100, state.progress.learned / 20 * 100)}%`;
  if (message) $("statusText").textContent = message;
}

function markLearned(message) {
  state.progress.learned = Math.min(20, state.progress.learned + 1);
  saveProgress(message);
}

function addMistake(payload) {
  const next = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    wrong: payload.wrong || "",
    right: payload.right,
    type: payload.type || "句型错误",
    trigger: payload.trigger || "",
    explanation: payload.explanation || "",
    reviews: 0,
    nextReview: todayKey(),
    createdAt: new Date().toISOString()
  };
  state.mistakes = [next, ...state.mistakes].slice(0, 80);
  writeJSON(store.mistakes, state.mistakes);
  renderMistakes();
  renderHome();
}

function refreshVoices() {
  if ("speechSynthesis" in window) state.voices = speechSynthesis.getVoices();
}

function americanVoice() {
  const usVoices = state.voices.filter(voice => /^en[-_]US$/i.test(voice.lang) || /United States|US English/i.test(voice.name));
  const preferred = ["Microsoft Aria", "Microsoft Jenny", "Google US English", "Samantha", "Microsoft Zira", "Microsoft David"];
  return preferred.map(name => usVoices.find(voice => voice.name.includes(name))).find(Boolean)
    || usVoices.find(voice => /Natural|Online/i.test(voice.name))
    || usVoices[0]
    || state.voices.find(voice => /^en/i.test(voice.lang));
}

function speak(text, rate = state.voiceRate) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = americanVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

function switchView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach(section => section.classList.toggle("active-view", section.id === `${view}View`));
  document.querySelectorAll(".main-nav button").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  location.hash = view;
}

function renderHome() {
  $("lessonCount").textContent = data.lessons.length;
  $("verbCount").textContent = data.verbs.length;
  $("scenarioCount").textContent = data.scenarios.length;
  $("mistakeCount").textContent = state.mistakes.length;
  const day = new Date().getDate();
  const lesson = data.lessons[day % data.lessons.length];
  const scenario = data.scenarios[day % data.scenarios.length];
  const pron = data.pronunciation[day % data.pronunciation.length];
  $("todaySwitch").textContent = `${lesson.chineseTrigger} = ${lesson.englishPattern}`;
  $("todayExample").textContent = lesson.examples[0].en;
  $("todayScenario").textContent = scenario[1];
  $("todayPronunciation").textContent = pron.group;
  $("todayVerbs").innerHTML = data.verbs.slice(day % 8, day % 8 + 5).map(v => `<span>${v[0]}</span>`).join("");
  saveProgress();
}

function renderLessonSelectors() {
  $("lessonSelect").innerHTML = data.lessons.map((lesson, index) => `<option value="${index}">${index + 1}. ${lesson.title}</option>`).join("");
  $("lessonButtons").innerHTML = data.lessons.map((lesson, index) => `
    <button class="lesson-button ${index === state.lessonIndex ? "active" : ""}" data-lesson="${index}">
      <strong>${lesson.title}</strong><span>${lesson.chineseTrigger}</span>
    </button>
  `).join("");
}

function renderLesson() {
  renderLessonSelectors();
  const lesson = data.lessons[state.lessonIndex];
  $("lessonSelect").value = String(state.lessonIndex);
  if (state.lessonMode === "learn") {
    $("lessonPanel").innerHTML = `
      <div class="card-head"><span class="tag">${lesson.level}</span><button class="listen-button" data-speak="${lesson.examples.map(e => e.en).join(" ")}">美式朗读</button></div>
      <h2>${lesson.title}</h2>
      <button class="trigger-button">${lesson.chineseTrigger}</button>
      <div class="formula-box"><span>英语结构</span><strong>${lesson.englishPattern}</strong></div>
      <p class="cn-note">${lesson.explanation}</p>
      <div class="example-grid">${lesson.examples.map(ex => `<div class="example-card"><div><strong>${ex.en}</strong><span>${ex.zh}<br>${ex.note}</span></div><button class="mini-speak" data-speak="${ex.en}">▶</button></div>`).join("")}</div>
      <div class="contrast-box"><h3>常见错误</h3>${lesson.commonMistakes.map(m => `<p><b>错：</b>${m.wrong}<br><b>对：</b>${m.right}<br>${m.reason}</p>`).join("")}</div>
    `;
  } else if (state.lessonMode === "practice") {
    const drill = lesson.drills[0];
    $("lessonPanel").innerHTML = `
      <div class="card-head"><span class="tag">练习模式</span><button class="listen-button" data-speak="${drill.answer}">听答案</button></div>
      <p class="prompt-label">${lesson.chineseTrigger}</p>
      <h2>${drill.question}</h2>
      <div class="choice-options">${drill.options.map(option => `<button class="choice-button" data-answer="${option}">${option}</button>`).join("")}</div>
      <p id="lessonFeedback" class="feedback"></p>
    `;
  } else {
    $("lessonPanel").innerHTML = `
      <div class="card-head"><span class="tag">脱稿口语</span><button class="listen-button" data-speak="${lesson.examples[0].en}">听示范</button></div>
      <h2>${lesson.speakingTask.prompt}</h2>
      <p class="cn-note">只看关键词，不看完整句子。先说 30 秒，再说 1 分钟。</p>
      <div class="keyword-cloud">${lesson.speakingTask.keywords.map(word => `<span>${word}</span>`).join("")}</div>
      <div class="formula-box"><span>可用骨架</span><strong>${lesson.englishPattern}</strong></div>
    `;
  }
}

function renderVerbSelectors() {
  $("verbSelect").innerHTML = data.verbs.map((verb, index) => `<option value="${index}">${verb[0]} - ${verb[1]}</option>`).join("");
}

function renderVerb() {
  const [base, meaning, third, ing, past, pp, example] = data.verbs[state.verbIndex];
  $("verbSelect").value = String(state.verbIndex);
  $("verbPanel").innerHTML = `
    <div class="card-head"><span class="tag">Verb Switch Trainer</span><button class="listen-button" data-speak="${base}. ${example}">美式发音</button></div>
    <h2>${base} <small>${meaning}</small></h2>
    <div class="verb-cards">
      <div><span>原形</span><strong>${base}</strong></div>
      <div><span>第三人称单数</span><strong>${third}</strong></div>
      <div><span>ing</span><strong>${ing}</strong></div>
      <div><span>过去式</span><strong>${past}</strong></div>
      <div><span>过去分词</span><strong>${pp}</strong></div>
    </div>
    <div class="example-grid">
      ${[
        [`I ${base} people.`, "现在经常做"],
        [`She ${third} people.`, "he/she/it 加 s"],
        [`I am ${ing} people today.`, "现在正在做"],
        [`I ${past.split(" / ")[0]} people yesterday.`, "昨天做了"],
        [`I've ${pp.split(" / ")[0]} people before.`, "以前做过"],
        [`I want to ${base} people.`, "想做，用 to + 原形"],
        [`I like ${ing} people.`, "喜欢做这件事，用 ing"]
      ].map(([en, zh]) => `<div class="example-card"><div><strong>${en}</strong><span>${zh}</span></div><button class="mini-speak" data-speak="${en}">▶</button></div>`).join("")}
    </div>
    <div class="panel inner-panel">
      <h3>练习：中文 “我昨天帮助了顾客。”</h3>
      <div class="choice-options">
        <button class="choice-button" data-verb-choice="wrong">I help customers yesterday.</button>
        <button class="choice-button" data-verb-choice="right">I helped customers yesterday.</button>
        <button class="choice-button" data-verb-choice="wrong2">I've helped customers yesterday.</button>
      </div>
      <p id="verbFeedback" class="feedback"></p>
    </div>
  `;
}

function renderScenarioSelectors() {
  $("scenarioSelect").innerHTML = data.scenarios.map((item, index) => `<option value="${index}">${item[1]}</option>`).join("");
}

function renderScenario() {
  const scenario = data.scenarios[state.scenarioIndex];
  const lines = scenario[3][state.scenarioLevel];
  $("scenarioSelect").value = String(state.scenarioIndex);
  $("scenarioLevel").value = state.scenarioLevel;
  $("scenarioPanel").innerHTML = `
    <div class="card-head"><span class="tag">${state.scenarioLevel.replace("Plus", "+")}</span><button class="listen-button" data-speak="${lines.join(" ")}">全文朗读</button></div>
    <h2>${scenario[1]}</h2>
    <div class="keyword-cloud">${scenario[2].map(word => `<span>${word}</span>`).join("")}</div>
    <div class="example-grid">${lines.map(line => `<div class="example-card"><div><strong>${line}</strong></div><button class="mini-speak" data-speak="${line}">▶</button></div>`).join("")}</div>
    <div class="contrast-box"><h3>脱稿模式</h3><p>看上面的关键词，按 A2/B1/B1+ 的长度说出来。不要逐字背，先抓关键词和连接词。</p></div>
  `;
}

function renderPronunciation() {
  $("pronunciationPanel").innerHTML = data.pronunciation.map(group => `
    <article class="panel">
      <h2>${group.group}</h2>
      <div class="pron-list">${group.items.map(item => `
        <div class="pron-row">
          <strong>${item[0]}</strong><span>${item[1] || ""}</span>
          <button class="mini-speak" data-speak="${item[0]}">慢</button>
          <button class="mini-speak" data-speak-normal="${item[0]}">常</button>
        </div>
      `).join("")}</div>
    </article>
  `).join("");
}

function renderTest() {
  const test = data.tests[state.testIndex % data.tests.length];
  $("testPanel").innerHTML = `
    <div class="card-head"><span class="tag">${test.type}</span><button class="listen-button" data-speak="${test.question}">听题</button></div>
    <h2>${test.question}</h2>
    <div class="choice-options">${test.options.map(option => `<button class="choice-button" data-test-answer="${option}">${option}</button>`).join("")}</div>
    <p id="testFeedback" class="feedback"></p>
  `;
  $("writingPrompts").innerHTML = data.writing.map(prompt => `<span>${prompt}</span>`).join("");
}

function renderMistakes() {
  if (!state.mistakes.length) {
    $("mistakePanel").innerHTML = `<div class="panel wide-panel"><p class="empty-note">现在还没有错题。答错选择题、动词题或测试题后，会自动保存在这里。</p></div>`;
    return;
  }
  $("mistakePanel").innerHTML = state.mistakes.map(item => `
    <article class="mistake-item">
      <strong>${item.type}</strong>
      <span>错句：${item.wrong || "未填写"}</span>
      <span>正确：${item.right}</span>
      <span>中文开关：${item.trigger}</span>
      <span>${item.explanation}</span>
      <div class="review-actions">
        <button data-review="${item.id}" data-days="0">Again</button>
        <button data-review="${item.id}" data-days="1">Hard</button>
        <button data-review="${item.id}" data-days="3">Good</button>
        <button data-review="${item.id}" data-days="7">Easy</button>
      </div>
    </article>
  `).join("");
}

function renderAll() {
  renderHome();
  renderLessonSelectors();
  renderLesson();
  renderVerbSelectors();
  renderVerb();
  renderScenarioSelectors();
  renderScenario();
  renderPronunciation();
  renderTest();
  renderMistakes();
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view], [data-jump]");
  if (nav) switchView(nav.dataset.view || nav.dataset.jump);

  const speakButton = event.target.closest("[data-speak]");
  if (speakButton) speak(speakButton.dataset.speak, 0.62);

  const normalSpeak = event.target.closest("[data-speak-normal]");
  if (normalSpeak) speak(normalSpeak.dataset.speakNormal, 0.86);

  const lessonButton = event.target.closest("[data-lesson]");
  if (lessonButton) {
    state.lessonIndex = Number(lessonButton.dataset.lesson);
    renderLesson();
  }

  const lessonMode = event.target.closest("[data-lesson-mode]");
  if (lessonMode) {
    state.lessonMode = lessonMode.dataset.lessonMode;
    document.querySelectorAll("[data-lesson-mode]").forEach(button => button.classList.toggle("active", button === lessonMode));
    renderLesson();
  }

  const lessonAnswer = event.target.closest("[data-answer]");
  if (lessonAnswer) {
    const lesson = data.lessons[state.lessonIndex];
    const drill = lesson.drills[0];
    const correct = lessonAnswer.dataset.answer === drill.answer;
    lessonAnswer.classList.add(correct ? "correct" : "wrong");
    $("lessonFeedback").textContent = correct ? `正确：${drill.explanation}` : `正确答案：${drill.answer}。${drill.explanation}`;
    $("lessonFeedback").className = `feedback ${correct ? "good" : "bad"}`;
    if (!correct) addMistake({ wrong: lessonAnswer.dataset.answer, right: drill.answer, type: "英语开关错误", trigger: lesson.chineseTrigger, explanation: drill.explanation });
    markLearned(correct ? "英语开关练习完成。" : "已加入错题本。");
    speak(drill.answer);
  }

  const verbChoice = event.target.closest("[data-verb-choice]");
  if (verbChoice) {
    const correct = verbChoice.dataset.verbChoice === "right";
    verbChoice.classList.add(correct ? "correct" : "wrong");
    $("verbFeedback").textContent = correct ? "正确。yesterday + 了 = 过去式。" : "正确答案：I helped customers yesterday. yesterday + 了 = 过去式。";
    $("verbFeedback").className = `feedback ${correct ? "good" : "bad"}`;
    if (!correct) addMistake({ wrong: verbChoice.textContent, right: "I helped customers yesterday.", type: "忘记过去式", trigger: "昨天 + 了", explanation: "具体过去时间用过去式。" });
    markLearned(correct ? "动词练习完成。" : "动词错误已加入错题本。");
  }

  const testAnswer = event.target.closest("[data-test-answer]");
  if (testAnswer) {
    const test = data.tests[state.testIndex % data.tests.length];
    const correct = testAnswer.dataset.testAnswer === test.answer;
    testAnswer.classList.add(correct ? "correct" : "wrong");
    $("testFeedback").textContent = correct ? `正确：${test.explanation}` : `正确答案：${test.answer}。${test.explanation}`;
    $("testFeedback").className = `feedback ${correct ? "good" : "bad"}`;
    if (!correct) addMistake({ wrong: testAnswer.dataset.testAnswer, right: test.answer, type: test.type, trigger: "测试训练", explanation: test.explanation });
    markLearned(correct ? "测试题完成。" : "测试错题已保存。");
  }

  const review = event.target.closest("[data-review]");
  if (review) {
    const item = state.mistakes.find(m => m.id === review.dataset.review);
    if (item) {
      const next = new Date();
      next.setDate(next.getDate() + Number(review.dataset.days));
      item.nextReview = next.toLocaleDateString("en-CA");
      item.reviews += 1;
      writeJSON(store.mistakes, state.mistakes);
      renderMistakes();
    }
  }
});

$("lessonSelect").addEventListener("change", event => { state.lessonIndex = Number(event.target.value); renderLesson(); });
$("verbSelect").addEventListener("change", event => { state.verbIndex = Number(event.target.value); renderVerb(); });
$("scenarioSelect").addEventListener("change", event => { state.scenarioIndex = Number(event.target.value); renderScenario(); });
$("scenarioLevel").addEventListener("change", event => { state.scenarioLevel = event.target.value; renderScenario(); });
$("nextTest").addEventListener("click", () => { state.testIndex += 1; renderTest(); });
$("slowSpeed").addEventListener("click", () => { state.voiceRate = 0.62; $("statusText").textContent = "发音速度：慢速。"; });
$("normalSpeed").addEventListener("click", () => { state.voiceRate = 0.86; $("statusText").textContent = "发音速度：正常。"; });
$("clearMistakes").addEventListener("click", () => { state.mistakes = []; writeJSON(store.mistakes, state.mistakes); renderMistakes(); renderHome(); });

refreshVoices();
if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", refreshVoices);
renderAll();
switchView(location.hash.replace("#", "") || "home");
