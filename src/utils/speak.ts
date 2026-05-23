let currentAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, HTMLAudioElement>();

const TTS_URL = 'https://arabskiy-put-v2-production.up.railway.app/api/tts';

function tryWebSpeech(text: string): boolean {
  const ss = window.speechSynthesis;
  if (!ss) return false;
  const voices = ss.getVoices().filter(v => v.lang.startsWith('ar'));
  if (voices.length === 0) return false;
  ss.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = voices[0];
  u.lang = 'ar';
  u.rate = 0.9;
  ss.speak(u);
  return true;
}

export function speakArabic(text: string) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  // Try Web Speech API first (works on iOS and some Android)
  if (tryWebSpeech(text)) return;

  // Fallback: backend TTS proxy
  const url = `${TTS_URL}?text=${encodeURIComponent(text)}`;
  let audio = audioCache.get(text);
  if (!audio) {
    audio = new Audio(url);
    audioCache.set(text, audio);
  }
  currentAudio = audio;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
  currentAudio?.pause();
  currentAudio = null;
}

// Kept for Settings.tsx compatibility
export type VoiceGender = 'male' | 'female';
export function getVoiceGender(): VoiceGender {
  return (localStorage.getItem('ap_voice_gender') as VoiceGender) ?? 'male';
}
export function setVoiceGender(g: VoiceGender) {
  localStorage.setItem('ap_voice_gender', g);
}
export function getArabicVoiceNames(): string[] {
  return ['Google Arabic (онлайн)'];
}
