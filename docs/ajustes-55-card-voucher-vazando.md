# Ajuste 55 — Card de voucher anexado vazando pra fora do formulário

Bug visto pela Adriana (24/set/2026) em Central → Transporte: depois de anexar `voucher-voo-buenosaires-santiago.pdf`, a linha-card do arquivo anexado (📎 nome + substituir + excluir) passa da borda direita do formulário.

## Causa

Em `src/components/central/VoucherUpload.module.css`, o container `.voucherUpload` é `flex-direction: column` com **`align-items: flex-start`**. Com isso, os filhos não esticam até a largura do formulário: cada um fica do tamanho do próprio conteúdo. O `.voucherAttached` tem o nome do arquivo com `white-space: nowrap`, então a largura "do conteúdo" é o nome inteiro numa linha só. Resultado: o card fica mais largo que o formulário e vaza. As reticências (`text-overflow: ellipsis` no `.voucherFileName`) nunca entram em ação, porque o pai nunca fica mais estreito que o texto.

## Correção (só CSS, `VoucherUpload.module.css`)

No `.voucherAttached`, acrescentar:
```css
  align-self: stretch;
  min-width: 0;
```
e no `.voucherUploadRow` (linha "Tem um voucher?" + botão), acrescentar `align-self: stretch;` pra ela também ocupar a largura toda e o botão encostar à direita de verdade.

Não trocar o `align-items: flex-start` do `.voucherUpload`: as mensagens de sucesso/aviso abaixo continuam do tamanho do texto, como estão hoje.

Como o `VoucherUpload.module.css` é compartilhado, a correção vale pra **Transporte e Estadia** de uma vez. A aba **Outros** e **Meus documentos** (`AttachmentList`) usam a mesma classe `.voucherAttached` dentro de `<li>`: conferir que a lista (`.list` em `AttachmentList.module.css`) não vaza também; se vazar, acrescentar `min-width: 0;` no `.list` e no `.wrap` de lá.

## Como testar

1. Central → Transporte → Buenos Aires → enviar `voucher-voo-buenosaires-santiago.pdf` → o card do arquivo fica dentro do formulário, e o nome termina em "…" se não couber. Os ícones de substituir e excluir ficam visíveis à direita.
2. Testar na largura de celular pequeno (360px) e com os dois modos (iOS e Android do switcher).
3. Mesmo teste em Estadia com `voucher-hotel-santiago-cumbreslastarria.pdf`.
4. Aba Outros e Meus documentos (se já aplicados): anexar um arquivo com nome bem longo → não vaza.
5. `npm run lint` e `npm run build` passando.
