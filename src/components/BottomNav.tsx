import { Home, BarChart3, UserCircle2, SlidersHorizontal } from 'lucide-react';
import { t } from '../i18n';
import type { Lang } from '../i18n';

export type NavTab = 'home' | 'stats' | 'profile' | 'settings';

interface Props {
  active: NavTab;
  lang: Lang;
  onChange: (tab: NavTab) => void;
}

type NavItem = { id: NavTab; icon: (p: { size: number }) => JSX.Element; labelKey: 'nav_home' | 'nav_stats' | 'nav_profile' | 'nav_settings' };

const ITEMS: NavItem[] = [
  { id: 'home',     icon: ({ size }) => <Home size={size} />,             labelKey: 'nav_home' },
  { id: 'stats',    icon: ({ size }) => <BarChart3 size={size} />,        labelKey: 'nav_stats' },
  { id: 'profile',  icon: ({ size }) => <UserCircle2 size={size} />,      labelKey: 'nav_profile' },
  { id: 'settings', icon: ({ size }) => <SlidersHorizontal size={size} />, labelKey: 'nav_settings' },
];

export default function BottomNav({ active, lang, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(({ id, icon: Icon, labelKey }) => (
        <button
          key={id}
          className={`bottom-nav__item${active === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={22} />
          <span>{t(lang, labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
