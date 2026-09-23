# Ajuste 26 — Central (com abas), reordenação do menu, Início, Documentos em outro nível, Splash branca

Duas rodadas de feedback da Adriana (14/set/2026), consolidadas num único ajuste porque a segunda altera diretamente a primeira antes de qualquer coisa ser implementada.

**Rodada 1**: "Reservas" dá a impressão de ser só hospedagem, mas a seção vai reunir voo, hospedagem, transporte e seguro. Documentos (passaporte, visto, vacina — coisa da pessoa, que não muda a cada viagem) deveria estar em outro nível, não no menu fixo da viagem. Precisa de uma tela Início pra acessar viagens (versão simples: viagem atual + criar nova) e acessar Documentos. A Splash deveria ser branca, com a logo centralizada e um grafismo leve de fundo.

**Rodada 2**, depois de eu ter sugerido "Logística" pro nome do item de menu: "Pro item de menu vamos na linha central da viagem e lá dentro transporte/estadia/outros. E na trilha do menu abaixo vamos deixar a sequência: Destinos, Central, Convidados, Roteiro, Custos." Isso substitui o nome sugerido antes e define a estrutura interna da seção, além de reordenar e renomear o menu inteiro.

## 1. Menu fixo (`BottomNav.tsx`) — nova ordem e novos nomes

Ordem final, 5 itens (Documentos não é mais um deles — ver item 3):

```tsx
const ITEMS: NavItem[] = [
  { path: '/destinos', label: 'Destinos', icon: '📍' },
  { path: '/central', label: 'Central', icon: '🧳' },
  { path: '/convidar', label: 'Convidados', icon: '👥' },
  { path: '/roteiro', label: 'Roteiro', icon: '🧭' },
  { path: '/custos', label: 'Custos', icon: '💰' },
];
```

Mudanças em relação ao que existe hoje:
- **Ordem**: Destinos, Central, Convidados, Roteiro, Custos (antes era Destinos, Membros, Roteiro, Reservas, Documentos, Gastos).
- **"Membros" vira "Convidados"** — só o label; rota continua `/convidar` (já fazia sentido com o novo label, sem necessidade de trocar).
- **"Reservas" vira "Central"** — label e rota (`/reservas` → `/central`, ver item 2).
- **"Gastos" vira "Custos"** — label e rota (`/gastos` → `/custos`, mesma lógica do Central: evita a rota ficar com um nome que não bate mais com o label, pra não confundir quem mexer no código depois).
- **"Documentos" sai da lista** — vai pra Início (item 3).

O badge de progresso (`badgeByPath`, ver `docs/ajustes-22-trilha-progresso-e-salvo.md`) não muda — continua só em `/destinos` e `/roteiro` (check) e `/convidar` (contagem); Central e Custos continuam sem selo, ainda são seções sem critério de completude definido.

## 2. Nova tela Central (`src/screens/Central.tsx`, rota `/central`) — com abas Transporte/Estadia/Outros

Reaproveita o padrão já usado em `Itinerary.tsx` (`Tabs` + painéis `role="tabpanel"`) — 3 abas, cada uma por enquanto com um estado "em construção" (mesmo espírito do `ComingSoon`, mas dentro da própria tela, não uma tela cheia por aba):

```tsx
import { useState } from 'react';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { Tabs } from '../components/shell/Tabs';
import styles from './Central.module.css';

const TABS_NAME = 'central-tabs';

const PANELS: Record<string, { icon: string; message: string }> = {
  transporte: { icon: '✈️', message: 'Voos e outros deslocamentos entram aqui — ainda não desenhado nesse bloco do protótipo.' },
  estadia: { icon: '🏨', message: 'Hospedagens entram aqui — ainda não desenhado nesse bloco do protótipo.' },
  outros: { icon: '📋', message: 'Seguro viagem e outros itens práticos entram aqui — ainda não desenhado nesse bloco do protótipo.' },
};

export function Central() {
  const [tab, setTab] = useState<'transporte' | 'estadia' | 'outros'>('transporte');
  const panel = PANELS[tab];

  return (
    <ScreenShell appBar={<AppBar title="Central da viagem" />} bottomNav={<BottomNav />}>
      <Tabs
        name={TABS_NAME}
        label="Seções da Central"
        items={[
          { value: 'transporte', label: 'Transporte' },
          { value: 'estadia', label: 'Estadia' },
          { value: 'outros', label: 'Outros' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
      />
      <div role="tabpanel" className={styles.wrap}>
        <span className={styles.icon} aria-hidden="true">{panel.icon}</span>
        <p className={styles.message}>{panel.message}</p>
      </div>
    </ScreenShell>
  );
}
```

`Central.module.css` — reaproveitar o mesmo espaçamento/estilo de `ComingSoon.module.css` (ícone grande, texto centralizado, `gap` na escala de 8px).

AppBar da tela usa "Central da viagem" (mais descritivo), seguindo o mesmo padrão de "Roteiro" (menu) → "Roteiro da viagem" (AppBar) e "Destinos" (menu) → "Destinos e datas" (AppBar) — o label do menu fica curto, o título da tela pode ser um pouco mais completo.

## 3. Documentos sai do menu fixo, vira acesso só pela Início

Remove `/documentos` do `SectionComingSoon`/`BottomNav` — não é mais uma das seções da viagem. A rota continua existindo, mas agora renderiza `ComingSoon` direto (sem `bottomNav`, com `onBack` voltando pra Início):

```tsx
<Route
  path="/documentos"
  element={<ComingSoon title="Documentos" message="Seus documentos de viagem (passaporte, visto, vacina) entram aqui — ainda não desenhado nesse bloco do protótipo." onBack={() => navigate('/inicio')} />}
/>
```

