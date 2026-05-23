let _voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  _voices = window.speechSynthesis?.getVoices() ?? [];
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

function pickArabicVoice(): SpeechSynthesisVoice | null {
  const ar = _voices.filter(v => v.lang.startsWith('ar'));
  if (ar.length === 0) return null;
  // prefer male (Maged on iOS, any male on Android)
  return ar.find(v => /maged|male/i.test(v.name)) ?? ar[0];
}

export function speakArabic(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const doSpeak = () => {
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'ar-SA';
    utt.rate = 0.82;
    utt.pitch = 1;
    const voice = pickArabicVoice();
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  };

  if (_voices.length === 0) {
    // voices not ready yet — wait for the event, then speak
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true });
  } else {
    doSpeak();
  }
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
}
