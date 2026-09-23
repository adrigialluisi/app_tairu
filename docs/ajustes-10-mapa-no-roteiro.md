# Ajuste 10 — Visualização em mapa no Roteiro (Tela 4b)

Pedido da Adriana (10/set/2026): incluir mapa nessa etapa. Contexto real, não é feature nova do nada — o app atual já tem um "mapa dinâmico" elogiado pela Vera ("mapa automático ao inserir endereço numa atividade"), mas com entrega parcial (só funcionava com evento inserido manualmente, sem rastreamento em tempo real — ver `../../Instrucoes/09-entrega-prometida-vs-real.md`, item 4). O fluxo novo do Mês 2 não tinha essa etapa desenhada ainda; entra agora, ligada ao Roteiro (Tela 4b), mostrando os lugares marcados no mapa.

**Decisões confirmadas com a Adriana:**
- Mapa entra no **Roteiro (Tela 4b)**, não vai esperar a Linha do tempo (Tela 7, ainda não construída).
- Mapa **real**, com geografia de verdade (OpenStreetMap via Leaflet) — não um mapa esquemático. Isso é a única parte do protótipo que depende de internet (ver exceção documentada no `CLAUDE.md`).

## Dependências novas

```
npm install leaflet react-leaflet
npm install -D @types/leaflet
```

Tiles do OpenStreetMap (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) — uso padrão gratuito, sem chave de API, respeitando a política de uso da OSM (não é pra produção em escala, mas serve bem pra um protótipo de teste com poucos usuários).

## Dados: `places.json` ganhou `lat`/`lng`

`docs/dados/places.json` foi atualizado — cada lugar agora tem `lat` e `lng` (coordenadas reais, de fontes públicas conhecidas dos próprios monumentos/locais, precisão de bairro/quarteirão). Recopiar esse arquivo por cima de `src/data/places.json` (mesmo processo de antes, o conteúdo mudou).

## Comportamento na Tela 4b

- Dentro da aba "Roteiro" (não na aba "Dicas locais"), um alternador **Lista / Mapa** (mesmo padrão visual de abas/segmented já usado no protótipo — iOS pílula, Android sublinhado).
- **Modo Mapa**: mostra um mapa Leaflet centralizado no destino ativo (mesmo seletor de destino já usado — Buenos Aires/Santiago), com um pino pra cada lugar marcado na Tela 4a **daquele destino**. Lugares customizados (`customLabel`, sem `placeId`) não têm coordenada — não aparecem no mapa, só na lista (nota discreta no mapa: "N lugares sem localização não aparecem aqui").
- Cada pino é **numerado ou colorido pelo dia** do roteiro em que está alocado (mesma cor/número que aparece no modo Lista pra aquele item) — pra dar pra reconhecer visualmente "isso é do Dia 2", etc. Lugar marcado como "pulei" aparece com pino visualmente diferenciado (não só cor — usar opacidade reduzida + ícone, mesma regra de nunca indicar estado só por cor).
- Tocar num pino abre um popup simples: nome do lugar, bairro, dia do roteiro (ou "pulado").
- Zoom/posição inicial do mapa: enquadrar automaticamente todos os pinos daquele destino (bounds fit), não um zoom fixo arbitrário.
- Fallback: se a Adriana estiver sem internet durante um teste, o mapa não carrega os tiles — nesse caso mostrar uma mensagem simples no lugar do mapa ("Mapa precisa de internet — sem conexão agora") em vez de quebrar a tela; o modo Lista continua funcionando normalmente.

## Acessibilidade

- Alternador Lista/Mapa com padrão de tab acessível, igual ao já usado em Roteiro/Dicas locais.
- Mapa em si tem limitação conhecida de acessibilidade pra leitor de tela (é assim em qualquer mapa interativo) — por isso o modo Lista continua sendo a via principal, o mapa é um complemento visual, nunca a única forma de ver a informação.
- Popup do pino, quando aberto, precisa ser fechável por teclado (Esc) e focável.

## Checklist antes de considerar pronto

- `npm run build` limpo.
- Alternar entre Lista e Mapa funciona nos dois destinos (Buenos Aires e Santiago) do cenário de teste.
- Pinos aparecem nas posições geográficas corretas (conferir visualmente: Recoleta não pode aparecer em cima de La Boca, por exemplo).
- Tocar num pino mostra o popup com nome/bairro/dia.
- Lugar customizado (sem coordenada) não quebra o mapa, só fica de fora dele.
- Testar em 375px e 390px, nas duas variantes iOS/Android.
- Espaçamento segue a regra geral do `CLAUDE.md`.
