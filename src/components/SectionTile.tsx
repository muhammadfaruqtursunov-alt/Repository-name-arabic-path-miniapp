import type { ReactNode } from 'react';

// Плитка раздела/подраздела на главном экране и внутри разделов.
interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  soonLabel?: string;   // если задано — плитка неактивна, с бейджем «Скоро»
  wide?: boolean;       // на всю ширину сетки, иконка слева
  gold?: boolean;
}

export default function SectionTile({ icon, title, subtitle, onClick, soonLabel, wide, gold }: Props) {
  const disabled = !!soonLabel;
  const iconBox = (
    <div style={{
      width: 44, height: 44, borderRadius: 12, background: 'var(--accent-tint)', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: wide ? 0 : 10,
    }}>
      {icon}
    </div>
  );

  return (
    <div
      className={`glass-card${gold ? ' glass-card--gold' : ''}`}
      style={{
        position: 'relative',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        gridColumn: wide ? 'span 2' : undefined,
        display: wide ? 'flex' : 'block',
        alignItems: wide ? 'center' : undefined,
        gap: wide ? 12 : undefined,
      }}
      onClick={disabled ? undefined : onClick}
      role={disabled ? undefined : 'button'}
    >
      {soonLabel && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          background: 'var(--accent-tint)', color: 'var(--accent)',
          borderRadius: 10, padding: '2px 7px', fontSize: 9, fontWeight: 700,
          border: '1px solid var(--accent-border)',
        }}>
          {soonLabel}
        </div>
      )}
      {iconBox}
      <div style={{ minWidth: 0 }}>
        <div className="title-card" style={{ marginBottom: 2 }}>{title}</div>
        {subtitle && <div className="text-muted" style={{ fontSize: 12 }}>{subtitle}</div>}
      </div>
    </div>
  );
}
