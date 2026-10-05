import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button as UiButton } from '@/components/ui/button';
import { Button } from './Button';

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
 * Miolo: Alert do shadcn (ver docs/ajustes-70-...md), com role="status" no
 * lugar do role="alert" padrão — é sugestão, não urgência.
 */
export function SuggestionCard({ message, actionLabel, to, storageKey }: SuggestionCardProps) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <Alert
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 pr-4 has-data-[slot=alert-action]:pr-4"
    >
      <AlertDescription className="pr-10 text-sm font-medium text-foreground">
        {message}
      </AlertDescription>
      <AlertAction className="top-0.5 right-0.5">
        <UiButton
          variant="ghost"
          size="icon"
          className="size-11 bg-transparent text-base text-muted-foreground hover:bg-muted focus-visible:ring-0"
          onClick={() => setDismissed(true)}
          aria-label={`Dispensar sugestão: ${storageKey}`}
        >
          <span aria-hidden="true">×</span>
        </UiButton>
      </AlertAction>
      <Button onClick={() => navigate(to)}>{actionLabel}</Button>
    </Alert>
  );
}
