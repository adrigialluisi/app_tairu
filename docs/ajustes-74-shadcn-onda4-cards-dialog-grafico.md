# Ajuste 74 — shadcn/ui, onda 4 (última): Card, Dialog, Collapsible, Table, Scroll Area e Chart

Última onda da migração. Segue as regras visuais do **ajuste 72** (tema stone + bordô, escala de espaçamento, ícones lucide) e do **ajuste 73** (miolo cinza, cartões brancos). Nossos componentes mantêm nome e props; o visual vem do shadcn.

## 1. Componentes

| Onde | Base shadcn | Como deve ficar |
|---|---|---|
| Todos os cartões: dia do Roteiro, lugar (`PlaceCard`), evento (`EventCard`), gasto (`ExpenseCard`), transporte/hospedagem/outros, documento (`DocumentCard`), resumo de Custos (`CostSummary`), cartões da Retrospectiva, card de destaque da Início | **Card** (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) | Fundo branco, borda stone-200, `rounded-xl`, padding 16px, sem sombra. Título 16px/600, descrição 13px stone-600. Ações (Editar, Remover) no `CardFooter` ou no canto do header, sempre com 44px de toque. **Uma estrutura só pra todos**: some a variação de padding/raio entre telas. |
| `PhotoViewer` (Memórias) | **Dialog** em tela cheia | Prende o foco sozinho, fecha com Esc e com o X (44px, ícone lucide `X`), fundo escuro atrás da foto. Setas anterior/próxima com `ChevronLeft`/`ChevronRight`. Campos de dia, lugar, legenda e destaque continuam iguais. |
| "Não achou? Adicione um lugar…" (Sugestões), resumos editáveis dos passos (Destinos) | **Collapsible** | Linha com ícone `Plus`, texto e `ChevronDown` que gira ao abrir. Sem borda tracejada: borda stone-200 sólida. |
| "Valores de referência" no Conversor | **Table** | Cabeçalho 13px stone-600, linhas com divisória stone-200, números alinhados à direita com `tabular-nums`. |
| Carrosséis de Sugestões e atalhos das seções | **Scroll Area** (horizontal) | Rolagem lateral sem barra cinza aparente, com encaixe (`snap`) em cada cartão; primeiro cartão alinhado com o título (16px). Se o Scroll Area atrapalhar o encaixe ou o toque no celular, manter `overflow-x-auto` com barra escondida e anotar. |
| Barra por categoria em Custos | **Chart** (barra empilhada horizontal, Recharts) | Uma barra de 12px, cantos arredondados, cores do tema (`chart-1` a `chart-5`, sem cinza padrão), legenda com ícone + nome + valor em R$. Tooltip ao tocar mostrando categoria e valor. Total em reais acima, como hoje. |

## 2. Cuidados
- Card é só estrutura e visual: nenhum comportamento muda (selecionar lugar, editar, remover, mover parada, marcar pulei).
- Fotos dos cartões de lugar continuam no topo do Card (sem padding em volta da foto, cantos de cima arredondados), com o botão + / ✓ por cima.
- Gráfico: se Recharts deixar o bundle muito maior que hoje, avisar antes de commitar.

## 3. Conferir (iOS e Android)
- [ ] `npm run build` passa.
- [ ] Todos os cartões com o mesmo raio, borda e padding em todas as telas.
- [ ] Memórias: abrir foto, navegar com setas, fechar com Esc e X.
- [ ] Sugestões: "Adicionar por conta própria" abre/fecha; carrosséis rolam sem barra cinza.
- [ ] Conversor: tabela alinhada.
- [ ] Custos: gráfico com as cores do Tairu e tooltip.
- [ ] Commit "shadcn onda 4" na branch `prototipo-mes2-shadcn`.
- [ ] Listar diferenças que não deu pra evitar.
