export type Accent  = 'gold' | 'emerald' | 'ruby' | 'rose' | 'pearl' | 'graphite';
export type Surface = 'matte' | 'glass' | '3d';
export type Mood    = 'calm' | 'focused' | 'bold';

export interface Theme { accent: Accent; surface: Surface; mood: Mood; }

const DEFAULT: Theme = { accent: 'gold', surface: 'glass', mood: 'focused' };
const KEY = 'ap_theme';

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const p = JSON.parse(raw) as Partial<Theme>;
    return {
      accent:  p.accent  ?? DEFAULT.accent,
      surface: p.surface ?? DEFAULT.surface,
      mood:    p.mood    ?? DEFAULT.mood,
    };
  } catch {
    return DEFAULT;
  }
}

export function applyTheme(theme: Theme): void {
  const el = document.documentElement;
  el.dataset.accent  = theme.accent;
  el.dataset.surface = theme.surface;
  el.classList.remove('mood-calm', 'mood-focused', 'mood-bold');
  el.classList.add(`mood-${theme.mood}`);
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(KEY, JSON.stringify(theme));
  applyTheme(theme);
}
