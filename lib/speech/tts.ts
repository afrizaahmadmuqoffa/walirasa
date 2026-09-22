/**
 * WaliRasa — Web Speech API helper (HANYA dipakai di client).
 * Kecepatan default 82% per standar sensory-friendly, bisa digeser
 * 50–100% oleh guru melalui kontrol di editor.
 */
const DEFAULT_RATE = 0.82;
const MIN_RATE = 0.5;
const MAX_RATE = 1.0;

let voiceInitialized = false;

function ensureVoicesLoaded() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (!voiceInitialized) {
    voiceInitialized = true;
    // Chrome memuat daftar voice secara asinkron; trigger sekali agar
    // getVoices() terisi saat pertama kali dipakai.
    window.speechSynthesis.getVoices();
  }
}

export function speakAudio(text: string, rate: number = DEFAULT_RATE): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  pauseAudio();

  ensureVoicesLoaded();

  const cleanText = text?.trim() || "";
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = "id-ID";
  utterance.rate = Math.min(MAX_RATE, Math.max(MIN_RATE, rate));
  utterance.pitch = 1;
  utterance.volume = 1;

  // Pilih voice bahasa Indonesia kalau tersedia, fallback apapun.
  const voices = window.speechSynthesis.getVoices();
  const idVoice = voices.find(
    (v) => v.lang.toLowerCase().startsWith("id") || v.name.toLowerCase().includes("indonesi")
  );
  if (idVoice) {
    utterance.voice = idVoice;
  }

  window.speechSynthesis.speak(utterance);
}

/** Hentikan/mengosongkan antrian bicara (dipanggil sebelum bicara baru). */
export function pauseAudio(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}