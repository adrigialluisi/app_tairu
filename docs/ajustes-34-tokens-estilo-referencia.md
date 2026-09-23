# Ajuste 34 — Remodelar tokens de base a partir dos prints de referência (fase 1 de N)

Pedido da Adriana (15/set/2026), a partir de 2 leva de prints (apps de viagem — mapa/itinerário/formulário; e detalhe de hospedagem/itinerário/busca): "Design clean com as informações fáceis de achar... usar esses prints de exemplo para construir os componentes do app... primeiro remodelar nossos tokens. Manter apenas as cores do Tairu."

**Este é só a fase 1 (tokens de base).** Fases seguintes (ainda não especificadas, roadmap no fim deste doc) vão aplicar esses tokens nos componentes de verdade (cards, abas/timeline, menu, botões) tela por tela.

Prints salvos em `docs/referencias/referencia-01-mapa-itinerario-clima.png` e `docs/referencias/referencia-02-hospedagem-itinerario-busca.png` — abrir e olhar direto neles antes de cada fase, não confiar só na descrição abaixo.

## O que os prints têm em comum, sem entrar em cor

- Cantos bem arredondados e generosos em cards/fotos (~20px), sem a diferença grande que o protótipo tem hoje entre iOS (24px) e Android (12px) — as referências não têm essa distinção, é uma linguagem só.
- Fotos grandes, cheias (edge-to-edge dentro do card), com selo/badge sobreposto por cima (nome do lugar, "Maldives", coração de favorito) — já é o padrão que o `TripHeroCard` do `ajustes-30` começou a usar.
- Linha do tempo vertical: linha conectora fina + bolinha por parada, horário à esquerda, título em negrito + subtítulo mais leve/apagado, ícone pequeno à direita — muito parecido com o que o `ajustes-27` tentou construir (que você achou que "não ficou bom"). Vale revisitar esse componente na fase 2 com essas referências concretas.
- Chips/abas em pílula, com o item selecionado preenchido e os outros só com borda.
- Espaçamento generoso dentro dos cards (parece maior que o `--space-4` de 16px que a maioria dos cards do protótipo usa hoje).
- Títulos grandes e em negrito (saudação, nome do lugar/viagem), subtítulos e metadados visivelmente mais leves/apagados — hierarquia tipográfica clara, mas hoje o protótipo não tem uma escala de tamanhos definida como token, cada componente usa um valor solto.
- Sombra suave e "flutuante" nos cards com foto, não uma borda dura.

## O que NÃO muda

- Nenhuma cor. `--bg-top/mid/low/bottom`, `--accent`, `--accent-dark`, `--card`, `--card-border`, `--text`, `--muted`, `--field-border` continuam exatamente como estão — são as cores do Tairu, já validadas em WCAG AA (ver comentário no topo do `tokens.css`, não mexer nele).
- A fonte (`--font-ios`/`--font-android`) continua a mesma — as referências têm um toque serifado num dos sets, mas isso é identidade visual do app de exemplo, não da Tairu (mesma lógica do "Figma: estrutura sim, tokens não" já registrada no CLAUDE.md).
- A alternância de casca iOS/Android continua existindo pros elementos de navegação (barra, abas, botão de ação) — só o raio de cantos de cards/fotos deixa de variar tanto entre plataformas (ver abaixo).

## `src/styles/tokens.css` — adições (nada é removido, só acrescentado)

```css
/*
  Escala tipográfica — antes cada componente usava um font-size solto
  (Home tinha 20px pro nome da viagem, AppBar 19px pro título, etc., sem
  token nenhum). Adicionado agora como base pra fase 2 (componentes)
  reaproveitar em vez de continuar inventando valor por componente.
*/
--text-2xl: 28px;  /* título de tela, ex. "Olá! 👋" */
--text-xl: 20px;   /* nome de card grande, título de seção */
--text-lg: 17px;   /* título de item de lista, linha de timeline */
--text-base: 15px; /* corpo padrão */
--text-sm: 13px;   /* metadado, legenda, texto --muted */

--font-weight-bold: 800;
--font-weight-semibold: 700;
--font-weight-medium: 600;
--font-weight-regular: 400;

--line-height-tight: 1.2;
--line-height-normal: 1.4;

/* Passo novo na escala de espaçamento — pra padding interno de card mais generoso que --space-4, sem pular direto pro --space-6 */
--space-5: 20px;

/*
  Raio de cantos pra CONTEÚDO com foto (hero card, cards de lugar, fotos
  de capa) — único pras duas plataformas, porque as referências não
  diferenciam isso por sistema (diferente dos raios de CHROME de
  navegação abaixo, que continuam com --radius-ios-card/
  --radius-android-card do jeito que estão, sem mudança).
*/
--radius-photo: 20px;

/* Android ganha um pouco mais de arredondamento nos cards — reduz a distância visual do iOS sem apagar a diferença de plataforma */
--radius-android-card: 16px; /* era 12px */

/* Sombras mais suaves e "flutuantes", pra cards com foto */
--shadow-card: 0 4px 20px rgba(43, 42, 46, 0.10); /* era 0 2px 12px rgba(43, 42, 46, 0.08) */
--shadow-photo: 0 8px 28px rgba(43, 42, 46, 0.14); /* nova, só pra fotos grandes tipo hero card */
```

(As duas linhas que trocam valor existente — `--radius-android-card` e `--shadow-card` — substituem a linha atual no lugar, não duplicam.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Nenhuma cor mudou — abrir o app do jeito que está hoje (antes de qualquer componente ser migrado pra usar os tokens novos) deve parecer idêntico visualmente, já que só foram ADICIONADOS tokens novos e trocados 2 valores (raio do card Android, sombra) que ainda não aparecem em lugar nenhum visível até a fase 2 usar `--radius-photo`/`--shadow-photo` de propósito.
- Os comentários de contraste WCAG no topo do arquivo continuam intactos.

## Roadmap das próximas fases (ainda não especificadas — só o rumo)

1. **Fase 2 — Cards com foto** (`docs/ajustes-35-...md`, construído): `TripHeroCard` (Início) e os cards de lugar da aba Lugares do Roteiro passam a usar `--radius-photo`/`--shadow-photo`/`--space-5`.
2. **Fase 3 — Fundo mais branco** (`docs/ajustes-38-fase3-fundo-mais-branco.md`, `docs/ajustes-39-sheet-branco-inputs-mais-leves.md`): o `ScreenShell` (todas as 5 telas do menu fixo + `ComingSoon`) troca o gradiente pêssego→verde-azulado por branco sólido. O `ajustes-38` só deixou branca a faixa do `AppBar` (sem interação); o `ajustes-39` corrigiu pro branco ficar no "sheet" — a área onde a pessoa de fato interage (campos, botões) — e afinou borda/cantos dos inputs (`--radius-android-input` de 8 pra 14px).
3. **Fase 4 — Timeline do Roteiro**: revisita o `TimelineStop` do `ajustes-27` com as referências de itinerário em mãos — é a chance de resolver o "não ficou bom" com um alvo visual concreto em vez de tentar de novo às cegas.
4. **Fase 5 — Chips/abas e menu**: `Tabs`, `BottomNav`/menu fixo, filtros — pílulas mais próximas do que as referências mostram.
4. Outras telas conforme forem sendo revisadas.

Cada fase continua sendo um ajuste separado, testado e confirmado antes da próxima — mesmo ritmo de sempre.
