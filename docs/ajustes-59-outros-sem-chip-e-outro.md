# Ajuste 59 — Central → Outros: remover "Chip ou internet" e "Outro"

Pedido da Adriana (02/out/2026): na aba Outros da Central, tirar as opções **📶 Chip ou internet** e **📋 Outro**. Ficam só 3 tipos: 🛡️ Seguro viagem, 🎟️ Passeio ou excursão, 🎫 Ingresso ou evento.

Remover de verdade (tipo, rótulos, configuração e casos), não só esconder o chip — assim o TypeScript garante que não sobra nenhum caminho morto.

## O que mudar

### `src/context/TripContext.tsx`
```ts
export type OtherItemType = 'seguro' | 'passeio' | 'ingresso';
```

### `src/utils/otherSummary.ts`
- Tirar `chip` e `outro` de `TYPE_LABELS` e `TYPE_ICONS`.
- `OTHER_TYPES = ['seguro', 'passeio', 'ingresso']`.
- Em `otherItemDetailRows` (ou como a função se chamar), apagar os `case 'chip'` e `case 'outro'`.
- Se o título do card tiver algum tratamento específico pra `'outro'`/`'chip'`, apagar também.

### `src/components/central/OtherItemForm.tsx`
- Apagar as entradas `chip` e `outro` do `FIELD_CONFIG`.
- Em `handleTypeChange`: `if (newType === 'seguro' || newType === 'chip')` → `if (newType === 'seguro')`.

### Textos que citam os tipos
Rodar `grep -rni "chip ou internet\|chip\b" src` e ajustar qualquer texto visível que ainda mencione chip (ex.: hint ou estado vazio da aba Outros). Não mexer em `OptionChipGroup` (é o nome do componente, não o tipo).

## Conferir
- [ ] Outros mostra só Seguro viagem, Passeio ou excursão, Ingresso ou evento.
- [ ] Seguro continua puxando as datas da viagem ao ser escolhido pela primeira vez.
- [ ] `npm run lint` e `npm run build` sem erro.
