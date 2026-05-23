import { useEffect, useState } from 'react';
import type { Achievement } from '../utils/achievements';

interface Props {
  achievement: Achievement | null;
  onDone: () => void;
}

export default function AchievementPopup({ achievement, onDone }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!achievement) return;
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 3200);
    return () => clearTimeout(t);
  }, [achievement]);

  if (!achievement) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 72, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`,
        zIndex: 8000,
        opacity: visible ? 1 : 0,
        transition: 'opacity 350ms ease, transform 350ms ease',
        pointerEvents: 'none',
        minWidth: 240, maxWidth: 300,
      }}
    >
      <div style={{
        background: 'rgba(10,11,20,0.94)',
        border: '1.5px solid rgba(192,150,60,0.40)',
        borderRadius: 18,
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.07) inset',
        backdropFilter: 'blur(20px)',
      }}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>{achievement.emoji}</span>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
            Достижение!
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>
            {achievement.title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {achievement.desc}
          </div>
        </div>
      </div>
    </div>
  );
}
