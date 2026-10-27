# Ajuste 96 — iPhone sem rolagem lateral e upload por contexto

Origem: primeiro teste real, num iPhone (Safari), com os arquivos do kit enviados pelo celular. Pedido da Adriana em 27/out/2026. Commit: `ajuste 96: iPhone sem rolagem lateral e upload por contexto`.

---

## 1. iPhone (Safari)

**Problema:** a página rolava pros lados e não se ajustava à largura.

**Causa mais provável:** os campos têm 15px (`--text-base`). Abaixo de 16px, o iOS dá zoom ao tocar no campo e não volta sozinho, e a tela ampliada rola pros lados. Na revisão do código não achei nenhum elemento com largura fixa maior que 375px: os carrosséis (`PlaceCard` de 200px, `EventCard` de 240px, viagens passadas de 180px) rolam por dentro, e as margens negativas (`-mx-4` dos carrosséis e da faixa presa) só ocupam o padding de 16px do miolo. Sem navegador automatizado nesta máquina, **a conferência em 375px e 390px fica pro aparelho**.

**Feito:**
- a. Miolo do `ScreenShell` com `overflow-x: hidden` e `overscroll-behavior-x: none`: o que passar da largura é cortado, sem rolagem lateral.
- b. `html` e `body` com `overflow-x: clip` (no Safari 16+; `hidden` de reserva) e `overscroll-behavior-x: none`. O `clip` foi preferido porque o `hidden` transformaria o `body` (que tem `height: 100%`) no contêiner de rolagem, quebrando o sticky da Início. Carrosséis e faixas de abas continuam rolando por dentro.
- c. `input` (menos checkbox, radio, range e file), `select` e `textarea` com `font-size: 16px !important` em `global.css`, por cima do 15px dos componentes.
- d. Menu fixo (`BottomNav`) com `replace`; os atalhos entre as 5 seções também (Roteiro → Custos/Central, Custos → Central/Convidados, "Ir pra Destinos" dos estados vazios, cards de próximo passo). As sub-abas (Central, Custos, Roteiro) já eram estado da tela, sem histórico. Início → seção, Documentos e as telas da viagem passada continuam com push.

## 2. Upload pelo celular, reconhecido pelo contexto

- a. Todo envio aceita `image/*` e `application/pdf`: o `VoucherUpload` (Transporte, Hospedagem, Outros) já aceitava; a nota em Custos passou a aceitar PDF; Documentos já aceitava em "Escolher arquivo" ("Tirar foto" continua só imagem, é a câmera).
- b. Ordem de leitura: 1º o nome (como antes, agora também com os `.jpg` do kit); 2º o contexto. Transporte e Hospedagem já caíam no voucher de exemplo da cidade (`TRANSPORT_EXAMPLE_BY_CITY`/`STAY_EXAMPLE_BY_CITY`): em Buenos Aires, LA 4550 e Magnolia. **Nota em Custos (muda a regra do ajustes-90):** foto ou PDF qualquer vira a nota do Don Julio (ARS 120.000, 15/11), ou a do Bocanáriz se o "Onde foi?" já for Santiago (`readReceiptFile(file, { cityId, fromStop })`). Aberto pela parada do Roteiro, a foto qualquer continua sem inventar o valor (o formulário já vem com o lugar e pede o total).
- c. A faixa verde "confira os campos" aparece como antes.
- d. `voucher-voo-buenosaires-santiago.jpg` e `voucher-hotel-buenosaires-magnolia.jpg` copiados do `Kit_Teste_Usabilidade/` pra `public/mock-vouchers/` e cadastrados com os mesmos dados do PDF. A `nota-don-julio-buenosaires.jpg` do kit é igual à de `public/mock-receipts/`.
- e. Teste: `src/data/mockReceipts.test.ts` (IMG_0001.jpg em Lançar gasto → ARS 120.000, 15/11; Santiago → Bocanáriz; nome do kit vale mais que o contexto; parada não inventa). O Transporte e a Hospedagem de Buenos Aires com IMG_0001.jpg (→ LA 4550 e Magnolia) foram conferidos com um script avulso: o `mockVouchers.ts` importa a base de aeroportos e não roda no `node --test` puro.
