// Static-site helper contract for future component extraction.
// Current app uses data-* buttons and src/utils/audio.js directly.
export function SpeakButton({ label = "Speak", text, audioPath, slow = false }) {
  return { label, text, audioPath, slow };
}
