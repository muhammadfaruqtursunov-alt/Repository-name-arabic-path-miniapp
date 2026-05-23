import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { saveTheme, loadTheme } from '../utils/theme';
import type { Accent, Surface, Mood } from '../utils/theme';
import type { Lang } from '../i18n';

interface Props {
  lang: Lang;
  onBack: () => void;
}

const ACCENTS: { id: Accent; title: string; swatch: string }[] = [
  { id: 'gold',     title: 'Gold',     swatch: 'linear-gradient(145deg, #E0B86A 0%, #9A7028 100%)' },
  { id: 'emerald',  title: 'Emerald',  swatch: 'linear-gradient(145deg, #6FE0AE 0%, #1E7A55 100%)' },
  { id: 'ruby',     title: 'Ruby',     swatch: 'linear-gradient(145deg, #E97A6C 0%, #8A2818 100%)' },
  { id: 'rose',     title: 'Rose',     swatch: 'linear-gradient(145deg, #F2A6CB 0%, #A53D74 100%)' },
  { id: 'pearl',    title: 'Pearl',    swatch: 'linear-gradient(145deg, #FFFFFF 0%, #A8ADBC 100%)' },
  { id: 'graphite', title: 'Graphite', swatch: 'linear-gradient(145deg, #C2C7D2 0%, #5A6072 100%)' },
];

const SURFACES: { id: Surface; title: string; desc: string }[] = [
  { id: 'matte', title: 'Матовый',  desc: 'Плоский, чёткий' },
  { id: 'glass', title: 'Стекло',   desc: 'Градиент, блик' },
  { id: '3d',    title: '3D-фаска', desc: 'Объёмные кнопки' },
];

const MOODS: { id: Mood; title: string; desc: string }[] = [
  { id: 'calm',    title: 'Спокойный', desc: 'Мягкое свечение' },
  { id: 'focused', title: 'Фокус',     desc: 'Стандарт' },
  { id: 'bold',    title: 'Смелый',    desc: 'Яркое свечение' },
];

export default function Themes({ onBack }: Props) {
  const [theme, setTheme] = useState(loadTheme);

  function update<K extends keyof typeof theme>(key: K, val: typeof theme[K]) {
    const next = { ...theme, [key]: val };
    setTheme(next);
    saveTheme(next); // applies instantly via applyTheme inside saveTheme
  }

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="page-header" style={{ background: 'var(--bg-card)' }}>
        <button
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="title-card" style={{ flex: 1 }}>🎨 Оформление</h1>
      </div>

      <div className="page-content" style={{ paddingTop: 20 }}>

        {/* ── Accent ─────────────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600, letterSpacing: 0.3 }}>
            АКЦЕНТНЫЙ ЦВЕТ
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {ACCENTS.map(a => (
              <div key={a.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => update('accent', a.id)}
                  title={a.title}
                  style={{
                    width: 46, height: 46, borderRadius: '50%',
                    background: a.swatch,
                    border: theme.accent === a.id
                      ? '3px solid rgba(255,255,255,0.85)'
                      : '2px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    boxShadow: theme.accent === a.id
                      ? '0 0 0 2px rgba(255,255,255,0.20), 0 6px 18px rgba(0,0,0,0.50)'
                      : '0 4px 14px rgba(0,0,0,0.40)',
                    transform: theme.accent === a.id ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 150ms',
                  }}
                />
                <span style={{
                  fontSize: 10, letterSpacing: 0.3,
                  color: theme.accent === a.id ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: theme.accent === a.id ? 700 : 400,
                  transition: 'color 150ms',
                }}>
                  {a.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Surface ────────────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600, letterSpacing: 0.3 }}>
            МАТЕРИАЛ КНОПОК
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SURFACES.map(s => (
              <button
                key={s.id}
                onClick={() => update('surface', s.id)}
                style={{
                  flex: 1, height: 68, borderRadius: 14, cursor: 'pointer',
                  border: theme.surface === s.id
                    ? '1.5px solid var(--accent)'
                    : '1px solid rgba(255,255,255,0.10)',
                  background: theme.surface === s.id
                    ? 'var(--accent-tint)'
                    : 'rgba(255,255,255,0.04)',
                  color: theme.surface === s.id ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 150ms',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>{s.title}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Mood ───────────────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600, letterSpacing: 0.3 }}>
            НАСТРОЕНИЕ
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => update('mood', m.id)}
                style={{
                  flex: 1, height: 68, borderRadius: 14, cursor: 'pointer',
                  border: theme.mood === m.id
                    ? '1.5px solid var(--accent)'
                    : '1px solid rgba(255,255,255,0.10)',
                  background: theme.mood === m.id
                    ? 'var(--accent-tint)'
                    : 'rgba(255,255,255,0.04)',
                  color: theme.mood === m.id ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 150ms',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700 }}>{m.title}</span>
                <span style={{ fontSize: 10, opacity: 0.7 }}>{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Live preview ───────────────────────────────────────── */}
        <div className="glass-card" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 600, letterSpacing: 0.3 }}>
            ПРЕДПРОСМОТР
          </div>
          <button className="btn btn-primary" style={{ marginBottom: 10 }}>
            Основная кнопка
          </button>
          <button className="btn btn-gold">
            Дополнительная кнопка
          </button>
        </div>

        <button className="btn btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>
          <ChevronLeft size={16} /> Назад в настройки
        </button>

      </div>
    </div>
  );
}
