export function speakArabic(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ar-SA';
  utt.rate = 0.82;
  utt.pitch = 1;
  window.speechSynthesis.speak(utt);
}

export function stopSpeech() {
  window.speechSynthesis?.cancel();
}
