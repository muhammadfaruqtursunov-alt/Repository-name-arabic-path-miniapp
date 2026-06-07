// ============================================================================
// СА́РФ (الصَّرْف) — арабская морфология
// Источник: «Китаб Бидан» (كِتَاب بِدَان) — классический персоязычный учебник صرف.
// Модельный глагол всей книги: ضَرَبَ (бить).
//
// СТАТУС: «бланк» — пока заполнены только فارسی (оригинал) + русский перевод.
//         Слоты en / uz / tj оставлены пустыми и заполнятся позже.
//         Структура уроков (как именно резать на уроки/тесты) — будет задана позже,
//         поэтому здесь хранятся только данные, без привязки к экранам.
//
// Все арабские формы — с полными харакатами (حركات) и и'рабом (إعراب).
// ============================================================================

// Многоязычный текст. fa и ru заполнены; en/uz/tj — слоты на будущее.
export interface SarfText {
  fa: string;          // فارسی — оригинал книги
  ru: string;          // русский перевод
  en?: string;         // (заполнить позже)
  uz?: string;         // (заполнить позже)
  tj?: string;         // (заполнить позже)
}

// Элемент теории: термин + определение (+ примеры).
export interface SarfTheory {
  ar?: string;         // арабский термин/слово (с харакатами)
  tr?: string;         // транслитерация
  term: SarfText;      // название/перевод термина
  def: SarfText;       // определение / объяснение
  examples?: string[]; // примеры (арабский)
}

// Одна форма (صِيغَة) в парадигме спряжения.
export interface SarfSigha {
  ar: string;          // арабская форма (с харакатами)
  tr?: string;         // транслитерация
  label: SarfText;     // грамматический разбор формы (лицо/род/число)
}

// Парадигма спряжения (صرف صغیر) — таблица из 14 / 8 / 6 / 3 форм.
export interface SarfParadigm {
  key: string;
  ar: string;          // арабский заголовок (مَعْلُوم فِعْل مَاضِي)
  title: SarfText;     // перевод заголовка
  gloss?: SarfText;    // общий смысл («ударил», «бьёт», «был побит» …)
  rule?: SarfText;     // طريقة الصرف — правило образования
  sighas: SarfSigha[];
}

// Раздел книги (потенциальная тема урока — деление на уроки задаётся позже).
export interface SarfSection {
  key: string;
  emoji: string;
  title: SarfText;
  intro?: SarfText;
  theory?: SarfTheory[];
  paradigms?: SarfParadigm[];
}

// ────────────────────────────────────────────────────────────────────────────
// Общие массивы грамматических разборов (label) — переиспользуются парадигмами.
// ────────────────────────────────────────────────────────────────────────────

// 14 форм в «обычном» порядке: غائب (3-е л., 6) → مخاطب (2-е л., 6) → متكلّم (1-е л., 2)
const L14G: SarfText[] = [
  { fa: 'واحِد مُذَكَّر غائِب',  ru: 'ед. ч., м. р., 3-е л. (он)', en: "sing., masc., 3rd person (he)", uz: "birlik, muz. jins, 3-shaxs (u)", tj: "танҳо, муз., шахси 3 (ӯ)" },
  { fa: 'تَثْنِیَة مُذَكَّر غائِب', ru: 'дв. ч., м. р., 3-е л. (они вдвоём)', en: "dual, masc., 3rd person (they two)", uz: "ikkilik, muz. jins, 3-shaxs (ular ikkovi)", tj: "тасния, муз., шахси 3 (он ду нафар)" },
  { fa: 'جَمْع مُذَكَّر غائِب',  ru: 'мн. ч., м. р., 3-е л. (они)', en: "plural, masc., 3rd person (they)", uz: "koʻplik, muz. jins, 3-shaxs (ular)", tj: "ҷамъ, муз., шахси 3 (онҳо)" },
  { fa: 'واحِد مُؤَنَّث غائِب',  ru: 'ед. ч., ж. р., 3-е л. (она)', en: "sing., fem., 3rd person (she)", uz: "birlik, muan. jins, 3-shaxs (u)", tj: "танҳо, муан., шахси 3 (ӯ)" },
  { fa: 'تَثْنِیَة مُؤَنَّث غائِب', ru: 'дв. ч., ж. р., 3-е л. (они вдвоём)', en: "dual, fem., 3rd person (they two)", uz: "ikkilik, muan. jins, 3-shaxs (ular ikkovi)", tj: "тасния, муан., шахси 3 (он ду нафар)" },
  { fa: 'جَمْع مُؤَنَّث غائِب',  ru: 'мн. ч., ж. р., 3-е л. (они)', en: "plural, fem., 3rd person (they)", uz: "koʻplik, muan. jins, 3-shaxs (ular)", tj: "ҷамъ, муан., шахси 3 (онҳо)" },
  { fa: 'واحِد مُذَكَّر مُخاطَب',  ru: 'ед. ч., м. р., 2-е л. (ты)', en: "sing., masc., 2nd person (you)", uz: "birlik, muz. jins, 2-shaxs (sen)", tj: "танҳо, муз., шахси 2 (ту)" },
  { fa: 'تَثْنِیَة مُذَكَّر مُخاطَب', ru: 'дв. ч., м. р., 2-е л. (вы вдвоём)', en: "dual, masc., 2nd person (you two)", uz: "ikkilik, muz. jins, 2-shaxs (siz ikkovingiz)", tj: "тасния, муз., шахси 2 (шумо ду нафар)" },
  { fa: 'جَمْع مُذَكَّر مُخاطَب',  ru: 'мн. ч., м. р., 2-е л. (вы)', en: "plural, masc., 2nd person (you)", uz: "koʻplik, muz. jins, 2-shaxs (sizlar)", tj: "ҷамъ, муз., шахси 2 (шумо)" },
  { fa: 'واحِد مُؤَنَّث مُخاطَب',  ru: 'ед. ч., ж. р., 2-е л. (ты)', en: "sing., fem., 2nd person (you)", uz: "birlik, muan. jins, 2-shaxs (sen)", tj: "танҳо, муан., шахси 2 (ту)" },
  { fa: 'تَثْنِیَة مُؤَنَّث مُخاطَب', ru: 'дв. ч., ж. р., 2-е л. (вы вдвоём)', en: "dual, fem., 2nd person (you two)", uz: "ikkilik, muan. jins, 2-shaxs (siz ikkovingiz)", tj: "тасния, муан., шахси 2 (шумо ду нафар)" },
  { fa: 'جَمْع مُؤَنَّث مُخاطَب',  ru: 'мн. ч., ж. р., 2-е л. (вы)', en: "plural, fem., 2nd person (you)", uz: "koʻplik, muan. jins, 2-shaxs (sizlar)", tj: "ҷамъ, муан., шахси 2 (шумо)" },
  { fa: 'واحِد مُتَكَلِّم',       ru: 'ед. ч., 1-е л. (я)', en: "sing., 1st person (I)", uz: "birlik, 1-shaxs (men)", tj: "танҳо, шахси 1 (ман)" },
  { fa: 'مُتَكَلِّم مَعَ الْغَیْر',  ru: 'мн. ч., 1-е л. (мы)', en: "plural, 1st person (we)", uz: "koʻplik, 1-shaxs (biz)", tj: "ҷамъ, шахси 1 (мо)" },
];

// 14 форм в порядке книги для نهی / امر بلام مجهول: مخاطب (6) → غائب (6) → متكلّم (2)
const L14K: SarfText[] = [
  L14G[6], L14G[7], L14G[8], L14G[9], L14G[10], L14G[11],
  L14G[0], L14G[1], L14G[2], L14G[3], L14G[4], L14G[5],
  L14G[12], L14G[13],
];

// 8 форм для امر بلام معلوم: غائب (6) → متكلّم (2)
const L8: SarfText[] = [
  L14G[0], L14G[1], L14G[2], L14G[3], L14G[4], L14G[5], L14G[12], L14G[13],
];

// 6 форм причастий (اسم فاعل / اسم مفعول / اسم تفضیل): مذكّر (3) → مؤنّث (3)
const L6P: SarfText[] = [
  { fa: 'واحِد مُذَكَّر',  ru: 'ед. ч., м. р.', en: "sing., masc.", uz: "birlik, muz. jins", tj: "танҳо, муз." },
  { fa: 'تَثْنِیَة مُذَكَّر', ru: 'дв. ч., м. р.', en: "dual, masc.", uz: "ikkilik, muz. jins", tj: "тасния, муз." },
  { fa: 'جَمْع مُذَكَّر',  ru: 'мн. ч., м. р.', en: "plural, masc.", uz: "koʻplik, muz. jins", tj: "ҷамъ, муз." },
  { fa: 'واحِد مُؤَنَّث',  ru: 'ед. ч., ж. р.', en: "sing., fem.", uz: "birlik, muan. jins", tj: "танҳо, муан." },
  { fa: 'تَثْنِیَة مُؤَنَّث', ru: 'дв. ч., ж. р.', en: "dual, fem.", uz: "ikkilik, muan. jins", tj: "тасния, муан." },
  { fa: 'جَمْع مُؤَنَّث',  ru: 'мн. ч., ж. р.', en: "plural, fem.", uz: "koʻplik, muan. jins", tj: "ҷамъ, муан." },
];

// 6 форм امر حاضر (только مخاطب): مذكّر (3) → مؤنّث (3)
const L6A: SarfText[] = [
  { fa: 'واحِد مُذَكَّر مُخاطَب',  ru: 'ед. ч., м. р. (ты)', en: "sing., masc. (you)", uz: "birlik, muz. jins (sen)", tj: "танҳо, муз. (ту)" },
  { fa: 'تَثْنِیَة مُذَكَّر مُخاطَب', ru: 'дв. ч., м. р. (вы вдвоём)', en: "dual, masc. (you two)", uz: "ikkilik, muz. jins (siz ikkovingiz)", tj: "тасния, муз. (шумо ду нафар)" },
  { fa: 'جَمْع مُذَكَّر مُخاطَب',  ru: 'мн. ч., м. р. (вы)', en: "plural, masc. (you)", uz: "koʻplik, muz. jins (sizlar)", tj: "ҷамъ, муз. (шумо)" },
  { fa: 'واحِد مُؤَنَّث مُخاطَب',  ru: 'ед. ч., ж. р. (ты)', en: "sing., fem. (you)", uz: "birlik, muan. jins (sen)", tj: "танҳо, муан. (ту)" },
  { fa: 'تَثْنِیَة مُؤَنَّث مُخاطَب', ru: 'дв. ч., ж. р. (вы вдвоём)', en: "dual, fem. (you two)", uz: "ikkilik, muan. jins (siz ikkovingiz)", tj: "тасния, муан. (шумо ду нафар)" },
  { fa: 'جَمْع مُؤَنَّث مُخاطَب',  ru: 'мн. ч., ж. р. (вы)', en: "plural, fem. (you)", uz: "koʻplik, muan. jins (sizlar)", tj: "ҷамъ, муан. (шумо)" },
];

// 3 формы (اسم زمان/مكان, اسم آلت): واحد / تثنیه / جمع
const L3: SarfText[] = [
  { fa: 'واحِد',   ru: 'ед. ч.', en: "sing.", uz: "birlik", tj: "танҳо" },
  { fa: 'تَثْنِیَة', ru: 'дв. ч.', en: "dual", uz: "ikkilik", tj: "тасния" },
  { fa: 'جَمْع',   ru: 'мн. ч.', en: "plural", uz: "koʻplik", tj: "ҷамъ" },
];

// Хелпер: собрать парадигму из массивов форм / транслитераций / меток.
function mk(forms: string[], trs: string[], labels: SarfText[]): SarfSigha[] {
  return forms.map((ar, i) => ({ ar, tr: trs[i], label: labels[i] }));
}

// ============================================================================
// ДАННЫЕ
// ============================================================================

