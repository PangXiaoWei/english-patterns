import { readFile } from "node:fs/promises";
import vm from "node:vm";

const context = { window: {} };
vm.createContext(context);
vm.runInContext(await readFile(new URL("../data/unit5Data.js", import.meta.url), "utf8"), context);
const data = context.window.UNIT5_DATA;

const failures = [];
if (!data || data.lessons?.length !== 4) failures.push("Unit 5 must contain four lessons.");
if ((data.reviewQuestions?.length || 0) < 80) failures.push("Unit 5 needs at least 80 practice items.");
const invalidAnswers = (data.reviewQuestions || []).filter(item => !Array.isArray(item.options) || !item.options.includes(item.answer));
if (invalidAnswers.length) failures.push(`${invalidAnswers.length} practice answers are missing from their options.`);
for (const [name, reading] of [["5A", data.lessonA?.reading], ["5B", data.lessonB?.reading]]) {
  const words = (reading?.paragraphs || []).join(" ").trim().split(/\s+/).filter(Boolean).length;
  if (words < 250 || words > 350) failures.push(`${name} reading has ${words} words; expected 250–350.`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PatternFlow validation passed: ${data.reviewQuestions.length} practice items, four lessons, valid readings.`);
}
