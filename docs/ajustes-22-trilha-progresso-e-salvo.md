# Ajuste 22 — Trilha de progresso: selos no menu, confirmação de "Salvo" e sugestão de próximo passo

Feedback da Adriana (11/set/2026): "acho que faltou algo pra salvar e pra ir conduzindo o usuário a preencher os itens de menu... como uma trilha guiando mesmo ele." Como o menu fixo agora é sempre visível e nenhuma seção trava a outra (`docs/ajustes-21-menu-sempre-visivel.md`), falta uma forma de a pessoa perceber o que já preencheu, ter confirmação de que os dados ficaram salvos, e ser guiada pro próximo passo natural — sem reintroduzir nenhuma trava. Escopo aprovado por ela: selos de progresso no menu + toast de "Salvo" + card de sugestão de próximo passo, dispensável.

Nenhuma dessas três coisas precisa de um botão "Salvar" de verdade — tudo já grava no estado (`TripContext`) no momento em que a pessoa digita/seleciona, igual já funciona hoje. O que falta é só **feedback visual** disso, não um mecanismo novo de persistência.

## 1. Critérios de "seção completa" — `src/utils/tripProgress.ts` (novo arquivo)

Funções puras, sem estado, reaproveitáveis tanto no `BottomNav` quanto nos cards de sugestão:

```ts
import type { TripContextValue } from '../context/TripContext';

/** Pelo menos 1 destino, e todos os destinos cadastrados já com datas preenchidas. */
export function isDestinosComplete(trip: Pick<TripContextValue, 'destinations'>): boolean {
  return trip.destinations.length > 0 && trip.destinations.every((d) => d.dateStart && d.dateEnd);
}

/** Pelo menos 1 lugar escolhido (de qualquer destino). */
export function isRoteiroComplete(trip: Pick<TripContextValue, 'selectedPlaces'>): boolean {
  return trip.selectedPlaces.length > 0;
}
```

Membros não entra aqui — convidar é opcional pra sempre (ver `docs/tela-02-convidar-companheiros.md`), não faz sentido um selo de "completo" nele. Reservas/Documentos/Gastos também ficam de fora por enquanto — ainda são placeholders "em construção", sem critério possível.

## 2. Selos no menu fixo — `BottomNav.tsx`

`BottomNav` passa a ler `useTrip()` direto (mesmo padrão de outros componentes que já leem o contexto global) e calcular o estado de cada item:

```tsx
import { useLocation, Link } from 'react-router-dom';
import { useTrip } from '../../context/TripContext';
import { isDestinosComplete, isRoteiroComplete } from '../../utils/tripProgress';
import styles from './BottomNav.module.css';

// ...

export function BottomNav() {
  const location = useLocation();
  const trip = useTrip();

  const badgeByPath: Record<string, { type: 'check' } | { type: 'count'; value: number } | undefined> = {
    '/destinos': isDestinosComplete(trip) ? { type: 'check' } : undefined,
    '/convidar': trip.companions.length > 0 ? { type: 'count', value: trip.companions.length } : undefined,
    '/roteiro': isRoteiroComplete(trip) ? { type: 'check' } : undefined,
  };

  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {ITEMS.map((item) => {
        const active = location.pathname === item.path;
        const badge = badgeByPath[item.path];
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.item} ${active ? styles.itemActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className={styles.iconWrap}>
              <span className={styles.icon} aria-hidden="true">{item.icon}</span>
              {badge?.type === 'check' && (
                <span className={styles.badgeCheck} aria-hidden="true">✓</span>
              )}
              {badge?.type === 'count' && (
                <span className={styles.badgeCount} aria-hidden="true">{badge.value}</span>
              )}
            </span>
            <span className={styles.label}>{item.label}</span>
            {badge?.type === 'check' && <span className="visually-hidden"> — concluído</span>}
            {badge?.type === 'count' && (
              <span className="visually-hidden"> — {badge.value} convite{badge.value > 1 ? 's' : ''}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

CSS novo em `BottomNav.module.css` (o `.item` já existia como container; `.iconWrap` é novo, só pra dar `position: relative` ao ícone e ancorar o selo):

```css
.iconWrap {
  position: relative;
  display: inline-flex;
}

.badgeCheck,
.badgeCount {
  position: absolute;
  top: -4px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 14px;
  height: 14px;
  padding: 0 2px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  color: var(--card);
}

.badgeCheck {
  background: var(--accent);
}

