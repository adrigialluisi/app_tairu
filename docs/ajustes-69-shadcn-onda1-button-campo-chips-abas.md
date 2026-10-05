# Ajuste 69 — shadcn/ui, onda 1: Button, TextField, grupos de chips e Tabs

Pedido da Adriana (02/out/2026): usar o **shadcn/ui** como base dos componentes pra melhorar a UI, mantendo a identidade do Tairu. A instalação (Tailwind sem reset global, tema mapeado pros tokens do Tairu, MCP do shadcn, `CLAUDE.md` atualizado) já foi feita na branch `prototipo-mes2-shadcn`, sem mudar nenhuma tela.

Esta é a **onda 1**: os 4 componentes que aparecem em quase todas as telas.

| Nosso componente | Usado em | Base shadcn |
|---|---|---|
| `shell/Button.tsx` | 24 arquivos | Button (já instalado em `ui/button.tsx`) |
| `inputs/TextField.tsx` | 11 arquivos | Input + Label (+ Field, se o registro tiver) |
| `quiz/OptionChipGroup.tsx` e `MultiOptionChipGroup.tsx` | 10 arquivos | Toggle Group (`type="single"` / `type="multiple"`) |
| `shell/Tabs.tsx` | 4 arquivos (+ telas que usam as variantes) | Tabs |

## Regra principal: trocar por dentro, sem mexer nas telas

- **Cada componente nosso continua existindo com o mesmo nome, o mesmo caminho e as mesmas props.** Só o miolo passa a usar o componente do shadcn. Assim **nenhum arquivo de tela muda** nesta onda, e o risco fica concentrado em 5 arquivos.
- **Instalar pelo MCP do shadcn** (consultar o registro antes; nunca copiar componente de memória). Os arquivos do shadcn ficam em `src/components/ui/`.
- **Estilo só pelos tokens do Tairu** (já mapeados no `index.css`). Nada de cor nova, nada de cinza padrão do shadcn.
- **Não perder o que já foi corrigido nos ajustes anteriores:**
  - alvo de toque mínimo **44px** em tudo que é clicável;
  - foco visível sem duplicar (ver ajustes 08–10 sobre `:focus-visible`);
  - **iOS vs Android**: raio e fonte por `data-platform` (já no tema); botão de pílula no iOS, raio 16px no Android;
  - um só botão primário por tela (as telas já seguem isso; só não quebrar).

## 1. Button (`shell/Button.tsx`)
- Manter as props atuais (`variant` primary/secondary/…, `fullWidth`, `disabled`, `onClick`, `type`, children).
- Mapear: `primary` → variante default do shadcn (bordô, hover `--accent-dark`, como já ajustado em `ui/button.tsx`); `secondary` → `outline` com borda e texto nos tokens; outras variantes que existirem → a mais próxima (`ghost`, `link`).
- Altura mínima 44px (48px se for a altura atual), `fullWidth` → `w-full`.

## 2. TextField (`inputs/TextField.tsx`)
- Manter as props (`id`, `label`, `value`, `onChange(string)`, `placeholder`, `error`, `inputMode`, `autoComplete`, `autoCapitalize`, `onKeyDown`, `hint` se houver).
- Rótulo sempre visível com `Label` ligado por `htmlFor`; erro abaixo, ligado por `aria-describedby`, cor `--error`; `aria-invalid` quando houver erro.
- Visual: pílula no iOS, raio 14px no Android (tokens `--radius-ios-input` / `--radius-android-input`), borda `--field-border`, foco `--field-border-focus`.
- O `autoComplete="off"` e as correções de autofill do `ajustes-19` precisam continuar valendo.

## 3. OptionChipGroup e MultiOptionChipGroup (`quiz/`)
- Manter as props (`legend`, `options`, `value`/`values`, `onChange`/`onToggle`).
- Por dentro: `ToggleGroup` `type="single"` / `type="multiple"`, dentro de um `fieldset` com `legend` visível (mesmo espaçamento legend → chips de 24px do `ajustes`).
- Chip selecionado: fundo `--accent`, texto branco; não selecionado: borda `--field-border`, fundo transparente. Altura mínima 44px, quebra de linha permitida (`flex-wrap`).
- **Comportamento atual de seleção única não muda**: se hoje tocar no chip já selecionado não desmarca, continuar assim (o ToggleGroup single desmarca por padrão; impedir isso ignorando valor vazio).

## 4. Tabs (`shell/Tabs.tsx`)
- Manter as props (`name`, `label`, `items`, `value`, `onChange`, `iconOnly`, `variant="pill-date"`).
- Variante padrão: `Tabs` do shadcn. **iOS** como controle segmentado (pílula com fundo); **Android** como abas com sublinhado (é a regra do roteiro de teste).
- `iconOnly`: ícone visível + `aria-label` com o rótulo.
- `variant="pill-date"`: continua nossa (mês em cima, dia embaixo, rolagem horizontal), só reaproveitando a lógica de teclado/foco do Tabs do shadcn por baixo, se encaixar sem esforço; se não encaixar, deixar como está e anotar.
- Navegação por setas do teclado continua funcionando (o shadcn já faz).

## 5. Conferir (no navegador, nos dois modos iOS e Android)
- [ ] `npm run build` passa.
- [ ] Abrir o app (`npm run dev`) e percorrer: Início, Destinos (passos 1 e 2), Central (3 abas), Convidados, Roteiro (Sugestões, Roteiro com pills de data, Dicas), Custos (3 abas), Meus documentos, Memórias.
- [ ] Botões, campos, chips e abas com a cor bordô do Tairu, nenhum cinza padrão do shadcn aparecendo.
- [ ] Tudo clicável com pelo menos 44px; foco visível com Tab do teclado.
- [ ] Modo Android: abas sublinhadas, Roboto, raio 16px. Modo iOS: abas em pílula, fonte do sistema.
- [ ] Nada mudou de lugar nas telas (só o acabamento dos componentes).
- [ ] Listar, no fim, qualquer diferença visual que não deu pra evitar.
- [ ] Commit na branch `prototipo-mes2-shadcn` ("shadcn onda 1").

## Próximas ondas (pra referência, não fazer agora)
- **Onda 2**: Switch, Badge (chips/selos/tags), Avatar (`MemberAvatars`), Sonner (`SaveToast`), Alert (`SuggestionCard`), Empty (estados vazios).
- **Onda 3**: Native Select (`CurrencySelect`, seletor de dia), Combobox (`DestinationField`, `HotelSearchField`), Calendar/Date Picker (`DateRangeField`).
- **Onda 4**: Card nos cards (Documentos, Gastos, Lugares, Eventos, Retrospectiva, resumo de Custos), Dialog (`PhotoViewer`), Collapsible, Table (conversor), Carousel/Scroll Area (Sugestões), Chart (barra de Custos).
- Continuam nossos: AppBar, BottomNav, ScreenShell, PlatformSwitcher, RouteMap, TimelineStop, AgendaRow, AttachmentList, VoucherUpload.
