const $ = id => document.getElementById(id);

const STORAGE_KEY = "awei.patterns.progress.v1";

const lessons = [
  {
    id: "basic",
    tag: "句型骨架",
    title: "英语句子先抓主语 + 动词",
    chinese: "中文可以说“昨天很忙”“下雨了”，主语有时省略；英语通常要把主语和动词说出来。",
    formula: "Subject + Verb + Object / Place / Time",
    contrast: "中文靠语境也能懂，英语更依赖句子位置。先问自己：谁做？动作是什么？再补充对象、地点、时间。",
    examples: [
      ["I study English every day.", "我每天学习英语。"],
      ["She works in a supermarket.", "她在超市工作。"],
      ["It rained yesterday.", "昨天下雨了。英语需要形式主语 it。"]
    ],
    quiz: {
      prompt: "我昨天很忙。",
      answer: "I was busy yesterday.",
      options: ["I was busy yesterday.", "I busy yesterday.", "Yesterday busy I.", "I am busy yesterday."]
    },
    write: {
      prompt: "我每天练习英语。",
      hint: "主语 I + 动词 practice + 对象 English + 时间 every day",
      answer: "I practice English every day."
    }
  },
  {
    id: "past",
    tag: "过去式",
    title: "过去发生的动作，动词要变过去式",
    chinese: "中文常用“昨天、以前、刚才”表示过去；英语除了时间词，动词本身也要变。",
    formula: "Subject + past verb + time",
    contrast: "不要只加 yesterday 却忘记动词。中文说“我昨天去”，英语必须说 I went yesterday，不是 I go yesterday。",
    examples: [
      ["I went to class yesterday.", "我昨天去上课了。go 变 went。"],
      ["He worked last weekend.", "他上周末工作了。work 加 -ed。"],
      ["They bought some fruit.", "他们买了一些水果。buy 变 bought。"]
    ],
    quiz: {
      prompt: "她昨天去了学校。",
      answer: "She went to school yesterday.",
      options: ["She went to school yesterday.", "She go to school yesterday.", "She goes to school yesterday.", "She gone to school yesterday."]
    },
    write: {
      prompt: "我上周买了牛奶。",
      hint: "buy 的过去式是 bought",
      answer: "I bought milk last week."
    }
  },
  {
    id: "participle",
    tag: "过去分词",
    title: "过去分词常跟 have / has / had 或 be 一起用",
    chinese: "过去分词不是单独表示过去。它常用于完成时和被动语态。",
    formula: "have / has + past participle; be + past participle",
    contrast: "中文说“我已经做完了”，没有动词形态变化；英语要说 I have finished it。finished 在这里是过去分词。",
    examples: [
      ["I have finished my homework.", "我已经完成作业了。finish 的过去分词是 finished。"],
      ["She has gone home.", "她已经回家了。go 的过去分词是 gone。"],
      ["The form was completed yesterday.", "表格昨天被填好了。被动语态用 was + completed。"]
    ],
    quiz: {
      prompt: "我已经看过这部电影。",
      answer: "I have seen this movie.",
      options: ["I have seen this movie.", "I have saw this movie.", "I saw this movie already have.", "I seen this movie yesterday."]
    },
    write: {
      prompt: "我已经写完了邮件。",
      hint: "完成时：have + past participle；write 的过去分词是 written",
      answer: "I have written the email."
    }
  },
  {
    id: "future",
    tag: "未来时",
    title: "将来要用 will 或 be going to",
    chinese: "中文常说“明天、以后、等一下”就能表达未来；英语通常需要 will 或 be going to。",
    formula: "will + verb; am / is / are going to + verb",
    contrast: "will 偏决定、预测、承诺；be going to 偏计划或有迹象。两者后面都接动词原形。",
    examples: [
      ["I will call you tomorrow.", "我明天会打电话给你。will 后面用 call。"],
      ["She is going to study tonight.", "她今晚打算学习。going to 后面用 study。"],
      ["It is going to rain.", "看起来要下雨了。有迹象时常用 going to。"]
    ],
    quiz: {
      prompt: "我明天会去超市。",
      answer: "I will go to the supermarket tomorrow.",
      options: ["I will go to the supermarket tomorrow.", "I will went to the supermarket tomorrow.", "I going to supermarket tomorrow.", "I am go to the supermarket tomorrow."]
    },
    write: {
      prompt: "她今晚打算学习英语。",
      hint: "计划：be going to + 动词原形",
      answer: "She is going to study English tonight."
    }
  },
  {
    id: "negative",
    tag: "否定和疑问",
    title: "否定、疑问常需要助动词",
    chinese: "中文加“不、没、吗”很直接；英语经常要加 do / does / did / will / have。",
    formula: "Do / Did / Will + subject + verb?",
    contrast: "用了 did，后面的实义动词回到原形。Did you went 是错的，要说 Did you go?",
    examples: [
      ["I do not understand.", "我不明白。"],
      ["Did you work yesterday?", "你昨天工作了吗？did 后面用 work。"],
      ["Will you be available tomorrow?", "你明天有空吗？"]
    ],
    quiz: {
      prompt: "你昨天工作了吗？",
      answer: "Did you work yesterday?",
      options: ["Did you work yesterday?", "Did you worked yesterday?", "You worked yesterday?", "Do you worked yesterday?"]
    },
    write: {
      prompt: "我昨天没有去学校。",
      hint: "过去否定：did not + 动词原形",
      answer: "I did not go to school yesterday."
    }
  }
];