.badgeCount {
  background: var(--muted);
}
```

(Cores: o selo de check usa `--accent`, mesmo tom de destaque já usado no resto do app pra estado ativo/positivo; o de contagem usa `--muted`, deliberadamente mais discreto — é informativo, não é uma meta a bater.)

## 3. Toast de confirmação "Salvo" — componente + hook reaproveitáveis

**`src/components/shell/SaveToast.tsx`** (novo):

```tsx
import styles from './SaveToast.module.css';

interface SaveToastProps {
  visible: boolean;
  message: string;
}

export function SaveToast({ visible, message }: SaveToastProps) {
  return (
    <div className={styles.toast} data-visible={visible} role="status" aria-live="polite">
      <span aria-hidden="true">✓</span> {message}
    </div>
  );
}
```

**`src/components/shell/SaveToast.module.css`** (novo):

```css
.toast {
  position: absolute;
  left: 50%;
  bottom: var(--space-4);
  transform: translate(-50%, 4px);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border-radius: 999px;
  background: var(--text);
  color: var(--card);
  font-size: 13px;
  font-weight: 700;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease, transform 200ms ease;
}

.toast[data-visible='true'] {
  opacity: 1;
  transform: translate(-50%, 0);
}
```

**`src/hooks/useSaveToast.ts`** (novo — primeiro hook próprio do projeto; pasta `src/hooks/` criada só pra ele, convenção padrão de projeto React, sem precedente pra seguir aqui):

```ts
import { useEffect, useRef, useState } from 'react';

const TOAST_DURATION_MS = 2000;

export function useSaveToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show(text: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(text);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), TOAST_DURATION_MS);
  }

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return { message, visible, show };
}
```

### 3.1 `ScreenShell.tsx` — novo slot `toast`

```tsx
interface ScreenShellProps {
  appBar?: ReactNode;
  bottomNav?: ReactNode;
  footer?: ReactNode;
  toast?: ReactNode; // novo
  children: ReactNode;
}

export function ScreenShell({ appBar, bottomNav, footer, toast, children }: ScreenShellProps) {
  return (
    <div className={styles.screen}>
      {appBar}
      <div className={styles.sheet}>
        <main className={styles.content}>{children}</main>
        {footer && <footer className={styles.footer}>{footer}</footer>}
        {toast}
      </div>
      {bottomNav}
    </div>
  );
}
```

`ScreenShell.module.css`: adicionar `position: relative;` em `.sheet` (é o que ancora o `position: absolute` do toast — nada mais no `.sheet` muda de comportamento com isso).

### 3.2 Disparar o toast nos 3 pontos de "salvar" de verdade

**`CreateTrip.tsx`** — instanciar `const { message, visible, show } = useSaveToast();` e trocar:

```tsx
onAdd={trip.addDestination}
onDateRangeChange={trip.setDestinationDateRange}
```

por:

```tsx
onAdd={(destination) => {
  trip.addDestination(destination);
  show('Destino adicionado');
}}
onDateRangeChange={(id, start, end) => {
  trip.setDestinationDateRange(id, start, end);
  if (start && end) show('Datas salvas');
}}
```

E passar `toast={<SaveToast visible={visible} message={message} />}` pro `<ScreenShell>`.

**`Itinerary.tsx`** — mesma instância do hook. Trocar o `onToggle` do `<PlaceRow>` (hoje `() => trip.togglePlace(activeDestinationId, { placeId: place.id, categories: place.categories })`) por uma função que só dispara o toast quando está **adicionando** (não ao remover):

```tsx
onToggle={() => {
  const wasSelected = selectedIdsForDestination.has(place.id);
  trip.togglePlace(activeDestinationId, { placeId: place.id, categories: place.categories });
  if (!wasSelected) show('Lugar adicionado');
}}
```

E em `handleAddCustom`:

```tsx
function handleAddCustom() {
  const trimmed = customText.trim();
  if (trimmed.length === 0) return;
  trip.addCustomPlace(activeDestinationId, trimmed);
  setCustomText('');
  show('Lugar adicionado');
}
```

Passar `toast={<SaveToast visible={visible} message={message} />}` pros dois `<ScreenShell>` da tela (o de estado vazio não precisa, só o principal).

**`InviteCompanions.tsx`** — mesma instância do hook, em `handleAdd`:

```tsx
function handleAdd() {
  const trimmed = email.trim();
  if (trimmed.length === 0) return;
  if (!EMAIL_RE.test(trimmed)) {
    setError('Digite um e-mail válido, no formato nome@exemplo.com.');
    return;
  }
  trip.addCompanion(trimmed);
  setEmail('');
  setError(null);
  show('Convite adicionado');
}
```

Passar `toast={<SaveToast visible={visible} message={message} />}` pro `<ScreenShell>`.

## 4. Card de sugestão de próximo passo — dispensável, não bloqueia nada

**`src/components/shell/SuggestionCard.tsx`** (novo):

```tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SuggestionCard.module.css';

