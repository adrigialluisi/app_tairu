# Ajuste 44 — Encurta o aviso "essa viagem tem N destinos"

Feedback da Adriana (22/set/2026), vendo o aviso (reposicionado no `ajustes-43`) logo abaixo do título "Perfil da viagem": texto longo demais. Pediu pra encurtar, mantendo: quantos destinos a viagem tem, pedir pra marcar tudo que fizer sentido, e explicar o porquê — é isso que direciona as sugestões de dicas no roteiro.

## O que muda

**`src/components/quiz/TripProfileQuiz.tsx`** — trocar só o texto do parágrafo (mesma condição `trip.destinations.length > 1`, mesma classe `styles.multiDestinationHint`, mesma posição definida no `ajustes-43`):

Texto atual:
```
Essa viagem tem {N} destinos — pense em todos eles ao responder as próximas duas perguntas. Marque tudo que fizer sentido pra qualquer um dos lugares, mesmo que eles sejam bem diferentes entre si (ex.: um destino mais urbano e outro mais de natureza).
```

Texto novo:
```tsx
<p className={styles.multiDestinationHint}>
  Essa viagem tem {trip.destinations.length} destinos — marque tudo que fizer sentido pra qualquer um deles,
  é isso que direciona as sugestões de dicas no roteiro.
</p>
```

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Numa viagem com 2+ destinos, o aviso aparece curto, logo abaixo do título "Perfil da viagem" (posição do `ajustes-43` intacta), com o número certo de destinos.
