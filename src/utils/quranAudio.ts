/**
 * Аудио Корана с бесплатных CDN (мы ничего не храним):
 *  - слово: audio.qurancdn.com (Quran.com, пословное чтение)
 *  - аят:   everyayah.com, выбранный чтец
 * Один общий плеер — новое воспроизведение останавливает предыдущее.
 */
const pad3 = (n: number) => String(n).padStart(3, '0');

const RATE_KEY = 'ap_quran_rate';
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

function loadRate(): number {
  const v = Number(localStorage.getItem(RATE_KEY));
  return PLAYBACK_RATES.includes(v as typeof PLAYBACK_RATES[number]) ? v : 1;
}

let rate = loadRate();
let audio: HTMLAudioElement | null = null;
let queueToken = 0;
let onTimeUpdate: (() => void) | null = null;

function player(): HTMLAudioElement {
  if (!audio) audio = new Audio();
  audio.playbackRate = rate;
  return audio;
}

export function getPlaybackRate(): number {
  return rate;
}

export function setPlaybackRate(r: number) {
  rate = r;
  localStorage.setItem(RATE_KEY, String(r));
  if (audio) audio.playbackRate = r;
}

function clearTimeUpdate() {
  if (audio && onTimeUpdate) audio.removeEventListener('timeupdate', onTimeUpdate);
  onTimeUpdate = null;
}

export function stopQuranAudio() {
  queueToken++;
  clearTimeUpdate();
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

/**
 * Подсветка слов в такт озвучке (караоке): не у всех чтецов есть таймкоды
 * на уровне слова (только Quran.com/QDC, не everyayah.com), поэтому для
 * остальных функция сама переходит на обычное playAyahs без подсветки.
 */
const QDC_RECITER_ID: Partial<Record<string, number>> = {
  Husary_Muallim_128kbps: 12,
  Alafasy_128kbps: 7,
  Minshawy_Murattal_128kbps: 9,
};

interface QdcVerseTiming { verse_key: string; timestamp_from: number; timestamp_to: number; segments: number[][] }
interface QdcAudio { audioUrl: string; verseTimings: QdcVerseTiming[] }

const qdcCache = new Map<string, Promise<QdcAudio | null>>();

function loadQdcAudio(qdcId: number, surah: number): Promise<QdcAudio | null> {
  const cacheKey = `${qdcId}:${surah}`;
  let p = qdcCache.get(cacheKey);
  if (p) return p;
  p = fetch(`https://api.qurancdn.com/api/qdc/audio/reciters/${qdcId}/audio_files?chapter=${surah}&segments=true`)
    .then(r => r.ok ? r.json() : null)
    .then(json => {
      const f = json?.audio_files?.[0];
      if (!f?.audio_url || !Array.isArray(f.verse_timings)) return null;
      return { audioUrl: f.audio_url as string, verseTimings: f.verse_timings as QdcVerseTiming[] };
    })
    .catch(() => null);
  qdcCache.set(cacheKey, p);
  return p;
}

/**
 * Как playAyahs, но с onWord(ayahIndex, wordPosition) — позиция слова внутри
 * аята (1-based, как в морфологии). Если для чтеца/суры нет таймкодов слов,
 * тихо переходит на обычное воспроизведение (onWord просто не вызывается).
 */
export async function playAyahsSynced(
  reciterKey: string,
  surah: number,
  keys: [number, number][],
  onAyah?: (i: number) => void,
  onWord?: (i: number, wordPos: number) => void,
  onDone?: () => void,
) {
  const qdcId = QDC_RECITER_ID[reciterKey];
  const qdc = qdcId ? await loadQdcAudio(qdcId, surah) : null;
  if (!qdc) { void playAyahs(reciterKey, keys, onAyah, onDone); return; }

  const wantedKeys = new Set(keys.map(([s, a]) => `${s}:${a}`));
  const timings = qdc.verseTimings.filter(t => wantedKeys.has(t.verse_key));
  if (timings.length === 0) { void playAyahs(reciterKey, keys, onAyah, onDone); return; }

  stopQuranAudio();
  const token = queueToken;
  const a = player();
  a.src = qdc.audioUrl;
  a.currentTime = timings[0].timestamp_from / 1000;

  let lastAyah = -1;
  let lastWord = -1;
  const rangeEnd = timings[timings.length - 1].timestamp_to;
  const handler = () => {
    if (token !== queueToken) return;
    const tMs = a.currentTime * 1000;
    if (tMs >= rangeEnd) { stopQuranAudio(); onDone?.(); return; }
    const vi = timings.findIndex(t => tMs >= t.timestamp_from && tMs < t.timestamp_to);
    if (vi === -1) return;
    if (vi !== lastAyah) { lastAyah = vi; lastWord = -1; onAyah?.(keys.findIndex(([s, ay]) => `${s}:${ay}` === timings[vi].verse_key)); }
    const seg = timings[vi].segments.find(s => s.length === 3 && tMs >= s[1] && tMs < s[2]);
    if (seg && seg[0] !== lastWord) { lastWord = seg[0]; onWord?.(lastAyah, seg[0]); }
  };
  onTimeUpdate = handler;
  a.addEventListener('timeupdate', handler);
  a.onended = () => { if (token === queueToken) onDone?.(); };
  a.onerror = () => { if (token === queueToken) onDone?.(); };
  await a.play().catch(() => {});
}
