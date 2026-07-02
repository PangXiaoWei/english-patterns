import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8788);
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

await loadEnvLocal();

async function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!existsSync(envPath)) return;
  const content = await readFile(envPath, "utf8");
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function handleTTS(req, res) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "OPENAI_API_KEY is not configured" }));
      return;
    }
    const body = JSON.parse(await readBody(req));
    const text = String(body.text || "").trim();
    const speed = Math.min(1.2, Math.max(0.6, Number(body.speed || 1)));
    const voice = ["marin", "cedar"].includes(body.voice) ? body.voice : "marin";
    const accent = ["neutral", "new-zealand", "british", "american"].includes(body.accent) ? body.accent : "neutral";
    if (!text) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "text is required" }));
      return;
    }
    const baseInstructions = speed < 1
      ? "Speak clearly and naturally for an English learner. Use careful pronunciation, natural pauses, and a neutral English accent. Do not speak too fast."
      : "Speak clearly and naturally in everyday English. Use accurate pronunciation and natural intonation.";
    const accentInstructions = {
      neutral: "",
      "new-zealand": " Use a clear New Zealand English accent, suitable for an English learner.",
      british: " Use a clear British English accent, suitable for an English learner.",
      american: " Use a clear American English accent, suitable for an English learner."
    };
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: text,
        speed,
        instructions: `${baseInstructions}${accentInstructions[accent]}`,
        response_format: "mp3"
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "TTS generation failed", detail }));
      return;
    }
    const audio = Buffer.from(await response.arrayBuffer());
    res.writeHead(200, {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store"
    });
    res.end(audio);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: error.message || "Unknown TTS error" }));
  }
}

function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const pathname = decodeURIComponent((url.pathname === "/" || url.pathname === "/lesson-lab") ? "/index.html" : url.pathname);
  const target = path.normalize(path.join(__dirname, pathname));
  if (!target.startsWith(__dirname) || !existsSync(target)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(target).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  createReadStream(target).pipe(res);
}

createServer((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === "POST" && req.url === "/api/tts") {
    handleTTS(req, res);
    return;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    serveStatic(req, res);
    return;
  }
  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method not allowed");
}).listen(PORT, () => {
  console.log(`Awei English Patterns running at http://127.0.0.1:${PORT}/`);
});