export const sarfSections: SarfSection[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // 0. ВВЕДЕНИЕ
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'intro',
    emoji: '📖',
    title: { fa: 'مُقَدِّمَه', ru: 'Введение', en: "Introduction", uz: "Kirish", tj: "Муқаддима" },
    intro: {
      fa: 'کِتاب بِدان یکی از کتاب‌های مشهور و قدیمی در علم صرف است که میان طلّاب و دانشمندان علوم دینی پیوسته مورد توجّه بوده است.',
      ru: '«Китаб Бидан» — один из самых известных и старинных учебников науки صرف (морфологии), издавна почитаемый среди учащихся и знатоков религиозных наук.',
      en: "\"Kitab Bidan\" is one of the most famous and ancient textbooks of the science of sarf (morphology), long held in esteem among students and scholars of the religious sciences.",
      uz: "\"Kitab Bidan\" sarf (morfologiya) ilmining eng mashhur va qadimiy darsliklaridan biri boʻlib, diniy ilmlar talabalari va olimlari orasida azaldan eʼtiborga molik boʻlib kelgan.",
      tj: "«Китоби Бидон» яке аз машҳуртарин ва қадимтарин китобҳои дарсии илми сарф (морфология) аст, ки дар миёни толибон ва олимони илмҳои динӣ аз қадим мавриди эҳтиром будааст.",
    },
    theory: [
      {
        ar: 'اَلصَّرْف',
        tr: 'aṣ-ṣarf',
        term: { fa: 'صرف', ru: 'Сарф (морфология)', en: "Sarf (morphology)", uz: "Sarf (morfologiya)", tj: "Сарф (морфология)" },
        def: {
          fa: 'صرف علمی است که از تغییر و گردانیدن یک کلمه به صیغه‌های گوناگون (ماضی، مضارع، امر، اسم فاعل و …) بحث می‌کند.',
          ru: 'Сарф — наука, изучающая изменение одного слова в различные формы (прошедшее, настоящее, повеление, причастие и т. д.) и их образование.',
          en: "Sarf is the science that studies the change of a single word into various forms (past, present, imperative, active participle, etc.) and their formation.",
          uz: "Sarf - bitta soʻzning turli shakllarga (oʻtgan zamon, hozirgi zamon, buyruq, aniq feʼl ismi va h.k.) oʻzgarishi va ularning yasalishini oʻrganadigan ilmdir.",
          tj: "Сарф илмест, ки оид ба тағйир ёфтани як калима ба шаклҳои гуногун (замони гузашта, замони ҳозира, амр, исми фоил ва ғ.) ва сохта шудани онҳо баҳс мекунад.",
        },
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ВИДЫ СЛОВ
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'kalimat',
    emoji: '🔤',
    title: { fa: 'کَلِماتِ عَرَب', ru: 'Виды слов в арабском', en: "Types of words in Arabic", uz: "Arab tilidagi soʻz turlari", tj: "Намудҳои калима дар забони арабӣ" },
    intro: {
      fa: 'بِدان (خداوند ترا در دو جهان سعادتمند گرداند) که کلمات عرب بر سه قسم است: اِسم، فِعل و حَرف.',
      ru: 'Знай (да дарует тебе Аллах счастье в обоих мирах), что слова арабского языка делятся на три вида: имя, глагол и частица.',
      en: "Know (may God grant you happiness in both worlds) that the words of the Arabic language are of three kinds: noun (ism), verb (fiʿl), and particle (harf).",
      uz: "Bilgin (Alloh seni ikki dunyoda baxtli qilsin) ki, arab tilining soʻzlari uch turga boʻlinadi: ism, feʼl va harf.",
      tj: "Бидон (Худованд туро дар ду ҷаҳон саодатманд гардонад), ки калимаҳои забони арабӣ ба се қисм тақсим мешаванд: исм, феъл ва ҳарф.",
    },
    theory: [
      {
        ar: 'اِسْم',
        tr: 'ism',
        term: { fa: 'اسم', ru: 'Имя (существительное)', en: "Noun (ism)", uz: "Ism (ot)", tj: "Исм (ном)" },
        def: {
          fa: 'کلمه‌ای است که دارای معنای مستقل است و برای نامیدن چیزی یا کسی به کار می‌رود و دلالت بر زمان نمی‌کند.',
          ru: 'Слово с самостоятельным значением, служащее для называния предмета или лица и не указывающее на время.',
          en: "A word with an independent meaning, used to name a thing or person, and not indicating time.",
          uz: "Mustaqil maʼnoga ega boʻlgan, biror narsa yoki shaxsni nomlash uchun ishlatiladigan va zamonga ishora qilmaydigan soʻz.",
          tj: "Калимаест, ки маънои мустақил дорад ва барои номидани чизе ё касе истифода мешавад ва ба замон далолат намекунад.",
        },
        examples: ['رَجُلٌ', 'الأَسَدُ', 'التِّلْمِیذُ', 'قَلَمٌ'],
      },
      {
        ar: 'فِعْل',
        tr: 'fiʿl',
        term: { fa: 'فعل', ru: 'Глагол', en: "Verb (fiʿl)", uz: "Feʼl", tj: "Феъл" },
        def: {
          fa: 'کلمه‌ای است که دارای معنای مستقل است و همراه با یکی از زمان‌های گذشته، حال یا آینده می‌باشد و صیغه‌ی مشخّص دارد.',
          ru: 'Слово с самостоятельным значением, связанное с одним из времён (прошедшим, настоящим или будущим) и имеющее определённую форму.',
          en: "A word with an independent meaning, associated with one of the tenses (past, present, or future) and having a definite form.",
          uz: "Mustaqil maʼnoga ega boʻlgan, zamonlardan biri (oʻtgan, hozirgi yoki kelasi) bilan bogʻliq va aniq shaklga ega boʻlgan soʻz.",
          tj: "Калимаест, ки маънои мустақил дорад ва бо яке аз замонҳо (гузашта, ҳозира ё оянда) алоқаманд буда, шакли муайян дорад.",
        },
        examples: ['ضَرَبَ', 'یَضْرِبُ', 'اِجْلِسْ'],
      },
      {
        ar: 'حَرْف',
        tr: 'ḥarf',
        term: { fa: 'حرف', ru: 'Частица (служебное слово)', en: "Particle (harf, function word)", uz: "Harf (yordamchi soʻz)", tj: "Ҳарф (калимаи ёрирасон)" },
        def: {
          fa: 'کلمه‌ای است که معنای مستقل ندارد و در جمله میان کلمات ارتباط معنایی برقرار می‌کند.',
          ru: 'Слово без самостоятельного значения, устанавливающее в предложении смысловую связь между словами.',
          en: "A word with no independent meaning that establishes a semantic link between words in a sentence.",
          uz: "Mustaqil maʼnoga ega boʻlmagan, gapda soʻzlar oʻrtasida maʼnoviy bogʻlanish oʻrnatadigan soʻz.",
          tj: "Калимаест, ки маънои мустақил надорад ва дар ҷумла миёни калимаҳо алоқаи маъноӣ барқарор мекунад.",
        },
        examples: ['مِنْ', 'عَنْ', 'فِي', 'قَدْ', 'سَوْفَ'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 2. РАЗРЯДЫ СЛОВА (по числу букв) + МИЗАН
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'taqsim',
    emoji: '🧩',
    title: { fa: 'تَقْسیمِ کَلِمَه و میزان', ru: 'Разряды слова и «весы» (мизан)', en: "Categories of words and the \"scale\" (mizan)", uz: "Soʻz turkumlari va \"tarozi\" (mizon)", tj: "Тақсимоти калима ва «тарозу» (мизон)" },
    theory: [
      {
        term: { fa: 'تقسیم اسم', ru: 'Разряды имени', en: "Categories of the noun", uz: "Ism turkumlari", tj: "Тақсимоти исм" },
        def: {
          fa: 'اسم بر سه قسم است: ثُلاثی (سه حرفی)، رُباعی (چهار حرفی) و خُماسی (پنج حرفی).',
          ru: 'Имя бывает трёх разрядов: трёхбуквенное (سُلاثي), четырёхбуквенное (رُباعي) и пятибуквенное (خُماسي).',
          en: "The noun is of three categories: triliteral (ثلاثي, three letters), quadriliteral (رباعي, four letters), and quinqueliteral (خماسي, five letters).",
          uz: "Ism uch turkumga boʻlinadi: uch harfli (ثلاثي), toʻrt harfli (رباعي) va besh harfli (خماسي).",
          tj: "Исм ба се қисм тақсим мешавад: сеҳарфа (ثلاثي), чорҳарфа (رباعي) ва панҷҳарфа (خماسي).",
        },
        examples: ['زَیْدٌ — ثلاثی', 'جَعْفَرٌ — رباعی', 'سَفَرْجَلٌ — خماسی'],
      },
      {
        term: { fa: 'تقسیم فعل', ru: 'Разряды глагола', en: "Categories of the verb", uz: "Feʼl turkumlari", tj: "Тақсимоти феъл" },
        def: {
          fa: 'فعل بر دو قسم است: ثُلاثی (سه حرفی) و رُباعی (چهار حرفی).',
          ru: 'Глагол бывает двух разрядов: трёхбуквенный (ثلاثي) и четырёхбуквенный (رباعي).',
          en: "The verb is of two categories: triliteral (ثلاثي, three letters) and quadriliteral (رباعي, four letters).",
          uz: "Feʼl ikki turkumga boʻlinadi: uch harfli (ثلاثي) va toʻrt harfli (رباعي).",
          tj: "Феъл ба ду қисм тақсим мешавад: сеҳарфа (ثلاثي) ва чорҳарфа (رباعي).",
        },
        examples: ['ضَرَبَ — ثلاثی', 'دَحْرَجَ — رباعی'],
      },
      {
        ar: 'فَعَلَ',
        tr: 'faʿala',
        term: { fa: 'میزان', ru: 'Мизан («весы», шаблон слова)', en: "Mizan (\"scale\", word pattern)", uz: "Mizon (\"tarozi\", soʻz qolipi)", tj: "Мизон («тарозу», қолаби калима)" },
        def: {
          fa: 'میزانِ کلمه‌ی عرب «فاء و عین و لام» است؛ یعنی هر سه حرفِ اصلیِ کلمه را با فاء‌الفعل، عین‌الفعل و لام‌الفعل می‌سنجند.',
          ru: 'Образец арабского слова — это «فاء، عين، لام». Три коренные буквы слова соотносят с فاء (1-я), عين (2-я) и لام (3-я) корня.',
          en: "The pattern of an Arabic word is \"fa, ʿayn, lam\"; that is, the three root letters of a word are measured against the fa (1st), ʿayn (2nd), and lam (3rd) of the root.",
          uz: "Arab soʻzining qolipi \"fa, ayn, lom\" dir; yaʼni soʻzning uchta oʻzak harfi oʻzakning fa (1-chi), ayn (2-chi) va lom (3-chi) harflari bilan oʻlchanadi.",
          tj: "Қолаби калимаи арабӣ «фо, айн, лом» аст; яъне се ҳарфи аслии калимаро бо фо (1-ум), айн (2-ум) ва ломи (3-юми) реша месанҷанд.",
        },
        examples: ['ضَرَبَ ⟵ فَعَلَ', 'ض=ف، ر=ع، ب=ل'],
      },
      {
        term: { fa: 'حرف اصلی و زائد', ru: 'Коренная и добавочная буквы', en: "Root and additional letters", uz: "Oʻzak va qoʻshimcha harflar", tj: "Ҳарфҳои аслӣ ва зиёдатӣ" },
        def: {
          fa: 'حرف اصلی آن است که در مقابل فاء و عین و لام قرار می‌گیرد؛ حرف زائد آن است که افزون بر حروف اصلی باشد.',
          ru: 'Коренная буква (أصلي) — та, что соответствует فاء/عين/لام; добавочная (زائد) — та, что прибавлена сверх коренных.',
          en: "A root letter (أصلي) is one that corresponds to fa/ʿayn/lam; an additional letter (زائد) is one added beyond the root letters.",
          uz: "Oʻzak harf (أصلي) - fa/ayn/lomga mos keladigan harf; qoʻshimcha harf (زائد) - oʻzak harflar ustiga qoʻshilgan harf.",
          tj: "Ҳарфи аслӣ (أصلي) он аст, ки ба фо/айн/лом мувофиқ меояд; ҳарфи зиёдатӣ (زائد) он аст, ки илова бар ҳарфҳои аслӣ омадааст.",
        },
        examples: ['ضَرَبَ بر وزن فَعَلَ (همه اصلی)', 'أَكْرَمَ بر وزن أَفْعَلَ (همزه زائد)'],
      },
      {
        term: { fa: 'مجرّد و مزید', ru: 'Чистый (مجرّد) и расширенный (مزید)', en: "Bare (mujarrad) and augmented (mazid)", uz: "Sof (mujarrad) va orttirilgan (mazid)", tj: "Холис (муҷаррад) ва афзуда (мазид)" },
        def: {
          fa: 'مُجَرَّد آن است که بر حروف اصلی چیزی افزوده نشده باشد؛ مَزید آن است که بر حروف اصلی حرف یا حروفی افزوده شده باشد. این تقسیم در ثلاثی، رباعی و خماسی جاری است.',
          ru: 'Чистый (مجرّد) — без добавочных букв сверх коренных; расширенный (مزید) — с добавочными буквами. Это деление действует в трёх-, четырёх- и пятибуквенных словах.',
          en: "The bare form (مجرّد) has nothing added beyond the root letters; the augmented form (مزید) has one or more letters added to the root letters. This division applies to triliteral, quadriliteral, and quinqueliteral words.",
          uz: "Sof shakl (مجرّد) - oʻzak harflarga hech narsa qoʻshilmagani; orttirilgan shakl (مزید) - oʻzak harflarga bir yoki bir necha harf qoʻshilgani. Bu boʻlinish uch, toʻrt va besh harfli soʻzlarda amal qiladi.",
          tj: "Холис (مجرّد) он аст, ки бар ҳарфҳои аслӣ чизе афзуда нашудааст; афзуда (مزید) он аст, ки бар ҳарфҳои аслӣ як ё якчанд ҳарф илова шудааст. Ин тақсимот дар сеҳарфа, чорҳарфа ва панҷҳарфа ҷорӣ аст.",
        },
        examples: ['ضَرَبَ (ثلاثی مجرّد)', 'أَكْرَمَ (ثلاثی مزید)', 'دَحْرَجَ (رباعی مجرّد)', 'تَدَحْرَجَ (رباعی مزید)'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 3. ТИПЫ КОРНЕЙ (صحیح / معتل / مهموز / مضاعف)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'aqsam',
    emoji: '🗂️',
    title: { fa: 'اَقسامِ صحیح و مُعتَل', ru: 'Типы глаголов: правильные и слабые', en: "Types of verbs: sound and weak", uz: "Feʼl turlari: sogʻlom va illatli", tj: "Намудҳои феъл: саҳеҳ ва муътал" },
    intro: {
      fa: 'اقسام اسم و فعل از این هفت قسم بیرون نیست: صحیح، مُضاعَف، مِثال، اَجوَف، ناقِص، لَفیف و مُلتَوی. (همچنین مهموز.)',
      ru: 'Имя и глагол не выходят за пределы семи типов: правильный, удвоенный, подобный, полый, недостаточный, «обвитый» и «свитый» (а также «хамзованный»).',
      en: "Nouns and verbs do not go beyond these seven types: sound, doubled, assimilated, hollow, defective, \"wrapped\", and \"twined\" (as well as \"hamzated\").",
      uz: "Ism va feʼl quyidagi yetti turdan tashqariga chiqmaydi: sogʻlom, qoʻsh undoshli, misol, oʻrtasi illatli, oxiri illatli, lafif va multaviy (shuningdek, hamzali).",
      tj: "Исм ва феъл аз ин ҳафт қисм берун нест: саҳеҳ, музоъаф, мисол, аҷваф, ноқис, лафиф ва мултавӣ (ҳамчунин маҳмуз).",
    },
    theory: [
      {
        ar: 'حُرُوفُ الْعِلَّة: و ا ي',
        term: { fa: 'حروف علّت', ru: 'Слабые буквы (حروف العلّة)', en: "Weak letters (huruf al-ʿilla)", uz: "Illat harflari (huruf al-illa)", tj: "Ҳарфҳои иллат (ҳуруф-ул-илла)" },
        def: {
          fa: 'حروف علّت سه‌اند: واو، الف و یاء. هرگاه یکی از این‌ها در کلمه باشد، آن کلمه «معتلّ» نامیده می‌شود.',
          ru: 'Слабых букв три: و (вав), ا (алиф) и ي (йа). Если одна из них есть в слове, такое слово называется «слабым» (مُعتَلّ).',
          en: "There are three weak letters: و (waw), ا (alif), and ي (ya). When one of them is in a word, that word is called \"weak\" (muʿtall).",
          uz: "Illat harflari uchta: و (vov), ا (alif) va ي (yo). Bulardan biri soʻzda boʻlsa, u soʻz \"illatli\" (muʼtall) deb ataladi.",
          tj: "Ҳарфҳои иллат сетоянд: و (вов), ا (алиф) ва ي (йо). Ҳар гоҳ яке аз инҳо дар калима бошад, он калима «муътал» номида мешавад.",
        },
        examples: ['و — ا — ي'],
      },
      {
        ar: 'صَحِیْح',
        tr: 'ṣaḥīḥ',
        term: { fa: 'صحیح', ru: 'Правильный (صحيح)', en: "Sound (sahih)", uz: "Sogʻlom (sahih)", tj: "Саҳеҳ (солим)" },
        def: {
          fa: 'آن است که در مقابل فاء و عین و لامِ آن حرف علّت نباشد و دو حرف از یک جنس نباشد.',
          ru: 'Тот, у которого ни одна из коренных (فاء/عين/لام) не является слабой буквой и нет двух одинаковых коренных подряд.',
          en: "One in which none of the root letters (fa/ʿayn/lam) is a weak letter and there are no two identical root letters together.",
          uz: "Uning oʻzak harflaridan (fa/ayn/lom) birortasi illat harfi boʻlmagan va bir jinsdagi ikkita harf boʻlmagan soʻz.",
          tj: "Он аст, ки ҳеҷ як аз ҳарфҳои аслии он (фо/айн/лом) ҳарфи иллат набошад ва ду ҳарфи ҳамҷинс набошад.",
        },
        examples: ['ضَرْبٌ — ضَرَبَ'],
      },
      {
        ar: 'مُضَاعَف',
        tr: 'muḍāʿaf',
        term: { fa: 'مضاعف', ru: 'Удвоенный (مضاعف)', en: "Doubled (mudaʿaf)", uz: "Qoʻsh undoshli (muzoaf)", tj: "Музоъаф (дучанда)" },
        def: {
          fa: 'آن است که در مقابل عین و لام (در ثلاثی) دو حرف از یک جنس باشد.',
          ru: 'Тот, у которого вторая и третья коренные (عين и لام) — две одинаковые буквы.',
          en: "One in which the second and third root letters (ʿayn and lam) are two identical letters.",
          uz: "Ikkinchi va uchinchi oʻzak harflari (ayn va lom) bir xil ikkita harf boʻlgan soʻz.",
          tj: "Он аст, ки ҳарфи дуюм ва сеюми реша (айн ва лом) ду ҳарфи якхела бошанд.",
        },
        examples: ['فَرَّ (در اصل فَرَرَ)', 'صَرْصَرَ (رباعی)'],
      },
      {
        ar: 'مَهْمُوز',
        tr: 'mahmūz',
        term: { fa: 'مهموز', ru: 'Хамзованный (مهموز)', en: "Hamzated (mahmuz)", uz: "Hamzali (mahmuz)", tj: "Маҳмуз (ҳамзадор)" },
        def: {
          fa: 'آن است که یکی از حروف اصلی آن همزه باشد: مهموزالفاء، مهموزالعین یا مهموزاللام.',
          ru: 'Тот, у которого одна из коренных — хамза: по 1-й (الفاء), 2-й (العين) или 3-й (اللام) коренной.',
          en: "One in which one of the root letters is a hamza: in the 1st (al-fa), 2nd (al-ʿayn), or 3rd (al-lam) root.",
          uz: "Oʻzak harflaridan biri hamza boʻlgan soʻz: 1-chi (al-fa), 2-chi (al-ayn) yoki 3-chi (al-lom) oʻzak boʻyicha.",
          tj: "Он аст, ки яке аз ҳарфҳои аслии он ҳамза бошад: дар реша 1-ум (ал-фо), 2-ум (ал-айн) ё 3-юм (ал-лом).",
        },
        examples: ['أَخَذَ (مهموزالفاء)', 'سَأَلَ (مهموزالعین)', 'قَرَأَ (مهموزاللام)'],
      },
      {
        ar: 'مِثَال',
        tr: 'mithāl',
        term: { fa: 'مثال', ru: 'Подобный (مثال)', en: "Assimilated (mithal)", uz: "Misol", tj: "Мисол" },
        def: {
          fa: 'آن است که در مقابل فاء، حرف علّت باشد.',
          ru: 'Тот, у которого первая коренная (فاء) — слабая буква.',
          en: "One in which the first root letter (fa) is a weak letter.",
          uz: "Birinchi oʻzak harfi (fa) illat harfi boʻlgan soʻz.",
          tj: "Он аст, ки ҳарфи якуми реша (фо) ҳарфи иллат бошад.",
        },
        examples: ['وَعَدَ', 'وَعْدٌ'],
      },
      {
        ar: 'أَجْوَف',
        tr: 'ajwaf',
        term: { fa: 'اجوف', ru: 'Полый (أجوف)', en: "Hollow (ajwaf)", uz: "Oʻrtasi illatli (ajvaf)", tj: "Аҷваф (миёнхолӣ)" },
        def: {
          fa: 'آن است که در مقابل عین، حرف علّت باشد.',
          ru: 'Тот, у которого вторая коренная (عين) — слабая буква.',
          en: "One in which the second root letter (ʿayn) is a weak letter.",
          uz: "Ikkinchi oʻzak harfi (ayn) illat harfi boʻlgan soʻz.",
          tj: "Он аст, ки ҳарфи дуюми реша (айн) ҳарфи иллат бошад.",
        },
        examples: ['قَالَ (قَوَلَ)', 'قَوْلٌ'],
      },
      {
        ar: 'نَاقِص',
        tr: 'nāqiṣ',
        term: { fa: 'ناقص', ru: 'Недостаточный (ناقص)', en: "Defective (naqis)", uz: "Oxiri illatli (noqis)", tj: "Ноқис" },
        def: {
          fa: 'آن است که در مقابل لام، حرف علّت باشد.',
          ru: 'Тот, у которого третья коренная (لام) — слабая буква.',
          en: "One in which the third root letter (lam) is a weak letter.",
          uz: "Uchinchi oʻzak harfi (lom) illat harfi boʻlgan soʻz.",
          tj: "Он аст, ки ҳарфи сеюми реша (лом) ҳарфи иллат бошад.",
        },
        examples: ['رَمَى (رَمَيَ)', 'رَمْيٌ'],
      },
      {
        ar: 'لَفِیْف',
        tr: 'lafīf',
        term: { fa: 'لفیف', ru: 'Обвитый (لفيف)', en: "Wrapped (lafif)", uz: "Lafif", tj: "Лафиф" },
        def: {
          fa: 'آن است که در مقابل عین و لام، هر دو حرف علّت باشد.',
          ru: 'Тот, у которого вторая и третья коренные (عين и لام) — обе слабые буквы.',
          en: "One in which the second and third root letters (ʿayn and lam) are both weak letters.",
          uz: "Ikkinchi va uchinchi oʻzak harflari (ayn va lom) ikkalasi ham illat harfi boʻlgan soʻz.",
          tj: "Он аст, ки ҳарфи дуюм ва сеюми реша (айн ва лом) ҳар ду ҳарфи иллат бошанд.",
        },
        examples: ['قَوِيَ', 'قُوّةٌ'],
      },
      {
        ar: 'مُلْتَوِي',
        tr: 'multawī',
        term: { fa: 'ملتوی', ru: 'Свитый (ملتوي)', en: "Twined (multawi)", uz: "Multaviy", tj: "Мултавӣ" },
        def: {
          fa: 'آن است که در مقابل فاء و لام، هر دو حرف علّت باشد.',
          ru: 'Тот, у которого первая и третья коренные (فاء и لام) — обе слабые буквы.',
          en: "One in which the first and third root letters (fa and lam) are both weak letters.",
          uz: "Birinchi va uchinchi oʻzak harflari (fa va lom) ikkalasi ham illat harfi boʻlgan soʻz.",
          tj: "Он аст, ки ҳарфи якум ва сеюми реша (фо ва лом) ҳар ду ҳарфи иллат бошанд.",
        },
        examples: ['وَشَى', 'وَشْيٌ'],
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ДЕРИВАЦИЯ (اشتقاق) — 12 производных + термины лица/рода/числа
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'ishtiqaq',
    emoji: '🌱',
    title: { fa: 'اِشتِقاق و اقسامِ فعل', ru: 'Деривация (12 производных)', en: "Derivation (12 derivatives)", uz: "Soʻz yasalishi (12 hosila)", tj: "Иштиқоқ (12 ҳосила)" },
    intro: {
      fa: 'اِسمِ مصدر آن است که از وی چیزی اشتقاق (مشتق شدن) می‌شود. عرب از هر مصدری دوازده چیز اشتقاق می‌کند.',
      ru: 'Масдар (отглагольное имя) — то, от чего производятся другие формы. Из каждого масдара арабы образуют двенадцать производных.',
      en: "The masdar (verbal noun) is that from which other forms are derived. From each masdar the Arabs derive twelve forms.",
      uz: "Masdar (harakat nomi) - undan boshqa shakllar yasaladigan asosdir. Arablar har bir masdardan oʻn ikkita hosila yasaydi.",
      tj: "Масдар (исми феълӣ) он аст, ки аз он шаклҳои дигар сохта мешаванд. Арабҳо аз ҳар масдар дувоздаҳ ҳосила месозанд.",
    },
    theory: [
      {
        term: { fa: 'مصدر', ru: 'Масдар (отглагольное имя)', en: "Masdar (verbal noun)", uz: "Masdar (harakat nomi)", tj: "Масдар (исми феълӣ)" },
        def: {
          fa: 'اصل و ریشه‌ای که دوازده مشتق از آن گرفته می‌شود؛ مانند: الضَّرْب (زدن)، القَتْل (کشتن).',
          ru: 'Корневая основа, от которой образуются 12 производных; например: الضَّرْب (битьё), القَتْل (убийство).',
          en: "The root base from which the 12 derivatives are formed; e.g.: al-darb (beating), al-qatl (killing).",
          uz: "12 ta hosila undan yasaladigan oʻzak asos; masalan: ad-darb (urish), al-qatl (oʻldirish).",
          tj: "Реша ва асосе, ки 12 ҳосила аз он гирифта мешавад; масалан: аз-зарб (задан), ал-қатл (куштан).",
        },
        examples: ['الضَّرْبُ', 'القَتْلُ'],
      },
      {
        ar: 'مَاضِي',
        term: { fa: 'ماضی', ru: '1) Прошедшее время', en: "1) Past tense", uz: "1) Oʻtgan zamon", tj: "1) Замони гузашта" },
        def: { fa: 'زمان گذشته را گویند.', ru: 'Действие в прошедшем времени.', en: "An action in the past tense.", uz: "Oʻtgan zamondagi harakat.", tj: "Амал дар замони гузашта." },
        examples: ['ضَرَبَ — ударил'],
      },
      {
        ar: 'مُضَارِع',
        term: { fa: 'مضارع', ru: '2) Настояще-будущее время', en: "2) Present-future tense", uz: "2) Hozirgi-kelasi zamon", tj: "2) Замони ҳозира-оянда" },
        def: { fa: 'زمان حال و آینده را گویند.', ru: 'Действие в настоящем/будущем времени.', en: "An action in the present/future tense.", uz: "Hozirgi/kelasi zamondagi harakat.", tj: "Амал дар замони ҳозира/оянда." },
        examples: ['یَضْرِبُ — бьёт / будет бить'],
      },
      {
        ar: 'اِسْمُ الْفَاعِل',
        term: { fa: 'اسم فاعل', ru: '3) Имя действующего (действ. причастие)', en: "3) Active participle (ism al-faʿil)", uz: "3) Aniq feʼl ismi (ism al-foil)", tj: "3) Исми фоил (сифати феълии фоилӣ)" },
        def: { fa: 'نام کننده‌ی کار را گویند.', ru: 'Название того, кто совершает действие.', en: "The name of the one who performs the action.", uz: "Harakatni bajaruvchining nomi.", tj: "Номи касе, ки амалро иҷро мекунад." },
        examples: ['ضَارِبٌ — бьющий'],
      },
      {
        ar: 'اِسْمُ الْمَفْعُول',
        term: { fa: 'اسم مفعول', ru: '4) Имя претерпевающего (страд. причастие)', en: "4) Passive participle (ism al-mafʿul)", uz: "4) Majhul feʼl ismi (ism al-mafʼul)", tj: "4) Исми мафъул (сифати феълии мафъулӣ)" },
        def: { fa: 'نام کرده‌شده را گویند.', ru: 'Название того, над кем совершено действие.', en: "The name of the one upon whom the action is performed.", uz: "Harakat ustida bajarilgan narsaning nomi.", tj: "Номи касе, ки амал бар ӯ иҷро шудааст." },
        examples: ['مَضْرُوبٌ — побитый'],
      },
      {
        ar: 'جَحْد',
        term: { fa: 'جحد', ru: '5) Отрицание прошедшего (جحد)', en: "5) Negation of the past (jahd)", uz: "5) Oʻtgan zamon inkori (jahd)", tj: "5) Инкори гузашта (ҷаҳд)" },
        def: { fa: 'انکار ماضی (با «لم»).', ru: 'Отрицание прошедшего действия (через لَمْ + усечённый мудари‘).', en: "Negation of a past action (via lam + jussive mudariʿ).", uz: "Oʻtgan zamondagi harakatning inkori (lam + jazm holatidagi muzore orqali).", tj: "Инкори амали гузашта (бо лам + музореи маҷзум)." },
        examples: ['لَمْ یَضْرِبْ — он не ударил'],
      },
      {
        ar: 'نَفْي',
        term: { fa: 'نفی', ru: '6) Отрицание будущего (نفي)', en: "6) Negation of the future (nafy)", uz: "6) Kelasi zamon inkori (nafy)", tj: "6) Инкори оянда (нафй)" },
        def: { fa: 'انکار مستقبل (با «لا»).', ru: 'Отрицание настоящего/будущего (через لَا + мудари‘).', en: "Negation of the present/future (via la + mudariʿ).", uz: "Hozirgi/kelasi zamonning inkori (la + muzore orqali).", tj: "Инкори ҳозира/оянда (бо ло + музореъ)." },
        examples: ['لَا یَضْرِبُ — он не бьёт / не будет бить'],
      },
      {
        ar: 'أَمْر',
        term: { fa: 'امر', ru: '7) Повеление (амр)', en: "7) Imperative (amr)", uz: "7) Buyruq (amr)", tj: "7) Амр (фармон)" },
        def: { fa: 'فرمودن.', ru: 'Приказ, повеление.', en: "A command, an order.", uz: "Buyruq, amr.", tj: "Фармон, амр." },
        examples: ['اِضْرِبْ — бей!'],
      },
      {
        ar: 'نَهْي',
        term: { fa: 'نهی', ru: '8) Запрет (нахй)', en: "8) Prohibition (nahy)", uz: "8) Taqiq (nahy)", tj: "8) Наҳй (манъ)" },
        def: { fa: 'بازداشتن.', ru: 'Запрещение действия.', en: "Prohibition of an action.", uz: "Harakatni taqiqlash.", tj: "Манъ кардани амал." },
        examples: ['لَا تَضْرِبْ — не бей!'],
      },
      {
        ar: 'اِسْمُ الزَّمَان',
        term: { fa: 'اسم زمان', ru: '9) Имя времени', en: "9) Noun of time (ism al-zaman)", uz: "9) Zamon ismi (ism az-zamon)", tj: "9) Исми замон" },
        def: { fa: 'نام وقتِ کردنِ کاری.', ru: 'Название времени совершения действия.', en: "The name of the time of an action.", uz: "Harakat bajariladigan vaqtning nomi.", tj: "Номи вақти иҷрои амал." },
        examples: ['مَضْرِبٌ — время битья'],
      },
      {
        ar: 'اِسْمُ الْمَكَان',
        term: { fa: 'اسم مکان', ru: '10) Имя места', en: "10) Noun of place (ism al-makan)", uz: "10) Joy ismi (ism al-makon)", tj: "10) Исми макон" },
        def: { fa: 'نام جای کردنِ کاری.', ru: 'Название места совершения действия.', en: "The name of the place of an action.", uz: "Harakat bajariladigan joyning nomi.", tj: "Номи ҷои иҷрои амал." },
        examples: ['مَضْرِبٌ — место битья'],
      },
      {
        ar: 'اِسْمُ الْآلَة',
        term: { fa: 'اسم آلت', ru: '11) Имя орудия', en: "11) Noun of instrument (ism al-ala)", uz: "11) Qurol ismi (ism al-ola)", tj: "11) Исми олат" },
        def: { fa: 'نام آنچه کار با وی کنند.', ru: 'Название орудия, которым совершают действие.', en: "The name of the instrument with which an action is performed.", uz: "Harakat bajariladigan qurolning nomi.", tj: "Номи асбобе, ки бо он амал иҷро мешавад." },
        examples: ['مِضْرَابٌ — орудие для битья'],
      },
      {
        ar: 'اِسْمُ التَّفْضِیل',
        term: { fa: 'اسم تفضیل', ru: '12) Имя превосходства (элатив)', en: "12) Noun of preference (elative, ism al-tafdil)", uz: "12) Orttirma ism (ism at-tafzil)", tj: "12) Исми тафзил (дараҷаи олӣ)" },
        def: { fa: 'نام بهتر (برتر).', ru: 'Название превосходящего в качестве/действии.', en: "The name of what surpasses in a quality or action.", uz: "Sifat yoki harakatda ustun boʻlganning nomi.", tj: "Номи касе, ки дар сифат ё амал бартарӣ дорад." },
        examples: ['أَضْرَبُ — более бьющий'],
      },
      {
        term: { fa: 'اصطلاحاتِ صیغه', ru: 'Термины формы (лицо / число / род)', en: "Form terms (person / number / gender)", uz: "Shakl atamalari (shaxs / son / jins)", tj: "Истилоҳоти шакл (шахс / шумора / ҷинс)" },
        def: {
          fa: 'واحِد: یک. تَثنیه: دو. جَمع: زیاده از دو. مُتَکَلِّم: گوینده. مُخاطَب: آن‌که با وی سخن گویند. غائِب: آن‌که از وی سخن گویند. مُذَکَّر: مرد. مُؤَنَّث: زن.',
          ru: 'واحد — единственное; تثنیه — двойственное; جمع — множественное (больше двух). متكلّم — говорящий (1-е л.); مخاطب — собеседник (2-е л.); غائب — отсутствующий (3-е л.). مذكّر — мужской род; مؤنّث — женский род.',
          en: "wahid - singular; tathniya - dual; jamʿ - plural (more than two). mutakallim - the speaker (1st person); mukhatab - the addressee (2nd person); ghaʾib - the absent one (3rd person). mudhakkar - masculine gender; muʾannath - feminine gender.",
          uz: "vohid - birlik; tasniya - ikkilik; jamʼ - koʻplik (ikkidan koʻp). mutakallim - soʻzlovchi (1-shaxs); muxotab - tinglovchi (2-shaxs); gʻoyib - hozir boʻlmagan (3-shaxs). muzakkar - muzakkar jins; muannas - muannas jins.",
          tj: "воҳид - танҳо; тасния - дугона; ҷамъ - ҷамъ (зиёда аз ду). мутакаллим - гӯянда (шахси 1); мухотаб - шунаванда (шахси 2); ғоиб - касе, ки ҳозир нест (шахси 3). музаккар - ҷинси мардона; муаннас - ҷинси занона.",
        },
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 5. ПРОШЕДШЕЕ ВРЕМЯ (الماضي) — действит. + страдат.
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'madi',
    emoji: '⏮️',
    title: { fa: 'تَصریفِ ماضی', ru: 'Спряжение прошедшего времени', en: "Conjugation of the past tense", uz: "Oʻtgan zamon tuslanishi", tj: "Тасрифи замони гузашта" },
    paradigms: [
      {
        key: 'madi_maloom',
        ar: 'مَعْلُوم فِعْل مَاضِي',
        title: { fa: 'ماضیِ معلوم', ru: 'Прошедшее, действительный залог', en: "Past, active voice", uz: "Oʻtgan zamon, aniq nisbat", tj: "Гузашта, навъи маълум (фоилӣ)" },
        gloss: { fa: 'زد', ru: 'ударил (соверш. действие)', en: "struck (completed action)", uz: "urdi (tugallangan harakat)", tj: "зад (амали анҷомёфта)" },
        sighas: mk(
          ['ضَرَبَ', 'ضَرَبَا', 'ضَرَبُوا', 'ضَرَبَتْ', 'ضَرَبَتَا', 'ضَرَبْنَ',
           'ضَرَبْتَ', 'ضَرَبْتُمَا', 'ضَرَبْتُمْ', 'ضَرَبْتِ', 'ضَرَبْتُمَا', 'ضَرَبْتُنَّ',
           'ضَرَبْتُ', 'ضَرَبْنَا'],
          ['ḍaraba', 'ḍarabā', 'ḍarabū', 'ḍarabat', 'ḍarabatā', 'ḍarabna',
           'ḍarabta', 'ḍarabtumā', 'ḍarabtum', 'ḍarabti', 'ḍarabtumā', 'ḍarabtunna',
           'ḍarabtu', 'ḍarabnā'],
          L14G,
        ),
      },
      {
        key: 'madi_majhool',
        ar: 'مَجْهُول فِعْل مَاضِي',
        title: { fa: 'ماضیِ مجهول', ru: 'Прошедшее, страдательный залог', en: "Past, passive voice", uz: "Oʻtgan zamon, majhul nisbat", tj: "Гузашта, навъи маҷҳул (мафъулӣ)" },
        gloss: { fa: 'زده شد', ru: 'был побит', en: "was struck", uz: "urildi", tj: "зада шуд" },
        rule: {
          fa: 'برای مجهول‌کردنِ ماضیِ معلوم، ماقبلِ آخر را کسره ده و هر متحرّکِ پیش از آن را ضمّه ده: ضَرَبَ ← ضُرِبَ.',
          ru: 'Чтобы образовать страдательный залог прошедшего: предпоследней букве — кясру, всем подвижным буквам перед ней — дамму. ضَرَبَ → ضُرِبَ.',
          en: "To form the passive of the past tense: give the second-to-last letter a kasra, and every vowelled letter before it a damma: daraba -> duriba.",
          uz: "Oʻtgan zamonni majhulga aylantirish uchun: oxiridan oldingi harfga kasra, undan oldingi har bir harakatli harfga zamma bering: daraba -> duriba.",
          tj: "Барои маҷҳул кардани гузаштаи маълум: ба ҳарфи пеш аз охир касра ва ба ҳар ҳарфи мутаҳаррики пеш аз он замма деҳ: зараба -> зуриба.",
        },
        sighas: mk(
          ['ضُرِبَ', 'ضُرِبَا', 'ضُرِبُوا', 'ضُرِبَتْ', 'ضُرِبَتَا', 'ضُرِبْنَ',
           'ضُرِبْتَ', 'ضُرِبْتُمَا', 'ضُرِبْتُمْ', 'ضُرِبْتِ', 'ضُرِبْتُمَا', 'ضُرِبْتُنَّ',
           'ضُرِبْتُ', 'ضُرِبْنَا'],
          ['ḍuriba', 'ḍuribā', 'ḍuribū', 'ḍuribat', 'ḍuribatā', 'ḍuribna',
           'ḍuribta', 'ḍuribtumā', 'ḍuribtum', 'ḍuribti', 'ḍuribtumā', 'ḍuribtunna',
           'ḍuribtu', 'ḍuribnā'],
          L14G,
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 6. НАСТОЯЩЕ-БУДУЩЕЕ (المضارع) — действит. + страдат.
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'mudari',
    emoji: '⏭️',
    title: { fa: 'تَصریفِ مضارع', ru: 'Спряжение настояще-будущего', en: "Conjugation of the present-future", uz: "Hozirgi-kelasi zamon tuslanishi", tj: "Тасрифи замони ҳозира-оянда" },
    paradigms: [
      {
        key: 'mudari_maloom',
        ar: 'مَعْلُوم فِعْل مُضَارِع',
        title: { fa: 'مضارعِ معلوم', ru: 'Настояще-будущее, действительный залог', en: "Present-future, active voice", uz: "Hozirgi-kelasi zamon, aniq nisbat", tj: "Ҳозира-оянда, навъи маълум (фоилӣ)" },
        gloss: { fa: 'می‌زند', ru: 'бьёт / будет бить', en: "strikes / will strike", uz: "uradi / uradigan boʻladi", tj: "мезанад / хоҳад зад" },
        sighas: mk(
          ['یَضْرِبُ', 'یَضْرِبَانِ', 'یَضْرِبُونَ', 'تَضْرِبُ', 'تَضْرِبَانِ', 'یَضْرِبْنَ',
           'تَضْرِبُ', 'تَضْرِبَانِ', 'تَضْرِبُونَ', 'تَضْرِبِیْنَ', 'تَضْرِبَانِ', 'تَضْرِبْنَ',
           'أَضْرِبُ', 'نَضْرِبُ'],
          ['yaḍribu', 'yaḍribāni', 'yaḍribūna', 'taḍribu', 'taḍribāni', 'yaḍribna',
           'taḍribu', 'taḍribāni', 'taḍribūna', 'taḍribīna', 'taḍribāni', 'taḍribna',
           'aḍribu', 'naḍribu'],
          L14G,
        ),
      },
      {
        key: 'mudari_majhool',
        ar: 'مَجْهُول فِعْل مُضَارِع',
        title: { fa: 'مضارعِ مجهول', ru: 'Настояще-будущее, страдательный залог', en: "Present-future, passive voice", uz: "Hozirgi-kelasi zamon, majhul nisbat", tj: "Ҳозира-оянда, навъи маҷҳул (мафъулӣ)" },
        gloss: { fa: 'زده می‌شود', ru: '(будет) побит', en: "is (being) struck / will be struck", uz: "urilmoqda / uriladi", tj: "зада мешавад" },
        rule: {
          fa: 'برای مجهول‌کردنِ مضارعِ معلوم، ماقبلِ آخر را فتحه ده و حرفِ مضارعت را ضمّه ده: یَضْرِبُ ← یُضْرَبُ.',
          ru: 'Чтобы образовать страдательный залог настоящего: предпоследней букве — фатху, приставочной букве — дамму. یَضْرِبُ → یُضْرَبُ.',
          en: "To form the passive of the present tense: give the second-to-last letter a fatha and the prefix letter a damma: yadribu -> yudrabu.",
          uz: "Hozirgi zamonni majhulga aylantirish uchun: oxiridan oldingi harfga fatha va old qoʻshimcha harfiga zamma bering: yadribu -> yudrabu.",
          tj: "Барои маҷҳул кардани ҳозираи маълум: ба ҳарфи пеш аз охир фатҳа ва ба ҳарфи музораъат замма деҳ: язрибу -> юзрабу.",
        },
        sighas: mk(
          ['یُضْرَبُ', 'یُضْرَبَانِ', 'یُضْرَبُونَ', 'تُضْرَبُ', 'تُضْرَبَانِ', 'یُضْرَبْنَ',
           'تُضْرَبُ', 'تُضْرَبَانِ', 'تُضْرَبُونَ', 'تُضْرَبِیْنَ', 'تُضْرَبَانِ', 'تُضْرَبْنَ',
           'أُضْرَبُ', 'نُضْرَبُ'],
          ['yuḍrabu', 'yuḍrabāni', 'yuḍrabūna', 'tuḍrabu', 'tuḍrabāni', 'yuḍrabna',
           'tuḍrabu', 'tuḍrabāni', 'tuḍrabūna', 'tuḍrabīna', 'tuḍrabāni', 'tuḍrabna',
           'uḍrabu', 'nuḍrabu'],
          L14G,
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 7. ПРИЧАСТИЯ (اسم الفاعل / اسم المفعول)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'participles',
    emoji: '👤',
    title: { fa: 'اسم فاعل و اسم مفعول', ru: 'Причастия', en: "Participles", uz: "Sifatdoshlar", tj: "Сифатҳои феълӣ" },
    paradigms: [
      {
        key: 'fail',
        ar: 'اِسْمُ الْفَاعِل',
        title: { fa: 'اسم فاعل', ru: 'Действительное причастие', en: "Active participle", uz: "Aniq sifatdosh", tj: "Сифати феълии фоилӣ" },
        gloss: { fa: 'زننده', ru: 'бьющий', en: "the one striking", uz: "uruvchi", tj: "зананда" },
        rule: {
          fa: 'از ثلاثیِ مجرّد بر وزن «فَاعِل» می‌آید؛ مانند ضَارِبٌ، قَاتِلٌ.',
          ru: 'От чистого трёхбуквенного образуется по модели فَاعِل; например ضَارِبٌ, قَاتِلٌ.',
          en: "From the bare triliteral, formed on the pattern faʿil; e.g. darib, qatil.",
          uz: "Sof uch harflidan \"foil\" qolipida yasaladi; masalan: dorib, qotil.",
          tj: "Аз сеҳарфаи холис дар қолаби «фоил» сохта мешавад; масалан: зориб, қотил.",
        },
        sighas: mk(
          ['ضَارِبٌ', 'ضَارِبَانِ', 'ضَارِبُونَ', 'ضَارِبَةٌ', 'ضَارِبَتَانِ', 'ضَارِبَاتٌ'],
          ['ḍāribun', 'ḍāribāni', 'ḍāribūna', 'ḍāribatun', 'ḍāribatāni', 'ḍāribātun'],
          L6P,
        ),
      },
      {
        key: 'mafool',
        ar: 'اِسْمُ الْمَفْعُول',
        title: { fa: 'اسم مفعول', ru: 'Страдательное причастие', en: "Passive participle", uz: "Majhul sifatdosh", tj: "Сифати феълии мафъулӣ" },
        gloss: { fa: 'زده‌شده', ru: 'побитый', en: "the one struck", uz: "urilgan", tj: "задашуда" },
        rule: {
          fa: 'از ثلاثیِ مجرّد بر وزن «مَفْعُول» می‌آید؛ مانند مَضْرُوبٌ، مَقْتُولٌ.',
          ru: 'От чистого трёхбуквенного образуется по модели مَفْعُول; например مَضْرُوبٌ, مَقْتُولٌ.',
          en: "From the bare triliteral, formed on the pattern mafʿul; e.g. madrub, maqtul.",
          uz: "Sof uch harflidan \"mafʼul\" qolipida yasaladi; masalan: mazrub, maqtul.",
          tj: "Аз сеҳарфаи холис дар қолаби «мафъул» сохта мешавад; масалан: мазруб, мақтул.",
        },
        sighas: mk(
          ['مَضْرُوبٌ', 'مَضْرُوبَانِ', 'مَضْرُوبُونَ', 'مَضْرُوبَةٌ', 'مَضْرُوبَتَانِ', 'مَضْرُوبَاتٌ'],
          ['maḍrūbun', 'maḍrūbāni', 'maḍrūbūna', 'maḍrūbatun', 'maḍrūbatāni', 'maḍrūbātun'],
          L6P,
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 8. ОТРИЦАНИЕ — جحد (прош.) + نفي (буд.), действит. и страдат.
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'jahd_nafy',
    emoji: '🚫',
    title: { fa: 'جحد و نفی', ru: 'Отрицание (прошедшего и будущего)', en: "Negation (of past and future)", uz: "Inkor (oʻtgan va kelasi zamon)", tj: "Инкор (гузашта ва оянда)" },
    paradigms: [
      {
        key: 'jahd_maloom',
        ar: 'مَعْلُوم فِعْل جَحْد',
        title: { fa: 'جحدِ معلوم', ru: 'Отрицание прошедшего, действит. залог', en: "Negation of the past, active voice", uz: "Oʻtgan zamon inkori, aniq nisbat", tj: "Инкори гузашта, навъи маълум (фоилӣ)" },
        gloss: { fa: 'نزد', ru: 'не ударил (لَمْ + усечённый мудари‘)', en: "did not strike (lam + jussive mudariʿ)", uz: "urmadi (lam + jazm holatidagi muzore)", tj: "назад (лам + музореи маҷзум)" },
        sighas: mk(
          ['لَمْ یَضْرِبْ', 'لَمْ یَضْرِبَا', 'لَمْ یَضْرِبُوا', 'لَمْ تَضْرِبْ', 'لَمْ تَضْرِبَا', 'لَمْ یَضْرِبْنَ',
           'لَمْ تَضْرِبْ', 'لَمْ تَضْرِبَا', 'لَمْ تَضْرِبُوا', 'لَمْ تَضْرِبِي', 'لَمْ تَضْرِبَا', 'لَمْ تَضْرِبْنَ',
           'لَمْ أَضْرِبْ', 'لَمْ نَضْرِبْ'],
          ['lam yaḍrib', 'lam yaḍribā', 'lam yaḍribū', 'lam taḍrib', 'lam taḍribā', 'lam yaḍribna',
           'lam taḍrib', 'lam taḍribā', 'lam taḍribū', 'lam taḍribī', 'lam taḍribā', 'lam taḍribna',
           'lam aḍrib', 'lam naḍrib'],
          L14G,
        ),
      },
      {
        key: 'jahd_majhool',
        ar: 'مَجْهُول فِعْل جَحْد',
        title: { fa: 'جحدِ مجهول', ru: 'Отрицание прошедшего, страдат. залог', en: "Negation of the past, passive voice", uz: "Oʻtgan zamon inkori, majhul nisbat", tj: "Инкори гузашта, навъи маҷҳул (мафъулӣ)" },
        gloss: { fa: 'زده نشد', ru: 'не был побит', en: "was not struck", uz: "urilmadi", tj: "зада нашуд" },
        rule: {
          fa: 'ماقبلِ آخر را فتحه و حرفِ مضارعت را ضمّه ده: لَمْ یَضْرِبْ ← لَمْ یُضْرَبْ.',
          ru: 'Предпоследней — фатху, приставочной — дамму. لَمْ یَضْرِبْ → لَمْ یُضْرَبْ.',
          en: "Give the second-to-last letter a fatha and the prefix letter a damma: lam yadrib -> lam yudrab.",
          uz: "Oxiridan oldingi harfga fatha, old qoʻshimcha harfiga zamma bering: lam yadrib -> lam yudrab.",
          tj: "Ба ҳарфи пеш аз охир фатҳа ва ба ҳарфи музораъат замма деҳ: лам язриб -> лам юзраб.",
        },
        sighas: mk(
          ['لَمْ یُضْرَبْ', 'لَمْ یُضْرَبَا', 'لَمْ یُضْرَبُوا', 'لَمْ تُضْرَبْ', 'لَمْ تُضْرَبَا', 'لَمْ یُضْرَبْنَ',
           'لَمْ تُضْرَبْ', 'لَمْ تُضْرَبَا', 'لَمْ تُضْرَبُوا', 'لَمْ تُضْرَبِي', 'لَمْ تُضْرَبَا', 'لَمْ تُضْرَبْنَ',
           'لَمْ أُضْرَبْ', 'لَمْ نُضْرَبْ'],
          ['lam yuḍrab', 'lam yuḍrabā', 'lam yuḍrabū', 'lam tuḍrab', 'lam tuḍrabā', 'lam yuḍrabna',
           'lam tuḍrab', 'lam tuḍrabā', 'lam tuḍrabū', 'lam tuḍrabī', 'lam tuḍrabā', 'lam tuḍrabna',
           'lam uḍrab', 'lam nuḍrab'],
          L14G,
        ),
      },
      {
        key: 'nafy_maloom',
        ar: 'مَعْلُوم فِعْل نَفْي',
        title: { fa: 'نفیِ معلوم', ru: 'Отрицание будущего, действит. залог', en: "Negation of the future, active voice", uz: "Kelasi zamon inkori, aniq nisbat", tj: "Инкори оянда, навъи маълум (фоилӣ)" },
        gloss: { fa: 'نمی‌زند', ru: 'не бьёт / не будет бить (لَا + мудари‘)', en: "does not strike / will not strike (la + mudariʿ)", uz: "urmaydi (la + muzore)", tj: "намезанад / нахоҳад зад (ло + музореъ)" },
        sighas: mk(
          ['لَا یَضْرِبُ', 'لَا یَضْرِبَانِ', 'لَا یَضْرِبُونَ', 'لَا تَضْرِبُ', 'لَا تَضْرِبَانِ', 'لَا یَضْرِبْنَ',
           'لَا تَضْرِبُ', 'لَا تَضْرِبَانِ', 'لَا تَضْرِبُونَ', 'لَا تَضْرِبِیْنَ', 'لَا تَضْرِبَانِ', 'لَا تَضْرِبْنَ',
           'لَا أَضْرِبُ', 'لَا نَضْرِبُ'],
          ['lā yaḍribu', 'lā yaḍribāni', 'lā yaḍribūna', 'lā taḍribu', 'lā taḍribāni', 'lā yaḍribna',
           'lā taḍribu', 'lā taḍribāni', 'lā taḍribūna', 'lā taḍribīna', 'lā taḍribāni', 'lā taḍribna',
           'lā aḍribu', 'lā naḍribu'],
          L14G,
        ),
      },
      {
        key: 'nafy_majhool',
        ar: 'مَجْهُول فِعْل نَفْي',
        title: { fa: 'نفیِ مجهول', ru: 'Отрицание будущего, страдат. залог', en: "Negation of the future, passive voice", uz: "Kelasi zamon inkori, majhul nisbat", tj: "Инкори оянда, навъи маҷҳул (мафъулӣ)" },
        gloss: { fa: 'زده نمی‌شود', ru: 'не (будет) побит', en: "is not / will not be struck", uz: "urilmaydi", tj: "зада намешавад" },
        rule: {
          fa: 'ماقبلِ آخر را فتحه و حرفِ مضارعت را ضمّه ده: لَا یَضْرِبُ ← لَا یُضْرَبُ.',
          ru: 'Предпоследней — фатху, приставочной — дамму. لَا یَضْرِبُ → لَا یُضْرَبُ.',
          en: "Give the second-to-last letter a fatha and the prefix letter a damma: la yadribu -> la yudrabu.",
          uz: "Oxiridan oldingi harfga fatha, old qoʻshimcha harfiga zamma bering: la yadribu -> la yudrabu.",
          tj: "Ба ҳарфи пеш аз охир фатҳа ва ба ҳарфи музораъат замма деҳ: ло язрибу -> ло юзрабу.",
        },
        sighas: mk(
          ['لَا یُضْرَبُ', 'لَا یُضْرَبَانِ', 'لَا یُضْرَبُونَ', 'لَا تُضْرَبُ', 'لَا تُضْرَبَانِ', 'لَا یُضْرَبْنَ',
           'لَا تُضْرَبُ', 'لَا تُضْرَبَانِ', 'لَا تُضْرَبُونَ', 'لَا تُضْرَبِیْنَ', 'لَا تُضْرَبَانِ', 'لَا تُضْرَبْنَ',
           'لَا أُضْرَبُ', 'لَا نُضْرَبُ'],
          ['lā yuḍrabu', 'lā yuḍrabāni', 'lā yuḍrabūna', 'lā tuḍrabu', 'lā tuḍrabāni', 'lā yuḍrabna',
           'lā tuḍrabu', 'lā tuḍrabāni', 'lā tuḍrabūna', 'lā tuḍrabīna', 'lā tuḍrabāni', 'lā tuḍrabna',
           'lā uḍrabu', 'lā nuḍrabu'],
          L14G,
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 9. ПОВЕЛЕНИЕ И ЗАПРЕТ (الأمر والنهي)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'amr_nahy',
    emoji: '❗',
    title: { fa: 'امر و نهی', ru: 'Повеление и запрет', en: "Imperative and prohibition", uz: "Buyruq va taqiq", tj: "Амр ва наҳй" },
    paradigms: [
      {
        key: 'amr_hadir',
        ar: 'أَمْر حَاضِر',
        title: { fa: 'امرِ حاضر', ru: 'Повеление (2-е лицо)', en: "Imperative (2nd person)", uz: "Buyruq (2-shaxs)", tj: "Амри ҳозир (шахси 2)" },
        gloss: { fa: 'بزن', ru: 'бей!', en: "strike!", uz: "ur!", tj: "бизан!" },
        rule: {
          fa: 'امرِ حاضر تنها برای مخاطب (شش صیغه) می‌آید.',
          ru: 'Повеление обращено только к собеседнику (2-е лицо) — шесть форм.',
          en: "The direct imperative is addressed only to the addressee (2nd person) - six forms.",
          uz: "Buyruq faqat tinglovchiga (2-shaxs) qaratilgan - oltita shakl.",
          tj: "Амри ҳозир танҳо ба мухотаб (шахси 2) равона аст - шаш сиға.",
        },
        sighas: mk(
          ['اِضْرِبْ', 'اِضْرِبَا', 'اِضْرِبُوا', 'اِضْرِبِي', 'اِضْرِبَا', 'اِضْرِبْنَ'],
          ['iḍrib', 'iḍribā', 'iḍribū', 'iḍribī', 'iḍribā', 'iḍribna'],
          L6A,
        ),
      },
      {
        key: 'amr_lam_maloom',
        ar: 'مَعْلُوم أَمْر بِاللَّام',
        title: { fa: 'امر بِلام (معلوم)', ru: 'Повеление с лям (3-е и 1-е лицо)', en: "Imperative with lam (3rd and 1st person), active", uz: "Lam bilan buyruq (3- va 1-shaxs), aniq", tj: "Амр бо лом (шахси 3 ва 1), маълум" },
        gloss: { fa: 'باید بزند', ru: 'пусть ударит', en: "let him strike", uz: "ursin", tj: "бигзор бизанад" },
        rule: {
          fa: 'امر بِلام برای غائب و متکلّم می‌آید: «لام امر» بر سرِ مضارعِ مجزوم.',
          ru: 'Повеление с لِـ (لام الأمر) для 3-го и 1-го лица: لِـ + усечённый мудари‘.',
          en: "The imperative with li- (lam al-amr) is for the 3rd and 1st person: li- + jussive mudariʿ.",
          uz: "li- (lam al-amr) bilan buyruq 3- va 1-shaxs uchun: li- + jazm holatidagi muzore.",
          tj: "Амр бо ли- (ломи амр) барои шахси 3 ва 1: ли- + музореи маҷзум.",
        },
        sighas: mk(
          ['لِیَضْرِبْ', 'لِیَضْرِبَا', 'لِیَضْرِبُوا', 'لِتَضْرِبْ', 'لِتَضْرِبَا', 'لِیَضْرِبْنَ',
           'لِأَضْرِبْ', 'لِنَضْرِبْ'],
          ['liyaḍrib', 'liyaḍribā', 'liyaḍribū', 'litaḍrib', 'litaḍribā', 'liyaḍribna',
           'liʾaḍrib', 'linaḍrib'],
          L8,
        ),
      },
      {
        key: 'amr_lam_majhool',
        ar: 'مَجْهُول أَمْر بِاللَّام',
        title: { fa: 'امر بِلام (مجهول)', ru: 'Повеление с лям, страдат. залог', en: "Imperative with lam, passive voice", uz: "Lam bilan buyruq, majhul nisbat", tj: "Амр бо лом, навъи маҷҳул (мафъулӣ)" },
        gloss: { fa: 'باید زده شود', ru: 'пусть будет побит', en: "let him be struck", uz: "urilsin", tj: "бигзор зада шавад" },
        sighas: mk(
          ['لِتُضْرَبْ', 'لِتُضْرَبَا', 'لِتُضْرَبُوا', 'لِتُضْرَبِي', 'لِتُضْرَبَا', 'لِتُضْرَبْنَ',
           'لِیُضْرَبْ', 'لِیُضْرَبَا', 'لِیُضْرَبُوا', 'لِتُضْرَبْ', 'لِتُضْرَبَا', 'لِیُضْرَبْنَ',
           'لِأُضْرَبْ', 'لِنُضْرَبْ'],
          ['lituḍrab', 'lituḍrabā', 'lituḍrabū', 'lituḍrabī', 'lituḍrabā', 'lituḍrabna',
           'liyuḍrab', 'liyuḍrabā', 'liyuḍrabū', 'lituḍrab', 'lituḍrabā', 'liyuḍrabna',
           'liʾuḍrab', 'linuḍrab'],
          L14K,
        ),
      },
      {
        key: 'nahy_maloom',
        ar: 'مَعْلُوم فِعْل نَهْي',
        title: { fa: 'نهیِ معلوم', ru: 'Запрет, действит. залог', en: "Prohibition, active voice", uz: "Taqiq, aniq nisbat", tj: "Наҳй, навъи маълум (фоилӣ)" },
        gloss: { fa: 'مزن', ru: 'не бей! (لَا + усечённый мудари‘)', en: "do not strike! (la + jussive mudariʿ)", uz: "urma! (la + jazm holatidagi muzore)", tj: "мазан! (ло + музореи маҷзум)" },
        sighas: mk(
          ['لَا تَضْرِبْ', 'لَا تَضْرِبَا', 'لَا تَضْرِبُوا', 'لَا تَضْرِبِي', 'لَا تَضْرِبَا', 'لَا تَضْرِبْنَ',
           'لَا یَضْرِبْ', 'لَا یَضْرِبَا', 'لَا یَضْرِبُوا', 'لَا تَضْرِبْ', 'لَا تَضْرِبَا', 'لَا یَضْرِبْنَ',
           'لَا أَضْرِبْ', 'لَا نَضْرِبْ'],
          ['lā taḍrib', 'lā taḍribā', 'lā taḍribū', 'lā taḍribī', 'lā taḍribā', 'lā taḍribna',
           'lā yaḍrib', 'lā yaḍribā', 'lā yaḍribū', 'lā taḍrib', 'lā taḍribā', 'lā yaḍribna',
           'lā aḍrib', 'lā naḍrib'],
          L14K,
        ),
      },
      {
        key: 'nahy_majhool',
        ar: 'مَجْهُول فِعْل نَهْي',
        title: { fa: 'نهیِ مجهول', ru: 'Запрет, страдат. залог', en: "Prohibition, passive voice", uz: "Taqiq, majhul nisbat", tj: "Наҳй, навъи маҷҳул (мафъулӣ)" },
        gloss: { fa: 'زده مشو', ru: 'да не будешь побит', en: "may you not be struck", uz: "urilma", tj: "зада нашав" },
        sighas: mk(
          ['لَا تُضْرَبْ', 'لَا تُضْرَبَا', 'لَا تُضْرَبُوا', 'لَا تُضْرَبِي', 'لَا تُضْرَبَا', 'لَا تُضْرَبْنَ',
           'لَا یُضْرَبْ', 'لَا یُضْرَبَا', 'لَا یُضْرَبُوا', 'لَا تُضْرَبْ', 'لَا تُضْرَبَا', 'لَا یُضْرَبْنَ',
           'لَا أُضْرَبْ', 'لَا نُضْرَبْ'],
          ['lā tuḍrab', 'lā tuḍrabā', 'lā tuḍrabū', 'lā tuḍrabī', 'lā tuḍrabā', 'lā tuḍrabna',
           'lā yuḍrab', 'lā yuḍrabā', 'lā yuḍrabū', 'lā tuḍrab', 'lā tuḍrabā', 'lā yuḍrabna',
           'lā uḍrab', 'lā nuḍrab'],
          L14K,
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 10. ИМЯ ВРЕМЕНИ/МЕСТА, ОРУДИЯ, ПРЕВОСХОДСТВА
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'zaman_makan_ala',
    emoji: '📍',
    title: { fa: 'اسم زمان و مکان، آلت و تفضیل', ru: 'Имя времени/места, орудия и превосходства', en: "Noun of time/place, instrument, and preference", uz: "Zamon/joy, qurol va orttirma ismi", tj: "Исми замон/макон, олат ва тафзил" },
    paradigms: [
      {
        key: 'zaman_makan',
        ar: 'اِسْمُ الزَّمَان وَالْمَكَان',
        title: { fa: 'اسم زمان و مکان', ru: 'Имя времени и места', en: "Noun of time and place", uz: "Zamon va joy ismi", tj: "Исми замон ва макон" },
        gloss: { fa: 'جای / وقتِ زدن', ru: 'место / время битья', en: "place / time of striking", uz: "urish joyi / vaqti", tj: "ҷой / вақти задан" },
        rule: {
          fa: 'از ثلاثیِ مجرّد بر وزن «مَفْعَل / مَفْعِل» می‌آید؛ مانند مَضْرِب، مَقْتَل.',
          ru: 'От чистого трёхбуквенного по модели مَفْعَل / مَفْعِل; например مَضْرِب, مَقْتَل.',
          en: "From the bare triliteral on the pattern mafʿal / mafʿil; e.g. madrib, maqtal.",
          uz: "Sof uch harflidan \"mafʼal / mafʼil\" qolipida; masalan: mazrib, maqtal.",
          tj: "Аз сеҳарфаи холис дар қолаби «мафъал / мафъил»; масалан: мазриб, мақтал.",
        },
        sighas: mk(
          ['مَضْرِبٌ', 'مَضْرِبَانِ', 'مَضَارِبُ'],
          ['maḍribun', 'maḍribāni', 'maḍāribu'],
          L3,
        ),
      },
      {
        key: 'ala',
        ar: 'اِسْمُ الْآلَة',
        title: { fa: 'اسم آلت', ru: 'Имя орудия', en: "Noun of instrument", uz: "Qurol ismi", tj: "Исми олат" },
        gloss: { fa: 'ابزارِ زدن', ru: 'орудие для битья', en: "instrument for striking", uz: "urish quroli", tj: "асбоби задан" },
        rule: {
          fa: 'از ثلاثیِ مجرّد بر وزن «مِفْعَل، مِفْعَلَة، مِفْعَال» می‌آید؛ مانند مِسْطَر، مِكْنَسَة، مِفْتَاح.',
          ru: 'От чистого трёхбуквенного по моделям مِفْعَل، مِفْعَلَة، مِفْعَال; например مِسْطَر, مِكْنَسَة, مِفْتَاح.',
          en: "From the bare triliteral on the patterns mifʿal, mifʿala, mifʿal; e.g. mistar, miknasa, miftah.",
          uz: "Sof uch harflidan \"mifʼal, mifʼala, mifʼol\" qoliplarida; masalan: mistar, miknasa, miftoh.",
          tj: "Аз сеҳарфаи холис дар қолабҳои «мифъал, мифъала, мифъол»; масалан: мистар, микнаса, мифтоҳ.",
        },
        sighas: mk(
          ['مِضْرَابٌ', 'مِضْرَابَانِ', 'مَضَارِیْبُ'],
          ['miḍrābun', 'miḍrābāni', 'maḍārību'],
          L3,
        ),
      },
      {
        key: 'tafdil',
        ar: 'اِسْمُ التَّفْضِیل',
        title: { fa: 'اسم تفضیل', ru: 'Имя превосходства (элатив)', en: "Noun of preference (elative)", uz: "Orttirma ism (afzallik)", tj: "Исми тафзил (дараҷаи олӣ)" },
        gloss: { fa: 'زننده‌تر', ru: 'более бьющий', en: "more striking", uz: "koʻproq uruvchi", tj: "бештар зананда" },
        rule: {
          fa: 'مذکّر بر وزن «أَفْعَل» و مؤنّث بر وزن «فُعْلَى» می‌آید.',
          ru: 'Мужской род — по модели أَفْعَل, женский — по модели فُعْلَى.',
          en: "The masculine is on the pattern afʿal, the feminine on the pattern fuʿla.",
          uz: "Muzakkar jins \"afʼal\" qolipida, muannas jins \"fuʼla\" qolipida boʻladi.",
          tj: "Ҷинси мардона дар қолаби «афъал», ҷинси занона дар қолаби «фуъло» меояд.",
        },
        sighas: mk(
          ['أَضْرَبُ', 'أَضْرَبَانِ', 'أَضْرَبُونَ', 'ضُرْبَى', 'ضُرْبَیَانِ', 'ضُرْبَیَاتٌ'],
          ['aḍrabu', 'aḍrabāni', 'aḍrabūna', 'ḍurbā', 'ḍurbayāni', 'ḍurbayātun'],
          L6P,
        ),
      },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // 11. ТАБЛИЦА ПОРОД (جدول الأبواب)
  // ──────────────────────────────────────────────────────────────────────────
  {
    key: 'abwab',
    emoji: '📊',
    title: { fa: 'جدولِ بابها', ru: 'Таблица пород (أبواب)', en: "Table of verb forms (abwab)", uz: "Boblar (abvob) jadvali", tj: "Ҷадвали бобҳо (абвоб)" },
    intro: {
      fa: 'هر فعل بنابر حرکتِ عینِ ماضی و مضارع و افزودنِ حروف زائد، در یکی از بابها صرف می‌شود.',
      ru: 'Каждый глагол по огласовке 2-й коренной (в прош. и наст.) и по добавочным буквам относится к одной из «пород» (أبواب).',
      en: "Each verb, according to the vowel of the 2nd root (in the past and present) and the addition of extra letters, is conjugated in one of the forms (abwab).",
      uz: "Har bir feʼl 2-oʻzakning harakatiga (oʻtgan va hozirgi zamonda) va qoʻshimcha harflar qoʻshilishiga koʻra boblardan (abvob) birida tuslanadi.",
      tj: "Ҳар феъл аз рӯи ҳаракати айни реша (дар гузашта ва ҳозира) ва афзудани ҳарфҳои зиёдатӣ дар яке аз бобҳо (абвоб) тасриф мешавад.",
    },
    theory: [
      {
        ar: 'نَصَرَ — یَنْصُرُ',
        tr: 'naṣara – yanṣuru',
        term: { fa: 'باب ۱: فَعَلَ یَفْعُلُ', ru: 'Порода 1: فَعَلَ — یَفْعُلُ', en: "Form 1: faʿala - yafʿulu", uz: "1-bob: faala - yafulu", tj: "Боби 1: фаъала - яфъулу" },
        def: { fa: 'فتحه در ماضی، ضمّه در مضارع (ثلاثی مجرّد).', ru: 'Фатха в прош. — дамма в наст. (чистый трёхбуквенный).', en: "Fatha in the past, damma in the present (bare triliteral).", uz: "Oʻtganda fatha, hozirgida zamma (sof uch harfli).", tj: "Дар гузашта фатҳа, дар ҳозира замма (сеҳарфаи холис)." },
      },
      {
        ar: 'ضَرَبَ — یَضْرِبُ',
        tr: 'ḍaraba – yaḍribu',
        term: { fa: 'باب ۲: فَعَلَ یَفْعِلُ', ru: 'Порода 2: فَعَلَ — یَفْعِلُ', en: "Form 2: faʿala - yafʿilu", uz: "2-bob: faala - yafilu", tj: "Боби 2: фаъала - яфъилу" },
        def: { fa: 'فتحه در ماضی، کسره در مضارع (بابِ الگوی این کتاب).', ru: 'Фатха в прош. — кясра в наст. (порода модельного глагола книги).', en: "Fatha in the past, kasra in the present (the form of this book's model verb).", uz: "Oʻtganda fatha, hozirgida kasra (shu kitobning namuna feʼli bobi).", tj: "Дар гузашта фатҳа, дар ҳозира касра (боби феъли намунавии ин китоб)." },
      },
      {
        ar: 'فَتَحَ — یَفْتَحُ',
        tr: 'fataḥa – yaftaḥu',
        term: { fa: 'باب ۳: فَعَلَ یَفْعَلُ', ru: 'Порода 3: فَعَلَ — یَفْعَلُ', en: "Form 3: faʿala - yafʿalu", uz: "3-bob: faala - yafalu", tj: "Боби 3: фаъала - яфъалу" },
        def: { fa: 'فتحه در ماضی و مضارع (غالباً با حرف حلقی).', ru: 'Фатха в прош. и наст. (обычно при гортанной коренной).', en: "Fatha in the past and present (usually with a guttural root letter).", uz: "Oʻtganda va hozirgida fatha (odatda boʻgʻiz harfi bilan).", tj: "Дар гузашта ва ҳозира фатҳа (одатан бо ҳарфи ҳалқӣ)." },
      },
      {
        ar: 'عَلِمَ — یَعْلَمُ',
        tr: 'ʿalima – yaʿlamu',
        term: { fa: 'باب ۴: فَعِلَ یَفْعَلُ', ru: 'Порода 4: فَعِلَ — یَفْعَلُ', en: "Form 4: faʿila - yafʿalu", uz: "4-bob: faila - yafalu", tj: "Боби 4: фаъила - яфъалу" },
        def: { fa: 'کسره در ماضی، فتحه در مضارع.', ru: 'Кясра в прош. — фатха в наст.', en: "Kasra in the past, fatha in the present.", uz: "Oʻtganda kasra, hozirgida fatha.", tj: "Дар гузашта касра, дар ҳозира фатҳа." },
      },
      {
        ar: 'حَسُنَ — یَحْسُنُ',
        tr: 'ḥasuna – yaḥsunu',
        term: { fa: 'باب ۵: فَعُلَ یَفْعُلُ', ru: 'Порода 5: فَعُلَ — یَفْعُلُ', en: "Form 5: faʿula - yafʿulu", uz: "5-bob: faula - yafulu", tj: "Боби 5: фаъула - яфъулу" },
        def: { fa: 'ضمّه در ماضی و مضارع (افعال صفات و طبیعت‌ها).', ru: 'Дамма в прош. и наст. (глаголы качеств/свойств).', en: "Damma in the past and present (verbs of qualities/traits).", uz: "Oʻtganda va hozirgida zamma (sifat/xususiyat feʼllari).", tj: "Дар гузашта ва ҳозира замма (феълҳои сифат/хислат)." },
      },
      {
        ar: 'حَسِبَ — یَحْسِبُ',
        tr: 'ḥasiba – yaḥsibu',
        term: { fa: 'باب ۶: فَعِلَ یَفْعِلُ', ru: 'Порода 6: فَعِلَ — یَفْعِلُ', en: "Form 6: faʿila - yafʿilu", uz: "6-bob: faila - yafilu", tj: "Боби 6: фаъила - яфъилу" },
        def: { fa: 'کسره در ماضی و مضارع (نادر).', ru: 'Кясра в прош. и наст. (редкая порода).', en: "Kasra in the past and present (a rare form).", uz: "Oʻtganda va hozirgida kasra (kam uchraydigan bob).", tj: "Дар гузашта ва ҳозира касра (боби нодир)." },
      },
      {
        ar: 'أَكْرَمَ — یُكْرِمُ — إِكْرَامًا',
        tr: 'akrama – yukrimu – ikrāman',
        term: { fa: 'باب ۷: أَفْعَلَ (إفعال)', ru: 'Порода 7: أَفْعَلَ (إفعال)', en: "Form 7: afʿala (ifʿal)", uz: "7-bob: afala (ifol)", tj: "Боби 7: афъала (ифъол)" },
        def: { fa: 'بابِ مزید؛ غالباً متعدّی‌سازی (سببیت).', ru: 'Расширенная порода; чаще каузатив (придание переходности).', en: "An augmented form; usually causative (making transitive).", uz: "Orttirilgan bob; koʻpincha oʻzlik-orttirma (oʻtimlilik berish).", tj: "Боби афзуда; аксаран сабабӣ (гузаранда сохтан)." },
      },
      {
        ar: 'فَرَّحَ — یُفَرِّحُ — تَفْرِیحًا',
        tr: 'farraḥa – yufarriḥu – tafrīḥan',
        term: { fa: 'باب ۸: فَعَّلَ (تفعیل)', ru: 'Порода 8: فَعَّلَ (تفعيل)', en: "Form 8: faʿʿala (tafʿil)", uz: "8-bob: faala (tafil)", tj: "Боби 8: фаъъала (тафъил)" },
        def: { fa: 'بابِ مزید؛ شدّت یا سببیت.', ru: 'Расширенная порода; интенсивность или каузатив.', en: "An augmented form; intensity or causative.", uz: "Orttirilgan bob; kuchaytirish yoki oʻzlik-orttirma.", tj: "Боби афзуда; шиддат ё сабабӣ." },
      },
      {
        ar: 'قَاتَلَ — یُقَاتِلُ — مُقَاتَلَةً وَقِتَالًا',
        tr: 'qātala – yuqātilu – muqātalatan / qitālan',
        term: { fa: 'باب ۹: فَاعَلَ (مفاعله)', ru: 'Порода 9: فَاعَلَ (مفاعلة)', en: "Form 9: faʿala (mufaʿala)", uz: "9-bob: foala (mufoala)", tj: "Боби 9: фоъала (муфоъала)" },
        def: { fa: 'بابِ مزید؛ مشارکت (دو طرفه).', ru: 'Расширенная порода; взаимность действия.', en: "An augmented form; reciprocity of action (mutual).", uz: "Orttirilgan bob; harakatning oʻzaroligi (ikki tomonlama).", tj: "Боби афзуда; иштироки амал (дутарафа)." },
      },
      {
        ar: 'اِنْكَسَرَ — یَنْكَسِرُ — اِنْكِسَارًا',
        tr: 'inkasara – yankasiru – inkisāran',
        term: { fa: 'باب ۱۰: اِنْفَعَلَ (انفعال)', ru: 'Порода 10: اِنْفَعَلَ (انفعال)', en: "Form 10: infaʿala (infiʿal)", uz: "10-bob: infaala (infiol)", tj: "Боби 10: инфаъала (инфиъол)" },
        def: { fa: 'بابِ مزید؛ مطاوعه (پذیرشِ اثر).', ru: 'Расширенная порода; возвратно-страдательное значение.', en: "An augmented form; reflexive-passive meaning (undergoing the effect).", uz: "Orttirilgan bob; oʻzlik-majhul maʼno (taʼsirni qabul qilish).", tj: "Боби афзуда; маънои бозгашту маҷҳулӣ (қабули таъсир)." },
      },
      {
        ar: 'اِجْتَمَعَ — یَجْتَمِعُ — اِجْتِمَاعًا',
        tr: 'ijtamaʿa – yajtamiʿu – ijtimāʿan',
        term: { fa: 'باب ۱۱: اِفْتَعَلَ (افتعال)', ru: 'Порода 11: اِفْتَعَلَ (افتعال)', en: "Form 11: iftaʿala (iftiʿal)", uz: "11-bob: iftaala (iftiol)", tj: "Боби 11: ифтаъала (ифтиъол)" },
        def: { fa: 'بابِ مزید؛ مطاوعه و گاه معنیِ اتّخاذ.', ru: 'Расширенная порода; возвратность, иногда «принятие/совершение для себя».', en: "An augmented form; reflexivity, sometimes the meaning of \"taking/doing for oneself\".", uz: "Orttirilgan bob; oʻzlik, baʼzan \"oʻzi uchun qabul qilish/bajarish\" maʼnosi.", tj: "Боби афзуда; бозгашт, гоҳе маънои «барои худ қабул/иҷро кардан»." },
      },
      {
        ar: 'اِحْمَرَّ — یَحْمَرُّ — اِحْمِرَارًا',
        tr: 'iḥmarra – yaḥmarru – iḥmirāran',
        term: { fa: 'باب ۱۲: اِفْعَلَّ (افعلال)', ru: 'Порода 12: اِفْعَلَّ (افعلال)', en: "Form 12: ifʿalla (ifʿilal)", uz: "12-bob: ifalla (ifilol)", tj: "Боби 12: ифъалла (ифъилол)" },
        def: { fa: 'بابِ مزید؛ رنگ‌ها و عیب‌ها.', ru: 'Расширенная порода; цвета и (телесные) недостатки.', en: "An augmented form; colors and (bodily) defects.", uz: "Orttirilgan bob; ranglar va (tana) nuqsonlari.", tj: "Боби афзуда; рангҳо ва айбҳои (ҷисмонӣ)." },
      },
      {
        ar: 'تَكَلَّمَ — یَتَكَلَّمُ — تَكَلُّمًا',
        tr: 'takallama – yatakallamu – takalluman',
        term: { fa: 'باب ۱۳: تَفَعَّلَ (تفعّل)', ru: 'Порода 13: تَفَعَّلَ (تفعّل)', en: "Form 13: tafaʿʿala (tafaʿʿul)", uz: "13-bob: tafaala (tafaul)", tj: "Боби 13: тафаъъала (тафаъъул)" },
        def: { fa: 'بابِ مزید؛ مطاوعهٔ «فعّل».', ru: 'Расширенная порода; возвратность от فَعَّلَ.', en: "An augmented form; the reflexive of faʿʿala.", uz: "Orttirilgan bob; faala (8-bob) ning oʻzlik shakli.", tj: "Боби афзуда; шакли бозгашти фаъъала." },
      },
    ],
  },
];

// ============================================================================
// ХЕЛПЕРЫ
// ============================================================================

export type SarfLang = 'fa' | 'ru' | 'en' | 'uz' | 'tj';

// Текст с фолбэком: запрошенный язык → ru → fa.
// Принимает любую языковую строку (в т. ч. 'ar' из общего i18n — маппится на ru).
export function sarfText(t: SarfText | undefined, lang: string): string {
  if (!t) return '';
  const key = lang === 'ar' ? 'ru' : lang;
  return (t as unknown as Record<string, string | undefined>)[key] || t.ru || t.fa || '';
}

export function sarfSectionTitle(s: SarfSection, lang: string): string {
  return sarfText(s.title, lang);
}

// Найти раздел по ключу.
export function getSarfSection(key: string): SarfSection | undefined {
  return sarfSections.find((s) => s.key === key);
}
