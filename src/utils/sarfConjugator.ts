// ============================================================================
// ДВИЖОК СПРЯЖЕНИЯ (تصريف) — صرف صغیر для здоровых (صحيح سالم) трёхбуквенных глаголов.
//
// По корню [ف، ع، ل] и «группе» (باب) генерирует полный тасриф — все производные
// (12 иштикак из «Китаб Бидан» + اسم زمان/مكان/آلة/تفضيل):
//   ماضي معلوم/مجهول · مضارع معلوم/مجهول · أمر · نهي · جحد · نفي ·
//   اسم فاعل · اسم مفعول · اسم زمان ومكان · اسم آلة · اسم تفضيل.
//
// Группы (только для صحيح سالم, чтобы формы были регулярны):
//   1) نَصَرَ – يَنْصُرُ  (فَعَلَ يَفْعُلُ)  past=fatha, present=damma
//   2) ضَرَبَ – يَضْرِبُ  (فَعَلَ يَفْعِلُ)  past=fatha, present=kasra
//   3) عَلِمَ – يَعْلَمُ  (فَعِلَ يَفْعَلُ)  past=kasra, present=fatha
// ============================================================================

// ── Харакаты и буквы (Unicode) ──────────────────────────────────────────────
export const FATHA = 'َ';
export const KASRA = 'ِ';
export const DAMMA = 'ُ';
export const SUKUN = 'ْ';
export const SHADDA = 'ّ';
export const FATHATAN = 'ً';
export const DAMMATAN = 'ٌ';
export const KASRATAN = 'ٍ';

const ALIF = 'ا';        // ا
const WAW = 'و';         // و
const YA = 'ي';          // ي
const ALIF_MAQ = 'ى';    // ى
const TA = 'ت';          // ت
const NUN = 'ن';         // ن
const MIM = 'م';         // م
const TA_MARBUTA = 'ة';  // ة
const HAMZA_ALIF = 'أ';  // أ
const LAM = 'ل';         // ل

const LAM_PREFIX = LAM + FATHA + MIM + SUKUN + ' '; // «لَمْ »
const LA_PREFIX = LAM + FATHA + ALIF + ' ';         // «لَا »

export type SarfGroup = 1 | 2 | 3;

function vowels(group: SarfGroup): { pastV: string; presentV: string } {
  if (group === 1) return { pastV: FATHA, presentV: DAMMA };
  if (group === 2) return { pastV: FATHA, presentV: KASRA };
  return { pastV: KASRA, presentV: FATHA };
}

// ── Метки разборов (صيغة) ───────────────────────────────────────────────────
export interface SighaLabel {
  ar: string;
  ru: string;
}

// 14 форм: غائب(6) → مخاطب(6) → متكلّم(2)
const SIGHA14: SighaLabel[] = [
  { ar: 'هُوَ', ru: 'он' },
  { ar: 'هُمَا (مذ.)', ru: 'они двое (м.)' },
  { ar: 'هُمْ', ru: 'они (м.)' },
  { ar: 'هِيَ', ru: 'она' },
  { ar: 'هُمَا (مؤ.)', ru: 'они двое (ж.)' },
  { ar: 'هُنَّ', ru: 'они (ж.)' },
  { ar: 'أَنْتَ', ru: 'ты (м.)' },
  { ar: 'أَنْتُمَا (مذ.)', ru: 'вы двое (м.)' },
  { ar: 'أَنْتُمْ', ru: 'вы (м.)' },
  { ar: 'أَنْتِ', ru: 'ты (ж.)' },
  { ar: 'أَنْتُمَا (مؤ.)', ru: 'вы двое (ж.)' },
  { ar: 'أَنْتُنَّ', ru: 'вы (ж.)' },
  { ar: 'أَنَا', ru: 'я' },
  { ar: 'نَحْنُ', ru: 'мы' },
];

// порядок مخاطب(6) → غائب(6) → متكلّم(2) — для نهي и امر بلام مجهول
const ORDER_K = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 12, 13];
const SIGHA14K: SighaLabel[] = ORDER_K.map((i) => SIGHA14[i]);

