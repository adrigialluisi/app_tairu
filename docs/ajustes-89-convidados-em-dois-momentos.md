# Ajuste 89 — Convidados em dois momentos: planejar sozinha, e "dois dias depois" as novidades do grupo

Origem: teste de 13/out/2026. Decisão da Adriana: mostrar as contribuições dos convidados enquanto a participante ainda está montando a viagem confunde (não fica claro o que foi ela e o que veio dos outros). Todas as pessoas entrevistadas são **organizadoras**, então o teste passa a ter dois momentos:

- **Parte A — "Planejando sozinha":** ela cria a viagem, convida, coloca reservas, escolhe lugares, lança gasto. Os convidados ficam em "Convite enviado". Nada dos outros aparece.
- **Parte B — "Dois dias depois":** o moderador aciona um controle escondido; o app simula que a pessoa "abriu o app de novo" e mostra as novidades: quem entrou, o que sugeriram, o que pagaram.

Substitui a mecânica do ajuste 67 (convidado "entra" 2,5 s depois de convidado e já despeja tudo).

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 89: convidados em dois momentos com novidades do grupo`.

---

## 1. Parte A: convite fica em "Convite enviado"

- Remover o `scheduleMockJoin` automático de 2,5 s (`TripContext.tsx`). Todo convite, inclusive Marina e Rodrigo, fica em **"Convite enviado"**.
- O resto do fluxo de convite continua igual (corrigir e cancelar convite, ajuste 83).

## 2. Controle do moderador: "Simular 2 dias depois"

- **Toque longo (~800 ms) no seletor iOS/Android** (`PlatformSwitcher`) abre um pequeno menu discreto, com o título "Moderador" e duas opções:
  1. **"Simular: 2 dias depois"**
  2. **"Recomeçar teste"** (chama `resetTrip()` e volta pra Splash, pra preparar o próximo participante)
- Nada disso aparece num toque normal; o toque curto continua alternando iOS/Android.
- "Simular 2 dias depois" só fica ativo se Marina e/ou Rodrigo (e-mails do cenário) foram convidados. Se não, mostrar "Convide a Marina e o Rodrigo primeiro". Depois de usado uma vez, fica desativado até "Recomeçar teste".
- Ao acionar:
  1. Marina e Rodrigo (só os do cenário que foram convidados) passam para **"Na viagem"**.
  2. As contribuições deles são aplicadas (item 3).
  3. O app **vai pra Início** (simula reabrir o app) e mostra um **banner no topo, estilo notificação do celular**, por ~5 s: ícone do Tairu + "Marina e Rodrigo entraram na viagem e adicionaram 6 lugares e 2 gastos". Tocar no banner rola até o bloco de novidades.

## 3. Contribuições menores e coerentes

`src/data/mockCompanions.ts`:
- **Lugares: 1 por cidade por pessoa** (2 por cidade no total), em vez de 6 por pessoa:
  - Marina: `ba-don-julio`, `sc-bocanariz`, `atc-laguna-cejar`
  - Rodrigo: `ba-la-bombonera`, `sc-mercado-central`, `atc-valle-de-la-luna`
- **Gastos só quando fazem sentido.** Cada gasto simulado ganha um campo `requires`, e só é criado se a condição existir na viagem no momento da simulação:
  - Rodrigo — "Transfer Ezeiza → hotel" (ARS 45.000): `requires: { type: 'transport-arrival', cityId: 'buenos-aires-ar' }` (existe um transporte chegando em Buenos Aires na Central) **ou** `{ type: 'stay', cityId: 'buenos-aires-ar' }` (existe hospedagem em Buenos Aires).
  - Marina — trocar o tour do Tatio por **"Tour Laguna Cejar (3 pessoas)"**, CLP, ligado ao lugar que ela mesma sugeriu: `requires: { type: 'place', placeId: 'atc-laguna-cejar' }`. Manter um valor plausível e marcar no código que é dado simulado.
- Se a condição não existir, o gasto não aparece (e não aparece depois sozinho).

## 4. Bloco "Novidades na viagem" na Início

- Acima de "Avisos", um bloco **"Novidades na viagem"** que aparece depois da simulação:
  - "Marina Duarte e Rodrigo Antunes entraram na viagem" (avatares).
  - "6 lugares sugeridos" → leva ao Roteiro → Sugestões (cidade com mais novidades).
  - "2 gastos lançados" (ou 1) → leva a Custos → Lançamentos.
- Cada linha some depois que a pessoa visita aquela seção. Quando todas forem vistas, o bloco some.

## 5. Selos do menu: ✓ é só seu; novidade é número

Em `BottomNav.tsx` e `utils/tripProgress.ts`:
- **✓ só por ação de quem está usando:**
  - Roteiro: ✓ se existe lugar ou evento com `addedBy === 'voce'` ou com `'voce'` em `alsoWantedBy`.
  - Custos: ✓ se existe gasto lançado pela participante ou custo vindo da Central que ela cadastrou. Gasto de convidado não conta.
- **Selo de novidade com número** (cinza escuro, igual ao contador de Convidados) em Roteiro, Custos e Convidados, contando o que chegou na simulação e ainda não foi visto. O número some quando a pessoa abre a seção.
- Se uma seção tem ✓ e novidade ao mesmo tempo, mostrar o número (novidade tem prioridade); o ✓ volta depois de visto.

## 6. Marca "Novo" nos itens

- Lugares sugeridos e gastos lançados na simulação ganham um selo pequeno **"Novo"** no cartão (Sugestões, parada do Roteiro e lançamento em Custos), até a seção ser visitada.
- Os selos de autoria que já existem ("Selecionado pelo grupo", "Sugerido por Marina", "Lançado por Rodrigo") continuam.

## 7. Estado

No `TripContext`: `groupUpdateSimulated: boolean`, `unseenUpdates: { roteiro: string[]; custos: string[]; convidados: string[] }` (ids dos itens novos), e `markSectionSeen(section)`. Tudo zera em `resetTrip()`.

---

## Checklist de aceite
- [ ] Convidar Marina e Rodrigo deixa os dois em "Convite enviado"; nada aparece em Roteiro ou Custos.
- [ ] Toque longo no seletor iOS/Android abre o menu "Moderador"; toque curto continua alternando.
- [ ] "Simular 2 dias depois" leva à Início com o banner e o bloco "Novidades na viagem".
- [ ] 2 lugares sugeridos por cidade (1 de cada convidado).
- [ ] Transfer do Rodrigo só aparece se houver chegada ou hotel em Buenos Aires na Central.
- [ ] ✓ de Roteiro e Custos só com ação própria; números de novidade somem ao visitar.
- [ ] Selo "Novo" nos itens até a seção ser vista.
- [ ] "Recomeçar teste" zera tudo.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
