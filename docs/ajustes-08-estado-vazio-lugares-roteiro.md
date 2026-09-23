# Ajuste 08 — Mensagem clara quando não tem viagem cadastrada

## Causa (não é bug, é comportamento esperado do protótipo)

`SelectPlaces.tsx` e `Itinerary.tsx` dependem de `trip.destinations`/`trip.dateStart`/`trip.dateEnd`, que só existem depois que a pessoa passa pela Tela 1 (Criar viagem). Como o estado é só em memória (sem backend, de propósito — ver `CLAUDE.md`), um refresh de página ou uma navegação direta pra `/lugares` ou `/roteiro` sem passar pela Tela 1 zera esse estado. Hoje, nesse caso, as duas telas renderizam praticamente em branco (só título/subtítulo, sem tabs, sem lista, sem dicas) — confuso pra quem não sabe a causa, e um risco real: se um participante do teste der refresh sem querer no meio da sessão, a tela fica vazia sem explicação.

## O que mudar

Em `SelectPlaces.tsx`, quando `trip.destinations.length === 0`: mostrar uma mensagem substituindo o conteúdo principal (tabs + lista), tipo "Essa viagem ainda não tem destinos cadastrados. Volte e cadastre a viagem primeiro." com um botão "Ir pra Criar viagem" (`navigate('/criar-viagem')`).

Em `Itinerary.tsx`, quando `trip.destinations.length === 0` ou faltar `dateStart`/`dateEnd`: mesma ideia — mensagem clara + botão de voltar pro começo do fluxo (`navigate('/criar-viagem')`), em vez de renderizar as abas/seções vazias.

Isso é só uma rede de segurança visual — não muda a regra de nada pré-preenchido nem cria dado falso, só explica com clareza por que a tela está vazia quando não tem viagem cadastrada.

## Checklist

- `npm run build` limpo.
- Testar: abrir o protótipo direto em `/#/lugares` ou `/#/roteiro` sem passar pela Tela 1 antes — deve aparecer a mensagem + botão, nunca tela em branco.
- Fluxo normal (Splash → Criar viagem → ... → Lugares → Roteiro) continua funcionando exatamente como antes.
