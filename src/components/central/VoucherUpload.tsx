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
  /** texto da faixa verde (a nota de Custos diz "da nota", ajustes-90) */
  filledMessage?: string;
}

const DEFAULT_FILLED_MESSAGE = 'Preenchemos os campos com o que lemos do arquivo. Confira antes de salvar.';

/**
 * Feedback da leitura simulada (docs/ajustes-84-...md, seção 1), igual em todo
 * formulário: "Lendo o documento…" com spinner (sem spinner com movimento
 * reduzido) e, depois, a faixa "Preenchemos os campos…". A região é sempre
 * montada com aria-live, pra o leitor de tela anunciar as duas mensagens.
 */
export function ReadStatus({ reading, filled, filledMessage = DEFAULT_FILLED_MESSAGE }: ReadStatusProps) {
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
            {filledMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface VoucherUploadProps {
  /** arquivo enviado; null = mostra só o botão de enviar (em Outros, é o anexo mais recente do registro) */
  fileName: string | null;
  reading: boolean;
  filled: boolean;
  onFileSelected: (file: File) => void;
  onRemove?: () => void;
  hint?: string;
  buttonLabel?: string;
  filledMessage?: string;
  /** "Substituir voucher" / "Excluir voucher" → "… nota" (ajustes-90) */
  fileNoun?: string;
  /** tipos aceitos (a nota é foto; o voucher também pode ser PDF) */
  accept?: string;
}

export function VoucherUpload({
  fileName,
  reading,
  filled,
  onFileSelected,
  onRemove,
  hint = 'Tem um voucher? Envie pra preencher os campos automaticamente.',
  buttonLabel = 'Enviar voucher',
  filledMessage,
  fileNoun = 'voucher',
  accept = 'application/pdf,image/*',
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
        accept={accept}
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
              aria-label={`Substituir ${fileNoun}`}
              title={`Substituir ${fileNoun}`}
            >
              <ReplaceIcon />
            </button>
            {onRemove && (
              <button
                type="button"
                className={`${styles.voucherIconButton} ${styles.voucherIconButtonDanger}`}
                onClick={onRemove}
                aria-label={`Excluir ${fileNoun}`}
                title={`Excluir ${fileNoun}`}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>
      )}

      <ReadStatus reading={reading} filled={filled} filledMessage={filledMessage} />
    </div>
  );
}
