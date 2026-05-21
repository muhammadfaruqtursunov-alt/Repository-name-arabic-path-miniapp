interface Props {
  pct: number;
  className?: string;
}

export default function ProgressBar({ pct, className = '' }: Props) {
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-bar__fill" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
