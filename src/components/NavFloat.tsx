import { Home } from 'lucide-react';

// Плавающая стеклянная кнопка «Домой». Назад — только жестом (свайп от края экрана).
interface Props {
  onHome: () => void;
}

export default function NavFloat({ onHome }: Props) {
  return (
    <div className="navfloat" role="navigation" aria-label="Навигация">
      <button className="navfloat__btn home" onClick={onHome} aria-label="На главный экран" title="Домой">
        <Home size={18} />
      </button>
    </div>
  );
}
