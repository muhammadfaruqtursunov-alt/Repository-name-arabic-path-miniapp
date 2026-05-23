let currentAudio: HTMLAudioElement | null = null;
const audioCache = new Map<string, HTMLAudioElement>();

export function speakArabic(text: string) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  const url =
    `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`;

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
  currentAudio?.pause();
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