// 6 форм причастий: مذكّر(3) → مؤنّث(3)
const SIGHA6P: SighaLabel[] = [
  { ar: 'مُفرد مذكّر', ru: 'ед. м.' },
  { ar: 'مثنّى مذكّر', ru: 'дв. м.' },
  { ar: 'جمع مذكّر', ru: 'мн. м.' },
  { ar: 'مُفرد مؤنّث', ru: 'ед. ж.' },
  { ar: 'مثنّى مؤنّث', ru: 'дв. ж.' },
  { ar: 'جمع مؤنّث', ru: 'мн. ж.' },
];

// 6 форм امر حاضر (مخاطب)
const SIGHA6A: SighaLabel[] = [
  { ar: 'أَنْتَ', ru: 'ты (м.)' },
  { ar: 'أَنْتُمَا (مذ.)', ru: 'вы двое (м.)' },
  { ar: 'أَنْتُمْ', ru: 'вы (м.)' },
  { ar: 'أَنْتِ', ru: 'ты (ж.)' },
  { ar: 'أَنْتُمَا (مؤ.)', ru: 'вы двое (ж.)' },
  { ar: 'أَنْتُنَّ', ru: 'вы (ж.)' },
];

// 3 формы (اسم زمان/مكان/آلة)
const SIGHA3: SighaLabel[] = [
  { ar: 'مُفرد', ru: 'ед.' },
  { ar: 'مثنّى', ru: 'дв.' },
  { ar: 'جمع', ru: 'мн.' },
];

// ── Перфект (ماضي): 14 форм по «основе» (до لام) + третья коренная ──────────
function perfectForms(base: string, f3: string): string[] {
  return [
    base + f3 + FATHA,                                       // هو
    base + f3 + FATHA + ALIF,                                // هما (م)
    base + f3 + DAMMA + WAW + ALIF,                          // هم
    base + f3 + FATHA + TA + SUKUN,                          // هي
    base + f3 + FATHA + TA + FATHA + ALIF,                   // هما (ف)
    base + f3 + SUKUN + NUN + FATHA,                         // هن
    base + f3 + SUKUN + TA + FATHA,                          // أنتَ
    base + f3 + SUKUN + TA + DAMMA + MIM + FATHA + ALIF,     // أنتما (م)
    base + f3 + SUKUN + TA + DAMMA + MIM + SUKUN,            // أنتم
    base + f3 + SUKUN + TA + KASRA,                          // أنتِ
    base + f3 + SUKUN + TA + DAMMA + MIM + FATHA + ALIF,     // أنتما (ف)
    base + f3 + SUKUN + TA + DAMMA + NUN + SHADDA + FATHA,   // أنتنّ
    base + f3 + SUKUN + TA + DAMMA,                          // أنا
    base + f3 + SUKUN + NUN + FATHA + ALIF,                  // نحن
  ];
}

// ── Имперфект (مضارع): 14 форм. midV — огласовка عين; prefixV — огласовка
//    приставки (фатха=معلوم / дамма=مجهول); jussive — для جزم (لم/نهي). ──────
type EndKind = 'IND' | 'DUAL' | 'PLM' | 'PLF' | 'FSG2';
const IMPERF_END: EndKind[] = [
  'IND', 'DUAL', 'PLM', 'IND', 'DUAL', 'PLF',
  'IND', 'DUAL', 'PLM', 'FSG2', 'DUAL', 'PLF',
  'IND', 'IND',
];
const PREFIX_LETTER = [YA, YA, YA, TA, TA, YA, TA, TA, TA, TA, TA, TA, HAMZA_ALIF, NUN];

function imperfForms(
  f1: string, f2: string, f3: string,
  midV: string, prefixV: string, jussive: boolean,
): string[] {
  return IMPERF_END.map((end, i) => {
    const pre = PREFIX_LETTER[i] + prefixV;
    const core = f1 + SUKUN + f2 + midV;
    let ending: string;
    if (!jussive) {
      switch (end) {
        case 'IND':  ending = f3 + DAMMA; break;
        case 'DUAL': ending = f3 + FATHA + ALIF + NUN + KASRA; break;
        case 'PLM':  ending = f3 + DAMMA + WAW + NUN + FATHA; break;
        case 'PLF':  ending = f3 + SUKUN + NUN + FATHA; break;
        case 'FSG2': ending = f3 + KASRA + YA + NUN + FATHA; break;
      }
    } else {
      switch (end) {
        case 'IND':  ending = f3 + SUKUN; break;
        case 'DUAL': ending = f3 + FATHA + ALIF; break;        // отпадает ن
        case 'PLM':  ending = f3 + DAMMA + WAW + ALIF; break;  // ن→молчаливый алиф
        case 'PLF':  ending = f3 + SUKUN + NUN + FATHA; break; // مبني — без изменений
        case 'FSG2': ending = f3 + KASRA + YA; break;          // отпадает ن
      }
    }
    return pre + core + ending;
  });
}

