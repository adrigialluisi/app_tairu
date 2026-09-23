# Tela 0 — Splash

## Objetivo
Primeira tela que o participante do teste vê ao abrir o link. Só isso: identidade da marca + um jeito de entrar.

## Conteúdo
- Fundo com o gradiente da identidade visual (`--bg-top` → `--bg-bottom`).
- Marca do Tairu centralizada verticalmente, usando o arquivo real da logo (não é mais placeholder):
  - `public/logo/LogoTairu.svg` — símbolo/wordmark sem tagline (242×203). Servido como asset estático — referenciar por URL (`/logo/LogoTairu.svg`), não por import do bundler. Fica nessa pasta justamente pra poder ser substituído no futuro (a Adriana troca o arquivo, sem precisar mexer em código).
  - `public/logo/LogoTairu_Tagline.svg` — versão com tagline (243×246), mesma lógica de substituição.
  - Usar a versão **sem tagline** na Splash (tela pequena, foco em entrar rápido); a versão com tagline fica disponível pra outros usos (ex.: alguma tela de apresentação/onboarding futura, se surgir).
  - **A logo fica em transparência — sem card, sem caixa, sem borda branca ao redor.** Nada de `background`/padding/sombra por trás do `<img>`.
  - **Atenção de contraste, resolvida por posicionamento, não por caixa de fundo:** os SVGs são monocromáticos, preenchidos em `#110F0D` (quase preto) — só ficam legíveis sobre fundo claro. Como a logo é transparente, ela tem que ficar posicionada sobre a **parte clara do gradiente** (a faixa de `--bg-top`/começo de `--bg-mid`, não centralizada no meio da tela toda) — ancorar o bloco da marca perto do topo (ex.: `justify-content: flex-start` com padding-top generoso, botão "Continuar" fixo embaixo por `justify-content: space-between` no container da tela), nunca deixar cair sobre a parte escura do gradiente (perto de `--bg-bottom`).
  - Não recolorir o SVG sem confirmar com a Adriana — a cor `#110F0D` é a original enviada por ela.
- Tagline em texto (não a versão SVG): **"Planeje viagens do seu jeito, sozinho ou em grupo."** — a versão anterior ("Planeje viagens em grupo...") presumia grupo como obrigatório, o que contradiz a etapa 2 do fluxo (convite é totalmente opcional; metade da amostra do Mês 1 alterna entre viagens solo e em grupo). Nunca reintroduzir uma tagline que dê a entender que viajar em grupo é o caso padrão ou obrigatório.
- Um botão "Continuar" (estilo iOS/Android conforme a plataforma ativa) que leva pra Tela 1 (Criar viagem).
- Sem campos, sem login, sem lógica de autenticação — fora de escopo deste protótipo.

## Estado
Estático, sem dado nenhum pra carregar. Não precisa de loading real (é só a tela de abertura do teste).
