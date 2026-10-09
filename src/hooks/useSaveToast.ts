import { useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 2000;
/** com ação ("Desfazer"), o toast fica mais tempo pra dar tempo de tocar */
const TOAST_WITH_ACTION_MS = 5000;

export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Mensagem de salvar/adicionar com o lembrete de que fica offline (docs/ajustes-82-...md, seção 2):
 * "Gasto salvo · disponível offline". Só em ação de salvar ou adicionar — remover não usa.
 */
export function withOffline(text: string): string {
  return `${text} · disponível offline`;
}

/** Controla o toast "Salvo" reaproveitável (ver docs/ajustes-22-trilha-progresso-e-salvo.md). */
export function useSaveToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [action, setAction] = useState<ToastAction | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function hide() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }

  /** `toastAction`: botão no toast (ex.: "Desfazer" ao cancelar convite, ajustes-83) */
  function show(text: string, toastAction?: ToastAction) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    setAction(toastAction ?? null);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), toastAction ? TOAST_WITH_ACTION_MS : TOAST_DURATION_MS);
  }

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { message, visible, show, action, hide };
}
