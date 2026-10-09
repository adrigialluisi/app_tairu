import { useEffect, useRef, type CSSProperties } from 'react';
import { CircleCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import type { ToastAction } from '../../hooks/useSaveToast';

interface SaveToastProps {
  visible: boolean;
  message: string;
  /** botão no toast (ex.: "Desfazer") — `onDone` esconde o toast depois do toque */
  action?: ToastAction | null;
  onDone?: () => void;
}

const TOAST_ID = 'tairu-save';

/* O Toaster do Sonner é `position: fixed` na janela; aqui ele fica preso na base da folha da tela (a .sheet do
   ScreenShell, que é position: relative), no mesmo lugar do toast de antes — acima do menu fixo, 16px da borda. */
const TOASTER_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 'var(--space-4)',
  width: 'auto',
  transform: 'none',
};
// cada toast ocupa a largura toda e centraliza a pílula dentro (o Sonner fixaria uma largura de 356px)
const TOAST_STYLE: CSSProperties = { left: 0, right: 0, width: '100%', display: 'flex', justifyContent: 'center' };

/**
 * Confirmação leve de "isso já foi salvo" — não existe botão "Salvar" de
 * verdade nesse protótipo, tudo grava no TripContext no momento em que a
 * pessoa digita/seleciona; este toast só dá o feedback visual disso (ver
 * docs/ajustes-22-trilha-progresso-e-salvo.md). Usado junto com o hook
 * useSaveToast, que continua controlando timing/duração (2 s).
 *
 * Miolo: Sonner (shadcn, ver docs/ajustes-70-...md). As telas não mudam:
 * `visible`/`message` viram chamadas ao `toast` do Sonner, sempre com o mesmo
 * id — então aparece uma mensagem por vez, e a nova substitui a anterior. O
 * <section> do Sonner já é aria-live="polite".
 */
export function SaveToast({ visible, message, action, onDone }: SaveToastProps) {
  // sempre a ação mais recente (dois "Cancelar convite" seguidos têm a mesma mensagem, mas desfazem coisas diferentes)
  const actionRef = useRef(action);
  const onDoneRef = useRef(onDone);
  actionRef.current = action;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!visible) {
      toast.dismiss(TOAST_ID);
      return;
    }
    toast.custom(
      () => (
        // visual do Sonner padrão (ajustes-72): fundo branco, borda stone-200, sombra, ✓ verde (--success 6.29:1)
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-[0_4px_12px_rgba(28,25,23,0.1)]">
          <CircleCheck className="size-4 flex-none text-success" aria-hidden="true" />
          {message}
          {action && (
            // texto --accent-dark no branco 9.67:1; 44px de alvo
            <button
              type="button"
              className="-my-3 ml-1 min-h-11 cursor-pointer border-0 bg-transparent px-2 font-medium text-(--accent-dark) underline-offset-4 hover:underline"
              onClick={() => {
                actionRef.current?.onClick();
                onDoneRef.current?.();
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      ),
      { id: TOAST_ID, duration: Infinity },
    );
    // a ação em si é lida do ref no toque; o toast só é redesenhado quando muda o que aparece
  }, [visible, message, action?.label]);

  // saiu da tela: o toast não acompanha a pessoa pra próxima (era assim antes, o estado era da tela)
  useEffect(() => () => void toast.dismiss(TOAST_ID), []);

  return (
    <Toaster
      position="bottom-center"
      containerAriaLabel="Avisos"
      offset={0}
      mobileOffset={0}
      visibleToasts={1}
      style={TOASTER_STYLE}
      toastOptions={{ unstyled: true, style: TOAST_STYLE }}
    />
  );
}
