# Ajuste 71 — shadcn/ui, onda 3: seletores, campos com busca e calendário

Continuação dos ajustes 69 e 70. **Mesmas regras:** instalar pelo MCP do shadcn consultando o registro; nossos componentes mantêm nome, caminho e props (telas não mudam); estilo só pelos tokens do Tairu (nenhum cinza padrão); 44px de toque; foco visível; iOS/Android por `data-platform`.

Esta onda mexe nos componentes **mais delicados** (digitação, listas e datas), então o cuidado com comportamento é maior que com visual.

---

## 1. Componentes

| Nosso componente | Base shadcn | Cuidados |
|---|---|---|
| `inputs/CurrencySelect.tsx` e o seletor "mover pra outro dia" do Roteiro | **Native Select** | Continua `<select>` nativo por baixo: no iPhone abre a roda do sistema (bom pro teste). Rótulo visível e o comportamento de nome curto/código do ajuste 70 continuam. |
| `inputs/DestinationField.tsx` (autocomplete de cidade) | **Combobox** (Popover + Command) | Base real `cities.json`, sem API e sem IA, como hoje. Busca ignora acento e caixa (`normalize` atual). Chips dos destinos escolhidos continuam abaixo do campo. Teclado: setas, Enter escolhe, Esc fecha. O campo não pode perder o texto digitado ao abrir/fechar a lista. |
| `central/HotelSearchField.tsx` (busca de hospedagem) | **Combobox** | Mantém a lista rica (foto, estrelas, faixa de preço, distância) dentro dos itens; "Nenhuma hospedagem da nossa lista. Pode continuar digitando…" vira o estado vazio do Command; digitar um nome livre continua permitido. |
| `inputs/Calendar.tsx` + `inputs/DateRangeField.tsx` | **Calendar** + Date Picker (Popover) | **Em português** (meses, dias da semana, semana começando no domingo como hoje). Intervalo de datas. A máscara de digitação `dd/mm/aaaa` **continua** sincronizada com o calendário (regra do ajuste 08/09). Prop `required={false}` do ajuste 52 continua. Datas que se tocam entre destinos continuam permitidas. |

## 2. Selos que ficaram de fora da onda 2
Passar pro `Badge` (variantes já criadas na onda 2): selo do hotel (estrelas/selo Michelin etc.), selo da foto em Memórias (⭐ destaque, "Marcada automaticamente"), "Oculto" na Retrospectiva e os selos de progresso do menu fixo (✓ e contadores). **Só o visual**: posição e tamanho iguais.

## 3. Conferir (nos modos iOS e Android)
- [ ] `npm run build` passa.
- [ ] Destinos: digitar "buenos" → lista com Buenos Aires; Enter escolhe; escolher Santiago e "san pedro" também; chips aparecem; moeda sugerida certa.
- [ ] Datas por destino: digitar 20112026 vira 20/11/2026 e marca no calendário; escolher no calendário preenche o campo; calendário em português.
- [ ] Hospedagem: buscar "magnolia" mostra o hotel com foto e estrelas; nome livre continua funcionando.
- [ ] Custos e Central: seletor de moeda abre a lista nativa (no celular, a roda do sistema).
- [ ] Roteiro: mover parada de dia pelo seletor funciona.
- [ ] Selos da seção 2 com as cores do Tairu.
- [ ] Commit na branch `prototipo-mes2-shadcn` com a mensagem "shadcn onda 3".
- [ ] Listar diferenças visuais que não deu pra evitar.

## Próxima onda (referência)
- **Onda 4**: Card, Dialog (`PhotoViewer`), Collapsible, Table (conversor), Carousel/Scroll Area (Sugestões), Chart (barra de Custos).
