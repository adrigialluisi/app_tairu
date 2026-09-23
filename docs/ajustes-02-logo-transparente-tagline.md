# Ajustes — logo transparente + tagline (08/set/2026)

Ver `docs/tela-00-splash.md`, já atualizado — este arquivo só resume as mudanças em `src/screens/Splash.tsx` e `Splash.module.css`.

## 1. Logo sem caixa branca, em transparência

Hoje o `<img>` da logo está dentro de `.logoPanel`, que tem `background: var(--card)`, padding e sombra — é isso que está aparecendo como uma "borda branca" ao redor da logo.

- Remover o `.logoPanel` (ou zerar seu `background`, `padding`, `box-shadow`, `border-radius` — mais simples remover o wrapper e deixar só o `<img>` direto dentro de `.brand`).
- A logo (`#110F0D`, quase preta) só é legível sobre fundo claro — sem a caixa de apoio, ela precisa ficar posicionada sobre a parte **clara** do gradiente de fundo da tela (faixa de `--bg-top`), não solta no meio da tela inteira onde pode cair sobre uma parte mais escura do gradiente.
- Trocar o layout de `.brand`/`.screen`: em vez de centralizar o bloco da marca no meio de toda a altura da tela, ancorar perto do topo (ex.: `.screen` com `justify-content: space-between`, `.brand` com padding-top generoso em vez de `justify-content: center` ocupando o `flex: 1` inteiro) — o botão "Continuar" continua fixo embaixo.
- Resultado esperado: logo "flutuando" direto sobre o gradiente, sem card, sem sombra, sem borda — mas ainda com contraste alto por estar na parte clara.

## 2. Trocar a tagline

Texto atual: "Planeje viagens em grupo, do jeito que o grupo realmente decide."

Problema: presume que viajar em grupo é obrigatório/padrão. Não é — a etapa 2 do fluxo (convidar companheiros) é **totalmente opcional**, e metade da amostra de usuários do Mês 1 alterna entre viagens solo e em grupo (ver `../Site_Publicado/14-fluxo-proposto-mes2.html`, etapa 2).

Trocar por: **"Planeje viagens do seu jeito, sozinho ou em grupo."**

(Mesma cor/peso/tamanho de fonte de antes — só o texto muda.)

## Checklist antes de considerar pronto
- `npm run build` limpo.
- Testar 375px e 390px de largura — confirmar que a logo continua caindo sobre a parte clara do gradiente em telas menores também (o padding-top pode precisar de ajuste em telas muito baixas).
- Conferir visualmente que não sobrou nenhuma caixa/sombra atrás da logo.
- Reler a nova tagline em voz alta — tem que soltar natural, sem forçar a rima com a versão antiga.
