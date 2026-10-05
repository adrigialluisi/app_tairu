# Ajuste 72 — Virada visual: cara de shadcn com o bordô do Tairu

## Por que nada mudou nas ondas 1 e 2
As ondas 1 e 2 foram escritas com a regra "nada muda visualmente", e o `index.css` foi montado pra que **os nossos CSS Modules sempre ganhem** dos estilos do shadcn (o shadcn fica em camada `@layer`, os nossos estilos não). Resultado: o miolo virou shadcn, mas a aparência continuou 100% a antiga. **Essa regra foi um erro de premissa: a Adriana quer a cara do shadcn.**

Decisão da Adriana (05/out/2026): **visual do shadcn + bordô do Tairu.** Fundo branco, bordas finas e claras, cantos menores, sombras sutis, espaçamento regular. O bordô fica só nos destaques (botão principal, item ativo, link). **Sai o creme e saem as bordas escuras grossas.**

Esta mudança é **de propósito visual em todas as telas**. Ela substitui a regra "nada muda" das ondas 1–3 (a onda 3 continua válida pros comportamentos).

---

## 1. Inverter quem manda no estilo
- Nos componentes já migrados (Button, TextField, OptionChipGroup/Multi, Tabs, Switch, Badge, Avatar, toast, Alert, Empty), **o visual passa a vir das classes do shadcn** (Tailwind). **Apagar dos CSS Modules desses componentes** tudo que for cor, borda, raio, sombra, altura e tipografia; o `.module.css` só fica se sobrar algo de layout que o Tailwind não cubra (e se ficar vazio, apagar o arquivo).
- Ativar a base do Tailwind só no que é seguro: `body` com `bg-background text-foreground font-sans antialiased`. Continuar **sem** o reset completo (preflight) pra não quebrar telas ainda não revisadas; se algum estilo antigo atrapalhar, corrigir pontualmente.

## 2. Novo tema (substitui o mapeamento creme)
Reescrever o bloco `@theme inline` do `src/index.css` com estes valores (tons quentes da escala *stone* do Tailwind, que combinam com o bordô). **Contraste conferido; não trocar sem conferir de novo.**

| Variável shadcn | Valor | Uso | Contraste |
|---|---|---|---|
| background | `#ffffff` | fundo de todas as telas | — |
| foreground | `#1c1917` (stone-900) | texto principal | 17.5:1 |
| card / popover | `#ffffff` | cartões | — |
| card-foreground | `#1c1917` | | 17.5:1 |
| muted | `#f5f5f4` (stone-100) | fundos sutis, trilho das abas, estado vazio | — |
| muted-foreground | `#57534e` (stone-600) | texto secundário | 7.6:1 no branco · 7.0:1 no muted |
| border | `#e7e5e4` (stone-200) | bordas decorativas (cartão, divisória) | decorativa |
| input | `#78716c` (stone-500) | borda de campo | 4.8:1 (passa o mínimo de 3:1 pra borda de campo) |
| ring | `#b23345` (bordô) | anel de foco 2px | 6.1:1 |
| primary | `#b23345` (bordô) | botão principal, item ativo | texto branco 6.1:1 |
| primary-foreground | `#ffffff` | | |
| primary hover | `#7e2331` (`--accent-dark`) | hover/pressed | branco 9.7:1 |
| secondary | `#f5f5f4` | botão secundário | texto 16:1 |
| accent (hover do shadcn) | `#f5f5f4` | hover de linha/item | |
| destructive | `#b42318` | remover, vencido | 6.6:1 |
| success | `#2f6b4f` (mantém) | entrou, quite | 6.3:1 |
| destaque suave | `#fbeff1` (bordô 6%) | fundo de chip selecionado / selo bordô | texto `#7e2331` 8.6:1 |

**Raio** (fica parecido nos dois sistemas, sem pílula gigante): `--radius: 0.75rem` (12px) no iOS e `0.5rem` (8px) no Android. Campos e botões usam `rounded-md`, cartões `rounded-xl`. **Pílula total só em chip pequeno, selo e avatar.**

