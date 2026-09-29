import { useRef, type ChangeEvent } from 'react';
import { UploadIcon, TrashIcon } from '../shell/Icons';
import type { Attachment } from '../../context/TripContext';
import styles from './VoucherUpload.module.css';
import listStyles from './AttachmentList.module.css';

interface AttachmentListProps {
  attachments: Attachment[];
  onChange: (next: Attachment[]) => void;
  /** Texto do hint quando não há nenhum anexo ainda. Default = o texto usado na aba Outros. */
  hint?: string;
}

const DEFAULT_HINT = 'Anexe a apólice, o ingresso ou qualquer comprovante (PDF ou foto).';

export function AttachmentList({ attachments, onChange, hint = DEFAULT_HINT }: AttachmentListProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    const added = files.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      url: URL.createObjectURL(file),
    }));
    onChange([...attachments, ...added]);
  }

  function handleRemove(att: Attachment) {
    URL.revokeObjectURL(att.url);
    onChange(attachments.filter((a) => a.id !== att.id));
  }

  return (
    <div className={listStyles.wrap}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="application/pdf,image/*"
        className={styles.hiddenFileInput}
        onChange={handleFiles}
      />
      <div className={styles.voucherUploadRow}>
        <span className={styles.voucherHint}>
          {attachments.length === 0
            ? hint
            : `${attachments.length} ${attachments.length === 1 ? 'arquivo anexado' : 'arquivos anexados'}`}
        </span>
        <button type="button" className={styles.voucherButton} onClick={() => inputRef.current?.click()}>
          <UploadIcon />
          {attachments.length === 0 ? 'Anexar arquivos' : 'Anexar mais'}
        </button>
      </div>

      {attachments.length > 0 && (
        <ul className={listStyles.list}>
          {attachments.map((att) => (
            <li key={att.id} className={styles.voucherAttached}>
              <span className={styles.voucherFileIcon} aria-hidden="true">📎</span>
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className={`${styles.voucherFileName} ${listStyles.fileLink}`}
                title={`Abrir ${att.fileName}`}
              >
                {att.fileName}
              </a>
              <div className={styles.voucherFileActions}>
                <button
                  type="button"
                  className={`${styles.voucherIconButton} ${styles.voucherIconButtonDanger} ${listStyles.deleteButton}`}
                  onClick={() => handleRemove(att)}
                  aria-label={`Excluir ${att.fileName}`}
                  title="Excluir arquivo"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
