import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

export function loadVocabulary() {
  const file = path.join(rootDir, "data", "vocabulary.js");
  const source = fs.readFileSync(file, "utf8");
  const window = {};
  Function("window", source)(window);
  return { vocabulary: window.VOCABULARY || [], minimalPairs: window.MINIMAL_PAIRS || [], ...loadSiteEnglishData() };
}

function loadWindowData(fileName) {
  const file = path.join(rootDir, "data", fileName);
  const source = fs.readFileSync(file, "utf8");
  const window = {};
  Function("window", source)(window);
  return window;
}

function loadSiteEnglishData() {
  return {
    lessons: loadWindowData("lessons.js").LESSONS || [],
    verbs: loadWindowData("verbs.js").VERBS || [],
    scenarios: loadWindowData("scenarios.js").SCENARIOS || [],
    pronunciation: loadWindowData("pronunciation.js").PRONUNCIATION || [],
    tests: loadWindowData("tests.js").TESTS || []
  };
}

export function toPublicPath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

export function audioJobs(data, args = {}) {
  const { vocabulary, minimalPairs } = data;
  const jobs = [];
  const priority = args.priority ? Number(args.priority) : null;
  const category = args.category || "";
  const type = args.type || "";
  const add = job => {
    if (!job.text || !String(job.text).trim()) return;
    jobs.push(job);
  };

  vocabulary
    .filter(item => !priority || item.priority <= priority)
    .filter(item => !category || item.category === category)
    .forEach(item => {
      const wordDir = item.type === "phrase" ? "phrases" : "words";
      if (!type || type === "words") {
        add({
          key: `${item.id}.word`,
          text: item.tts?.wordText || item.text,
          output: path.join(rootDir, "public", "audio", "en-us", wordDir, `${slugify(item.text)}.mp3`),
          instructions: item.type === "phrase"
            ? "Speak this English phrase clearly in a natural American accent. Keep it natural and easy to repeat."
            : "Speak this English word clearly in a natural American accent. Keep it short and precise."
        });
      }
      if (!type || type === "examples") {
        add({
          key: `${item.id}.example`,
          text: item.tts?.exampleText || item.example,
          output: path.join(rootDir, "public", "audio", "en-us", "examples", `${item.id}-1.mp3`),
          instructions: "Speak this sentence clearly in a natural American accent, at a slightly slower speed for English learners. Keep the pronunciation natural and easy to imitate."
        });
      }
    });

  if (!type || type === "words") {
    minimalPairs.forEach(pair => {
      [
        [pair.wordA, "a"],
        [pair.wordB, "b"]
      ].forEach(([word, side]) => add({
        key: `${pair.id}.${side}`,
        text: word,
        output: path.join(rootDir, "public", "audio", "en-us", "minimal-pairs", `${slugify(word)}.mp3`),
        instructions: "Speak this word very clearly in a natural American accent. Emphasize the vowel or consonant contrast, but do not exaggerate unnaturally."
      }));
    });
  }

  addFullSiteJobs(jobs, data);

  const deduped = [];
  const seen = new Set();
  jobs.forEach(job => {
    const key = `${job.key}:${job.text}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(job);
  });

  return deduped.slice(0, args.limit ? Number(args.limit) : deduped.length);
}

function addFullSiteJobs(jobs, data) {
  const add = job => {
    if (!job.text || !String(job.text).trim()) return;
    jobs.push(job);
  };
  const fullSiteDir = (...parts) => path.join(rootDir, "public", "audio", "en-us", "full-site", ...parts);
  const sentenceInstructions = "Speak this English sentence clearly in a natural American accent. Use a friendly, realistic voice for an adult English learner. Keep the pace easy to repeat.";
  const shortInstructions = "Speak this English word or short phrase clearly in a natural American accent.";

  data.lessons?.forEach(lesson => {
    lesson.examples?.forEach((example, index) => add({
      key: `lesson.${lesson.id}.example.${index + 1}`,
      text: example.en,
      output: fullSiteDir("lessons", `${lesson.id}-example-${index + 1}.mp3`),
      instructions: sentenceInstructions
    }));
    lesson.commonMistakes?.forEach((mistake, index) => {
      add({
        key: `lesson.${lesson.id}.mistake.${index + 1}.wrong`,
        text: mistake.wrong,
        output: fullSiteDir("lessons", `${lesson.id}-mistake-${index + 1}-wrong.mp3`),
        instructions: sentenceInstructions
      });
      add({
        key: `lesson.${lesson.id}.mistake.${index + 1}.right`,
        text: mistake.right,
        output: fullSiteDir("lessons", `${lesson.id}-mistake-${index + 1}-right.mp3`),
        instructions: sentenceInstructions
      });
    });
    lesson.drills?.forEach((drill, index) => {
      drill.options?.forEach((option, optionIndex) => add({
        key: `lesson.${lesson.id}.drill.${index + 1}.option.${optionIndex + 1}`,
        text: option,
        output: fullSiteDir("lessons", `${lesson.id}-drill-${index + 1}-option-${optionIndex + 1}.mp3`),
        instructions: sentenceInstructions
      }));
      add({
        key: `lesson.${lesson.id}.drill.${index + 1}.answer`,
        text: drill.answer,
        output: fullSiteDir("lessons", `${lesson.id}-drill-${index + 1}-answer.mp3`),
        instructions: sentenceInstructions
      });
    });
    if (lesson.speakingTask?.prompt) add({
      key: `lesson.${lesson.id}.speaking.prompt`,
      text: lesson.speakingTask.prompt,
      output: fullSiteDir("lessons", `${lesson.id}-speaking-prompt.mp3`),
      instructions: sentenceInstructions
    });
  });

  data.verbs?.forEach(([base, , third, ing, past, participle, example]) => {
    [base, third, ing, past, participle].filter(Boolean).forEach(form => add({
      key: `verb.${slugify(base)}.${slugify(form)}`,
      text: form,
      output: fullSiteDir("verbs", `${slugify(base)}-${slugify(form)}.mp3`),
      instructions: shortInstructions
    }));
    add({
      key: `verb.${slugify(base)}.example`,
      text: example,
      output: fullSiteDir("verbs", `${slugify(base)}-example.mp3`),
      instructions: sentenceInstructions
    });
  });

  data.scenarios?.forEach(([id, , , levels]) => {
    Object.entries(levels || {}).forEach(([level, lines]) => {
      lines.forEach((line, index) => add({
        key: `scenario.${id}.${level}.${index + 1}`,
        text: line,
        output: fullSiteDir("scenarios", `${slugify(id)}-${slugify(level)}-${index + 1}.mp3`),
        instructions: sentenceInstructions
      }));
    });
  });

  data.pronunciation?.forEach((group, groupIndex) => {
    group.items?.forEach((item, itemIndex) => {
      const text = Array.isArray(item) ? item[0] : item;
      add({
        key: `pronunciation.${groupIndex + 1}.${itemIndex + 1}`,
        text,
        output: fullSiteDir("pronunciation", `${groupIndex + 1}-${itemIndex + 1}-${slugify(text)}.mp3`),
        instructions: shortInstructions
      });
    });
  });

  data.tests?.forEach((test, index) => {
    if (/^[A-Za-z0-9 ,.?'/-]+$/.test(test.question)) add({
      key: `test.${index + 1}.question`,
      text: test.question,
      output: fullSiteDir("tests", `test-${index + 1}-question.mp3`),
      instructions: sentenceInstructions
    });
    test.options?.forEach((option, optionIndex) => {
      if (/^[A-Za-z0-9 ,.?'/-]+$/.test(option)) add({
        key: `test.${index + 1}.option.${optionIndex + 1}`,
        text: option,
        output: fullSiteDir("tests", `test-${index + 1}-option-${optionIndex + 1}.mp3`),
        instructions: sentenceInstructions
      });
    });
    if (test.answer && /^[A-Za-z0-9 ,.?'/-]+$/.test(test.answer)) add({
      key: `test.${index + 1}.answer`,
      text: test.answer,
      output: fullSiteDir("tests", `test-${index + 1}-answer.mp3`),
      instructions: sentenceInstructions
    });
  });
}
