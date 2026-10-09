import { Camera, FileText, FolderOpen, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Attachment } from '../../context/TripContext';
import { Button } from '../shell/Button';
import { Icon } from '../shell/Icon';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|heif|avif)$/i;

/** imagem vira miniatura; PDF (ou anexo antigo sem tipo e sem extensão de imagem) continua com ícone */
export function isImageAttachment(att: Attachment): boolean {
  return att.mimeType ? att.mimeType.startsWith('image/') : IMAGE_EXT.test(att.fileName);
}

interface DocumentThumbsProps {
  attachments: Attachment[];
  /** nome do documento, pro rótulo acessível ("Passaporte, foto 1") */
  docLabel: string;
  /** só no formulário: botão "×" pra tirar o arquivo */
  onRemove?: (att: Attachment) => void;
}

/**
 * Miniaturas 64×64 dos arquivos do documento (docs/ajustes-84-...md, seção 2):
 * imagem → miniatura que abre em tela cheia (Dialog, Esc fecha); PDF → ícone de
 * arquivo que abre numa aba nova. Usado no formulário e no DocumentCard.
 */
export function DocumentThumbs({ attachments, docLabel, onRemove }: DocumentThumbsProps) {
  const [open, setOpen] = useState<Attachment | null>(null);
  if (attachments.length === 0) return null;

  return (
    <>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={`Arquivos de ${docLabel}`}>
        {attachments.map((att, i) => (
          <li key={att.id} className="relative">
            {isImageAttachment(att) ? (
              <button
                type="button"
                onClick={() => setOpen(att)}
                aria-label={`${docLabel}, foto ${i + 1}: ver em tela cheia`}
                className="block size-16 cursor-pointer overflow-hidden rounded-md border-0 bg-(--placeholder) p-0"
              >
                <img src={att.url} alt="" className="size-full object-cover" />
              </button>
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                title={att.fileName}
                aria-label={`Abrir ${att.fileName}`}
                className="flex size-16 flex-col items-center justify-center gap-1 rounded-md bg-(--bg-top) px-1 text-(length:--text-sm) text-foreground no-underline"
              >
                <Icon icon={FileText} className="text-[20px]" />
                <span className="w-full truncate text-center text-[11px]">{att.fileName}</span>
              </a>
            )}
            {onRemove && (
              // alvo de 44px saindo um pouco pra fora da miniatura; o círculo visível é de 24px
              <button
                type="button"
                onClick={() => onRemove(att)}
                aria-label={`Tirar ${att.fileName}`}
                className="absolute -top-3 -right-3 flex size-11 cursor-pointer items-center justify-center border-0 bg-transparent p-0"
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-black/70 text-white">
                  <Icon icon={X} />
                </span>
              </button>
            )}
          </li>
        ))}
      </ul>

      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        {open && (
          <DialogContent
            showCloseButton={false}
            className="inset-0 top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none bg-foreground p-0 text-white ring-0 sm:max-w-none"
          >
            <div className="flex items-center justify-between gap-2 p-2 pl-4">
              <DialogTitle className="m-0 truncate text-(length:--text-base) font-medium text-white">
                {docLabel} · {open.fileName}
              </DialogTitle>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Fechar"
                className="inline-flex size-11 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-[22px] text-white"
              >
                <Icon icon={X} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center p-2">
              <img src={open.url} alt={`${docLabel}, ${open.fileName}`} className="max-h-full max-w-full object-contain" />
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

interface DocumentFilePickerProps {
  /** arquivos novos — o formulário guarda nos anexos e roda a leitura simulada no último */
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

/** "Tirar foto" (câmera traseira) e "Escolher arquivo" (imagem ou PDF), lado a lado, 44px. */
export function DocumentFilePicker({ onFiles, disabled }: DocumentFilePickerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handle(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length > 0) onFiles(files);
  }

  return (
    <div className="flex gap-2">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handle} />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handle} />
      <Button variant="secondary" className="min-w-0 flex-1" disabled={disabled} onClick={() => cameraRef.current?.click()}>
        <Icon icon={Camera} /> Tirar foto
      </Button>
      <Button variant="secondary" className="min-w-0 flex-1" disabled={disabled} onClick={() => fileRef.current?.click()}>
        <Icon icon={FolderOpen} /> Escolher arquivo
      </Button>
    </div>
  );
}
