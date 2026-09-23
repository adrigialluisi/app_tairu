# Ajuste 20 — Corrigir regressão: menu voltou a aparecer a cada tecla digitada

Ao implementar `docs/ajustes-19-autofill-navegador.md`, o campo "Nome da viagem" em `CreateTrip.tsx` foi reescrito assim:

```tsx
<TextField
  id="trip-name"
  label="Nome da viagem"
  placeholder="Ex.: Réveillon em família"
  value={trip.name}
  onChange={(value) => {
    trip.setName(value);
    if (value.trim().length > 0) trip.markTripStarted();
  }}
  autoComplete="off"
  required
/>
```

Isso **remove o fix do `docs/ajustes-16-menu-aparece-so-ao-confirmar-nome.md`**: `markTripStarted()` agora dispara dentro do `onChange`, ou seja, a cada tecla digitada — exatamente o comportamento "esquisito" que o ajustes-16 tinha corrigido (menu aparecendo no meio da digitação, não só ao confirmar o nome). Foi um efeito colateral não intencional de resolver o autofill — precisa reverter só essa parte, mantendo o `autoComplete="off"` (esse continua certo).

## Correção — voltar pra blur/Enter, mas mais robusta contra autofill

Em vez de reler `trip.name` do estado do React (que foi a causa de desconfiar de dessincronia com autofill), ler o valor **direto do DOM** no momento do blur/Enter (`e.target.value` / `e.currentTarget.value`) — isso funciona independente de o autofill ter disparado `onChange` corretamente ou não, porque o navegador sempre atualiza o valor real do `<input>` no DOM, mesmo quando não dispara o evento que o React escuta:

```tsx
<TextField
  id="trip-name"
  label="Nome da viagem"
  placeholder="Ex.: Réveillon em família"
  value={trip.name}
  onChange={trip.setName}
  onBlur={(e) => {
    if (e.target.value.trim().length > 0) trip.markTripStarted();
  }}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim().length > 0) trip.markTripStarted();
  }}
  autoComplete="off"
  required
/>
```

Diferença chave em relação ao `ajustes-16` original: ali a checagem lia `trip.name.trim().length > 0` (estado do React); agora lê `e.target.value`/`e.currentTarget.value` (valor real do input no DOM). Isso resolve os dois problemas ao mesmo tempo — nem dispara a cada tecla (só no blur/Enter), nem depende do `onChange` ter sincronizado o estado corretamente.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Digitar no campo "Nome da viagem" **não** faz o menu aparecer a cada tecla — só ao sair do campo (clicar fora) ou apertar Enter.
- Depois de aparecer uma vez, o menu continua visível mesmo se o nome for apagado depois (comportamento do `ajustes-16`, não mudou).
- `autoComplete="off"` continua no campo (não regredir o `ajustes-19`).
- Testar de novo com autofill do navegador ativo (Safari, campo sugerindo algum valor salvo): mesmo que aconteça, sair do campo com qualquer texto real digitado deve acionar o menu normalmente.
