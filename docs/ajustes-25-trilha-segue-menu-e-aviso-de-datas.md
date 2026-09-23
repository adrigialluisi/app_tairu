# Ajuste 25 — Sugestão de próximo passo segue a ordem do menu + aviso quando faltam datas

Feedback da Adriana (11/set/2026), testando o fluxo novo (`ajustes-22`/`23`): "depois de destinos ele tá indo direto pra roteiro, pulando membros. Eu clico nos pontos turísticos mas ele não tá montando o roteiro."

São dois problemas distintos, os dois rastreados no código real:

## 1. A sugestão depois de salvar o Perfil da viagem pulava Membros

Em `CreateTrip.tsx`, depois de salvar o Passo 2 (Perfil da viagem), o card de sugestão apontava direto pro Roteiro ("Tudo pronto! Já pode montar o roteiro do dia a dia" → `/roteiro`). Isso contraria a ordem visual do menu fixo (Destinos, **Membros**, Roteiro, Reservas, Documentos, Gastos) — a trilha ia Destinos→Roteiro→Membros, só chegando em Membros depois, quando já tinha lugar escolhido no Roteiro. Corrigido pra seguir a mesma ordem do menu: **Destinos→Membros primeiro**.

**`CreateTrip.tsx`** — trocar:

```tsx
{perfilSaved && trip.selectedPlaces.length === 0 && (
  <SuggestionCard
    message="Tudo pronto! Já pode montar o roteiro do dia a dia."
    actionLabel="Ir pro Roteiro"
    to="/roteiro"
    storageKey="ir-pro-roteiro"
  />
)}
```

por:

```tsx
{perfilSaved && trip.companions.length === 0 && (
  <SuggestionCard
    message="Tudo pronto! Já pode convidar quem vai com você pra essa viagem."
    actionLabel="Convidar companheiros"
    to="/convidar"
    storageKey="ir-pro-membros"
  />
)}
```

O card de sugestão que já existia em `Itinerary.tsx` ("Já tem lugares escolhidos. Quer convidar alguém pra essa viagem?" → `/convidar`) **continua igual, sem mudança** — ele serve como um segundo lembrete, caso a pessoa pule o primeiro (em Destinos) e vá direto pro Roteiro pelo próprio menu.

## 2. Roteiro "não monta" quando falta data nos destinos — provável causa, precisa confirmar

O Roteiro dia a dia (aba "Roteiro" dentro da seção Roteiro) só consegue existir quando pelo menos um destino tem **as duas datas preenchidas** (`splitDaysByDestination` filtra por `dateStart && dateEnd` — um destino sem data simplesmente não entra em nenhum dia). Isso é comportamento antigo, não é bug novo — mas o `ajustes-23` tornou bem mais fácil chegar até aqui sem preencher datas: o botão "Salvar destinos" está liberado com qualquer destino, mesmo sem data (decisão deliberada, pra não travar quem ainda não sabe as datas exatas). Então dá pra escolher os lugares em "Lugares" normalmente (isso sempre funcionou, não depende de data) e só descobrir que o dia a dia está vazio ao abrir a aba "Roteiro" — o que pode ter sido lido como "não tá montando o roteiro".

**Antes de aplicar a mudança abaixo, confirmar com a Adriana**: os destinos que ela cadastrou já têm data de início E fim preenchidas? Se sim, é outra causa (não essa) e precisa investigar de novo com esse dado. Se não, a mudança abaixo resolve — deixa isso visível no momento de salvar, em vez de só descobrir depois na aba Roteiro.

**`CreateTrip.tsx`** — no resumo do Passo 1 (Destino), adicionar um aviso quando algum destino ainda não tem as duas datas:

```tsx
summary={
  <>
    <ul className={styles.summaryList}>
      {trip.destinations.map((d) => (
        <li key={d.id}>{formatDestinoSummaryLine(d)}</li>
      ))}
    </ul>
    {trip.destinations.some((d) => !d.dateStart || !d.dateEnd) && (
      <p className={styles.datesWarning}>
        ⚠ Pelo menos um destino ainda não tem datas — o Roteiro dia a dia só é montado depois que as datas
        estiverem preenchidas. Toque em "Editar" pra completar.
      </p>
    )}
  </>
}
```

**`CreateTrip.module.css`** — adicionar:

```css
.datesWarning {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
```

(Cor `--muted`, não `--error` — não é um erro que bloqueia nada, é só um aviso informativo; a pessoa pode perfeitamente salvar e continuar sem data, só precisa saber que o Roteiro dia a dia vai ficar vazio até completar.)

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Depois de salvar o Perfil da viagem (Passo 2), sem nenhum convite ainda enviado, aparece o card sugerindo Convidar companheiros — não mais "Ir pro Roteiro".
- O card de sugestão de Membros dentro do Roteiro (`Itinerary.tsx`) continua funcionando igual (sem mudança nele).
- Cadastrar um destino sem preencher as datas e salvar: o resumo do Passo 1 mostra o aviso de datas faltando, junto da linha "datas a definir" desse destino.
- Preencher as duas datas do destino faz o aviso sumir automaticamente do resumo (sem precisar re-salvar).
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