**Sombra**: cartões sem sombra, só borda `border`. Sombra `shadow-sm` apenas em elemento que flutua (aba ativa no iOS, popover, toast, barra inferior).

`src/styles/tokens.css`: atualizar os tokens antigos pra apontar pros novos valores (`--card` → branco, `--card-border` → stone-200, `--field-border` → stone-500, `--muted` → stone-600, `--bg-top` → stone-100…), assim as telas ainda não revisadas herdam o visual novo automaticamente. Remover o gradiente/creme de fundo onde ainda existir (exceto a Splash, que pode manter o grafismo leve).

## 3. Tipografia e espaçamento (escala única, múltiplos de 4)
- **Pesos mais leves**, como no shadcn: títulos 600, rótulos 500, corpo 400. **Nada em 800.**
- Tamanhos: título de tela 24px · título de seção 18px · título de cartão 16px · corpo 15px · auxiliar 13px. Altura de linha 1.4 (títulos 1.25).
- Espaçamento:
  - margem lateral da tela: **16px**
  - entre seções/blocos da tela: **24px**
  - padding interno de cartão: **16px**
  - entre campos de um formulário: **16px**
  - rótulo → campo: **6px**; campo → texto de ajuda/erro: **6px**
  - entre itens de lista: **8px** (ou divisória `border`)
- Remover espaçamentos soltos fora dessa escala (ex.: os vãos grandes entre "Lugares pra visitar", "Ver dicas" e "Adicionar fotos" no Roteiro).

## 4. Componentes, como devem ficar

| Componente | Visual novo |
|---|---|
| **Button** primário | fundo bordô, texto branco, altura 44px, `rounded-md`, peso 500, sem sombra. Secundário: `variant="outline"` (fundo branco, borda stone-200, texto stone-900). Link: texto bordô sublinhado no hover. |
| **TextField** | fundo branco, borda 1px stone-500, `rounded-md`, altura 44px, texto 15px; foco: borda bordô + anel 2px bordô/20%. Placeholder stone-500. Rótulo 14px peso 500 acima. |
| **Chips** (OptionChipGroup) | não selecionado: fundo branco, borda 1px stone-300 (o texto do chip já identifica o limite), texto stone-900, `rounded-full`, altura 36–40px com área de toque de 44px; selecionado: fundo `#fbeff1`, borda bordô, texto `#7e2331`, ícone ✓. **Não usar bordô cheio nos chips** (fica pesado com vários). |
| **Tabs** (iOS) | trilho `bg-muted` (stone-100) `rounded-lg` com 4px de folga; aba ativa: fundo branco + `shadow-sm` + texto stone-900 peso 600; inativa: texto stone-600. **Sem bordô e sem borda escura no trilho.** |
| **Tabs** (Android) | sem trilho; abas de texto com sublinhado 2px bordô na ativa e borda inferior stone-200 em toda a linha. |
| **Tabs ícone** (Lista/Mapa) | segmentado pequeno (2 ícones, 40px cada) alinhado à direita, não ocupa a largura toda. Ícones lucide `List` e `Map`. |
| **Pílulas de data** | não selecionada: fundo branco, borda stone-200, mês 11px stone-500 em cima, dia 18px stone-900 embaixo; selecionada: fundo bordô, **texto branco** (corrige o texto preto no vermelho de hoje). "Todos os dias" igual às outras. **Esconder a barra de rolagem** (a faixa cinza embaixo). |
| **Cartões** (dia do Roteiro, lugar, gasto, documento, resumos) | fundo branco, borda 1px stone-200, `rounded-xl`, padding 16px, sem sombra. Cabeçalho do cartão: título 16px/600 + subtítulo 13px stone-600. |
| **Badge/selos** | `rounded-full`, 12px peso 500, altura 22px: neutro (stone-100/stone-700), bordô suave (`#fbeff1`/`#7e2331`), alerta (vermelho suave), sucesso (verde suave). |
| **Estados vazios** | ícone lucide 32px stone-400 num círculo stone-100, título 15px/500, texto 13px stone-600, centralizados, sem cartão creme. |
| **AppBar** | fundo branco, borda inferior stone-200, título 17px/600; ícones lucide (`House`, `ChevronLeft`/`ArrowLeft`). |
| **Barra inferior (menu)** | fundo branco, borda superior stone-200, ícones lucide 22px; ativo bordô, inativo stone-500; rótulo 11px. |
| **Toast** | Sonner padrão (fundo branco, borda, sombra) com ícone ✓ verde. |

