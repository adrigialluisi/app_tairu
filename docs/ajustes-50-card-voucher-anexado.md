# Ajuste 50 — Voucher anexado vira um card, com excluir/substituir

Contexto: feedback sobre a área de voucher depois de anexar um arquivo (`TransportItemForm`). Duas mudanças, ligadas:

1. Quando já existe um voucher anexado, o card de "Enviar voucher" (hint + botão pill) some — não faz sentido mostrar de novo, já que só existe um voucher por transporte.
2. No lugar, aparece uma div em formato de linha (card) mostrando: nome do arquivo anexado (com reticências/ellipsis se for muito grande) à esquerda, e à direita dois ícones: substituir (reabre o seletor de arquivo) e excluir (remove o voucher anexado).

Isso substitui as duas mensagens antigas que só mostravam texto (a de "Voucher enviado: {nome}..." e a de "📎 Voucher anexado: {nome} Trocar") por um componente único e mais visual.

## 1. Novos ícones em `src/components/shell/Icons.tsx`

Adicionar, junto do `UploadIcon` que já existe nesse arquivo:

```tsx
export function ReplaceIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 0 0-7.94 7h2.02A6 6 0 0 1 12 6c1.66 0 3.14.69 4.22 1.78L14 10h6V4l-2.35 2.35z"
      />
      <path
        fill="currentColor"
        d="M6.35 17.65A7.95 7.95 0 0 0 12 20a8 8 0 0 0 7.94-7h-2.02A6 6 0 0 1 12 18c-1.66 0-3.14-.69-4.22-1.78L10 14H4v6l2.35-2.35z"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M9 3a1 1 0 0 0-1 1v1H4.5a1 1 0 1 0 0 2H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm1 2h4v0h-4v0zM7 7h10v13H7V7zm3 2a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1z"
      />
    </svg>
  );
}
```

## 2. `src/components/central/TransportItemForm.tsx`

Importar os dois novos ícones junto do `UploadIcon`:
```ts
import { UploadIcon, ReplaceIcon, TrashIcon } from '../shell/Icons';
```

Adicionar uma função pra remover o voucher (perto de `handleVoucherFileChange`, antes do `return`):
```ts
function handleRemoveVoucher() {
  setVoucherFileName(null);
  setVoucherRecognized(null);
}
```
(Só desanexa o arquivo — não apaga os campos que já tinham sido preenchidos automaticamente, o usuário pode ter ajustado algo à mão.)

Trocar o bloco inteiro de `<div className={styles.voucherUpload}>` (que hoje tem o input escondido, a linha de hint+botão, e as 3 mensagens condicionais) por:

```tsx
<div className={styles.voucherUpload}>
  <input
    ref={fileInputRef}
    type="file"
    accept="application/pdf,image/*"
    className={styles.hiddenFileInput}
    onChange={handleVoucherFileChange}
  />

  {!voucherFileName && (
    <div className={styles.voucherUploadRow}>
      <span className={styles.voucherHint}>Tem um voucher? Anexe pra preencher os campos automaticamente.</span>
      <button type="button" className={styles.voucherButton} onClick={() => fileInputRef.current?.click()}>
        <UploadIcon />
        Enviar voucher
      </button>
    </div>
  )}

  {voucherFileName && (
    <div className={styles.voucherAttached}>
      <span className={styles.voucherFileIcon} aria-hidden="true">📎</span>
      <span className={styles.voucherFileName} title={voucherFileName}>
        {voucherFileName}
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
          onClick={handleRemoveVoucher}
          aria-label="Excluir voucher"
          title="Excluir voucher"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )}

  {voucherRecognized === true && (
    <p className={styles.voucherMessageSuccess}>
      <span aria-hidden="true">✓</span> Campos preenchidos automaticamente. Confira antes de salvar.
    </p>
  )}
  {voucherRecognized === false && (
    <p className={styles.voucherMessageMuted}>
      Não reconhecemos esse voucher automaticamente — confira/preencha os campos manualmente abaixo.
    </p>
  )}
</div>
```

Reparar que a mensagem de sucesso não repete mais o nome do arquivo (já aparece no card acima) e que o terceiro bloco antigo (`voucherRecognized === null && voucherFileName`, com o link "Trocar") foi removido — o card novo já cobre esse caso (editar um transporte que já tinha voucher salvo de antes).

## 3. `src/components/central/TransportItemForm.module.css`

Remover a classe `.voucherChangeButton` (não é mais usada).

Adicionar:

```css
.voucherAttached {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-android-input);
  padding: var(--space-2) var(--space-3);
}

.voucherFileIcon {
  flex: 0 0 auto;
  font-size: 16px;
}

.voucherFileName {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.voucherFileActions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex: 0 0 auto;
}

.voucherIconButton {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  border-radius: 999px;
}

.voucherIconButton:active {
  transform: scale(0.94);
}

.voucherIconButtonDanger {
  color: var(--error);
}
```

## Resultado esperado

- Antes de anexar qualquer voucher: aparece só o texto + botão pill "Enviar voucher" (igual está hoje).
- Depois de anexar: o botão some, e no lugar aparece um card com 📎 + nome do arquivo (cortado com "..." se for grande) + dois ícones à direita (substituir / excluir).
- Clicar em substituir reabre o seletor de arquivo (mesmo comportamento de antes, só que agora via ícone).
- Clicar em excluir remove o voucher anexado e volta a mostrar o texto + botão de enviar — os campos que já tinham sido preenchidos continuam como estavam, não são apagados.
- Mensagem de "campos preenchidos automaticamente" continua aparecendo quando o voucher é reconhecido, só que sem repetir o nome do arquivo (que já está no card).
