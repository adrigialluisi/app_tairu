# Ajuste 28 — Redesenho da tela Início (depois da Splash)

Feedback da Adriana (14/set/2026), pausando a conversa sobre a timeline do Roteiro pra tratar primeiro da tela Início ("Antes do roteiro. Vamos ajustar a parte inicial."):

> "Depois do splash screen. Ter uma tela inicial melhor projetada. Sem a cara das outras telas. Com o nome do usuário do canto superior direito, carrossel com viagens passadas, um botão para criar nova viagem e um link para acessar os documentos. Ao criar a nova viagem aí tem a trilha embaixo. Precisa de um link superior para retomar a tela inicial."

A `Home.tsx` de hoje (`docs/ajustes-26-central-inicio-documentos-splash.md`) foi construída em cima do `ScreenShell`/`AppBar` padrão — exatamente "a cara das outras telas" que ela quer evitar agora. Esse ajuste substitui o layout inteiro da tela, mantendo as duas funções que já existiam (continuar viagem atual, nova viagem, acesso a documentos) e adicionando o que faltava.

**Duas decisões resolvidas por pergunta direta antes de escrever esse ajuste** (o protótipo não tem nenhuma etapa de login/identificação, então nenhuma das duas podia ser assumida sem violar "nada pré-preenchido"):

1. **Nome do usuário**: por enquanto, sem captura de nome nenhuma — o canto superior direito fica com um ícone genérico de perfil (não funcional ainda, reservado pra quando existir uma etapa de identificação), e a saudação usa um texto genérico, não um nome.
2. **Carrossel de viagens passadas**: como o protótipo não guarda histórico real (tudo em memória, decisão do `ajustes-26`), o carrossel mostra **1-2 viagens de exemplo fixas, marcadas com um selo "Exemplo"** — só pra ilustrar o layout, nunca dado real nem clicável. Isso é diferente do card "Sua viagem" (viagem atual em andamento), que continua 100% real.

## 1. `Home.tsx` — layout novo, sem `ScreenShell`/`AppBar` padrão

Mesma lógica do `Splash.tsx` (também não usa `ScreenShell`/`AppBar` — tem cara própria). `Home.tsx` vira:

```tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/shell/Button';
import { useTrip } from '../context/TripContext';
import styles from './Home.module.css';

const EXAMPLE_PAST_TRIPS = [
  { id: 'exemplo-1', name: 'Buenos Aires, Argentina', meta: 'Exemplo · 5 dias' },
  { id: 'exemplo-2', name: 'Santiago, Chile', meta: 'Exemplo · 4 dias' },
];

export function Home() {
  const trip = useTrip();
  const navigate = useNavigate();
  const hasActiveTrip = trip.name.trim().length > 0 || trip.destinations.length > 0;

  function handleNewTrip() {
    trip.resetTrip();
    navigate('/destinos');
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <img src="/logo/LogoTairu.svg" alt="Tairu" className={styles.logoMark} />
        <button type="button" className={styles.profileButton} aria-label="Perfil (em breve)" disabled>
          <span aria-hidden="true">👤</span>
        </button>
      </header>

      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>Olá! 👋</h1>
        <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
      </div>

      {hasActiveTrip && (
        <div className={styles.tripCard}>
          <p className={styles.tripCardLabel}>Sua viagem</p>
          <p className={styles.tripCardName}>{trip.name.trim() || 'Viagem sem nome'}</p>
          <Button variant="primary" fullWidth onClick={() => navigate('/destinos')}>
            Continuar viagem
          </Button>
        </div>
      )}

      <section className={styles.pastTrips} aria-label="Viagens passadas (exemplo)">
        <h2 className={styles.sectionTitle}>Viagens passadas</h2>
        <div className={styles.carousel}>
          {EXAMPLE_PAST_TRIPS.map((t) => (
            <div key={t.id} className={styles.pastTripCard}>
              <span className={styles.exampleBadge}>Exemplo</span>
              <p className={styles.pastTripName}>{t.name}</p>
              <p className={styles.pastTripMeta}>{t.meta}</p>
            </div>
          ))}
        </div>
        <p className={styles.pastTripsNote}>Suas viagens concluídas vão aparecer aqui.</p>
      </section>

      <div className={styles.actions}>
        <Button variant={hasActiveTrip ? 'secondary' : 'primary'} fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>
        <button type="button" className={styles.documentsLink} onClick={() => navigate('/documentos')}>
          📄 Documentos
        </button>
      </div>
    </div>
  );
}
```

Pontos importantes:
- **`.profileButton` fica `disabled`** de propósito — é um placeholder de layout, não uma função real ainda. Não navega pra lugar nenhum, não abre nada.
- **`EXAMPLE_PAST_TRIPS` é uma constante fixa no código**, não vem de `TripContext` nem de nenhum estado — deixa claro que não é dado real, e não precisa de nenhuma mudança no modelo de dados da viagem.
- O selo "Exemplo" em cada card + a legenda "Suas viagens concluídas vão aparecer aqui" abaixo do carrossel deixam explícito pro moderador (e pra quem olhar o protótipo depois) que aquilo é ilustrativo — evita confundir com dado real durante o teste de usabilidade.
- O card "Sua viagem" continua exatamente como era (dado real, `trip.name`/`trip.destinations`), só mudou de posição no layout.

## 2. `Home.module.css` — visual próprio, não herdado do `ScreenShell`

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-6);
  background-color: #FFFFFF;
  background-image: radial-gradient(var(--accent) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 0;
  opacity: 1;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logoMark {
  height: 28px;
  width: auto;
}

.profileButton {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--touch-target);
  height: var(--touch-target);
  border-radius: 999px;
  border: 1.5px solid var(--field-border);
  background: var(--card);
  font-size: 18px;
  opacity: 0.6;
}