// ── Повеление (أمر حاضر): 6 форм 2-го лица ──────────────────────────────────
function imperativeForms(f1: string, f2: string, f3: string, presentV: string): string[] {
  const waslV = presentV === DAMMA ? DAMMA : KASRA;
  const stem = ALIF + waslV + f1 + SUKUN + f2 + presentV;
  return [
    stem + f3 + SUKUN,              // أنتَ
    stem + f3 + FATHA + ALIF,       // أنتما (م)
    stem + f3 + DAMMA + WAW + ALIF, // أنتم
    stem + f3 + KASRA + YA,         // أنتِ
    stem + f3 + FATHA + ALIF,       // أنتما (ف)
    stem + f3 + SUKUN + NUN + FATHA,// أنتنّ
  ];
}

// ── Причастия и имена ───────────────────────────────────────────────────────
function ismFailForms(f1: string, f2: string, f3: string): string[] {
  const base = f1 + FATHA + ALIF + f2 + KASRA; // فَاعِ
  return [
    base + f3 + DAMMATAN,
    base + f3 + FATHA + ALIF + NUN + KASRA,
    base + f3 + DAMMA + WAW + NUN + FATHA,
    base + f3 + FATHA + TA_MARBUTA + DAMMATAN,
    base + f3 + FATHA + TA + FATHA + ALIF + NUN + KASRA,
    base + f3 + FATHA + ALIF + TA + DAMMATAN,
  ];
}

function ismMafulForms(f1: string, f2: string, f3: string): string[] {
  const base = MIM + FATHA + f1 + SUKUN + f2 + DAMMA + WAW; // مَفْعُو
  return [
    base + f3 + DAMMATAN,
    base + f3 + FATHA + ALIF + NUN + KASRA,
    base + f3 + DAMMA + WAW + NUN + FATHA,
    base + f3 + FATHA + TA_MARBUTA + DAMMATAN,
    base + f3 + FATHA + TA + FATHA + ALIF + NUN + KASRA,
    base + f3 + FATHA + ALIF + TA + DAMMATAN,
  ];
}

function ismZamanMakanForms(f1: string, f2: string, f3: string, presentV: string): string[] {
  const zV = presentV === KASRA ? KASRA : FATHA;
  const base = MIM + FATHA + f1 + SUKUN + f2 + zV;            // مَفْعَل/مَفْعِل
  const basePl = MIM + FATHA + f1 + FATHA + ALIF + f2 + KASRA;// مَفَاعِل
  return [
    base + f3 + DAMMATAN,
    base + f3 + FATHA + ALIF + NUN + KASRA,
    basePl + f3 + DAMMA, // ممنوع من الصرف
  ];
}

function ismAlaForms(f1: string, f2: string, f3: string): string[] {
  const base = MIM + KASRA + f1 + SUKUN + f2 + FATHA + ALIF;          // مِفْعَال
  const basePl = MIM + FATHA + f1 + FATHA + ALIF + f2 + KASRA + YA;   // مَفَاعِيل
  return [
    base + f3 + DAMMATAN,
    base + f3 + FATHA + ALIF + NUN + KASRA,
    basePl + f3 + DAMMA,
  ];
}

function ismTafdilForms(f1: string, f2: string, f3: string): string[] {
  const mascBase = HAMZA_ALIF + FATHA + f1 + SUKUN + f2 + FATHA; // أَفْعَ
  const femBase = f1 + DAMMA + f2 + SUKUN;                       // فُعْـ
  return [
    mascBase + f3 + DAMMA, // أَفْعَل — ممنوع من الصرف
    mascBase + f3 + FATHA + ALIF + NUN + KASRA,
    mascBase + f3 + DAMMA + WAW + NUN + FATHA,
    femBase + f3 + FATHA + ALIF_MAQ,                                  // فُعْلَى
    femBase + f3 + FATHA + YA + FATHA + ALIF + NUN + KASRA,           // فُعْلَيَانِ
    femBase + f3 + FATHA + YA + FATHA + ALIF + TA + DAMMATAN,         // فُعْلَيَاتٌ
  ];
}

