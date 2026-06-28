import fs from "node:fs";
import { audioJobs, loadVocabulary, parseArgs } from "./shared-audio.mjs";

const args = parseArgs(process.argv.slice(2));
const data = loadVocabulary();
const jobs = audioJobs(data, args);
const missing = jobs.filter(job => !fs.existsSync(job.output));

if (!args.quiet) {
  console.log(`Vocabulary entries: ${data.vocabulary.length}`);
  console.log(`Minimal pairs: ${data.minimalPairs.length}`);
  console.log(`Audio jobs checked: ${jobs.length}`);
  console.log(`Missing MP3 files: ${missing.length}`);
  missing.slice(0, 80).forEach(job => console.log(`MISSING ${job.key} -> ${job.output}`));
  if (missing.length > 80) console.log(`...and ${missing.length - 80} more`);
}
