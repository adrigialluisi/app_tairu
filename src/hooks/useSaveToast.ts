import { useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 2000;

/** Controla o toast "Salvo" reaproveitável (ver docs/ajustes-22-trilha-progresso-e-salvo.md). */
export function useSaveToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(text: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
  }

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { message, visible, show };
}
