const $ = id => document.getElementById(id);
const data = {
  lessons: window.LESSONS || [],
  verbs: window.VERBS || [],
  scenarios: window.SCENARIOS || [],
  pronunciation: window.PRONUNCIATION || [],
  tests: window.TESTS || [],
  writing: window.WRITING_PROMPTS || [],
  vocabulary: window.VOCABULARY || [],
  minimalPairs: window.MINIMAL_PAIRS || [],
  lessonLabExample: window.EXAMPLE_LESSON_DATA || {}
};

const store = {
  progress: "awei.switch.progress.v1",
  mistakes: "awei.switch.mistakes.v1",
  masteredWords: "english_mastered_words",
  favoriteWords: "english_favorite_words",
  dailyMission: "english_daily_mission_done",
  lastPractice: "english_last_practice_date",
  streakDays: "english_streak_days",
  couldntSay: "english_couldnt_say_today",
  minimalPairs: "english_minimal_pairs_progress",
  lessonLabData: "awei.lesson.lab.data.v1",
  lessonLabProgress: "awei.lesson.lab.progress.v1",
  lessonLabMistakes: "awei.lesson.lab.mistakes.v1",
  lessonLabTtsCache: "awei.lesson.lab.tts.cache.v1"
};

const state = {
  view: "home",
  lessonIndex: 0,
  lessonMode: "learn",
  verbIndex: 0,
  scenarioIndex: 0,
  scenarioLevel: "A2",
  testIndex: 0,
  vocabCategory: "全部",
  vocabLevel: "全部",
  realLifeCategory: "全部",
  voiceRate: 0.72,
  voices: [],
  progress: readJSON(store.progress, { date: todayKey(), learned: 0 }),
  mistakes: readJSON(store.mistakes, []),
  masteredWords: readJSON(store.masteredWords, []),
  favoriteWords: readJSON(store.favoriteWords, []),
  dailyMission: readJSON(store.dailyMission, { date: todayKey(), done: [] }),
  couldntSay: readJSON(store.couldntSay, []),
  minimalPairs: readJSON(store.minimalPairs, {}),
  lessonLab: readJSON(store.lessonLabData, data.lessonLabExample),
  lessonLabTab: "vocabulary",
  lessonLabSwitchIndex: 0,
  lessonLabProgress: readJSON(store.lessonLabProgress, { mastered: [], tasks: [] }),
  lessonLabMistakes: readJSON(store.lessonLabMistakes, [])
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
  if (window.EnglishAudio) {
    return window.EnglishAudio.playAudioOrTTS({ text, slow: rate < 0.8 });
  }
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
  if (window.EnglishAudio) window.EnglishAudio.stopAudio();
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

function activeMissionItems() {
  const vocab = data.vocabulary.filter(item => item.priority <= 1);
  return [
    ...vocab.filter(item => item.type === "word").slice(0, 5).map(item => ({ id: `word-${item.id}`, label: `跟读词：${item.text}`, item })),
    ...vocab.filter(item => item.type === "phrase").slice(0, 3).map(item => ({ id: `phrase-${item.id}`, label: `跟读短语：${item.text}`, item })),
    ...vocab.filter(item => item.type === "sentence").slice(0, 2).map(item => ({ id: `sentence-${item.id}`, label: `跟读句子：${item.example}`, item })),
    { id: `pair-${data.minimalPairs[0]?.id || "work-walk"}`, label: `最小音差：${data.minimalPairs[0]?.wordA || "work"} / ${data.minimalPairs[0]?.wordB || "walk"}`, pair: data.minimalPairs[0] },
    { id: "couldnt-say", label: "记录 1 句今天没说出来的话", jump: "couldntSay" }
  ];
}

function ensureDailyMission() {
  if (state.dailyMission.date !== todayKey()) {
    state.dailyMission = { date: todayKey(), done: [] };
    writeJSON(store.dailyMission, state.dailyMission);
  }
}

function markMissionDone(id) {
  ensureDailyMission();
  if (!state.dailyMission.done.includes(id)) {
    state.dailyMission.done.push(id);
    writeJSON(store.dailyMission, state.dailyMission);
  }
  updatePracticeStreak();
}

function updatePracticeStreak() {
  const last = localStorage.getItem(store.lastPractice);
  const today = todayKey();
  if (last === today) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const current = Number(localStorage.getItem(store.streakDays) || "0");
  localStorage.setItem(store.streakDays, last === yesterday.toLocaleDateString("en-CA") ? String(current + 1) : "1");
  localStorage.setItem(store.lastPractice, today);
}

function renderSpeakActions(item, idPrefix = item.id) {
  const wordText = item.tts?.wordText || item.text;
  const exampleText = item.tts?.exampleText || item.example;
  return `
    <div class="speak-actions">
      <button data-audio="${item.audio?.word || ""}" data-text="${escapeAttr(wordText)}">🔈 Word</button>
      <button data-audio="${item.audio?.example || ""}" data-text="${escapeAttr(exampleText)}">🔈 Sentence</button>
      <button data-audio="${item.audio?.example || ""}" data-text="${escapeAttr(exampleText)}" data-slow="true">🐢 Slow</button>
      <button data-follow-read="${idPrefix}" data-audio="${item.audio?.example || ""}" data-text="${escapeAttr(exampleText)}" data-meaning="${escapeAttr(item.chinese)}" data-keywords="${escapeAttr((item.tags || []).join(", "))}">🎙️ 跟读</button>
      <button data-fav-word="${item.id}" class="${state.favoriteWords.includes(item.id) ? "active-action" : ""}">⭐ 收藏</button>
      <button data-master-word="${item.id}" class="${state.masteredWords.includes(item.id) ? "active-action" : ""}">✅ 已掌握</button>
    </div>
  `;
}

function escapeAttr(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function renderDailyMission() {
  if (!$("dailyMissionPanel")) return;
  ensureDailyMission();
  const missions = activeMissionItems();
  $("voiceToggle").textContent = window.EnglishAudio?.isVoiceEnabled() ? "声音开" : "静音";
  $("dailyMissionPanel").innerHTML = `
    <article class="mission-summary">
      <p class="eyebrow">5-10 MINUTES</p>
      <h3>今天只做一小组：听、跟读、标记完成。</h3>
      <strong>${state.dailyMission.done.length} / ${missions.length}</strong>
      <div class="progress-track"><span style="width:${Math.min(100, state.dailyMission.done.length / missions.length * 100)}%"></span></div>
    </article>
    <div class="mission-tasks">
      ${missions.map(mission => `
        <article class="mission-task ${state.dailyMission.done.includes(mission.id) ? "done" : ""}">
          <div><b>${mission.label}</b><span>${mission.item?.chinese || mission.pair?.chinese || "把真实想法变成可练的英文。"}</span></div>
          ${mission.item ? renderSpeakActions(mission.item, mission.id) : ""}
          ${mission.pair ? renderPairActions(mission.pair, mission.id) : ""}
          ${mission.jump ? `<button class="primary-button" data-jump="${mission.jump}">去记录</button>` : ""}
          <button class="small-button" data-mission-done="${mission.id}">${state.dailyMission.done.includes(mission.id) ? "已完成" : "标记完成"}</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderVocabSelectors() {
  if (!$("vocabCategory")) return;
  const categories = ["全部", ...new Set(data.vocabulary.map(item => item.category))];
  $("vocabCategory").innerHTML = categories.map(item => `<option>${item}</option>`).join("");
  $("vocabCategory").value = state.vocabCategory;
  $("vocabLevel").value = state.vocabLevel;
}

function renderVocabulary() {
  if (!$("vocabPanel")) return;
  renderVocabSelectors();
  const visible = data.vocabulary
    .filter(item => state.vocabCategory === "全部" || item.category === state.vocabCategory)
    .filter(item => state.vocabLevel === "全部" || item.level === state.vocabLevel)
    .sort((a, b) => a.priority - b.priority || a.text.localeCompare(b.text))
    .slice(0, 80);
  $("vocabPanel").innerHTML = visible.map(item => renderVocabCard(item)).join("") + renderMinimalPairs();
}

function renderVocabCard(item) {
  return `
    <article class="vocab-card">
      <div class="card-head"><span class="tag">${item.category}</span><span class="tag">${item.level} · P${item.priority}</span></div>
      <h3>${item.text}</h3>
      <p class="meaning">${item.chinese}</p>
      <p>${item.simpleDefinition}</p>
      <div class="example-line"><b>${item.example}</b><span>${item.exampleChinese}</span></div>
      ${renderSpeakActions(item)}
    </article>
  `;
}

function renderPairActions(pair, missionId = pair.id) {
  return `
    <div class="speak-actions">
      <button data-audio="${pair.audioA}" data-text="${escapeAttr(pair.ttsA)}">🔈 ${pair.wordA}</button>
      <button data-audio="${pair.audioB}" data-text="${escapeAttr(pair.ttsB)}">🔈 ${pair.wordB}</button>
      <button data-follow-read="${missionId}" data-audio="${pair.audioA}" data-text="${escapeAttr(pair.wordA)}" data-meaning="${escapeAttr(pair.chinese)}">🎙️ 跟读 A</button>
      <button data-follow-read="${missionId}-b" data-audio="${pair.audioB}" data-text="${escapeAttr(pair.wordB)}" data-meaning="${escapeAttr(pair.chinese)}">🎙️ 跟读 B</button>
      <button data-pair-master="${pair.id}" class="${state.minimalPairs[pair.id] ? "active-action" : ""}">✅ 掌握</button>
    </div>
  `;
}

function renderMinimalPairs() {
  return data.minimalPairs.map(pair => `
    <article class="vocab-card minimal-card">
      <div class="card-head"><span class="tag">Minimal Pairs</span><span>${state.minimalPairs[pair.id] ? "已掌握" : "练习中"}</span></div>
      <h3>${pair.wordA} / ${pair.wordB}</h3>
      <p class="meaning">${pair.chinese}</p>
      <div class="example-line"><b>${pair.exampleA}</b><span>${pair.exampleB}</span></div>
      ${renderPairActions(pair)}
    </article>
  `).join("");
}

function renderRealLife() {
  if (!$("realLifePanel")) return;
  const categories = ["全部", "Classroom English", "Homestay English", "Volunteer English", "Shopping & Supermarket", "Job Search English", "IT Support English", "Social Small Talk", "Health & Feelings", "Bank & Payment"];
  $("realLifeCategory").innerHTML = categories.map(item => `<option>${item}</option>`).join("");
  $("realLifeCategory").value = state.realLifeCategory;
  const visible = data.vocabulary
    .filter(item => item.type === "sentence")
    .filter(item => state.realLifeCategory === "全部" || item.category === state.realLifeCategory);
  $("realLifePanel").innerHTML = visible.map(item => renderVocabCard(item)).join("");
}

function renderCouldntSay() {
  if (!$("couldntList")) return;
  $("couldntList").innerHTML = state.couldntSay.length ? state.couldntSay.map(item => `
    <article class="vocab-card">
      <div class="card-head"><span class="tag">${item.category || "Daily Note"}</span><small>${item.date}</small></div>
      <p class="meaning">${item.originalText}</p>
      <h3>${item.naturalEnglish || "Add a natural English sentence later."}</h3>
      <p>${item.simpleEnglish || ""}</p>
      <p>${item.keywords || ""}</p>
      <div class="speak-actions">
        <button data-text="${escapeAttr(item.naturalEnglish || item.simpleEnglish || item.originalText)}">🔈 Speak</button>
        <button data-text="${escapeAttr(item.naturalEnglish || item.simpleEnglish || item.originalText)}" data-slow="true">🐢 Slow</button>
        <button data-follow-read="${item.id}" data-text="${escapeAttr(item.naturalEnglish || item.simpleEnglish || item.originalText)}" data-meaning="${escapeAttr(item.originalText)}">🎙️ 跟读</button>
        <button data-couldnt-master="${item.id}" class="${item.mastered ? "active-action" : ""}">✅ 已掌握</button>
      </div>
    </article>
  `).join("") : `<article class="panel"><p class="empty-note">还没有记录。今天遇到说不出来的一句话，就写在这里。</p></article>`;
}

function renderProgress() {
  if (!$("progressPanel")) return;
  const follow = readJSON(window.EnglishAudio?.keys.followRead || "english_follow_read_count", {});
  const today = todayKey();
  const todayFollow = Object.values(follow).reduce((sum, item) => sum + (item.byDate?.[today] || 0), 0);
  $("progressPanel").innerHTML = `
    <div><strong>${state.masteredWords.length}</strong><span>已掌握词汇</span></div>
    <div><strong>${state.favoriteWords.length}</strong><span>收藏词句</span></div>
    <div><strong>${todayFollow}</strong><span>今日跟读次数</span></div>
    <div><strong>${localStorage.getItem(store.streakDays) || 0}</strong><span>连续练习天数</span></div>
  `;
}

function lessonLabItems() {
  const lesson = state.lessonLab || {};
  return [
    ...(lesson.vocabulary || []).map(item => ({ kind: "vocabulary", key: `vocab:${item.id || item.word}`, label: item.word, text: item.audioText || item.example || item.word })),
    ...(lesson.pronunciation || []).flatMap(group => (group.words || []).map(item => ({ kind: "pronunciation", key: `pron:${group.id}:${item.word}`, label: item.word, text: item.word }))),
    ...(lesson.phrasalVerbs || []).map(item => ({ kind: "phrasal", key: `phrase:${item.phrase}`, label: item.phrase, text: item.example || item.phrase })),
    ...(lesson.sentenceSwitches || []).map((item, index) => ({ kind: "sentence", key: `switch:${item.id || index}`, label: item.zh || item.chinese, text: item.answer || item.answers?.[0] || item.zh || item.chinese })),
    ...(lesson.quantifiers || []).map(item => ({ kind: "quantifier", key: `quantifier:${item.id || item.pattern}`, label: item.pattern, text: item.example || item.pattern })),
    ...(lesson.realLifeTasks || []).map(item => ({ kind: "task", key: `task:${item.id || item.title}`, label: item.title, text: item.sentence || item.title }))
  ];
}

function lessonLabProgressPercent() {
  const total = Math.max(1, lessonLabItems().length);
  return Math.round((state.lessonLabProgress.mastered.length / total) * 100);
}

function saveLessonLab() {
  writeJSON(store.lessonLabData, state.lessonLab);
  writeJSON(store.lessonLabProgress, state.lessonLabProgress);
  writeJSON(store.lessonLabMistakes, state.lessonLabMistakes);
}

function renderLessonLab() {
  if (!$("lessonLabPanel")) return;
  const lesson = state.lessonLab || data.lessonLabExample;
  $("lessonLabTitle").textContent = lesson.title || "Untitled Lesson";
  $("lessonLabSource").textContent = lesson.sourceNote || lesson.source || "Imported lesson data";
  $("lessonLabLevel").textContent = lesson.level || "A2+/B1";
  $("lessonLabTopic").textContent = lesson.topic || "daily English";
  $("lessonLabVocabCount").textContent = (lesson.vocabulary || []).length;
  $("lessonLabSwitchCount").textContent = (lesson.sentenceSwitches || []).length;
  $("lessonLabPronFocus").textContent = (lesson.pronunciation || []).slice(0, 3).map(item => item.word).join(" / ") || "pronunciation";
  const progress = lessonLabProgressPercent();
  $("lessonLabProgressText").textContent = `${progress}%`;
  document.querySelector(".lab-progress-ring")?.style.setProperty("--progress", `${progress}%`);
  document.querySelectorAll("[data-lab-tab]").forEach(button => button.classList.toggle("active", button.dataset.labTab === state.lessonLabTab));
  const renderers = {
    vocabulary: renderLessonLabVocabulary,
    pronunciation: renderLessonLabPronunciation,
    phrasal: renderLessonLabPhrasal,
    switches: renderLessonLabSwitches,
    quantifiers: renderLessonLabQuantifiers,
    speaking: renderLessonLabSpeaking,
    tasks: renderLessonLabTasks,
    mistakes: renderLessonLabMistakes
  };
  $("lessonLabPanel").innerHTML = (renderers[state.lessonLabTab] || renderLessonLabVocabulary)(lesson);
}

function labActionButtons(text, key, type = "meaning", exampleText = text) {
  return `
    <div class="speak-actions lab-actions">
      <button data-lab-speak="${escapeAttr(text)}" data-rate="0.65">慢速播放</button>
      <button data-lab-speak="${escapeAttr(text)}" data-rate="0.95">正常播放</button>
      <button data-lab-speak="${escapeAttr(exampleText || text)}" data-rate="0.88">例句播放</button>
      <button data-lab-tts="${escapeAttr(text)}" data-speed="0.8">高质量播放</button>
      <button data-lab-master="${escapeAttr(key)}">我会了</button>
      <button data-lab-mistake="${escapeAttr(key)}" data-mistake-type="${escapeAttr(type)}" data-mistake-content="${escapeAttr(text)}">加入错题本</button>
      <button data-lab-task="${escapeAttr(key)}">加入今日任务</button>
    </div>
  `;
}

function renderLessonLabVocabulary(lesson) {
  return `<section class="lab-card-grid">${(lesson.vocabulary || []).map(item => {
    const key = `vocab:${item.word}`;
    return `
      <article class="lab-flip-card">
        <div class="card-head"><span class="tag">D${item.difficulty || "-"}</span><span>${(item.tags || []).join(" · ")}</span></div>
        <h3>${item.word}</h3>
        <p class="ipa">${item.ipa}</p>
        <p class="meaning">${item.chinese}</p>
        <div class="example-line"><b>${item.example || ""}</b><span>${item.exampleZh || ""}<br>${item.noteZh || item.note || ""}</span></div>
        ${labActionButtons(item.audioText || item.word, key, "意思", item.example || item.audioText || item.word)}
      </article>
    `;
  }).join("")}</section>`;
}

function renderLessonLabPronunciation(lesson) {
  return `<section class="lab-card-grid pronunciation-lab">${(lesson.pronunciation || []).flatMap(group => (group.words || []).map(item => `
    <article class="lab-flip-card">
      <div class="card-head"><span class="tag">${group.group}</span><span>${item.ipa}</span></div>
      <h3>${item.word}</h3>
      <p class="meaning">${item.chinese}</p>
      <div class="trap-box"><b>发音提示</b><span>${group.noteZh || ""}</span></div>
      ${labActionButtons(item.word, `pron:${group.id}:${item.word}`, "发音", item.word)}
    </article>
  `)).join("")}</section>`;
}

function renderLessonLabPhrasal(lesson) {
  return `<section class="phrasal-lab">${(lesson.phrasalVerbs || []).map(item => `
    <article class="lab-card phrasal-card">
      <div class="phrasal-icon">⚙</div>
      <div>
        <h3>${item.phrase}</h3>
        <p class="ipa">${item.ipa || ""}</p>
        <p class="meaning">${item.chinese}</p>
        <div class="example-line"><b>${item.example}</b><span>${item.example2 || ""}<br>${item.patternZh || ""}</span></div>
        ${labActionButtons(item.audioText || item.phrase, `phrase:${item.id || item.phrase}`, "句型", item.example || item.phrase)}
      </div>
    </article>
  `).join("")}</section>`;
}

function renderLessonLabSwitches(lesson) {
  const switches = lesson.sentenceSwitches || [];
  const item = switches[state.lessonLabSwitchIndex % Math.max(1, switches.length)] || {};
  return `
    <article class="lab-card switch-lab-card">
      <p class="eyebrow">CHINESE THINKING SWITCH</p>
      <h2>${item.zh || item.chinese || "No sentence switch yet."}</h2>
      <div id="labSwitchAnswer" class="switch-answer hidden">
        ${[item.answer, item.shortAnswer, ...(item.answers || [])].filter(Boolean).map(answer => `<strong>${answer}</strong>`).join("")}
        <p>${item.focus ? `Focus: ${item.focus}` : item.note || ""}</p>
        ${labActionButtons(item.answer || item.answers?.[0] || "", `switch:${item.id || state.lessonLabSwitchIndex}`, "句型", item.answer || item.shortAnswer || "")}
      </div>
      <div class="lab-hero-actions">
        <button class="primary-button" data-show-lab-answer>显示答案</button>
        <button class="small-button" data-next-lab-switch>再来一题</button>
      </div>
    </article>
  `;
}

function renderLessonLabQuantifiers(lesson) {
  return `<section class="lab-card-grid">${(lesson.quantifiers || []).map(item => `
    <article class="lab-flip-card">
      <div class="card-head"><span class="tag">Quantifier</span><span>${item.id || ""}</span></div>
      <h3>${item.pattern}</h3>
      <p class="meaning">${item.chinese}</p>
      <div class="example-line"><b>${item.example}</b><span>${item.exampleZh || ""}</span></div>
      ${labActionButtons(item.pattern, `quantifier:${item.id || item.pattern}`, "句型", item.example || item.pattern)}
    </article>
  `).join("")}</section>`;
}

function renderLessonLabSpeaking(lesson) {
  return `<section class="speaking-lab">${(lesson.speakingQuestions || []).map((item, index) => `
    <article class="lab-card speaking-card">
      <h3>${item.question}</h3>
      <p class="meaning">${item.questionZh || ""}</p>
      <div class="speaking-levels">
        <div><span>A2 简单回答</span><p>${item.a2Answer || item.a2 || ""}</p>${labActionButtons(item.a2Answer || item.a2 || "", `speak:a2:${item.id || index}`, "听不懂", item.a2Answer || item.a2 || "")}</div>
        <div><span>B1 更自然回答</span><p>${item.b1Answer || item.b1 || ""}</p>${labActionButtons(item.b1Answer || item.b1 || "", `speak:b1:${item.id || index}`, "听不懂", item.b1Answer || item.b1 || "")}</div>
      </div>
      <div class="personal-box"><b>Useful chunks</b><span>${(item.usefulChunks || []).join(" / ") || item.personalPrompt || ""}</span></div>
    </article>
  `).join("")}</section>`;
}

function renderLessonLabTasks(lesson) {
  return `<section class="lab-card-grid">${(lesson.realLifeTasks || []).map(item => `
    <article class="lab-flip-card">
      <div class="card-head"><span class="tag">Real Life Task</span><span>${item.id || ""}</span></div>
      <h3>${item.title}</h3>
      <p class="meaning">${item.scenarioZh}</p>
      <div class="example-line"><b>${item.sentence}</b><span>${item.sentenceZh || ""}</span></div>
      ${labActionButtons(item.sentence, `task:${item.id || item.title}`, "真实场景", item.sentence)}
    </article>
  `).join("")}</section>`;
}

function renderLessonLabMistakes() {
  if (!state.lessonLabMistakes.length) {
    return `<article class="lab-card"><p class="empty-note">还没有截图课程错题。点击词卡、短语或句型上的“加入错题本”后，会出现在这里。</p></article>`;
  }
  return `<section class="lab-card-grid">${state.lessonLabMistakes.map(item => `
    <article class="lab-card">
      <div class="card-head"><span class="tag">${item.type}</span><span>复习 ${item.reviews} 次</span></div>
      <h3>${item.content}</h3>
      <p>最近复习：${item.lastReviewed || "还未复习"}</p>
      <div class="speak-actions"><button data-lab-review="${item.id}">标记复习</button><button data-lab-speak="${escapeAttr(item.content)}" data-rate="0.75">朗读</button></div>
    </article>
  `).join("")}</section>`;
}

function labSpeakText(text, rate = 0.95) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices?.() || [];
  const voice = voices.find(item => /^en[-_]NZ$/i.test(item.lang))
    || voices.find(item => /^en[-_]GB$/i.test(item.lang))
    || voices.find(item => /^en[-_]US$/i.test(item.lang))
    || voices.find(item => /^en/i.test(item.lang));
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || "en-US";
  utterance.rate = rate;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
}

async function playHighQualityTTS(text, speed = 0.8) {
  const cache = window.__lessonLabTtsCache || (window.__lessonLabTtsCache = {});
  const key = `${text}::${speed}`;
  try {
    if (cache[key]) {
      new Audio(cache[key]).play();
      return;
    }
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice: "default", speed })
    });
    if (!response.ok) throw new Error("TTS request failed");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    cache[key] = url;
    new Audio(url).play();
  } catch {
    labSpeakText(text, speed);
  }
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
  renderDailyMission();
  renderLessonSelectors();
  renderLesson();
  renderVerbSelectors();
  renderVerb();
  renderScenarioSelectors();
  renderScenario();
  renderPronunciation();
  renderVocabulary();
  renderRealLife();
  renderCouldntSay();
  renderProgress();
  renderLessonLab();
  renderTest();
  renderMistakes();
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-view], [data-jump]");
  if (nav) switchView(nav.dataset.view || nav.dataset.jump);

  const labScroll = event.target.closest("[data-lab-scroll]");
  if (labScroll) document.getElementById(labScroll.dataset.labScroll)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const loadExample = event.target.closest("[data-load-example-lesson]");
  if (loadExample) {
    state.lessonLab = data.lessonLabExample;
    state.lessonLabProgress = { mastered: [], tasks: [] };
    saveLessonLab();
    $("lessonJsonInput").value = JSON.stringify(state.lessonLab, null, 2);
    $("lessonImportStatus").textContent = "已加载 exampleLessonData。";
    renderLessonLab();
  }

  const labTab = event.target.closest("[data-lab-tab]");
  if (labTab) {
    state.lessonLabTab = labTab.dataset.labTab;
    renderLessonLab();
  }

  const labSpeak = event.target.closest("[data-lab-speak]");
  if (labSpeak) labSpeakText(labSpeak.dataset.labSpeak, Number(labSpeak.dataset.rate || "0.95"));

  const labTts = event.target.closest("[data-lab-tts]");
  if (labTts) playHighQualityTTS(labTts.dataset.labTts, Number(labTts.dataset.speed || "0.8"));

  const labMaster = event.target.closest("[data-lab-master]");
  if (labMaster) {
    const key = labMaster.dataset.labMaster;
    if (!state.lessonLabProgress.mastered.includes(key)) state.lessonLabProgress.mastered.push(key);
    saveLessonLab();
    renderLessonLab();
  }

  const labTask = event.target.closest("[data-lab-task]");
  if (labTask) {
    const key = labTask.dataset.labTask;
    if (!state.lessonLabProgress.tasks.includes(key)) state.lessonLabProgress.tasks.push(key);
    saveLessonLab();
    $("lessonImportStatus").textContent = "已加入今日任务。";
    renderLessonLab();
  }

  const labMistake = event.target.closest("[data-lab-mistake]");
  if (labMistake) {
    state.lessonLabMistakes = [{
      id: crypto.randomUUID ? crypto.randomUUID() : `lab-${Date.now()}`,
      content: labMistake.dataset.mistakeContent,
      type: labMistake.dataset.mistakeType || "意思",
      reviews: 0,
      lastReviewed: "",
      createdAt: new Date().toISOString()
    }, ...state.lessonLabMistakes].slice(0, 100);
    saveLessonLab();
    $("lessonImportStatus").textContent = "已加入截图课程错题本。";
    renderLessonLab();
  }

  const labReview = event.target.closest("[data-lab-review]");
  if (labReview) {
    state.lessonLabMistakes = state.lessonLabMistakes.map(item => item.id === labReview.dataset.labReview
      ? { ...item, reviews: item.reviews + 1, lastReviewed: todayKey() }
      : item);
    saveLessonLab();
    renderLessonLab();
  }

  const showLabAnswer = event.target.closest("[data-show-lab-answer]");
  if (showLabAnswer) $("labSwitchAnswer")?.classList.remove("hidden");

  const nextLabSwitch = event.target.closest("[data-next-lab-switch]");
  if (nextLabSwitch) {
    state.lessonLabSwitchIndex += 1;
    renderLessonLab();
  }

  const audioButton = event.target.closest("[data-audio], [data-text]");
  if (audioButton && !audioButton.dataset.followRead) {
    window.EnglishAudio?.playAudioOrTTS({
      audioPath: audioButton.dataset.audio,
      text: audioButton.dataset.text,
      slow: audioButton.dataset.slow === "true"
    });
  }

  const followRead = event.target.closest("[data-follow-read]");
  if (followRead) {
    window.EnglishAudio?.playAudioOrTTS({
      audioPath: followRead.dataset.audio,
      text: followRead.dataset.text,
      slow: followRead.dataset.slow === "true"
    });
    window.EnglishAudio?.recordFollowRead(followRead.dataset.followRead);
    $("statusText").textContent = `Repeat it aloud. ${followRead.dataset.meaning || ""} ${followRead.dataset.keywords || ""}`;
    markMissionDone(followRead.dataset.followRead);
    renderDailyMission();
    renderProgress();
  }

  const fav = event.target.closest("[data-fav-word]");
  if (fav) {
    state.favoriteWords = toggleArray(store.favoriteWords, state.favoriteWords, fav.dataset.favWord);
    renderVocabulary();
    renderRealLife();
    renderProgress();
  }

  const master = event.target.closest("[data-master-word]");
  if (master) {
    state.masteredWords = toggleArray(store.masteredWords, state.masteredWords, master.dataset.masterWord);
    renderVocabulary();
    renderRealLife();
    renderProgress();
  }

  const missionDone = event.target.closest("[data-mission-done]");
  if (missionDone) {
    markMissionDone(missionDone.dataset.missionDone);
    renderDailyMission();
    renderProgress();
  }

  const pairMaster = event.target.closest("[data-pair-master]");
  if (pairMaster) {
    state.minimalPairs[pairMaster.dataset.pairMaster] = !state.minimalPairs[pairMaster.dataset.pairMaster];
    writeJSON(store.minimalPairs, state.minimalPairs);
    renderVocabulary();
  }

  const couldntMaster = event.target.closest("[data-couldnt-master]");
  if (couldntMaster) {
    state.couldntSay = state.couldntSay.map(item => item.id === couldntMaster.dataset.couldntMaster ? { ...item, mastered: !item.mastered } : item);
    writeJSON(store.couldntSay, state.couldntSay);
    renderCouldntSay();
  }

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

