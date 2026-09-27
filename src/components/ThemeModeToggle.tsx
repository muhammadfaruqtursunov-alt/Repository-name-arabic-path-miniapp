import { Moon, Sun } from 'lucide-react';
import type { Mode } from '../utils/theme';

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

/** Один переключатель «тёмная/светлая», как в iOS — со стеклянным стиком. */
export default function ThemeModeToggle({ mode, onChange }: Props) {
  const isLight = mode === 'light';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Moon size={16} color={isLight ? 'var(--text-muted)' : 'var(--accent-gold)'} style={{ transition: 'color 200ms' }} />
      <button
        type="button"
        role="switch"
        aria-checked={isLight}
        aria-label="Dark / Light mode"
        className={`toggle-glass${isLight ? ' on' : ''}`}
        onClick={() => onChange(isLight ? 'dark' : 'light')}
      >
        <span className="toggle-glass__dot">
          {isLight ? <Sun size={12} /> : <Moon size={12} />}
        </span>
      </button>
      <Sun size={16} color={isLight ? 'var(--accent-gold)' : 'var(--text-muted)'} style={{ transition: 'color 200ms' }} />
    </div>
  );
}
