import { Check, LoaderCircle, Paperclip, ScanText } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '../shell/Button';
import { UploadIcon, ReplaceIcon, TrashIcon } from '../shell/Icons';
import { Icon } from '../shell/Icon';
import styles from './VoucherUpload.module.css';

interface ReadStatusProps {
  /** "Lendo o documento…" (leitura simulada em andamento) */
  reading: boolean;
  /** leitura terminou e preencheu os campos */
  filled: boolean;
}

/**
 * Feedback da leitura simulada (docs/ajustes-84-...md, seção 1), igual em todo
 * formulário: "Lendo o documento…" com spinner (sem spinner com movimento
 * reduzido) e, depois, a faixa "Preenchemos os campos…". A região é sempre
 * montada com aria-live, pra o leitor de tela anunciar as duas mensagens.
 */
export function ReadStatus({ reading, filled }: ReadStatusProps) {
  return (
    <div aria-live="polite" className="w-full empty:hidden">
      {reading && (
        <p className="m-0 flex items-center gap-2 text-(length:--text-sm) font-medium text-foreground">
          <Icon icon={ScanText} />
          Lendo o documento…
          <LoaderCircle className="size-4 animate-spin motion-reduce:hidden" aria-hidden="true" />
        </p>
      )}
      {filled && !reading && (
        // mesma mensagem pra arquivo reconhecido e preenchimento de exemplo (o moderador sabe pelo roteiro)
        <Alert className="border-solid border-success/40 bg-success-soft">
          <Check className="text-success" aria-hidden="true" />
          <AlertDescription className="text-(length:--text-sm) text-foreground">
            Preenchemos os campos com o que lemos do arquivo. Confira antes de salvar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface VoucherUploadProps {
  /** arquivo enviado; null = mostra só o botão de enviar (Outros: o arquivo vai pra lista de anexos) */
  fileName: string | null;
  reading: boolean;
  filled: boolean;
  onFileSelected: (file: File) => void;
  onRemove?: () => void;
  hint?: string;
  buttonLabel?: string;
}

export function VoucherUpload({
  fileName,
  reading,
  filled,
  onFileSelected,
  onRemove,
  hint = 'Tem um voucher? Envie pra preencher os campos automaticamente.',
  buttonLabel = 'Enviar voucher',
}: VoucherUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFileSelected(file);
  }

  return (
    <div className={styles.voucherUpload}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,image/*"
        className={styles.hiddenFileInput}
        onChange={handleChange}
      />
      {!fileName && (
        <div className={styles.voucherUploadRow}>
          <span className={styles.voucherHint}>{hint}</span>
          <Button variant="secondary" disabled={reading} onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            {buttonLabel}
          </Button>
        </div>
      )}

      {fileName && (
        <div className={styles.voucherAttached}>
          <span className={styles.voucherFileIcon} aria-hidden="true"><Icon icon={Paperclip} /></span>
          <span className={styles.voucherFileName} title={fileName}>
            {fileName}
          </span>
          <div className={styles.voucherFileActions}>
            <button
              type="button"
              className={styles.voucherIconButton}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Substituir voucher"
              title="Substituir voucher"
            >
              <ReplaceIcon />
            </button>
            {onRemove && (
              <button
                type="button"
                className={`${styles.voucherIconButton} ${styles.voucherIconButtonDanger}`}
                onClick={onRemove}
                aria-label="Excluir voucher"
                title="Excluir voucher"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      )}

      <ReadStatus reading={reading} filled={filled} />
    </div>
  );
}
