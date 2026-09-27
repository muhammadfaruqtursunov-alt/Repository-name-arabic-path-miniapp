import { useEffect, useState } from 'react';

interface Props {
  storageKey: string;
  text: string;
}

/** Маленькая подсказка-пузырёк над кнопкой — один раз, пока ученик не увидел
 * эту функцию впервые. Гаснет сама через 4с или по тапу, больше не всплывает. */
export default function FirstTapHint({ storageKey, text }: Props) {
  const [show, setShow] = useState(() => {
    try { return localStorage.getItem(storageKey) !== '1'; } catch { return false; }
  });

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(dismiss, 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  function dismiss() {
    try { localStorage.setItem(storageKey, '1'); } catch { /* нет доступа к хранилищу */ }
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="first-hint" onClick={dismiss}>
      {text}
      <span className="first-hint__arrow" />
    </div>
  );
}