.greeting {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.greetingTitle {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
}

.greetingSubtitle {
  margin: 0;
  font-size: 16px;
  color: var(--muted);
}

.tripCard {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-android-card);
  padding: var(--space-4);
}

.tripCardLabel {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tripCardName {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.pastTrips {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.sectionTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: var(--text);
}

.carousel {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
  padding-bottom: var(--space-1);
}

.pastTripCard {
  flex: 0 0 auto;
  width: 160px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-android-card);
  padding: var(--space-3);
}

.exampleBadge {
  align-self: flex-start;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  background: var(--bg-top);
  border-radius: 999px;
  padding: 2px var(--space-2);
}

.pastTripName {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.pastTripMeta {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.pastTripsNote {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: auto;
}

.documentsLink {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-height: var(--touch-target);
  background: none;
  border: none;
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}
```

(O fundo reaproveita o mesmo grafismo de pontinhos da Splash — `docs/ajustes-26-central-inicio-documentos-splash.md` — pra dar uma identidade visual própria à dupla Splash→Início, diferente do fundo liso das telas de dentro de uma viagem.)

## 3. Link superior pra voltar à Início, dentro das 5 telas do menu fixo

Hoje o `AppBar` só sabe mostrar um botão de voltar (`onBack`) — nenhuma das 5 telas principais (Destinos, Central, Convidados, Roteiro, Custos) usa `onBack`, porque elas não empilham navegação, são destinos do menu fixo. Isso deixa espaço livre pra um novo botão "Início" nesse mesmo lugar.

**`src/components/shell/AppBar.tsx`** — adicionar prop `onHome`, com prioridade menor que `onBack` (nunca aparecem os dois ao mesmo tempo, mas se acontecer, `onBack` vence, porque geralmente é uma ação mais específica de contexto):

```tsx
interface AppBarProps {
  title: string;
  onBack?: () => void;
  onHome?: () => void;
}

export function AppBar({ title, onBack, onHome }: AppBarProps) {
  const { platform } = usePlatform();
  const backGlyph = platform === 'ios' ? '‹' : '←';

  return (
    <header className={styles.bar}>
      {onBack ? (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <span aria-hidden="true">{backGlyph}</span>
        </button>
      ) : onHome ? (
        <button type="button" className={styles.backButton} onClick={onHome} aria-label="Ir pra Início">
          <span aria-hidden="true">🏠</span>
        </button>
      ) : (
        platform === 'ios' && <span className={styles.spacer} aria-hidden="true" />
      )}
      <h1 className={styles.title}>{title}</h1>
      {platform === 'ios' && <span className={styles.spacer} aria-hidden="true" />}
    </header>
  );
}
```

(Reaproveita a classe `.backButton` que já existe — visualmente é só mais um botão-ícone no mesmo lugar, sem CSS novo.)

**Wire-up** — adicionar `onHome={() => navigate('/inicio')}` no `<AppBar>` de cada uma das 5 telas principais (confirmar o nome exato do componente de cada uma antes de editar, alguns podem ter mudado de arquivo desde o `ajustes-26`):
- `CreateTrip.tsx` (Destinos) — `<AppBar title="Destinos e datas" onHome={...} />`
- `Central.tsx` — `<AppBar title="Central da viagem" onHome={...} />`
- Tela de Convidados (provavelmente `InviteCompanions.tsx`) — mesma ideia
- `Itinerary.tsx` (Roteiro) — `<AppBar title="Roteiro da viagem" onHome={...} />`
- Tela de Custos (hoje ainda placeholder — provavelmente via `SectionComingSoon` ou equivalente) — mesma ideia

Todas essas telas precisam de `useNavigate` importado (a maioria já importa, por causa do `BottomNav`/outros links).

## 4. O que NÃO muda

- **A trilha (menu fixo) continua só aparecendo dentro de uma viagem** — Início não tem `bottomNav`, exatamente como já era desde o `ajustes-26`. A frase da Adriana ("ao criar a nova viagem aí tem a trilha embaixo") é a confirmação desse comportamento, não uma mudança.
- **"Nova viagem" continua resetando tudo** (`trip.resetTrip()`) e indo pra Destinos — sem mudança de lógica, só de posição no novo layout.
- **Documentos continua acessível só pela Início** — sem mudança de rota ou comportamento.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Início não usa `ScreenShell`/`AppBar` — tem cabeçalho próprio (logo + ícone de perfil desabilitado), saudação genérica, sem repetir o layout de nenhuma outra tela.
- Carrossel de viagens passadas mostra as 2 viagens de exemplo, cada uma com o selo "Exemplo" visível, com rolagem horizontal; não são clicáveis; a legenda abaixo do carrossel aparece sempre.
- Card "Sua viagem" continua aparecendo só quando existe uma viagem real em andamento (mesmo critério de antes).
- Nas 5 telas principais (Destinos, Central, Convidados, Roteiro, Custos), o canto onde ficaria o botão de voltar mostra um ícone de Início (🏠) que leva pra `/inicio` — sem quebrar nenhuma tela que eventualmente use `onBack` de verdade (esse continua tendo prioridade).
- Splash → Início → Nova viagem → Destinos → (usar o ícone de Início no AppBar) → volta pra Início sem perder o que já tinha sido preenchido na viagem em andamento.
- Testar em 375px e 390px, e nas duas variantes iOS/Android — o carrossel não deve cortar o último card de forma estranha, e o ícone de perfil não deve parecer clicável de verdade (está desabilitado).
