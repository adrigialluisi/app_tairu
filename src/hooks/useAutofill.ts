import { useEffect, useRef, useState } from 'react';

/** quanto dura o "Lendo o documento…" (leitura simulada, ajustes-84) */
const READ_MS = 1200;
/** quanto tempo os campos preenchidos ficam destacados */
const HIGHLIGHT_MS = 3000;

const EMPTY: ReadonlySet<string> = new Set();

/**
 * Estado da leitura simulada de voucher/documento, igual em todos os formulários
 * (docs/ajustes-84-tudo-que-sobe-preenche-sozinho.md, seção 1):
 * `read(apply)` mostra "Lendo o documento…" por ~1,2 s (campos desabilitados),
 * depois chama `apply` — que preenche os campos e devolve as chaves preenchidas —,
 * mostra o aviso "Preenchemos os campos…" e destaca essas chaves por 3 s (`hl`).
 * Trocar o arquivo chama `read` de novo e sobrescreve.
 */
export function useAutofill() {
  const [reading, setReading] = useState(false);
  const [filled, setFilled] = useState(false);
  const [highlighted, setHighlighted] = useState<ReadonlySet<string>>(EMPTY);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  }

  useEffect(() => clearTimers, []);

  function read(apply: () => string[]) {
    clearTimers();
    setReading(true);
    setFilled(false);
    setHighlighted(EMPTY);
    timers.current.push(
      setTimeout(() => {
        const keys = apply();
        setReading(false);
        setFilled(true);
        setHighlighted(new Set(keys));
        timers.current.push(setTimeout(() => setHighlighted(EMPTY), HIGHLIGHT_MS));
      }, READ_MS),
    );
  }

  /** arquivo removido: some o aviso e o destaque */
  function reset() {
    clearTimers();
    setReading(false);
    setFilled(false);
    setHighlighted(EMPTY);
  }

  return { reading, filled, read, reset, hl: (key: string) => highlighted.has(key) };
}

export type Autofill = ReturnType<typeof useAutofill>;
