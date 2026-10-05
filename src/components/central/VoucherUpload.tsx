import { Check, Paperclip } from 'lucide-react';
import { useRef, type ChangeEvent } from 'react';
import { Button } from '../shell/Button';
import { UploadIcon, ReplaceIcon, TrashIcon } from '../shell/Icons';
import { Icon } from '../shell/Icon';
import styles from './VoucherUpload.module.css';

interface VoucherUploadProps {
  fileName: string | null;
  /** true = reconhecido e preencheu os campos; false = não reconhecido; null = nada enviado nesta edição */
  recognized: boolean | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

export function VoucherUpload({ fileName, recognized, onFileSelected, onRemove }: VoucherUploadProps) {
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
          <span className={styles.voucherHint}>Tem um voucher? Anexe pra preencher os campos automaticamente.</span>
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            Enviar voucher
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
            <button
              type="button"
              className={`${styles.voucherIconButton} ${styles.voucherIconButtonDanger}`}
              onClick={onRemove}
              aria-label="Excluir voucher"
              title="Excluir voucher"
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      )}

      {recognized === true && (
        <p className={styles.voucherMessageSuccess}>
          <Icon icon={Check} /> Campos preenchidos automaticamente. Confira antes de salvar.
        </p>
      )}
      {recognized === false && (
        <p className={styles.voucherMessageMuted}>
          Não reconhecemos esse voucher automaticamente — confira/preencha os campos manualmente abaixo.
        </p>
      )}
    </div>
  );
}