// ── Категория тасрифа ───────────────────────────────────────────────────────
export interface TasrifCategory {
  key: string;
  ar: string;   // арабский заголовок
  ru: string;   // русский заголовок
  gloss: string;// краткий смысл
  labels: SighaLabel[];
  forms: string[];
}

export interface ConjResult {
  madi: string;    // словарная форма прош. (هو)
  mudari: string;  // словарная форма наст. (هو)
  categories: TasrifCategory[];
}

export function conjugate(root: [string, string, string], group: SarfGroup): ConjResult {
  const [f1, f2, f3] = root;
  const { pastV, presentV } = vowels(group);

  const pastBase = f1 + FATHA + f2 + pastV;          // فَعَ / فَعِ
  const pastActive = perfectForms(pastBase, f3);

  const pastPassBase = f1 + DAMMA + f2 + KASRA;      // فُعِ
  const pastPassive = perfectForms(pastPassBase, f3);

  const presentActive = imperfForms(f1, f2, f3, presentV, FATHA, false);
  const presentPassive = imperfForms(f1, f2, f3, FATHA, DAMMA, false);

  const jussiveActive = imperfForms(f1, f2, f3, presentV, FATHA, true);
  const jussivePassive = imperfForms(f1, f2, f3, FATHA, DAMMA, true);

  const jahdActive = jussiveActive.map((x) => LAM_PREFIX + x);
  const jahdPassive = jussivePassive.map((x) => LAM_PREFIX + x);

  const nafyActive = presentActive.map((x) => LA_PREFIX + x);
  const nafyPassive = presentPassive.map((x) => LA_PREFIX + x);

  const amr = imperativeForms(f1, f2, f3, presentV);
  const nahyActive = ORDER_K.map((i) => LA_PREFIX + jussiveActive[i]);
  const nahyPassive = ORDER_K.map((i) => LA_PREFIX + jussivePassive[i]);

  const fail = ismFailForms(f1, f2, f3);
  const maful = ismMafulForms(f1, f2, f3);
  const zamanMakan = ismZamanMakanForms(f1, f2, f3, presentV);
  const ala = ismAlaForms(f1, f2, f3);
  const tafdil = ismTafdilForms(f1, f2, f3);

  const categories: TasrifCategory[] = [
    { key: 'madi_m',  ar: 'الْمَاضِي الْمَعْلُوم',  ru: 'Прош. действ.',        gloss: 'сделал',          labels: SIGHA14,  forms: pastActive },
    { key: 'madi_mj', ar: 'الْمَاضِي الْمَجْهُول',  ru: 'Прош. страд.',         gloss: 'был сделан',      labels: SIGHA14,  forms: pastPassive },
    { key: 'mud_m',   ar: 'الْمُضَارِع الْمَعْلُوم', ru: 'Наст.-буд. действ.',  gloss: 'делает',          labels: SIGHA14,  forms: presentActive },
    { key: 'mud_mj',  ar: 'الْمُضَارِع الْمَجْهُول', ru: 'Наст.-буд. страд.',   gloss: 'делается',        labels: SIGHA14,  forms: presentPassive },
    { key: 'fail',    ar: 'اِسْمُ الْفَاعِل',        ru: 'Действ. причастие',   gloss: 'делающий',        labels: SIGHA6P,  forms: fail },
    { key: 'maful',   ar: 'اِسْمُ الْمَفْعُول',      ru: 'Страд. причастие',    gloss: 'сделанный',       labels: SIGHA6P,  forms: maful },
    { key: 'jahd_m',  ar: 'الْجَحْد الْمَعْلُوم',    ru: 'Отриц. прош. (لم)',   gloss: 'не сделал',       labels: SIGHA14,  forms: jahdActive },
    { key: 'jahd_mj', ar: 'الْجَحْد الْمَجْهُول',    ru: 'Отриц. прош. страд.', gloss: 'не был сделан',   labels: SIGHA14,  forms: jahdPassive },
    { key: 'nafy_m',  ar: 'النَّفْي الْمَعْلُوم',    ru: 'Отриц. буд. (لا)',    gloss: 'не делает',       labels: SIGHA14,  forms: nafyActive },
    { key: 'nafy_mj', ar: 'النَّفْي الْمَجْهُول',    ru: 'Отриц. буд. страд.',  gloss: 'не делается',     labels: SIGHA14,  forms: nafyPassive },
    { key: 'amr',     ar: 'الْأَمْر',                ru: 'Повеление',           gloss: 'делай!',          labels: SIGHA6A,  forms: amr },
    { key: 'nahy_m',  ar: 'النَّهْي الْمَعْلُوم',    ru: 'Запрет',              gloss: 'не делай!',       labels: SIGHA14K, forms: nahyActive },
    { key: 'nahy_mj', ar: 'النَّهْي الْمَجْهُول',    ru: 'Запрет страд.',       gloss: 'да не будешь…',   labels: SIGHA14K, forms: nahyPassive },
    { key: 'zaman',   ar: 'اِسْمُ الزَّمَان وَالْمَكَان', ru: 'Имя времени/места', gloss: 'место/время',  labels: SIGHA3,   forms: zamanMakan },
    { key: 'ala',     ar: 'اِسْمُ الْآلَة',          ru: 'Имя орудия',          gloss: 'орудие',          labels: SIGHA3,   forms: ala },
    { key: 'tafdil',  ar: 'اِسْمُ التَّفْضِيل',      ru: 'Имя превосходства',   gloss: 'более…',          labels: SIGHA6P,  forms: tafdil },
  ];

  return { madi: pastActive[0], mudari: presentActive[0], categories };
}

