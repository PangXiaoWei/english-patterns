import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import OpenAI from "openai";
import { audioJobs, loadVocabulary, parseArgs, rootDir, toPublicPath } from "./shared-audio.mjs";

dotenv.config({ path: path.join(rootDir, ".env.local") });

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args["dry-run"]);
const force = Boolean(args.force);
const model = process.env.TTS_MODEL || "gpt-4o-mini-tts";
const voice = process.env.TTS_VOICE || "marin";
const responseFormat = process.env.TTS_RESPONSE_FORMAT || "mp3";
const manifestPath = path.join(rootDir, "public", "audio", "audio-manifest.json");
const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, "utf8")) : {};
const data = loadVocabulary();
const jobs = audioJobs(data, args);

if (!dryRun && !process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is missing. Copy .env.example to .env.local and fill in your key.");
  process.exit(1);
}

const client = dryRun ? null : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
let success = 0;
let skipped = 0;
let failed = 0;

console.log(`Audio jobs selected: ${jobs.length}`);
console.log(`Model: ${model}, voice: ${voice}, format: ${responseFormat}`);

for (const job of jobs) {
  fs.mkdirSync(path.dirname(job.output), { recursive: true });
  if (!force && fs.existsSync(job.output)) {
    skipped += 1;
    console.log(`SKIP ${job.key}`);
    continue;
  }
  if (dryRun) {
    console.log(`DRY ${job.key}: ${job.text} -> ${job.output}`);
    continue;
  }
  try {
    console.log(`GENERATE ${job.key}: ${job.text}`);
    const audio = await client.audio.speech.create({
      model,
      voice,
      input: job.text,
      instructions: job.instructions,
      response_format: responseFormat
    });
    const buffer = Buffer.from(await audio.arrayBuffer());
    fs.writeFileSync(job.output, buffer);
    manifest[job.key] = {
      text: job.text,
      path: toPublicPath(job.output),
      voice,
      model,
      generatedAt: new Date().toISOString().slice(0, 10)
    };
    success += 1;
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${job.key}: ${error.message}`);
  }
}

if (!dryRun) fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log("");
console.log(`Success: ${success}`);
console.log(`Skipped: ${skipped}`);
console.log(`Failed: ${failed}`);
console.log(`Output: ${path.join(rootDir, "public", "audio", "en-us")}`);
