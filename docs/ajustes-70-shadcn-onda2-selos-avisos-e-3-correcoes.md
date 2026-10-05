# Ajuste 70 — shadcn/ui, onda 2: Switch, selos, avatares, avisos, estados vazios + 3 correções visuais

Continuação do `ajustes-69` (onda 1 aplicada no commit "shadcn onda 1"). **Mesmas regras da onda 1:** instalar pelo MCP do shadcn consultando o registro; nossos componentes mantêm nome, caminho e props; estilo só pelos tokens do Tairu; 44px de toque; foco visível; iOS/Android por `data-platform`.

**Diferença desta onda:** além de trocar o miolo dos componentes, entram **3 correções visuais pedidas pela Adriana** a partir dos prints de 05/out (seção 2). Essas sim mudam o visual, de propósito.

---

## 1. Componentes desta onda

| Nosso componente | Base shadcn | Observações |
|---|---|---|
| `shell/Switch.tsx` | Switch | `role="switch"` e rótulo clicável continuam; trilho ligado em `--accent`. |
| `inputs/Chip.tsx`, selos e tags (Exemplo, Offline, Compartilhado, Da Central, Lançado por, Hoje/Vence, contadores dos atalhos, tags de categoria) | Badge | Criar variantes nossas no Badge: `neutral` (fundo `--card`, borda `--card-border`), `accent` (fundo `--accent`, texto branco), `alert` (texto/borda `--error`), `success` (`--success` + ícone). Ícone sempre com texto. |
| `shell/MemberAvatars.tsx` | Avatar (+ grupo sobreposto) | Iniciais; fundo `--bg-low`, texto `--text`; `aria-label` com os nomes. |
| `shell/SaveToast.tsx` | Sonner | Mesma posição e duração de hoje; uma mensagem por vez; `aria-live="polite"`. Se o Sonner exigir mudar como as telas chamam o toast, manter o hook `useSaveToast` com a mesma assinatura e adaptar por dentro. |
| `shell/SuggestionCard.tsx` | Alert | Mantém o botão "×" de dispensar e o botão de ação (primário). |
| `shell/EmptyTripState.tsx` e estados vazios (Custos, Documentos, Memórias, Eventos) | Empty | Ícone grande, título, texto e ação; mesmos textos de hoje. Trocar só os que já usam um componente/padrão comum; não reescrever tela. |

## 2. Três correções visuais (mudam o visual de propósito)

### 2.1 Custos → "Valor" estreito demais
No `ExpenseForm` (e onde mais houver a dupla valor + moeda: custo em Transporte, Hospedagem, Outros, e o Conversor), o campo de **valor** está menor que o seletor de moeda e o exemplo aparece cortado ("Ex.: 12000(").
- Valor ocupa **~60%** da linha, moeda **~40%** (`grid-template-columns: 3fr 2fr`).
- No seletor de moeda, mostrar **só o código + nome curto quando couber**; se o espaço for pequeno, só o código ("BRL"). O nome completo continua nas opções da lista.
- Exemplo do valor mais curto: "Ex.: 120000" → **"Ex.: 450"**.

### 2.2 Roteiro → aba de destino quando só existe 1 destino
Hoje, com um só destino, aparece uma aba única gigante em bordô ("Buenos Aires") que parece botão de ação.
- **Com 1 destino:** não mostrar as abas de destino. Mostrar o nome da cidade como subtítulo da seção: `📍 Buenos Aires` (`--text-lg`, semibold).
- **Com 2 ou mais:** abas como estão.
- Vale nas três abas do Roteiro (Sugestões, Roteiro/Mapa, Dicas locais) e em Memórias se houver o mesmo padrão.

### 2.3 Cartão de lugar sem foto mostra só uma letra
No `PlaceCard` (Sugestões) e no `TimelineStop` (Roteiro), quando não há foto, aparece uma letra grande ("L") que parece erro.
- Trocar pela **ilustração da categoria**: ícone grande da primeira categoria do lugar (🍽️ gastronomia, 🏛️ cultura, 🌿 natureza, 🌙 vida noturna, 🛍️ compras) centralizado, sobre fundo `--bg-top` suave.
- Lugar adicionado à mão (sem categoria): ícone ✏️.
- Continua sem foto falsa (regra de dado real).

### 2.4 Sobras da onda 1 (achadas nos prints de 05/out)
- **Abas com fundo cinza nas opções não selecionadas** (Central, Roteiro, Custos): o cinza claro vem do padrão do shadcn e não existe no Tairu. Aba não selecionada volta a ser **transparente** sobre o fundo `--card` da barra (como era antes da onda 1). Conferir o `Tabs` e qualquer classe `bg-muted`/cinza que tenha vindo do registro.
- **Título "Valores de referência" cortado à esquerda** no Conversor (aparece "/alores"): corrigir o recuo/overflow pra o título alinhar com os outros títulos da tela.

## 3. Conferir (nos modos iOS e Android)
- [ ] `npm run build` passa.
- [ ] Switch em Meus documentos (Offline, Compartilhar, Me avisar) funciona por toque e teclado.
- [ ] Selos e tags com as cores do Tairu, nenhum cinza padrão.
- [ ] Toast "Salvo"/"Lugar adicionado" aparece e some como antes.
- [ ] Card de sugestão dispensável continua funcionando.
- [ ] Custos: campo Valor mais largo que a moeda; exemplo inteiro visível.
- [ ] Roteiro com 1 destino: sem aba gigante, só "📍 Buenos Aires". Com 3 destinos: abas normais.
- [ ] Lugar sem foto mostra o ícone da categoria, não letra.
- [ ] Abas não selecionadas sem fundo cinza; "Valores de referência" inteiro.
- [ ] Commit na branch `prototipo-mes2-shadcn` com a mensagem "shadcn onda 2".
- [ ] Listar diferenças visuais que não deu pra evitar.

## Próximas ondas (referência)
- **Onda 3**: Native Select (`CurrencySelect`, seletor de dia), Combobox (`DestinationField`, `HotelSearchField`), Calendar/Date Picker (`DateRangeField`).
- **Onda 4**: Card, Dialog (`PhotoViewer`), Collapsible, Table (conversor), Carousel/Scroll Area (Sugestões), Chart (barra de Custos).
