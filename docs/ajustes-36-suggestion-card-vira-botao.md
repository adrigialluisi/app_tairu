# Ajuste 36 — Sugestão de próximo passo vira botão, não mais uma caixa

Feedback da Adriana (15/set/2026), vendo o card "Tudo pronto! Já pode organizar transporte e hospedagem na Central": "o continuar depois de preencher pode ser em botão, esse formato de box é ruim."

O `SuggestionCard` (usado em `CreateTrip.tsx` depois de salvar os Destinos, e em `Itinerary.tsx`) hoje é uma caixa bege com um link de texto sublinhado dentro. Vira: o texto da mensagem continua (contexto de por que a sugestão apareceu), mas a ação vira um `<Button variant="secondary">` de verdade — o "×" de dispensar continua do lado.

**`src/components/shell/SuggestionCard.tsx`** — substituir todo o conteúdo:

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';
import styles from './SuggestionCard.module.css';

interface SuggestionCardProps {
  message: string;
  actionLabel: string;
  to: string;
  storageKey: string;
}

/**
 * Card de sugestão de próximo passo — dispensável, nunca bloqueia nada
 * (ver docs/ajustes-22-trilha-progresso-e-salvo.md). `storageKey` não tem
 * persistência real: identifica a sugestão só pro aria-label do botão de
 * dispensar; dispensar vale só pra visita atual à tela. Ação principal é
 * um botão de verdade (não mais um link de texto — ver
 * docs/ajustes-36-suggestion-card-vira-botao.md).
 */
export function SuggestionCard({ message, actionLabel, to, storageKey }: SuggestionCardProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={styles.card} role="status">
      <div className={styles.header}>
        <p className={styles.message}>{message}</p>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label={`Dispensar sugestão: ${storageKey}`}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <Button variant="secondary" onClick={() => navigate(to)}>
        {actionLabel}
      </Button>
    </div>
  );
}
```

**`src/components/shell/SuggestionCard.module.css`** — substituir todo o conteúdo:

```css
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-android-card);
  background: var(--bg-top);
  border: 1px solid var(--card-border);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
}

.message {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.dismiss {
  flex: 0 0 auto;
  background: none;
  border: none;
  min-width: 32px;
  min-height: 32px;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
}
```

(`.actions`/`.actionLink` saem — o `<Button>` já vem com o próprio estilo.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Nas duas telas que usam `SuggestionCard` (Destinos, depois de salvar; Roteiro), a sugestão aparece com o texto + um botão de verdade (`variant="secondary"`) + o "×" de dispensar — sem link sublinhado.
- Tocar no botão navega pra rota certa (`to`), igual antes.
- Dispensar continua escondendo o card (só na visita atual, sem persistência — comportamento não muda).
