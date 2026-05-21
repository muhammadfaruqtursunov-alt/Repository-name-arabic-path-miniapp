import { LANGS } from '../i18n';
import type { Lang } from '../i18n';

interface Props {
  current: Lang;
  onChange: (lang: Lang) => void;
}

export default function LanguageSwitcher({ current, onChange }: Props) {
  return (
    <div className="lang-bar">
      {LANGS.map(({ code, flag, label }) => (
        <button
          key={code}
          className={`lang-bar__item${current === code ? ' active' : ''}`}
          onClick={() => onChange(code)}
        >
          {flag} {label}
        </button>
      ))}
    </div>
  );
}
