const VOICE_KEY = 'ap_voice_gender';

export type VoiceGender = 'male' | 'female';

export function getVoiceGender(): VoiceGender {
  return (localStorage.getItem(VOICE_KEY) as VoiceGender) ?? 'male';
}

export function setVoiceGender(g: VoiceGender) {
  localStorage.setItem(VOICE_KEY, g);
}

function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const ar = voices.filter(v => v.lang.startsWith('ar'));
  if (ar.length === 0) return null;

  if (gender === 'male') {
    // Maged (iOS), or any voice whose name hints male
    return ar.find(v => /maged/i.test(v.name))
      ?? ar.find(v => /male/i.test(v.name))
      ?? ar[0];
  } else {
    // Prefer a voice that is NOT Maged (usually female on Android = Google Arabic)
    return ar.find(v => !/maged/i.test(v.name))
      ?? ar[0];
  }
}

function doSpeak(text: string) {
  const gender = getVoiceGender();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ar-SA';
  utt.rate = 0.82;
  utt.pitch = 1;
  const voice = pickVoice(gender);
  if (voice) utt.voice = voice;
  window.speechSynthesis.speak(utt);
}

export function speakArabic(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  // Try immediately (voices may already be loaded)
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(text);
    return;
  }

  // Voices not ready — wait for voiceschanged or fallback after 300 ms
  let fired = false;
  const onReady = () => {
    if (fired) return;
    fired = true;
    doSpeak(text);
  };
  window.speechSynthesis.addEventListener('voiceschanged', onReady, { once: true });
  // Safety fallback: some WebViews never fire the event
  setTimeout(onReady, 300);
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
}

/** Returns list of available Arabic voices for display */
export function getArabicVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith('ar')) ?? [];
}
