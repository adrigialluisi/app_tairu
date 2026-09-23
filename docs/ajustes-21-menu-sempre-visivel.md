# Ajuste 21 — Menu fixo aparece assim que sai da Splash, sem depender do nome

Esclarecimento da Adriana (11/set/2026), depois de 3 rodadas indo atrás de um "bug do menu" que na verdade era uma decisão errada minha desde o início: "o menu só aparece depois que eu digito qualquer coisa no campo nome da viagem. Ele já deveria aparecer assim que mudo da primeira tela pra essa." Ou seja — o menu fixo não deveria depender do nome da viagem estar preenchido. Deveria aparecer **assim que a pessoa sai da Splash e entra em qualquer uma das 6 seções** (Destinos, Membros, Roteiro, Reservas, Documentos, Gastos), sem pré-requisito nenhum.

> **Isso substitui por completo `docs/ajustes-16-menu-aparece-so-ao-confirmar-nome.md` e `docs/ajustes-20-corrigir-regressao-menu.md`** — não porque a implementação deles estivesse errada (as duas rodadas anteriores corrigiram exatamente o que foi pedido, e o código das duas está correto), mas porque a premissa toda ("a viagem ter nome" como único pré-requisito pro menu aparecer) deixa de existir. Toda a lógica de `hasStartedTrip`/`markTripStarted` sai do projeto — não tem mais nada pra "confirmar" antes do menu aparecer.

## 1. `TripContext.tsx` — remover `hasStartedTrip`/`markTripStarted`

Remover por completo:
- `hasStartedTrip: boolean;` de `TripState`.
- `markTripStarted: () => void;` de `TripContextValue`.
- `const [hasStartedTrip, setHasStartedTrip] = useState(false);`.
- `hasStartedTrip,` e `markTripStarted: () => setHasStartedTrip(true),` do objeto `value`.
- `hasStartedTrip` do array de dependências do `useMemo`.

Nada mais no estado da viagem depende disso — é uma remoção limpa, sem substituir por outra flag.

## 2. `CreateTrip.tsx` — campo "Nome da viagem" volta a ser simples

```tsx
<TextField
  id="trip-name"
  label="Nome da viagem"
  placeholder="Ex.: Réveillon em família"
  value={trip.name}
  onChange={trip.setName}
  autoComplete="off"
  required
/>
```

Remove os handlers `onBlur`/`onKeyDown` que existiam só pra chamar `markTripStarted()` — não tem mais nada pra disparar nesse momento. `autoComplete="off"` continua (isso é do `ajustes-19`, não muda).

## 3. `bottomNav` vira incondicional nas 6 telas de seção

Trocar, nos 4 arquivos abaixo, a condição `trip.hasStartedTrip ? <BottomNav /> : undefined` (ou equivalente) por `<BottomNav />` direto, sem condição nenhuma:

- **`CreateTrip.tsx`**: `bottomNav={<BottomNav />}`.
- **`InviteCompanions.tsx`**: `bottomNav={<BottomNav />}`.
- **`Itinerary.tsx`**: a variável `bottomNav` (hoje `const bottomNav = trip.hasStartedTrip ? <BottomNav /> : undefined;`, usada nos dois `<ScreenShell>` da tela — o de estado vazio e o principal) vira `const bottomNav = <BottomNav />;`, ou remover a variável e usar `<BottomNav />` direto nos dois lugares.
- **`App.tsx`**, dentro de `SectionComingSoon` (usado por `/reservas`, `/documentos`, `/gastos`): trocar

  ```tsx
  function SectionComingSoon({ title }: { title: string }) {
    const trip = useTrip();
    const bottomNav = trip.hasStartedTrip ? <BottomNav /> : undefined;
    return <ComingSoon title={title} bottomNav={bottomNav} />;
  }
  ```

  por

  ```tsx
  function SectionComingSoon({ title }: { title: string }) {
    return <ComingSoon title={title} bottomNav={<BottomNav />} />;
  }
  ```

  (o `useTrip` deixa de ser necessário aqui — remover o import se não sobrar nenhum outro uso dele nesse arquivo.)

A Splash (`/`) continua sem menu — não é uma das 6 seções, é a tela de entrada antes de tudo. O menu aparece a partir do momento em que a pessoa toca "Continuar" na Splash e cai em `/destinos`, mesmo com o nome ainda vazio.

## 4. `CLAUDE.md` — atualizar a seção "Navegação"

Trocar o primeiro bullet:

```
- **Único pré-requisito real: a viagem ter um nome.** [...]
```

por:

```
- **Sem pré-requisito nenhum pro menu aparecer.** O menu fixo (bottom nav) aparece assim que a pessoa sai da Splash e entra em qualquer uma das 6 seções — não depende de a viagem já ter nome, destino ou qualquer outro dado preenchido (atualizado em 11/set/2026, ver `docs/ajustes-21-menu-sempre-visivel.md`, que substitui as duas tentativas anteriores de condicionar isso ao nome — `docs/ajustes-16-...md` e `docs/ajustes-20-...md`).
```

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Na Splash, tocar "Continuar" e cair em `/destinos`: o menu fixo já aparece imediatamente, com o campo "Nome da viagem" ainda vazio.
- Digitar ou apagar o nome da viagem não muda em nada a visibilidade do menu (ele já estava lá antes de qualquer digitação).
- Navegar direto pra `/roteiro`, `/convidar`, `/reservas` etc. pelo próprio menu também mostra o menu normalmente (sem regressão nas outras seções).
- Nenhuma referência sobrando a `hasStartedTrip`/`markTripStarted` no código.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