interface SuggestionCardProps {
  message: string;
  actionLabel: string;
  to: string;
  storageKey: string; // identifica a sugestão, pra não reaparecer depois de dispensada NESTA visita à tela
}

export function SuggestionCard({ message, actionLabel, to, storageKey }: SuggestionCardProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={styles.card} role="status">
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Link to={to} className={styles.actionLink}>
          {actionLabel} <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className={styles.dismiss}
          onClick={() => setDismissed(true)}
          aria-label={`Dispensar sugestão: ${storageKey}`}
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
```

(`storageKey` só serve hoje pro `aria-label` do botão de dispensar ser específico — não tem persistência de verdade, é dispensado só durante a visita atual à tela; ver nota no checklist sobre esse comportamento ser intencional e simples.)

**`SuggestionCard.module.css`** (novo) — cartão sutil, cor de destaque discreta, não parece um alerta/erro:

```css
.card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border-radius: 12px;
  background: var(--bg-top);
  border: 1px solid var(--card-border);
}

.message {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.actionLink {
  color: var(--accent-dark);
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
}

.actionLink:hover,
.actionLink:focus-visible {
  text-decoration: underline;
}

.dismiss {
  background: none;
  border: none;
  min-width: 32px;
  min-height: 32px;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
}
```

### 4.1 Onde cada card aparece

**Em `CreateTrip.tsx`**, dentro do painel da aba "Destino", logo depois do `<DestinationField ... />`:

```tsx
{isDestinosComplete(trip) && trip.selectedPlaces.length === 0 && (
  <SuggestionCard
    message="Destinos prontos! Já pode montar o roteiro do dia a dia."
    actionLabel="Ir pro Roteiro"
    to="/roteiro"
    storageKey="ir-pro-roteiro"
  />
)}
```

**Em `Itinerary.tsx`**, dentro do painel da aba "Lugares", depois da lista de sugestões (final do conteúdo da aba, antes de fechar o `role="tabpanel"`):

```tsx
{isRoteiroComplete(trip) && trip.companions.length === 0 && (
  <SuggestionCard
    message="Já tem lugares escolhidos. Quer convidar alguém pra essa viagem?"
    actionLabel="Convidar companheiros"
    to="/convidar"
    storageKey="convidar-companheiros"
  />
)}
```

Os dois usam `isDestinosComplete`/`isRoteiroComplete` de `src/utils/tripProgress.ts` (mesmo arquivo do item 1).

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Adicionar um destino com datas completas faz o ícone "Destinos" do menu ganhar o selo ✓; remover a data de um dos destinos faz o selo sumir (`isDestinosComplete` reavalia toda hora).
- Escolher pelo menos 1 lugar faz o ícone "Roteiro" ganhar o selo ✓.
- Convidar alguém faz o ícone "Membros" ganhar um número (não um ✓) — convite não é uma "meta" a cumprir, só uma contagem.
- Adicionar destino, confirmar datas (as duas, início e fim), escolher um lugar e convidar alguém disparam o toast "Salvo" com a mensagem certa por ~2s; **remover** um lugar/destino/convite não dispara toast (só ações de adicionar).
- O card de sugestão "Ir pro Roteiro" aparece em Destinos só depois de destino(s) com data completa, e só enquanto nenhum lugar tiver sido escolhido ainda; dispensar com o "×" some ele até a próxima vez que a tela for revisitada (comportamento simples e intencional — não trava nem exige lógica de persistência nova).
- O card de sugestão "Convidar companheiros" aparece em Roteiro (aba Lugares) só depois de pelo menos 1 lugar escolhido, e só enquanto não houver nenhum convite ainda.
- Nenhum dos dois cards aparece se a condição não for satisfeita, e nenhum trava a navegação — a pessoa pode ignorar completamente e navegar pelo menu normalmente.
- Selos e toast funcionam nas duas variantes iOS/Android e em 375px/390px sem cortar texto nem sobrepor o conteúdo.
- Toast e cards seguem contraste WCAG AA (texto sobre `--text`/`--bg-top`, conferir razão de contraste real).