function toggleArray(key, current, id) {
  const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
  writeJSON(key, next);
  return next;
}

$("lessonSelect").addEventListener("change", event => { state.lessonIndex = Number(event.target.value); renderLesson(); });
$("verbSelect").addEventListener("change", event => { state.verbIndex = Number(event.target.value); renderVerb(); });
$("scenarioSelect").addEventListener("change", event => { state.scenarioIndex = Number(event.target.value); renderScenario(); });
$("scenarioLevel").addEventListener("change", event => { state.scenarioLevel = event.target.value; renderScenario(); });
$("nextTest").addEventListener("click", () => { state.testIndex += 1; renderTest(); });
$("slowSpeed").addEventListener("click", () => { state.voiceRate = 0.62; $("statusText").textContent = "发音速度：慢速。"; });
$("normalSpeed").addEventListener("click", () => { state.voiceRate = 0.86; $("statusText").textContent = "发音速度：正常。"; });
$("clearMistakes").addEventListener("click", () => { state.mistakes = []; writeJSON(store.mistakes, state.mistakes); renderMistakes(); renderHome(); });
$("voiceToggle")?.addEventListener("click", () => {
  const next = !window.EnglishAudio?.isVoiceEnabled();
  window.EnglishAudio?.setVoiceEnabled(next);
  $("voiceToggle").textContent = next ? "声音开" : "静音";
});
$("vocabCategory")?.addEventListener("change", event => { state.vocabCategory = event.target.value; renderVocabulary(); });
$("vocabLevel")?.addEventListener("change", event => { state.vocabLevel = event.target.value; renderVocabulary(); });
$("realLifeCategory")?.addEventListener("change", event => { state.realLifeCategory = event.target.value; renderRealLife(); });
$("importLessonJson")?.addEventListener("click", () => {
  try {
    const parsed = JSON.parse($("lessonJsonInput").value);
    state.lessonLab = parsed;
    state.lessonLabProgress = { mastered: [], tasks: [] };
    saveLessonLab();
    $("lessonImportStatus").textContent = "JSON 课程导入成功。";
    renderLessonLab();
  } catch {
    $("lessonImportStatus").textContent = "JSON 格式不正确，请检查括号、逗号和引号。";
  }
});
$("resetLessonLab")?.addEventListener("click", () => {
  state.lessonLab = data.lessonLabExample;
  state.lessonLabProgress = { mastered: [], tasks: [] };
  $("lessonJsonInput").value = JSON.stringify(state.lessonLab, null, 2);
  saveLessonLab();
  renderLessonLab();
});
$("lessonImageInput")?.addEventListener("change", event => {
  const file = event.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  $("lessonImagePreview").innerHTML = `<img src="${url}" alt="Uploaded lesson screenshot preview"><span>${file.name}</span>`;
});
$("couldntForm")?.addEventListener("submit", event => {
  event.preventDefault();
  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : `say-${Date.now()}`,
    date: todayKey(),
    originalText: $("couldntOriginal").value.trim(),
    naturalEnglish: $("couldntNatural").value.trim(),
    simpleEnglish: $("couldntSimple").value.trim(),
    keywords: $("couldntKeywords").value.trim(),
    category: "Daily Speaking",
    mastered: false
  };
  if (!item.originalText) return;
  state.couldntSay = [item, ...state.couldntSay].slice(0, 80);
  writeJSON(store.couldntSay, state.couldntSay);
  markMissionDone("couldnt-say");
  event.target.reset();
  renderCouldntSay();
  renderDailyMission();
  renderProgress();
});

refreshVoices();
if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", refreshVoices);
function initialViewFromLocation() {
  if (location.pathname.replace(/\/$/, "").endsWith("/lesson-lab")) return "lessonLab";
  return location.hash.replace("#", "") || "home";
}

window.addEventListener("hashchange", () => switchView(location.hash.replace("#", "") || "home"));
renderAll();
switchView(initialViewFromLocation());