const verbs = [
  ["be", "was / were", "been", "I have been busy this week."],
  ["go", "went", "gone", "She has gone home."],
  ["do", "did", "done", "I have done my homework."],
  ["have", "had", "had", "We had lunch at noon."],
  ["make", "made", "made", "He made dinner yesterday."],
  ["take", "took", "taken", "I have taken the test."],
  ["see", "saw", "seen", "I have seen this movie."],
  ["write", "wrote", "written", "She has written an email."],
  ["speak", "spoke", "spoken", "We have spoken before."],
  ["eat", "ate", "eaten", "They have eaten dinner."],
  ["buy", "bought", "bought", "I bought milk last week."],
  ["come", "came", "come", "He came to class early."],
  ["get", "got", "gotten", "I have gotten better at listening."],
  ["give", "gave", "given", "She has given me advice."],
  ["work", "worked", "worked", "I worked on Saturday."],
  ["study", "studied", "studied", "He studied English last night."],
  ["finish", "finished", "finished", "I have finished the form."],
  ["plan", "planned", "planned", "We planned the trip yesterday."]
];

const state = {
  lessonIndex: 0,
  learned: Number(localStorage.getItem(STORAGE_KEY) || 0),
  answeredChoice: false,
  voices: []
};

function normalize(text) {
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/[?.!,]/g, "")
    .replace(/\s+/g, " ");
}

function refreshVoices() {
  if ("speechSynthesis" in window) state.voices = speechSynthesis.getVoices();
}

function americanVoice() {
  const voices = state.voices;
  const usVoices = voices.filter(voice => /^en[-_]US$/i.test(voice.lang) || /United States|US English/i.test(voice.name));
  const preferred = ["Microsoft Aria", "Microsoft Jenny", "Google US English", "Samantha", "Microsoft Zira", "Microsoft David"];
  return preferred.map(name => usVoices.find(voice => voice.name.includes(name))).find(Boolean)
    || usVoices.find(voice => /Natural|Online/i.test(voice.name))
    || usVoices[0]
    || voices.find(voice => /^en/i.test(voice.lang));
}

function speak(text) {
  if (!("speechSynthesis" in window)) {
    $("statusText").textContent = "当前浏览器不支持朗读。建议使用 Chrome 或 Edge。";
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = americanVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = "en-US";
  utterance.rate = Number($("rateSlider").value);
  utterance.pitch = 1;
  utterance.volume = 1;
  speechSynthesis.speak(utterance);
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, String(state.learned));
  $("learnedCount").textContent = state.learned;
  $("progressBar").style.width = `${Math.min(100, state.learned / 12 * 100)}%`;
}

function markLearned(message) {
  state.learned = Math.min(12, state.learned + 1);
  saveProgress();
  $("statusText").textContent = message;
}

function currentLesson() {
  return lessons[state.lessonIndex];
}

function setMode(mode) {
  $("learnPanel").classList.toggle("hidden", mode !== "learn");
  $("choosePanel").classList.toggle("hidden", mode !== "choose");
  $("transformPanel").classList.toggle("hidden", mode !== "transform");
  if (mode === "choose") renderQuiz();
  if (mode === "transform") renderWrite();
}

