import { Home, ArrowLeft } from 'lucide-react';

// Плавающая стеклянная пилюля: «Домой» (на главный экран) + «Назад» (на предыдущий экран).
interface Props {
  onHome: () => void;
  onBack: () => void;
}

export default function NavFloat({ onHome, onBack }: Props) {
  return (
    <div className="navfloat" role="navigation" aria-label="Навигация">
      <button className="navfloat__btn home" onClick={onHome} aria-label="На главный экран" title="Домой">
        <Home size={18} />
      </button>
      <div className="navfloat__sep" />
      <button className="navfloat__btn" onClick={onBack} aria-label="Назад" title="Назад">
        <ArrowLeft size={18} />
      </button>
    </div>
  );
}