(`ComingSoon` já aceita `onBack` e `bottomNav` opcionais — não precisa de componente novo, só usar diferente do que hoje: hoje é sempre chamado com `bottomNav`, agora esse caso específico usa `onBack` no lugar.)

## 4. Nova tela Início (`src/screens/Home.tsx`, rota `/inicio`)

```tsx
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { Button } from '../components/shell/Button';
import { useTrip } from '../context/TripContext';
import styles from './Home.module.css';

export function Home() {
  const trip = useTrip();
  const navigate = useNavigate();
  const hasActiveTrip = trip.name.trim().length > 0 || trip.destinations.length > 0;

  function handleNewTrip() {
    trip.resetTrip();
    navigate('/destinos');
  }

  return (
    <ScreenShell appBar={<AppBar title="Início" />}>
      <div className={styles.wrap}>
        {hasActiveTrip && (
          <div className={styles.tripCard}>
            <p className={styles.tripCardLabel}>Sua viagem</p>
            <p className={styles.tripCardName}>{trip.name.trim() || 'Viagem sem nome'}</p>
            <Button variant="primary" fullWidth onClick={() => navigate('/destinos')}>
              Continuar viagem
            </Button>
          </div>
        )}

        <Button variant={hasActiveTrip ? 'secondary' : 'primary'} fullWidth onClick={handleNewTrip}>
          Nova viagem
        </Button>

        <button type="button" className={styles.documentsLink} onClick={() => navigate('/documentos')}>
          📄 Documentos
        </button>
      </div>
    </ScreenShell>
  );
}
```

Sem `bottomNav` — Início não é uma das 5 seções de uma viagem, é a tela anterior a entrar numa. "Nova viagem" some com tudo que estava preenchido antes (só faz sentido — não tem como ter duas viagens abertas ao mesmo tempo nessa versão simples) e vai direto pra Destinos.

`src/context/TripContext.tsx` ganha `resetTrip: () => void` em `TripContextValue`, implementado dentro do `TripProvider` chamando os setters internos de volta aos valores iniciais (nome vazio, destinos/companheiros/lugares selecionados/overrides do roteiro como arrays vazios, quiz de volta a `initialQuiz`) — usar os mesmos setters que `addDestination`/`setName`/etc. já usam internamente, só que resetando em vez de adicionando.

`Splash.tsx` — trocar `onClick={() => navigate('/destinos')}` por `onClick={() => navigate('/inicio')}`. `App.tsx` — adicionar `<Route path="/inicio" element={<Home />} />`.

## 5. Splash branca com grafismo leve (`Splash.module.css`)

```css
.screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: #FFFFFF;
  background-image: radial-gradient(var(--accent) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 0;
}
```

(Padrão de pontinhos bem espaçados, na cor de destaque do app — pra ficar "leve" de verdade, aplicar uma opacidade baixa só nesse padrão, não na logo: pode ser feito dando `opacity: 0.06` num pseudo-elemento `::before` posicionado atrás do conteúdo, em vez de opacity direto em `.screen` (que apagaria a logo/botão junto). Ajustar o valor exato depois de ver como fica — isso é só um ponto de partida.)

## 6. Consequência da nova ordem: sugestão de próximo passo em `CreateTrip.tsx`

O `ajustes-25` corrigiu o card de sugestão (depois de salvar o Perfil da viagem) pra apontar pra Convidados, seguindo a ordem do menu que existia até agora (Destinos→Membros). Com a nova ordem (Destinos→**Central**→Convidados...), esse card precisa apontar pra Central agora, pra continuar seguindo o mesmo princípio (a trilha acompanha a ordem visual do menu):

```tsx
{perfilSaved && trip.companions.length === 0 && (
  <SuggestionCard
    message="Tudo pronto! Já pode organizar transporte e hospedagem na Central."
    actionLabel="Ir pra Central"
    to="/central"
    storageKey="ir-pra-central"
  />
)}
```

(A condição continua `trip.companions.length === 0` só por não ter um critério de completude pra Central ainda — assim que Central tiver dados reais, dá pra trocar por um critério melhor, tipo `docs/ajustes-22`/`23` fizeram pra Destinos/Roteiro.)

O card de sugestão que já existe em `Itinerary.tsx` ("Já tem lugares escolhidos. Quer convidar alguém?" → Convidados) continua igual — ainda faz sentido como lembrete, independente da posição de Convidados na ordem do menu.

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Menu fixo mostra 5 itens, nessa ordem: Destinos, Central, Convidados, Roteiro, Custos.
- Central abre com 3 abas (Transporte, Estadia, Outros), cada uma com sua própria mensagem "em construção" — trocar de aba não perde o estado de nenhuma outra parte do app.
- Documentos não aparece mais no menu fixo dentro de uma viagem; só é alcançável pela Início, e o botão de voltar de lá volta pra Início (não pro menu fixo).
- Início mostra "Nova viagem" sempre; mostra o card "Sua viagem" só quando já existe nome ou destino preenchido; "Documentos" está acessível dali.
- Splash → Continuar leva pra Início, não mais direto pra Destinos.
- Central da viagem tem fundo branco, logo centralizada, e o grafismo de fundo é perceptível mas não compete com a logo nem com o botão Continuar.
- Depois de salvar o Perfil da viagem em Destinos, a sugestão aponta pra Central (não mais Convidados).
- Testar o fluxo inteiro: Splash → Início → Nova viagem → Destinos → salvar → sugestão pra Central → Central (3 abas) → Convidados → Roteiro → Custos, e também Início → Documentos → voltar.
- Testar em 375px e 390px, e nas duas variantes iOS/Android.
