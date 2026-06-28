(function () {
  const keys = {
    voiceEnabled: "english_voice_enabled",
    slowMode: "english_slow_mode_enabled",
    followRead: "english_follow_read_count"
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
  }

  function refreshVoices() {
    if ("speechSynthesis" in window) voices = speechSynthesis.getVoices();
  }

  function pickVoice() {
    const preferred = ["Google US English", "Microsoft Aria", "Microsoft Jenny", "Microsoft David", "Microsoft Zira", "Samantha", "Alex"];
    return preferred.map(name => voices.find(voice => voice.name.includes(name))).find(Boolean)
      || voices.find(voice => /^en[-_]US$/i.test(voice.lang))
      || voices.find(voice => /^en/i.test(voice.lang))
      || null;
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
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(normalizeSpeechText(text));
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = "en-US";
    utterance.rate = slow ? 0.7 : 1.0;
    utterance.pitch = 1;
    utterance.volume = 1;
    speechSynthesis.speak(utterance);
  }

  function playAudioOrTTS({ audioPath, text, slow = false } = {}) {
    if (!isVoiceEnabled()) return Promise.resolve(false);
    stopAudio();
    return new Promise(resolve => {
      if (!audioPath) {
        speakText(text, slow);
        resolve(false);
        return;
      }
      try {
        const audio = new Audio(audioPath);
        currentAudio = audio;
        audio.playbackRate = slow ? 0.75 : 1;
        audio.onended = () => resolve(true);
        audio.onerror = () => {
          stopAudio();
          speakText(text, slow);
          resolve(false);
        };
        audio.play().then(() => resolve(true)).catch(() => {
          stopAudio();
          speakText(text, slow);
          resolve(false);
        });
      } catch {
        speakText(text, slow);
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
    setVoiceEnabled
  };
})();
