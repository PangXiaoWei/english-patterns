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
  return { vocabulary: window.VOCABULARY || [], minimalPairs: window.MINIMAL_PAIRS || [] };
}

export function toPublicPath(filePath) {
  return path.relative(rootDir, filePath).replace(/\\/g, "/");
}

export function audioJobs({ vocabulary, minimalPairs }, args = {}) {
  const jobs = [];
  const priority = args.priority ? Number(args.priority) : null;
  const category = args.category || "";
  const type = args.type || "";
  const add = job => jobs.push(job);

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

  return jobs.slice(0, args.limit ? Number(args.limit) : jobs.length);
}