function renderLessonButtons() {
  const wrap = $("lessonButtons");
  wrap.innerHTML = "";
  lessons.forEach((lesson, index) => {
    const button = document.createElement("button");
    button.className = `lesson-button${index === state.lessonIndex ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `<strong>${lesson.title}</strong><span>${lesson.tag}</span>`;
    button.addEventListener("click", () => {
      state.lessonIndex = index;
      $("topicSelect").value = lesson.id;
      render();
    });
    wrap.appendChild(button);
  });
}

function renderTopicSelect() {
  $("topicSelect").innerHTML = lessons.map(lesson => `<option value="${lesson.id}">${lesson.tag} - ${lesson.title}</option>`).join("");
}

function renderLearn() {
  const lesson = currentLesson();
  $("lessonTag").textContent = lesson.tag;
  $("lessonTitle").textContent = lesson.title;
  $("lessonChinese").textContent = lesson.chinese;
  $("lessonFormula").textContent = lesson.formula;
  $("contrastText").textContent = lesson.contrast;
  const grid = $("exampleGrid");
  grid.innerHTML = "";
  lesson.examples.forEach(([en, cn]) => {
    const card = document.createElement("div");
    card.className = "example-card";
    card.innerHTML = `<div><strong>${en}</strong><span>${cn}</span></div><button class="mini-speak" type="button" aria-label="朗读 ${en}">▶</button>`;
    card.querySelector("button").addEventListener("click", () => speak(en));
    grid.appendChild(card);
  });
}

function renderQuiz() {
  const lesson = currentLesson();
  state.answeredChoice = false;
  $("quizPrompt").textContent = lesson.quiz.prompt;
  $("choiceFeedback").textContent = "";
  $("choiceFeedback").className = "feedback";
  const shuffled = [...lesson.quiz.options].sort(() => Math.random() - .5);
  const wrap = $("choiceOptions");
  wrap.innerHTML = "";
  shuffled.forEach(option => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => answerChoice(button, option));
    wrap.appendChild(button);
  });
}

function answerChoice(button, option) {
  if (state.answeredChoice) return;
  state.answeredChoice = true;
  const lesson = currentLesson();
  const correct = option === lesson.quiz.answer;
  document.querySelectorAll(".choice-button").forEach(item => {
    item.disabled = true;
    if (item.textContent === lesson.quiz.answer) item.classList.add("correct");
  });
  if (!correct) button.classList.add("wrong");
  $("choiceFeedback").textContent = correct
    ? "正确。注意听动词形态和时间词。"
    : `答案是：${lesson.quiz.answer}`;
  $("choiceFeedback").classList.add(correct ? "good" : "bad");
  speak(lesson.quiz.answer);
  markLearned(correct ? "选择题完成。" : "这题已加入你的记忆点：先看时间，再看动词。");
}

function renderWrite() {
  const lesson = currentLesson();
  $("writePrompt").textContent = lesson.write.prompt;
  $("writeHint").textContent = lesson.write.hint;
  $("writeInput").value = "";
  $("writeFeedback").textContent = "";
  $("writeFeedback").className = "feedback";
}

function checkWrite(event) {
  event.preventDefault();
  const lesson = currentLesson();
  const answer = $("writeInput").value;
  const correct = normalize(answer) === normalize(lesson.write.answer);
  $("writeFeedback").textContent = correct
    ? "很好。句型和动词形态都对。"
    : `参考答案：${lesson.write.answer}`;
  $("writeFeedback").className = `feedback ${correct ? "good" : "bad"}`;
  speak(lesson.write.answer);
  markLearned(correct ? "书写练习完成。" : "跟读参考答案，再自己写一遍会更稳。");
}

function renderVerbTable() {
  const query = normalize($("verbSearch").value);
  const rows = verbs.filter(row => !query || row.some(cell => normalize(cell).includes(query)));
  $("verbTable").innerHTML = rows.map((row, index) => `
    <tr>
      <td><strong>${row[0]}</strong></td>
      <td>${row[1]}</td>
      <td>${row[2]}</td>
      <td>${row[3]}</td>
      <td><button class="verb-sound" type="button" data-index="${index}">朗读</button></td>
    </tr>
  `).join("");
  document.querySelectorAll(".verb-sound").forEach((button, index) => {
    button.addEventListener("click", () => speak(rows[index][3]));
  });
}

function render() {
  renderLessonButtons();
  renderLearn();
  setMode($("modeSelect").value);
  saveProgress();
}

renderTopicSelect();
renderVerbTable();
refreshVoices();
if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", refreshVoices);

$("topicSelect").addEventListener("change", event => {
  state.lessonIndex = lessons.findIndex(lesson => lesson.id === event.target.value);
  render();
});

$("modeSelect").addEventListener("change", event => setMode(event.target.value));
$("lessonSpeak").addEventListener("click", () => speak(currentLesson().examples.map(item => item[0]).join(" ")));
$("quizSpeak").addEventListener("click", () => speak(currentLesson().quiz.answer));
$("answerSpeak").addEventListener("click", () => speak(currentLesson().write.answer));
$("playCurrent").addEventListener("click", () => {
  const mode = $("modeSelect").value;
  if (mode === "choose") speak(currentLesson().quiz.answer);
  else if (mode === "transform") speak(currentLesson().write.answer);
  else speak(currentLesson().examples[0][0]);
});
$("writeForm").addEventListener("submit", checkWrite);
$("verbSearch").addEventListener("input", renderVerbTable);
$("resetProgress").addEventListener("click", () => {
  state.learned = 0;
  saveProgress();
  $("statusText").textContent = "练习进度已重置。";
});

render();