## 5. Ícones: lucide no lugar dos emojis da interface
O shadcn usa **lucide-react** (já instalado). Trocar os **emojis da interface** por ícones lucide de traço, cor herdada do texto:
- Menu: Destinos `MapPin` · Central `Briefcase` · Convidados `Users` · Roteiro `Compass` · Custos `Wallet`.
- AppBar/Início: `House`, `User`, `FileText` (documentos), `Images` (memórias).
- Roteiro: dia `CalendarDays`, cidade `MapPin`, dicas `Lightbulb`, fotos `Camera`, agenda `Clock`, mover `ArrowLeftRight`, pulei `SkipForward`.
- Categorias: turístico `Landmark` · fora do circuito `Compass` · gastronomia `UtensilsCrossed` · cultura `Theater` · natureza `Trees` · vida noturna `Moon` · compras `ShoppingBag` · eventos `CalendarDays`.
- Transporte: voo `Plane` · ônibus `Bus` · trem `TrainFront` · carro `Car`; hospedagem `BedDouble`; check-out `LogOut`.
- Custos: `Wallet`, `ArrowUpDown` (inverter), categorias com os mesmos ícones acima; documentos `FileText`, alerta `TriangleAlert`, sucesso `CircleCheck`.
- Ícone sempre `aria-hidden` com texto ao lado (regra de acessibilidade já existente).
- **Ficam emojis só em conteúdo** (ex.: "Olá! 👋" na Início). Se ficar estranho, avisar.

## 6. Ordem de aplicação (pra não quebrar tudo de uma vez)
1. Tema + tokens + `body` (seções 1–3). Rodar e olhar todas as telas.
2. Componentes da tabela da seção 4.
3. Ícones (seção 5).
4. Passar tela por tela corrigindo espaçamentos fora da escala: **Roteiro primeiro** (é o pior hoje), depois Início, Destinos, Central, Convidados, Custos, Meus documentos, Memórias.
Fazer um commit por etapa ("visual 1 tema", "visual 2 componentes", "visual 3 ícones", "visual 4 telas").

## 7. Atualizar o `CLAUDE.md`
- Trocar a regra "nossos CSS Modules sempre ganham / nada muda visualmente" por: **"visual = shadcn com o tema do Tairu (seção 2 do ajuste 72); componentes estilizados por classes do shadcn, sem sobrescrever com CSS Module; escala de espaçamento e tipografia da seção 3; ícones lucide."**
- Atualizar a seção de identidade visual (sai creme/gradiente, entra branco + stone + bordô).

## 8. Conferir (iOS e Android)
- [ ] `npm run build` passa.
- [ ] Nenhum fundo creme nem borda escura grossa sobrando em nenhuma tela.
- [ ] Roteiro: pílula de data selecionada com texto branco; sem faixa cinza de rolagem; Lista/Mapa pequeno à direita; espaços iguais entre blocos do cartão do dia.
- [ ] Abas iOS: trilho cinza claro, ativa branca com sombra sutil. Android: sublinhado bordô.
- [ ] Chips: selecionado bordô suave, não bordô cheio.
- [ ] Menu inferior e AppBar com ícones lucide.
- [ ] Botão principal bordô continua único por tela.
- [ ] Foco visível em tudo (Tab do teclado) e alvos de 44px.
- [ ] Prints de antes/depois de: Início, Destinos, Central, Roteiro (Sugestões e Lista), Custos.
