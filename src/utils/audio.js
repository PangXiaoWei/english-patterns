(function () {
  const keys = {
    voiceEnabled: "patternFlow.voiceEnabled",
    voiceName: "patternFlow.voice",
    slowMode: "patternFlow.slowMode",
    followRead: "patternFlow.followRead"
  };

  const pronunciationMap = {
    SSH: "ess ess aych",
    DNS: "dee en ess",
    HTTP: "aych tee tee pee",
    HTTPS: "aych tee tee pee ess",
    IP: "eye pee",
    CPU: "see pee you",
    RAM: "ram",
    USB: "you ess bee",
    WiFi: "why fie",
    Nginx: "engine x",
    nginx: "engine x",
    systemd: "system dee",
    journalctl: "journal control",
    kubectl: "kube control",
    K3s: "kay three ess",
    K8s: "kay eight ess",
    DevOps: "dev ops",
    "CI/CD": "see eye, see dee",
    YAML: "yamel",
    JSON: "jay son",
    SQL: "sequel",
    sudo: "soo doo",
    chmod: "change mode",
    chown: "change owner",
    cache: "cash",
    queue: "cue",
    receipt: "ree seet",
    debt: "det",
    island: "eye land",
    clothes: "cloze",
    comfortable: "comf ter bul",
    vegetables: "vej tuh bulz"
  };

  let currentAudio = null;
  let voices = [];
  let manifestPromise = null;
  let manifestByText = null;
  let playbackToken = 0;

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

  function isVoiceEnabled() {
    return localStorage.getItem(keys.voiceEnabled) !== "false";
  }

  function setVoiceEnabled(enabled) {
    localStorage.setItem(keys.voiceEnabled, enabled ? "true" : "false");
  }

  function stopAudio() {
    playbackToken += 1;
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    } catch {}
    currentAudio = null;
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {}
    notifyAudioState(false, "");
  }

  function refreshVoices() {
    if ("speechSynthesis" in window) voices = speechSynthesis.getVoices();
  }

  function pickVoice() {
    const selected = localStorage.getItem(keys.voiceName) || "";
    const preferred = ["Microsoft Jenny", "Microsoft Aria", "Microsoft Guy", "Google US English", "Samantha"];
    return voices.find(voice => voice.name === selected)
      || preferred.map(name => voices.find(voice => voice.name.includes(name))).find(Boolean)
      || voices.find(voice => /^en[-_]US$/i.test(voice.lang))
      || voices.find(voice => /^en/i.test(voice.lang))
      || null;
  }

  function getVoices() {
    refreshVoices();
    return [...voices];
  }

  function setVoiceName(name) {
    localStorage.setItem(keys.voiceName, String(name || ""));
  }

  function getVoiceName() {
    return localStorage.getItem(keys.voiceName) || "";
  }

  function notifyAudioState(playing, text) {
    try {
      window.dispatchEvent(new CustomEvent("patternflow:audio-state", { detail: { playing, text } }));
    } catch {}
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function normalizeSpeechText(text) {
    let output = String(text || "");
    Object.entries(pronunciationMap).forEach(([from, to]) => {
      output = output.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to);
    });
    return output;
  }

  function speakText(text, slow = false) {
    if (!("speechSynthesis" in window)) return Promise.resolve(false);
    const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(text));
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = "en-US";
    utterance.rate = slow ? 0.68 : 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    return new Promise(resolve => {
      utterance.onstart = () => notifyAudioState(true, text);
      utterance.onend = () => { notifyAudioState(false, ""); resolve(false); };
      utterance.onerror = () => { notifyAudioState(false, ""); resolve(false); };
      speechSynthesis.speak(utterance);
    });
  }

  async function findAudioPathByText(text) {
    if (!text) return "";
    try {
      if (!manifestPromise) {
        manifestPromise = fetchFirstJSON(["audio/audio-manifest.json", "public/audio/audio-manifest.json"]);
      }
      const manifest = await manifestPromise;
      if (!manifestByText) {
        manifestByText = new Map();
        Object.values(manifest || {}).forEach(item => {
          if (item?.text && item?.path) manifestByText.set(item.text.trim().toLowerCase(), item.path);
        });
      }
      const normalized = normalizeLookupText(text);
      return manifestByText.get(normalized) || manifestByText.get(stripEndingPunctuation(normalized)) || "";
    } catch {
      return "";
    }
  }

  function normalizeLookupText(text) {
    return String(text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function stripEndingPunctuation(text) {
    return String(text || "").replace(/[.!?。！？]+$/g, "").trim();
  }

  function splitSpeechSegments(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map(segment => segment.trim())
      .filter(Boolean) || [];
  }

  async function fetchFirstJSON(urls) {
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) return response.json();
      } catch {}
    }
    return {};
  }

  async function playAudioOrTTS({ audioPath, text, slow = false } = {}) {
    if (!isVoiceEnabled()) return Promise.resolve(false);
    stopAudio();
    const token = playbackToken;
    const resolvedAudioPath = audioPath || await findAudioPathByText(text);
    if (resolvedAudioPath) {
      const played = await playAudioFile(resolvedAudioPath, slow, token);
      if (!played && token === playbackToken) await speakText(text, slow);
      return played;
    }

    const segments = splitSpeechSegments(text);
    if (segments.length > 1) {
      let usedLocalAudio = false;
      for (const segment of segments) {
        if (token !== playbackToken) return usedLocalAudio;
        const path = await findAudioPathByText(segment);
        if (path) {
          usedLocalAudio = true;
          const played = await playAudioFile(path, slow, token);
          if (!played && token === playbackToken) await speakText(segment, slow);
        } else {
          await speakText(segment, slow);
        }
      }
      return usedLocalAudio;
    }

    await speakText(text, slow);
    return false;
  }

  function playAudioFile(audioPath, slow, token) {
    return new Promise(resolve => {
      if (token !== playbackToken) {
        resolve(false);
        return;
      }
      try {
        const audio = new Audio(audioPath);
        currentAudio = audio;
        audio.playbackRate = slow ? 0.82 : 1;
        audio.onplay = () => notifyAudioState(true, "Local pronunciation audio");
        audio.onended = () => {
          if (token === playbackToken) currentAudio = null;
          notifyAudioState(false, "");
          resolve(true);
        };
        audio.onerror = () => {
          if (token === playbackToken) currentAudio = null;
          notifyAudioState(false, "");
          resolve(false);
        };
        audio.play().catch(() => resolve(false));
      } catch {
        resolve(false);
      }
    });
  }

  function recordFollowRead(id) {
    const today = new Date().toLocaleDateString("en-CA");
    const all = readJSON(keys.followRead, {});
    const item = all[id] || { total: 0, byDate: {} };
    item.total += 1;
    item.byDate[today] = (item.byDate[today] || 0) + 1;
    all[id] = item;
    writeJSON(keys.followRead, all);
    return item;
  }

  refreshVoices();
  if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", refreshVoices);
  window.addEventListener("hashchange", stopAudio);

  window.EnglishAudio = {
    keys,
    pronunciationMap,
    playAudioOrTTS,
    stopAudio,
    speakText,
    normalizeSpeechText,
    recordFollowRead,
    isVoiceEnabled,
    setVoiceEnabled,
    getVoices,
    setVoiceName,
    getVoiceName
  };
})();
