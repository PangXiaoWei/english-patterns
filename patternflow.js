(function () {
  "use strict";

  const root = document.getElementById("patternFlowApp");
  const content = window.PATTERN_FLOW_DATA || {};
  if (!root) return;

  const keys = {
    progress: "patternFlow.progress",
    unitProgress: "patternFlow.unit5.progress",
    knownWords: "patternFlow.knownWords",
    wrongAnswers: "patternFlow.wrongAnswers",
    voice: "patternFlow.voice",
    practiceScores: "patternFlow.practiceScores",
    lastLocation: "patternFlow.lastLocation",
    lastVisit: "patternFlow.lastVisit",
    preferences: "patternFlow.preferences",
    dailyActivity: "patternFlow.dailyActivity",
    expressions: "patternFlow.expressions"
  };

  const state = {
    view: initialView(),
    menuOpen: false,
    settingsOpen: false,
    speakingIndex: 0,
    speakingCategory: "全部",
    showKeywords: false,
    showModel: false,
    quickWords: [],
    preferences: readJSON(keys.preferences, { theme: "system", rate: "normal", followPause: 3 }),
    daily: readJSON(keys.dailyActivity, { date: todayKey(), done: [], returnComplete: "" }),
    previousVisit: localStorage.getItem(keys.lastVisit) || "",
    recording: null
  };

  let mediaRecorder = null;
  let mediaStream = null;
  let recordingChunks = [];
  let recordingStarted = 0;
  let recordingClock = null;
  let recordingUrl = "";

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : JSON.parse(JSON.stringify(fallback));
    } catch {
      return JSON.parse(JSON.stringify(fallback));
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function todayKey(date = new Date()) {
    return date.toLocaleDateString("en-CA");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function initialView() {
    const path = location.pathname.replace(/\/$/, "");
    if (path.endsWith("/studio")) return "studio";
    if (path.endsWith("/unit-5")) return "courses";
    const hash = location.hash.replace("#", "");
    return ["home", "courses", "speaking", "review", "progress", "settings", "studio"].includes(hash) ? hash : "home";
  }

  function setupShell() {
    root.innerHTML = `
      <div class="pf-app">
        <header class="pf-topbar">
          <button class="pf-mobile-menu" type="button" data-pf-menu aria-label="打开导航" aria-expanded="false">☰</button>
          <a class="pf-brand" href="#home" data-pf-view-link="home" aria-label="PatternFlow 首页">
            <span class="pf-brand-mark" aria-hidden="true">PF</span>
            <span><b>PatternFlow</b><small>English Patterns and Speaking Practice</small></span>
          </a>
          <nav class="pf-nav" id="pfNav" aria-label="主导航">
            ${[["home", "首页"], ["courses", "课程"], ["speaking", "口语"], ["review", "复习"], ["progress", "进度"]].map(([view, label]) => `<button type="button" data-pf-view-link="${view}">${label}</button>`).join("")}
          </nav>
          <div class="pf-header-tools">
            <div class="pf-audio-state" id="pfAudioState" aria-live="polite"><span class="pf-wave" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span id="pfAudioLabel">语音待命</span></div>
            <button type="button" class="pf-icon-button" data-pf-stop aria-label="停止朗读">■</button>
            <button type="button" class="pf-icon-button" data-pf-settings aria-label="打开设置">⚙</button>
          </div>
        </header>

        <main class="pf-main">
          <section class="pf-view" data-pf-view="home" id="pfHome"></section>
          <section class="pf-view" data-pf-view="courses" id="pfCourses"><div id="unit5App"></div></section>
          <section class="pf-view" data-pf-view="speaking" id="pfSpeaking"></section>
          <section class="pf-view" data-pf-view="review" id="pfReview"></section>
          <section class="pf-view" data-pf-view="progress" id="pfProgress"></section>
          <section class="pf-view" data-pf-view="settings" id="pfSettings"></section>
          <section class="pf-view" data-pf-view="studio" id="pfStudio"></section>
        </main>

        <aside class="pf-settings-drawer" id="pfSettingsDrawer" aria-label="快速设置" aria-hidden="true">
          <div><h2>快速设置</h2><button type="button" data-pf-settings-close aria-label="关闭设置">×</button></div>
          <label>主题<select id="pfQuickTheme"><option value="system">跟随系统</option><option value="dark">深色</option><option value="light">浅色</option></select></label>
          <label>播放速度<select id="pfQuickRate"><option value="normal">正常 0.9</option><option value="slow">慢速 0.68</option></select></label>
          <button type="button" class="pf-secondary-button" data-pf-open-settings>完整设置与数据</button>
        </aside>
        <div class="pf-drawer-backdrop" data-pf-settings-close></div>

        <footer class="pf-footer"><span>PatternFlow</span><p>Independent English Learning Project · 学习数据只保存在当前浏览器。</p><a href="studio/" data-pf-studio-link>课程工作室</a></footer>
      </div>
    `;
    syncPreferencesControls();
  }

  function renderAll() {
    renderHome();
    renderSpeaking();
    renderReview();
    renderProgress();
    renderSettings();
    renderStudio();
    switchView(state.view, false);
  }

  function unitProgress() {
    return readJSON(keys.unitProgress, {
      lessons: { "5A": [], "5B": [], "5C": [], "5D": [] },
      lastLocation: { page: "overview", lesson: "5A", step: "quick" },
      challengeBest: 0,
      reviewBest: 0
    });
  }

  function unitPercent(progress = unitProgress()) {
    const lessons = progress.lessons || {};
    const done = Object.values(lessons).reduce((sum, steps) => sum + (Array.isArray(steps) ? steps.length : 0), 0);
    return Math.round(done / 28 * 100);
  }

  function returnModeActive() {
    if (!state.previousVisit || state.daily.returnComplete === todayKey()) return false;
    const previous = new Date(`${state.previousVisit}T00:00:00`);
    const current = new Date(`${todayKey()}T00:00:00`);
    return Math.floor((current - previous) / 86400000) >= 3;
  }

  function ensureDaily() {
    if (state.daily.date !== todayKey()) state.daily = { date: todayKey(), done: [], returnComplete: state.daily.returnComplete || "" };
    writeJSON(keys.dailyActivity, state.daily);
  }

  function renderHome() {
    ensureDaily();
    const panel = document.getElementById("pfHome");
    if (!panel) return;
    const progress = unitProgress();
    const last = progress.lastLocation || { lesson: "5A", step: "quick" };
    const lessonName = lessonTitle(last.lesson);
    const percent = unitPercent(progress);
    const isReturn = returnModeActive();
    const tasks = isReturn
      ? [["listen-2", "听两句", "2 句"], ["repeat-2", "跟读两句", "2 句"], ["practice-3", "做三道题", "3 题"]]
      : [["listen-5", "听 5 句", "约 3 分钟"], ["speak-3", "说 3 句", "约 3 分钟"], ["practice-5", "练 5 题", "约 4 分钟"]];
    const completed = tasks.filter(([id]) => state.daily.done.includes(id)).length;
    const wrong = readJSON(keys.wrongAnswers, []);
    const known = readJSON(keys.knownWords, []);
    if (!state.quickWords.length) state.quickWords = randomWords(5);

    panel.innerHTML = `
      <section class="pf-home-hero ${isReturn ? "return-mode" : ""}">
        <div class="pf-hero-copy">
          <p class="pf-kicker">${isReturn ? "WELCOME BACK" : "CONTINUE LEARNING"}</p>
          <h1>${isReturn ? "欢迎回来" : "继续上次学习"}</h1>
          <p>${isReturn ? "不用补之前的任务。今天先用 5 分钟重新启动。" : `Unit 5 · ${last.lesson} ${lessonName}`}</p>
          ${isReturn ? "" : `<dl class="pf-continue-stats"><div><dt>上次学到</dt><dd>${stepLabel(last.step)}</dd></div><div><dt>当前进度</dt><dd>${percent}%</dd></div><div><dt>预计时间</dt><dd>8 分钟</dd></div></dl>`}
          <button type="button" class="pf-primary-button" data-pf-continue>${isReturn ? "开始 5 分钟恢复训练" : "继续上次学习"}</button>
        </div>
        <div class="pf-daily-card">
          <div class="pf-daily-head"><div><span>${isReturn ? "重新启动" : "今日十分钟训练"}</span><h2>${isReturn ? "今天只做三个小步骤" : "今天只做三件事"}</h2></div><strong>${completed}/${tasks.length}</strong></div>
          <div class="pf-daily-list">${tasks.map(([id, title, time], index) => `<button type="button" data-pf-daily="${id}" class="${state.daily.done.includes(id) ? "done" : ""}"><span>${state.daily.done.includes(id) ? "✓" : index + 1}</span><b>${title}</b><small>${time}</small></button>`).join("")}</div>
          <p>完成一个小步骤就很好，不累积以前的任务。</p>
        </div>
      </section>

      <section class="pf-quick-grid" aria-label="常用学习入口">
        <article class="pf-quick-card speak"><span>01 · SPEAK NOW</span><h2>立即开口</h2><p>${escapeHtml(currentSpeakingPrompt().question)}</p><div><button type="button" data-pf-speak="${escapeAttr(currentSpeakingPrompt().question)}">听问题</button><button type="button" data-pf-view-link="speaking">开始回答</button></div></article>
        <article class="pf-quick-card review"><span>02 · SMART REVIEW</span><h2>复习错题</h2><p>${wrong.length ? `为你选出近期最值得复习的 ${Math.min(8, wrong.length)} 道题。` : "完成练习后，这里会自动安排复习。"}</p><div><b>${wrong.length}</b><button type="button" data-pf-view-link="review">进入复习</button></div></article>
        <article class="pf-quick-card vocab"><span>03 · QUICK VOCABULARY</span><h2>快速词汇</h2><p>每次 5 个词，听、读、说，然后标记掌握。</p><div><b>${known.length}</b><button type="button" data-pf-quick-vocab>查看 5 个词</button></div></article>
      </section>

      <section class="pf-current-course">
        <div class="pf-section-title"><div><span>CURRENT COURSE</span><h2>Unit 5 – Things</h2></div><button type="button" class="pf-secondary-button" data-pf-view-link="courses">打开课程地图</button></div>
        <div class="pf-compact-lessons">${["5A", "5B", "5C", "5D"].map(id => { const steps = progress.lessons?.[id] || []; const p = Math.round(steps.length / 7 * 100); return `<article><span>${p === 100 ? "✓ 已完成" : p ? `进行中 ${p}%` : "未开始"}</span><h3>${id} ${lessonTitle(id)}</h3><div class="pf-progress-track"><i style="width:${p}%"></i></div><button type="button" data-pf-open-lesson="${id}">${p ? "继续" : "开始"}</button></article>`; }).join("")}</div>
      </section>

      <section class="pf-quick-vocabulary" id="pfQuickVocabulary" hidden>
        <div class="pf-section-title"><div><span>FIVE-WORD SESSION</span><h2>快速词汇</h2></div><button type="button" class="pf-secondary-button" data-pf-shuffle-vocab>换 5 个</button></div>
        <div class="pf-word-row">${state.quickWords.map(renderQuickWord).join("")}</div>
      </section>
    `;
  }

  function lessonTitle(id) {
    return ({ "5A": "Hidden Value", "5B": "Living at a Slower Pace", "5C": "Describe and Recommend a Product", "5D": "Borrowing, Lending and Giving" })[id] || "Hidden Value";
  }

  function stepLabel(step) {
    return ({ quick: "快速理解", learn: "句型与语法", vocabulary: "核心词汇", examples: "听与跟读", practice: "控制练习", realLife: "真实表达", checkpoint: "自我检查" })[step] || "快速理解";
  }

  function randomWords(count) {
    const source = normalizeVocabulary();
    return shuffle(source).slice(0, Math.min(count, source.length));
  }

  function normalizeVocabulary() {
    const fromSite = (window.VOCABULARY || []).map((item, index) => ({
      id: `site-${item.id || index}`,
      word: item.text || item.word || "useful",
      ipa: item.ipa || "",
      zh: item.meaning || item.chinese || "实用的",
      pos: item.partOfSpeech || item.type || "word",
      example: item.example || item.exampleSentence || `This is a useful ${item.text || "word"}.`
    }));
    const unit = window.UNIT5_DATA?.lessonA?.vocabulary?.map((item, index) => ({ id: `unit5-a-${index}`, word: item[0], ipa: item[1], zh: item[2], pos: "word", example: item[3] })) || [];
    return [...unit, ...fromSite].filter(item => item.word && item.example && item.ipa);
  }

  function renderQuickWord(item) {
    const known = readJSON(keys.knownWords, []).includes(item.id);
    return `<article class="pf-word-card ${known ? "mastered" : ""}" data-audio-card><div><span>${escapeHtml(item.pos)}</span><button type="button" data-pf-master-word="${item.id}">${known ? "✓ 已掌握" : "标记掌握"}</button></div><h3>${escapeHtml(item.word)}</h3><p class="pf-ipa">${escapeHtml(item.ipa)}</p><p>${escapeHtml(item.zh)}</p><p class="pf-example">${escapeHtml(item.example)}</p><div class="pf-audio-buttons"><button type="button" data-pf-speak="${escapeAttr(item.word)}">Normal</button><button type="button" data-pf-speak="${escapeAttr(item.word)}" data-pf-slow="true">Slow</button><button type="button" data-pf-speak="${escapeAttr(item.example)}">例句</button></div></article>`;
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function currentSpeakingPrompt() {
    const pool = filteredPrompts();
    return pool[state.speakingIndex % Math.max(1, pool.length)] || { question: "What is one useful thing you learned today?", keywords: ["learned", "useful", "next"], model: "I learned one useful phrase today, and I want to use it again tomorrow." };
  }

  function filteredPrompts() {
    const prompts = content.speakingPrompts || [];
    return state.speakingCategory === "全部" ? prompts : prompts.filter(item => item.category === state.speakingCategory);
  }

  function renderSpeaking() {
    const panel = document.getElementById("pfSpeaking");
    if (!panel) return;
    const prompt = currentSpeakingPrompt();
    const categories = ["全部", ...new Set((content.speakingPrompts || []).map(item => item.category))];
    panel.innerHTML = `
      <section class="pf-page-head"><div><span>SPEAK NOW</span><h1>立即开口</h1><p>先听问题，再用自己的信息回答。这里不做虚假的发音评分。</p></div><label>分类<select id="pfSpeakingCategory">${categories.map(item => `<option ${item === state.speakingCategory ? "selected" : ""}>${item}</option>`).join("")}</select></label></section>
      <section class="pf-speaking-stage" data-audio-card>
        <div class="pf-speaking-number">${String((state.speakingIndex % Math.max(1, filteredPrompts().length)) + 1).padStart(2, "0")}</div>
        <p>${escapeHtml(prompt.category)}</p>
        <h2>${escapeHtml(prompt.question)}</h2>
        <div class="pf-audio-buttons"><button type="button" data-pf-speak="${escapeAttr(prompt.question)}">Normal</button><button type="button" data-pf-speak="${escapeAttr(prompt.question)}" data-pf-slow="true">Slow</button><button type="button" data-pf-stop>Stop</button></div>
        <div class="pf-speaking-tools"><button type="button" data-pf-toggle-keywords>${state.showKeywords ? "隐藏关键词" : "显示关键词"}</button><button type="button" data-pf-toggle-model>${state.showModel ? "隐藏参考表达" : "查看参考表达"}</button><button type="button" data-pf-next-speaking>换一题</button></div>
        ${state.showKeywords ? `<div class="pf-keywords">${prompt.keywords.map(item => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        ${state.showModel ? `<div class="pf-model"><b>参考表达</b><p>${escapeHtml(prompt.model)}</p><div class="pf-audio-buttons"><button type="button" data-pf-speak="${escapeAttr(prompt.model)}">Normal</button><button type="button" data-pf-speak="${escapeAttr(prompt.model)}" data-pf-slow="true">Slow</button></div></div>` : ""}
        <div class="pf-speaking-timer"><span>准备 10 秒</span><i></i><span>回答 30 秒</span></div>
        ${renderRecorder("speaking-main")}
        <div class="pf-self-check"><span>自我检查</span><label><input type="checkbox"> 我直接回答了问题</label><label><input type="checkbox"> 我说了一个原因</label><label><input type="checkbox"> 我给了一个例子</label></div>
      </section>
    `;
  }

  function renderRecorder(id) {
    const recording = state.recording?.id === id ? state.recording : null;
    const active = mediaRecorder?.state === "recording";
    return `<div class="pf-recorder"><div><button type="button" class="pf-record-button ${active ? "recording" : ""}" data-pf-record-start="${id}" ${active ? "disabled" : ""}>● ${active ? "录音中" : "开始录音"}</button><button type="button" data-pf-record-stop ${active ? "" : "disabled"}>停止</button><button type="button" data-pf-record-play ${recording ? "" : "disabled"}>回放</button><button type="button" data-pf-record-delete ${recording ? "" : "disabled"}>删除</button><strong id="pfRecordTime">${active ? formatTime(Math.floor((Date.now() - recordingStarted) / 1000)) : recording?.duration || "00:00"}</strong></div><p id="pfRecordStatus">${recording ? "录音只保存在当前浏览器会话。" : "请允许浏览器使用麦克风。录音不用于自动评分。"}</p></div>`;
  }

  function renderReview() {
    const panel = document.getElementById("pfReview");
    if (!panel) return;
    const wrong = readJSON(keys.wrongAnswers, []);
    const due = [...wrong].sort((a, b) => String(a.nextReview || "").localeCompare(String(b.nextReview || ""))).slice(0, 8);
    const counts = wrong.reduce((all, item) => ({ ...all, [item.point || item.type || "句型"]: (all[item.point || item.type || "句型"] || 0) + 1 }), {});
    const weak = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const expressions = readJSON(keys.expressions, []);
    panel.innerHTML = `
      <section class="pf-page-head"><div><span>SMART REVIEW</span><h1>复习</h1><p>根据近期错误安排少量练习。连续正确两次后会降低出现频率。</p></div><button type="button" class="pf-primary-button" data-pf-open-unit-review>开始今日复习</button></section>
      <section class="pf-review-summary"><article><strong>${due.length}</strong><span>今日建议复习</span></article><article><strong>${wrong.length}</strong><span>全部错题</span></article><article><strong>${expressions.length}</strong><span>我的表达</span></article><article><strong>${weak[0]?.[0] || "等待数据"}</strong><span>最常错知识点</span></article></section>
      <section class="pf-review-layout">
        <div><div class="pf-section-title"><div><span>TODAY'S REVIEW</span><h2>近期最值得复习</h2></div></div>${due.length ? `<div class="pf-mistake-list">${due.map(renderMistake).join("")}</div>` : renderEmpty("完成一次控制练习后，这里会自动出现复习内容。")}</div>
        <aside class="pf-review-side"><h2>最常错知识点</h2>${weak.length ? weak.map(([point, count], index) => `<div><span>${index + 1}</span><b>${escapeHtml(point)}</b><em>${count} 次</em></div>`).join("") : `<p>还没有足够数据。</p>`}<button type="button" data-pf-open-challenge>Unit 5 Challenge · 综合挑战</button></aside>
      </section>
      <section class="pf-expression-lab"><div class="pf-section-title"><div><span>MY EXPRESSIONS</span><h2>我的表达</h2></div></div><form id="pfExpressionForm"><label>今天想说但没说出来的意思<input id="pfExpressionZh" required placeholder="例如：我需要一点时间检查这个问题"></label><label>自然英文<input id="pfExpressionEn" required placeholder="I need a little time to check this problem."></label><button class="pf-primary-button">保存表达</button></form><div class="pf-expression-list">${expressions.slice(0, 8).map(item => `<article><p>${escapeHtml(item.zh)}</p><strong>${escapeHtml(item.en)}</strong><button type="button" data-pf-speak="${escapeAttr(item.en)}">播放</button></article>`).join("")}</div></section>
    `;
  }

  function renderMistake(item) {
    return `<article class="pf-mistake-card"><div><span>${escapeHtml(item.point || item.type || "句型")}</span><em>复习 ${item.reviews || 0} 次</em></div><h3>${escapeHtml(item.question || item.trigger || "Review this pattern")}</h3><p><b>你的答案：</b>${escapeHtml(item.chosen || item.wrong || "未作答")}</p><p class="correct"><b>正确答案：</b>${escapeHtml(item.answer || item.right || "")}</p><p>${escapeHtml(item.explanation || "重新对照结构，再说一个新例句。")}</p>${item.example ? `<p class="example">${escapeHtml(item.example)} <button type="button" data-pf-speak="${escapeAttr(item.example)}">播放</button></p>` : ""}<div><button type="button" data-pf-understood="${escapeAttr(item.id)}">我已经理解</button><button type="button" data-pf-open-unit-review>再练一次</button></div></article>`;
  }

  function renderProgress() {
    const panel = document.getElementById("pfProgress");
    if (!panel) return;
    const progress = readJSON(keys.progress, { activities: {}, total: 0, mistakesResolved: 0 });
    const unit = unitProgress();
    const known = readJSON(keys.knownWords, []);
    const wrong = readJSON(keys.wrongAnswers, []);
    const days = lastSevenDays().map(day => ({ day, count: Number(progress.activities?.[day] || 0) }));
    const max = Math.max(1, ...days.map(item => item.count));
    const completeLessons = Object.values(unit.lessons || {}).filter(items => Array.isArray(items) && items.length >= 7).length;
    const weak = mostCommonPoint(wrong);
    const hasData = progress.total || known.length || unitPercent(unit);
    panel.innerHTML = `
      <section class="pf-page-head"><div><span>LEARNING PROGRESS</span><h1>进度</h1><p>只显示学习事实，不制造连续缺勤压力。</p></div></section>
      ${hasData ? `<section class="pf-progress-dashboard"><article class="pf-progress-ring" style="--progress:${unitPercent(unit)}"><div><strong>${unitPercent(unit)}%</strong><span>Unit 5</span></div></article><div class="pf-progress-metrics"><article><strong>${progress.total || 0}</strong><span>总练习活动</span></article><article><strong>${known.length}</strong><span>已掌握词汇</span></article><article><strong>${completeLessons}</strong><span>完成章节</span></article><article><strong>${progress.mistakesResolved || 0}</strong><span>已降低频率错题</span></article></div><article class="pf-weekly"><h2>最近 7 天练习</h2><div>${days.map(item => `<span><i style="height:${Math.max(6, item.count / max * 100)}%"></i><small>${item.day.slice(5)}</small><b>${item.count}</b></span>`).join("")}</div></article></section><section class="pf-progress-detail"><article><span>最近学习位置</span><h2>${unit.lastLocation?.lesson || "5A"} · ${stepLabel(unit.lastLocation?.step)}</h2></article><article><span>当前最常错</span><h2>${escapeHtml(weak || "暂无")}</h2></article><article><span>推荐下一步</span><h2>${wrong.length ? "先复习 5 道错题" : "继续 Unit 5 的下一个小步骤"}</h2></article></section>` : renderEmpty("Start your first activity to see your learning progress.\n开始第一次学习后，这里将显示你的学习进度。")}
    `;
  }

  function lastSevenDays() {
    return Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return todayKey(date); });
  }

  function mostCommonPoint(items) {
    const counts = items.reduce((all, item) => { const key = item.point || item.type || "句型"; all[key] = (all[key] || 0) + 1; return all; }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }

  function renderSettings() {
    const panel = document.getElementById("pfSettings");
    if (!panel) return;
    panel.innerHTML = `
      <section class="pf-page-head"><div><span>SETTINGS</span><h1>设置</h1><p>主题、语音和学习数据都只保存在当前浏览器。</p></div></section>
      <section class="pf-settings-grid">
        <article><h2>外观</h2><label>主题<select id="pfTheme"><option value="system">跟随系统</option><option value="dark">深色</option><option value="light">浅色</option></select></label></article>
        <article><h2>语音</h2><label>备用英语语音<select id="pfVoice"></select></label><label>默认速度<select id="pfRate"><option value="normal">正常 0.9</option><option value="slow">慢速 0.68</option></select></label><label>跟读停顿<select id="pfFollowPause"><option value="2">2 秒</option><option value="3">3 秒</option><option value="4">4 秒</option></select></label><p>语音质量取决于当前浏览器、操作系统和已安装语音。已有本地 MP3 时会优先播放本地音频。</p></article>
        <article><h2>学习数据</h2><div class="pf-settings-actions"><button type="button" data-pf-export>导出学习数据</button><label class="pf-file-button">导入学习数据<input type="file" id="pfImport" accept="application/json"></label><button type="button" data-pf-reset-progress>重置学习进度</button><button type="button" data-pf-reset-settings>恢复默认设置</button></div></article>
        <article><h2>关于项目</h2><p><b>PatternFlow</b><br>Independent English Learning Project</p><p>${escapeHtml(content.brand?.description || "An independent English self-study platform for practical English.")}</p><p>不上传个人学习数据，不提供虚假的口音或发音评分。</p></article>
      </section>
    `;
    populateSettings();
  }

  function renderStudio() {
    const panel = document.getElementById("pfStudio");
    if (!panel) return;
    const example = {
      id: "patternflow-unit-5-draft",
      title: "Things and Everyday English",
      level: "A2+",
      topic: "value, time, products and borrowing",
      vocabulary: (window.UNIT5_DATA?.lessonA?.vocabulary || []).slice(0, 6).map((item, index) => ({
        id: `draft-word-${index + 1}`,
        word: item[0],
        ipa: item[1],
        chinese: item[2],
        example: item[3],
        audioText: item[0]
      }))
    };
    panel.innerHTML = `
      <section class="pf-page-head"><div><span>HIDDEN AUTHOR TOOL</span><h1>课程工作室</h1><p>创建、检查和预览结构化课程数据。普通学习导航不会显示此页面。</p></div><button type="button" class="pf-secondary-button" data-pf-view-link="courses">返回课程</button></section>
      <section class="pf-studio-grid"><article><h2>课程 JSON</h2><label for="pfStudioJson">结构化课程数据</label><textarea id="pfStudioJson" rows="22">${escapeHtml(JSON.stringify(example, null, 2))}</textarea><div><button type="button" data-pf-studio-preview>课程预览</button><button type="button" data-pf-studio-export>导出 JSON</button></div></article><article><h2>公开安全检查</h2><div class="pf-studio-checks"><button type="button" data-pf-studio-check="privacy">检查隐私关键词</button><button type="button" data-pf-studio-check="audio">检查缺失语音字段</button><button type="button" data-pf-studio-check="duplicate">检查重复内容</button></div><div id="pfStudioResult" class="pf-studio-result">等待检查。</div><h2>预览</h2><div id="pfStudioPreview" class="pf-studio-preview"></div></article></section>
    `;
  }

  function renderEmpty(text) {
    return `<div class="pf-empty"><span aria-hidden="true">◇</span><p>${escapeHtml(text).replace(/\n/g, "<br>")}</p></div>`;
  }

  function switchView(view, updateHash = true) {
    state.view = view;
    document.querySelectorAll("[data-pf-view]").forEach(section => section.classList.toggle("active", section.dataset.pfView === view));
    document.querySelectorAll("[data-pf-view-link]").forEach(button => button.classList.toggle("active", button.dataset.pfViewLink === view));
    document.querySelector(".pf-nav")?.classList.remove("open");
    state.menuOpen = false;
    if (updateHash && view !== "studio") history.replaceState(null, "", `#${view}`);
    writeJSON(keys.lastLocation, { view, updatedAt: new Date().toISOString() });
    window.EnglishAudio?.stopAudio?.();
    if (view === "home") renderHome();
    if (view === "speaking") renderSpeaking();
    if (view === "review") renderReview();
    if (view === "progress") renderProgress();
    if (view === "settings") renderSettings();
  }

  function trackActivity(type) {
    const progress = readJSON(keys.progress, { activities: {}, total: 0, mistakesResolved: 0 });
    progress.activities[todayKey()] = Number(progress.activities[todayKey()] || 0) + 1;
    progress.total = Number(progress.total || 0) + 1;
    progress.lastType = type;
    progress.lastAt = new Date().toISOString();
    writeJSON(keys.progress, progress);
  }

  async function playText(text, slow, button) {
    if (!text) return;
    setAudioState(true, text);
    button?.classList.add("is-playing");
    button?.closest("[data-audio-card]")?.classList.add("audio-active");
    try {
      await window.EnglishAudio?.playAudioOrTTS({ text, slow });
    } finally {
      button?.classList.remove("is-playing");
      button?.closest("[data-audio-card]")?.classList.remove("audio-active");
      setAudioState(false);
    }
  }

  function setAudioState(playing, text = "") {
    document.getElementById("pfAudioState")?.classList.toggle("playing", playing);
    const label = document.getElementById("pfAudioLabel");
    if (label) label.textContent = playing ? `正在播放：${text.slice(0, 28)}${text.length > 28 ? "…" : ""}` : "语音待命";
  }

  function syncPreferencesControls() {
    ["pfQuickTheme", "pfTheme"].forEach(id => { const el = document.getElementById(id); if (el) el.value = state.preferences.theme || "system"; });
    ["pfQuickRate", "pfRate"].forEach(id => { const el = document.getElementById(id); if (el) el.value = state.preferences.rate || "normal"; });
  }

  function applyTheme(theme) {
    state.preferences.theme = theme;
    writeJSON(keys.preferences, state.preferences);
    const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    syncPreferencesControls();
  }

  function populateSettings() {
    syncPreferencesControls();
    const pause = document.getElementById("pfFollowPause");
    if (pause) pause.value = String(state.preferences.followPause || 3);
    const voice = document.getElementById("pfVoice");
    if (!voice) return;
    const voices = window.EnglishAudio?.getVoices?.() || [];
    const saved = localStorage.getItem(keys.voice) || "";
    voice.innerHTML = `<option value="">自动选择清晰美式语音</option>${voices.filter(item => /^en/i.test(item.lang)).map(item => `<option value="${escapeAttr(item.name)}" ${saved === item.name ? "selected" : ""}>${escapeHtml(item.name)} · ${escapeHtml(item.lang)}</option>`).join("")}`;
  }

  async function startRecording(id) {
    const status = document.getElementById("pfRecordStatus");
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      if (status) status.textContent = "请使用 localhost、Live Server 或项目开发服务器打开页面，并允许浏览器使用麦克风。";
      return;
    }
    try {
      window.EnglishAudio?.stopAudio?.();
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingChunks = [];
      mediaRecorder = new MediaRecorder(mediaStream);
      recordingStarted = Date.now();
      mediaRecorder.ondataavailable = event => { if (event.data.size) recordingChunks.push(event.data); };
      mediaRecorder.onstop = () => finishRecording(id);
      mediaRecorder.start();
      recordingClock = setInterval(() => { const el = document.getElementById("pfRecordTime"); if (el) el.textContent = formatTime(Math.floor((Date.now() - recordingStarted) / 1000)); }, 250);
      renderSpeaking();
    } catch {
      if (status) status.textContent = "没有获得麦克风权限。请在浏览器中允许麦克风后重试。";
    }
  }

  function finishRecording(id) {
    clearInterval(recordingClock);
    mediaStream?.getTracks().forEach(track => track.stop());
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    const blob = new Blob(recordingChunks, { type: mediaRecorder?.mimeType || "audio/webm" });
    recordingUrl = URL.createObjectURL(blob);
    state.recording = { id, url: recordingUrl, duration: formatTime(Math.max(1, Math.round((Date.now() - recordingStarted) / 1000))) };
    trackActivity("speaking");
    renderSpeaking();
  }

  function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function exportData() {
    const payload = { version: 1, exportedAt: new Date().toISOString(), data: {} };
    Object.values(keys).forEach(key => { const value = localStorage.getItem(key); if (value !== null) payload.data[key] = value; });
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `patternflow-learning-data-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function handleClick(event) {
    const view = event.target.closest("[data-pf-view-link]");
    if (view) { event.preventDefault(); switchView(view.dataset.pfViewLink); return; }
    if (event.target.closest("[data-pf-menu]")) { state.menuOpen = !state.menuOpen; document.querySelector(".pf-nav")?.classList.toggle("open", state.menuOpen); event.target.setAttribute("aria-expanded", String(state.menuOpen)); return; }
    if (event.target.closest("[data-pf-settings]")) { toggleSettings(true); return; }
    if (event.target.closest("[data-pf-settings-close]")) { toggleSettings(false); return; }
    if (event.target.closest("[data-pf-open-settings]")) { toggleSettings(false); switchView("settings"); return; }
    if (event.target.closest("[data-pf-stop]")) { window.EnglishAudio?.stopAudio?.(); setAudioState(false); return; }

    const speak = event.target.closest("[data-pf-speak]");
    if (speak) { playText(speak.dataset.pfSpeak, speak.dataset.pfSlow === "true", speak); return; }

    if (event.target.closest("[data-pf-continue]")) {
      if (returnModeActive()) {
        state.daily.returnComplete = todayKey();
        writeJSON(keys.dailyActivity, state.daily);
        switchView("speaking");
      } else {
        const location = unitProgress().lastLocation || { lesson: "5A", step: "quick" };
        switchView("courses");
        window.PatternFlowUnit5?.open?.(location.lesson, location.step);
      }
      return;
    }

    const lesson = event.target.closest("[data-pf-open-lesson]");
    if (lesson) { switchView("courses"); window.PatternFlowUnit5?.open?.(lesson.dataset.pfOpenLesson, "quick"); return; }

    const daily = event.target.closest("[data-pf-daily]");
    if (daily) {
      const id = daily.dataset.pfDaily;
      if (!state.daily.done.includes(id)) { state.daily.done.push(id); trackActivity("daily"); }
      if (returnModeActive() && state.daily.done.filter(item => ["listen-2", "repeat-2", "practice-3"].includes(item)).length >= 3) state.daily.returnComplete = todayKey();
      writeJSON(keys.dailyActivity, state.daily);
      renderHome(); return;
    }

    if (event.target.closest("[data-pf-quick-vocab]")) { document.getElementById("pfQuickVocabulary")?.removeAttribute("hidden"); document.getElementById("pfQuickVocabulary")?.scrollIntoView({ behavior: "smooth" }); return; }
    if (event.target.closest("[data-pf-shuffle-vocab]")) { state.quickWords = randomWords(5); renderHome(); document.getElementById("pfQuickVocabulary")?.removeAttribute("hidden"); return; }
    const master = event.target.closest("[data-pf-master-word]");
    if (master) { const words = readJSON(keys.knownWords, []); const id = master.dataset.pfMasterWord; writeJSON(keys.knownWords, words.includes(id) ? words.filter(item => item !== id) : [...words, id]); trackActivity("vocabulary"); renderHome(); document.getElementById("pfQuickVocabulary")?.removeAttribute("hidden"); return; }

    if (event.target.closest("[data-pf-toggle-keywords]")) { state.showKeywords = !state.showKeywords; renderSpeaking(); return; }
    if (event.target.closest("[data-pf-toggle-model]")) { state.showModel = !state.showModel; renderSpeaking(); return; }
    if (event.target.closest("[data-pf-next-speaking]")) { state.speakingIndex += 1; state.showKeywords = false; state.showModel = false; renderSpeaking(); return; }

    const start = event.target.closest("[data-pf-record-start]");
    if (start) { startRecording(start.dataset.pfRecordStart); return; }
    if (event.target.closest("[data-pf-record-stop]")) { if (mediaRecorder?.state === "recording") mediaRecorder.stop(); return; }
    if (event.target.closest("[data-pf-record-play]")) { if (state.recording?.url) new Audio(state.recording.url).play().catch(() => {}); return; }
    if (event.target.closest("[data-pf-record-delete]")) { if (recordingUrl) URL.revokeObjectURL(recordingUrl); recordingUrl = ""; state.recording = null; renderSpeaking(); return; }

    const understood = event.target.closest("[data-pf-understood]");
    if (understood) {
      const wrong = readJSON(keys.wrongAnswers, []);
      const item = wrong.find(entry => String(entry.id) === understood.dataset.pfUnderstood);
      if (item) {
        item.correctStreak = Number(item.correctStreak || 0) + 1;
        item.reviews = Number(item.reviews || 0) + 1;
        const next = new Date(); next.setDate(next.getDate() + (item.correctStreak >= 2 ? 7 : 2)); item.nextReview = todayKey(next);
        if (item.correctStreak === 2) { const progress = readJSON(keys.progress, { activities: {}, total: 0, mistakesResolved: 0 }); progress.mistakesResolved = Number(progress.mistakesResolved || 0) + 1; writeJSON(keys.progress, progress); }
        writeJSON(keys.wrongAnswers, wrong);
        renderReview();
      }
      return;
    }
    if (event.target.closest("[data-pf-open-unit-review]")) { switchView("courses"); window.PatternFlowUnit5?.openPage?.("review"); return; }
    if (event.target.closest("[data-pf-open-challenge]")) { switchView("courses"); window.PatternFlowUnit5?.openPage?.("challenge"); return; }

    if (event.target.closest("[data-pf-export]")) { exportData(); return; }
    if (event.target.closest("[data-pf-reset-progress]")) { if (confirm("确定清除 PatternFlow 学习进度和错题吗？主题与语音设置会保留。")) { [keys.progress, keys.unitProgress, keys.knownWords, keys.wrongAnswers, keys.practiceScores, keys.lastLocation, keys.dailyActivity, keys.expressions].forEach(key => localStorage.removeItem(key)); location.reload(); } return; }
    if (event.target.closest("[data-pf-reset-settings]")) { localStorage.removeItem(keys.preferences); localStorage.removeItem(keys.voice); location.reload(); return; }
    if (event.target.closest("[data-pf-studio-link]")) { event.preventDefault(); switchView("studio", false); history.replaceState(null, "", "#studio"); return; }
    if (event.target.closest("[data-pf-studio-preview]")) { studioPreview(); return; }
    if (event.target.closest("[data-pf-studio-export]")) { studioExport(); return; }
    const studioCheck = event.target.closest("[data-pf-studio-check]");
    if (studioCheck) { studioCheckData(studioCheck.dataset.pfStudioCheck); }
  }

  function handleChange(event) {
    if (["pfTheme", "pfQuickTheme"].includes(event.target.id)) { applyTheme(event.target.value); return; }
    if (["pfRate", "pfQuickRate"].includes(event.target.id)) { state.preferences.rate = event.target.value; writeJSON(keys.preferences, state.preferences); syncPreferencesControls(); return; }
    if (event.target.id === "pfFollowPause") { state.preferences.followPause = Number(event.target.value); writeJSON(keys.preferences, state.preferences); return; }
    if (event.target.id === "pfVoice") { localStorage.setItem(keys.voice, event.target.value); window.EnglishAudio?.setVoiceName?.(event.target.value); return; }
    if (event.target.id === "pfSpeakingCategory") { state.speakingCategory = event.target.value; state.speakingIndex = 0; renderSpeaking(); return; }
    if (event.target.id === "pfImport") importData(event.target.files?.[0]);
  }

  function handleSubmit(event) {
    if (event.target.id !== "pfExpressionForm") return;
    event.preventDefault();
    const zh = document.getElementById("pfExpressionZh")?.value.trim();
    const en = document.getElementById("pfExpressionEn")?.value.trim();
    if (!zh || !en) return;
    const items = readJSON(keys.expressions, []);
    items.unshift({ id: crypto.randomUUID?.() || String(Date.now()), zh, en, createdAt: new Date().toISOString() });
    writeJSON(keys.expressions, items.slice(0, 100));
    trackActivity("expression");
    renderReview();
  }

  function toggleSettings(open) {
    state.settingsOpen = open;
    document.getElementById("pfSettingsDrawer")?.classList.toggle("open", open);
    document.querySelector(".pf-drawer-backdrop")?.classList.toggle("open", open);
    document.getElementById("pfSettingsDrawer")?.setAttribute("aria-hidden", String(!open));
  }

  async function importData(file) {
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      Object.entries(payload.data || {}).forEach(([key, value]) => { if (Object.values(keys).includes(key) && typeof value === "string") localStorage.setItem(key, value); });
      location.reload();
    } catch { alert("导入失败：请选择由 PatternFlow 导出的 JSON 文件。"); }
  }

  function studioData() {
    try { return JSON.parse(document.getElementById("pfStudioJson")?.value || "{}"); } catch { return null; }
  }

  function studioPreview() {
    const data = studioData();
    const target = document.getElementById("pfStudioPreview");
    if (!target) return;
    target.innerHTML = data ? `<h3>${escapeHtml(data.title || "Untitled lesson")}</h3><p>${escapeHtml(data.level || "")}</p><p>${escapeHtml(data.topic || data.source || "")}</p><strong>${Array.isArray(data.vocabulary) ? data.vocabulary.length : 0} vocabulary items</strong>` : `<p class="pf-error">JSON 格式不正确。</p>`;
  }

  function studioExport() {
    const data = studioData();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "patternflow-course-draft.json"; link.click(); URL.revokeObjectURL(link.href);
  }

  function studioCheckData(type) {
    const data = studioData();
    const target = document.getElementById("pfStudioResult");
    if (!target || !data) { if (target) target.textContent = "JSON 格式不正确。"; return; }
    const raw = JSON.stringify(data).toLowerCase();
    if (type === "privacy") {
      const hits = (content.studioPrivacyTerms || []).filter(term => raw.includes(term));
      target.textContent = hits.length ? `发现需要人工检查的词：${hits.join("、")}` : "未发现已配置的隐私或来源关键词。";
    } else if (type === "audio") {
      const items = [...(data.vocabulary || []), ...(data.pronunciation || [])];
      const missing = items.filter(item => !(item.audioText || item.word || item.text));
      target.textContent = missing.length ? `${missing.length} 项缺少可朗读文本。` : "可朗读文本字段完整。";
    } else {
      const values = (data.vocabulary || []).map(item => String(item.word || item.text || "").toLowerCase()).filter(Boolean);
      const duplicate = values.filter((item, index) => values.indexOf(item) !== index);
      target.textContent = duplicate.length ? `发现重复：${[...new Set(duplicate)].join("、")}` : "未发现重复词汇。";
    }
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("change", handleChange);
  root.addEventListener("submit", handleSubmit);
  window.addEventListener("hashchange", () => { const hash = location.hash.replace("#", ""); if (["home", "courses", "speaking", "review", "progress", "settings"].includes(hash)) switchView(hash, false); });
  window.addEventListener("patternflow:audio-state", event => setAudioState(Boolean(event.detail?.playing), event.detail?.text || ""));
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => { if (state.preferences.theme === "system") applyTheme("system"); });

  localStorage.setItem(keys.lastVisit, todayKey());
  setupShell();
  renderAll();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("service-worker.js").catch(() => {});

  window.PatternFlow = { switchView, renderHome, renderReview, renderProgress, trackActivity, keys };
})();
