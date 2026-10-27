import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** mesmos botões do AlertDialog de Convidados: 44px, texto 15px */
const DIALOG_BUTTON = 'h-auto min-h-11 rounded-md px-4 text-(length:--text-base) font-medium focus-visible:ring-0';

interface ConflictDialogProps {
  /** "Nesse horário vocês já vão estar a caminho de Santiago (voo às 14:00)." — null fecha */
  message: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Atividade num horário em que o grupo está viajando entre cidades (ajustes-94, item 6): avisa e
 * deixa adicionar mesmo assim — é aviso, não trava. Usado no "Adicionar ao roteiro" dos eventos e
 * no "Salvar registro" de passeio e ingresso da Central. Cancelar não adiciona nada.
 */
export function ConflictDialog({ message, onConfirm, onCancel }: ConflictDialogProps) {
  return (
    <AlertDialog open={message !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-(length:--text-lg) font-semibold">Adicionar mesmo assim?</AlertDialogTitle>
          <AlertDialogDescription className="text-(length:--text-base)">{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {/* --accent-dark no branco 9.67:1; branco no --primary 6.08:1 (hover --accent-dark 9.67:1) */}
          <AlertDialogCancel className={`${DIALOG_BUTTON} border-primary bg-background text-(--accent-dark) hover:bg-accent-soft`}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction className={`${DIALOG_BUTTON} bg-primary text-white hover:bg-(--accent-dark)`} onClick={onConfirm}>
            Adicionar mesmo assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