// ============================================================================
// РАЗБОР ОГЛАСОВОК (для визуального теста — «играем с харакатами»)
// ============================================================================

const MARKS = new Set([FATHA, KASRA, DAMMA, SUKUN, SHADDA, FATHATAN, DAMMATAN, KASRATAN]);

export interface AUnit {
  base: string;  // буква (или пробел)
  mark: string;  // огласовка(и) на ней
}

// Разбить огласованную строку на единицы «буква + огласовка».
export function splitUnits(s: string): AUnit[] {
  const units: AUnit[] = [];
  for (const ch of s) {
    if (ch === ' ') { units.push({ base: ' ', mark: '' }); continue; }
    if (MARKS.has(ch)) {
      if (units.length) units[units.length - 1].mark += ch;
    } else {
      units.push({ base: ch, mark: '' });
    }
  }
  return units;
}

// Собрать строку обратно из единиц.
export function joinUnits(units: AUnit[]): string {
  return units.map((u) => u.base + u.mark).join('');
}

// Снять все огласовки (для нестрогого сравнения письменного ответа).
export function stripHarakat(s: string): string {
  let out = '';
  for (const ch of s) if (!MARKS.has(ch)) out += ch;
  return out.replace(/\s+/g, '').trim();
}

// Нестрогая нормализация для сравнения письменного ответа:
// снимает огласовки + сводит варианты букв (أإآ→ا, ى→ي, ة→ه) и убирает тату́виль.
// Так ученик не получает «неверно» из-за формы хамзы/алифа при правильном построении.
export function normalizeArabicLoose(s: string): string {
  return stripHarakat(s)
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ـ/g, '');
}

// «Простые» огласовки, которые угадывают в визуальном тесте.
export const SIMPLE_MARKS: { mark: string; ru: string; ar: string }[] = [
  { mark: FATHA, ru: 'фатха', ar: 'فَتْحَة' },
  { mark: KASRA, ru: 'кясра', ar: 'كَسْرَة' },
  { mark: DAMMA, ru: 'дамма', ar: 'ضَمَّة' },
  { mark: SUKUN, ru: 'сукун', ar: 'سُكُون' },
];

const SIMPLE_SET = new Set(SIMPLE_MARKS.map((m) => m.mark));

// Индексы единиц-кандидатов для «заглушки» огласовки в визуальном тесте:
// только настоящие согласные с ровно одной простой огласовкой (не долгие гласные).
export function blankCandidates(units: AUnit[]): number[] {
  const out: number[] = [];
  units.forEach((u, i) => {
    if (u.base === ' ' || u.base === ALIF || u.base === WAW || u.base === ALIF_MAQ) return;
    if (u.mark.length === 1 && SIMPLE_SET.has(u.mark)) out.push(i);
  });
  return out;
}
