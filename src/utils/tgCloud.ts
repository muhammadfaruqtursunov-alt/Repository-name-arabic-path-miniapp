/**
 * Тонкая обёртка над Telegram CloudStorage (значение до 4096 символов, поэтому длинное режем на куски).
 * Вне Telegram (или в старой версии) всё молча не делает ничего: данные остаются в localStorage.
 */
const CHUNK = 3500;

function cloud() {
  const tg = window.Telegram?.WebApp;
  if (!tg?.CloudStorage || !tg.initData) return null;
  if (tg.isVersionAtLeast && !tg.isVersionAtLeast('6.9')) return null;
  return tg.CloudStorage;
}

function getMany(keys: string[]): Promise<Record<string, string>> {
  return new Promise(resolve => {
    const cs = cloud();
    if (!cs) { resolve({}); return; }
    cs.getItems(keys, (err, values) => resolve(!err && values ? values : {}));
  });
}

/** Сохраняет строку кусками prefix_0…prefix_n-1 и счётчиком prefix_n. */
export function cloudSetChunked(prefix: string, text: string) {
  const cs = cloud();
  if (!cs) return;
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK) parts.push(text.slice(i, i + CHUNK));
  parts.forEach((p, i) => cs.setItem(`${prefix}_${i}`, p));
  cs.setItem(`${prefix}_n`, String(parts.length));
}

export async function cloudGetChunked(prefix: string): Promise<string | null> {
  const head = await getMany([`${prefix}_n`]);
  const n = Number(head[`${prefix}_n`] || 0);
  if (!n) return null;
  const keys = Array.from({ length: n }, (_, i) => `${prefix}_${i}`);
  const vals = await getMany(keys);
  return keys.map(k => vals[k] ?? '').join('');
}
