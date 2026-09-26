/**
 * Аудио Корана с бесплатных CDN (мы ничего не храним):
 *  - слово: audio.qurancdn.com (Quran.com, пословное чтение)
 *  - аят:   everyayah.com, выбранный чтец
 * Один общий плеер — новое воспроизведение останавливает предыдущее.
 */
const pad3 = (n: number) => String(n).padStart(3, '0');

let audio: HTMLAudioElement | null = null;
let queueToken = 0;

function player(): HTMLAudioElement {
  if (!audio) audio = new Audio();
  return audio;
}

export function stopQuranAudio() {
  queueToken++;
  const a = player();
  a.pause();
  a.onended = null;
  a.onerror = null;
}

function playUrl(url: string): Promise<void> {
  const a = player();
  a.pause();
  a.src = url;
  return new Promise(resolve => {
    a.onended = () => resolve();
    a.onerror = () => resolve();   // сеть/файл недоступен — просто идём дальше
    a.play().catch(() => resolve());
  });
}

export function playWord(s: number, a: number, w: number) {
  stopQuranAudio();
  void playUrl(`https://audio.qurancdn.com/wbw/${pad3(s)}_${pad3(a)}_${pad3(w)}.mp3`);
}

export function ayahUrl(reciter: string, s: number, a: number): string {
  return `https://everyayah.com/data/${reciter}/${pad3(s)}${pad3(a)}.mp3`;
}

/**
 * Читает аяты по очереди. onAyah сообщает, какой аят звучит (для подсветки),
 * onDone — когда очередь закончилась или была остановлена.
 */
export async function playAyahs(
  reciter: string,
  keys: [number, number][],
  onAyah?: (i: number) => void,
  onDone?: () => void,
) {
  stopQuranAudio();
  const token = queueToken;
  for (let i = 0; i < keys.length; i++) {
    if (token !== queueToken) return;
    onAyah?.(i);
    const [s, a] = keys[i];
    await playUrl(ayahUrl(reciter, s, a));
  }
  if (token === queueToken) onDone?.();
}
