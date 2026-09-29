# Ajuste 56 — Remover "Cancelar" do formulário de Transporte

Pedido da Adriana (29/set/2026): tirar o link "Cancelar" que aparece abaixo do botão "Salvar transporte" em Central → Transporte.

## Contexto

Estadia (`StayItemForm`), Outros (`OtherItemForm`) e Meus documentos (`DocumentForm`) já não têm "Cancelar": só o botão de salvar e, quando for edição, o link "Remover …". Transporte ficou de fora. Este ajuste deixa os quatro formulários iguais.

## O que mudar

### `src/components/central/TransportItemForm.tsx`
1. Remover a prop `onCancel` da interface `TransportItemFormProps` e da desestruturação dos parâmetros.
2. No bloco `.actions`, remover o `<button>` "Cancelar". Deixar igual ao `StayItemForm.tsx`:
```tsx
<div className={styles.actions}>
  <Button fullWidth disabled={!type} onClick={handleSave}>
    Salvar transporte
  </Button>
  {onRemove && (
    <div className={styles.secondaryActions}>
      <button
        type="button"
        className={`${styles.textButton} ${styles.removeButton} ${styles.removeOnly}`}
        onClick={onRemove}
      >
        Remover transporte
      </button>
    </div>
  )}
</div>
```

### `src/components/central/TransportItemForm.module.css`
Acrescentar (o mesmo que já existe em `StayItemForm.module.css`), pra "Remover transporte" ficar alinhado à esquerda agora que não tem mais "Cancelar" ao lado:
```css
.removeOnly {
  margin-left: 0;
}
```

### `src/components/central/TransportDestinationGroup.tsx`
Remover as duas linhas `onCancel={() => setEditingId(null)}` (no formulário de edição e no de novo transporte).

## Como testar
1. Central → Transporte → formulário novo: só o botão "Salvar transporte", sem nada abaixo.
2. Editar um transporte já salvo: botão "Salvar transporte" e, abaixo, "Remover transporte" alinhado à esquerda.
3. `npm run lint` e `npm run build` passando.
