import { Home, RotateCcw } from 'lucide-react';
import type { Lang } from '../i18n';

// Экран-поздравление: показывается, когда ученик дошёл до конца последнего тома курса.
interface Props {
  lang: Lang;
  count: number;       // сколько слов выучено
  onHome: () => void;
  onReview?: () => void;
}

const DUA_AR = 'اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي وَزِدْنِي عِلْمًا';

type SLang = 'ru' | 'en' | 'uz' | 'tj';
interface Content {
  title: string;
  body: string;        // содержит {count}
  duaLabel: string;
  translit: string;
  trans: string;
  footer: string;
  home: string;
  review: string;
  words: string;       // слово «слов» для счётчика
}

const C: Record<SLang, Content> = {
  ru: {
    title: 'Ма ша Аллах! Ты дошёл до конца!',
    body: 'Ты прошёл весь курс и выучил {count} — это серьёзный труд на пути знания. Да примет Аллах твоё старание и сделает это знание полезным для тебя.',
    duaLabel: 'Дуа',
    translit: 'Аллахумма-нфаʿнӣ бимā ʿалламтанӣ, ва ʿаллимнӣ мā янфаʿунӣ, ва зиднӣ ʿильмā.',
    trans: '«О Аллах! Дай мне пользу от того, чему Ты меня научил, научи меня тому, что мне полезно, и приумножь моё знание».',
    footer: 'Не останавливайся — повторяй выученное каждый день. Скоро, ин ша Аллах, добавим новые книги. Жди обновлений!',
    home: 'На главную',
    review: 'Повторить слова',
    words: 'слов',
  },
  en: {
    title: "Ma sha Allah! You've reached the end!",
    body: "You've completed the whole course and learned {count} — a real effort on the path of knowledge. May Allah accept your effort and make this knowledge beneficial for you.",
    duaLabel: "Duʿa",
    translit: 'Allahumma-nfaʿnī bimā ʿallamtanī, wa ʿallimnī mā yanfaʿunī, wa zidnī ʿilmā.',
    trans: '"O Allah! Benefit me with what You have taught me, teach me what benefits me, and increase me in knowledge."',
    footer: "Don't stop — review what you've learned every day. Soon, in sha Allah, we'll add new books. Stay tuned!",
    home: 'Home',
    review: 'Review words',
    words: 'words',
  },
  uz: {
    title: 'Mo sha Olloh! Yakuniga yetding!',
    body: "Butun kursni tamomlading va {count} oʻrganding — bu ilm yoʻlidagi katta mehnat. Olloh mehnatingni qabul qilsin va bu ilmni senga foydali qilsin.",
    duaLabel: 'Duo',
    translit: 'Allohumma-nfaʼnī bimā ʼallamtanī, wa ʼallimnī mā yanfaʼunī, wa zidnī ʼilmā.',
    trans: '"Yo Olloh! Menga oʻrgatgan narsang bilan foyda ber, menga foydali narsani oʻrgat va ilmimni ziyoda qil."',
    footer: "Toʻxtama — har kuni oʻrganganingni takrorla. Tez orada, in sha Olloh, yangi kitoblar qoʻshamiz. Yangiliklarni kuting!",
    home: 'Bosh sahifa',
    review: "Soʻzlarni takrorlash",
    words: "soʻz",
  },
  tj: {
    title: 'Мо шо Аллоҳ! Ту ба охир расидӣ!',
    body: 'Ту тамоми курсро гузаштӣ ва {count} ёд гирифтӣ — ин заҳмати ҷиддӣ дар роҳи дониш аст. Аллоҳ кӯшиши туро қабул кунад ва ин донишро барои ту судманд гардонад.',
    duaLabel: 'Дуо',
    translit: 'Аллоҳумма-нфаънӣ бимо алламтанӣ, ва аллимнӣ мо янфаъунӣ, ва зиднӣ ильмо.',
    trans: '«Эй Аллоҳ! Ба ман аз он чи омӯхтаӣ нафъ расон, он чиро, ки барои ман судманд аст, биёмӯз ва донишамро зиёд кун».',
    footer: 'Наист — ҳар рӯз омӯхтаатро такрор кун. Ба зудӣ, ин шо Аллоҳ, китобҳои нав илова мекунем. Мунтазир бош!',
    home: 'Ба асосӣ',
    review: 'Такрори калимаҳо',
    words: 'калима',
  },
};

export default function CourseComplete({ lang, count, onHome, onReview }: Props) {
  const c = C[(lang === 'ar' ? 'ru' : lang) as SLang] ?? C.ru;
  const countText = `${count} ${c.words}`;
  const body = c.body.replace('{count}', countText);

  return (
    <div className="screen-enter" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-content" style={{ paddingTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 72, marginBottom: 10 }}>🎉</div>
        <h1 className="title-screen" style={{ color: 'var(--accent-gold)', marginBottom: 14, lineHeight: 1.3 }}>
          {c.title}
        </h1>

        {/* счётчик слов */}
        <div style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 8, marginBottom: 16,
          padding: '8px 18px', borderRadius: 16,
          background: 'rgba(192,150,60,0.12)', border: '1px solid var(--accent-border)',
        }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--accent-gold)' }}>{count}</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{c.words}</span>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-main)', opacity: 0.92, marginBottom: 22, maxWidth: 460 }}>
          {body}
        </p>

        {/* Дуа */}
        <div className="glass-card glass-card--gold" style={{ maxWidth: 480, padding: '22px 18px', marginBottom: 24 }}>
          <div className="text-badge" style={{ color: 'var(--accent-gold)', marginBottom: 12 }}>🤲 {c.duaLabel}</div>
          <div className="text-arabic" style={{ fontSize: 24, lineHeight: 1.9, color: 'var(--accent-gold)', direction: 'rtl', marginBottom: 12 }}>
            {DUA_AR}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10 }}>
            {c.translit}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.5 }}>
            {c.trans}
          </div>
        </div>

        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--accent-teal)', marginBottom: 26, maxWidth: 460 }}>
          {c.footer}
        </p>

        <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={onHome}>
            <Home size={18} /> {c.home}
          </button>
          {onReview && (
            <button className="btn btn-ghost" style={{ gap: 8 }} onClick={onReview}>
              <RotateCcw size={16} /> {c.review}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
