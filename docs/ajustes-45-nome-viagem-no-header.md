# Ajuste 45 — Nome da viagem aparece como subtítulo no header das outras seções

Feedback da Adriana (22/set/2026), vendo o resumo de Destinos com "Latam" preenchido: perguntou se o campo "Nome da viagem" poderia virar algo que se digita e salva, pra depois aparecer no header das outras seções (Central, Convidados, Roteiro, Custos).

**Decisão sobre a mecânica (conversa com a Adriana):** não vira um passo novo com botão "Salvar"/"Editar" como Destino e Perfil — é um campo único, sem sub-perguntas, que já grava em tempo real no `TripContext` a cada letra digitada (`onChange={trip.setName}`), então criar um "Salvar" explícito seria um clique sem necessidade técnica. Optamos por: campo continua exatamente como está em Destinos (sem card, sem Editar); o **header das outras 4 seções da viagem passa a mostrar o nome como subtítulo**, assim que a pessoa sai da tela de Destinos — nesse app (navegação por rota, uma tela por vez, sem duas telas visíveis ao mesmo tempo), sair da tela de Destinos já é o mesmo evento que "sair do campo", então não precisa de nenhuma lógica nova de "commit ao perder foco" — só ler `trip.name` direto do contexto nas outras telas resolve.

**Escopo**: Central, Convidados, Roteiro (as 2 variantes de header — Lista/Mapa) e Custos (ainda placeholder "em construção") ganham o subtítulo. Destinos não ganha (o campo já está visível ali). Início e Documentos também não — Início tem cabeçalho próprio (sem `AppBar` compartilhado) e Documentos não é escopo da viagem (é dado da pessoa, ver `CLAUDE.md`). Sem nome preenchido ainda, o header fica exatamente como está hoje (nada de "Nome não definido" nem espaço vazio reservado).

## 1. `AppBar` ganha uma prop `subtitle` opcional

**`src/components/shell/AppBar.tsx`**:
```tsx
interface AppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onHome?: () => void;
}

export function AppBar({ title, subtitle, onBack, onHome }: AppBarProps) {
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
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {platform === 'ios' && <span className={styles.spacer} aria-hidden="true" />}
    </header>
  );
}
```
(só isso muda — `title` sozinho, sem `subtitle`, continua se comportando exatamente como hoje.)

**`src/components/shell/AppBar.module.css`** — envolver o título num grupo que segura as duas linhas, mantendo o alinhamento por plataforma que já existia:

```css
.titleGroup {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.subtitle {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

E trocar os seletores de alinhamento por plataforma pra mirar `.titleGroup` em vez de `.title` (assim `title`/`subtitle` alinham juntos — `text-align` é herdado):

```css
[data-platform='ios'] .titleGroup {
  text-align: center;
}

[data-platform='android'] .titleGroup {
  text-align: left;
}
```
(remove as regras antigas `[data-platform='ios'] .title { text-align: center; }` e `[data-platform='android'] .title { text-align: left; ... }` — a parte `font-weight: 500; letter-spacing: 0.1px;` do Android que estava em `.title` continua lá, só o `text-align` sai de `.title` e vai pra `.titleGroup`.)

## 2. As 4 telas passam `subtitle={trip.name || undefined}`

**`src/screens/Central.tsx`** — adicionar `import { useTrip } from '../context/TripContext';`, `const trip = useTrip();` dentro do componente, e:
```tsx
appBar={<AppBar title="Central da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
```

**`src/screens/InviteCompanions.tsx`** (já tem `trip = useTrip()`):
```tsx
appBar={<AppBar title="Convidar companheiros" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
```

**`src/screens/Itinerary.tsx`** (já tem `trip = useTrip()`) — nas **duas** ocorrências de `<AppBar title="Roteiro da viagem" ...>`:
```tsx
appBar={<AppBar title="Roteiro da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
```

**`src/App.tsx`**, função `SectionComingSoon` (usada só por `/custos`) — adicionar `useTrip`:
```tsx
import { useTrip } from './context/TripContext';
// ...
function SectionComingSoon({ title }: { title: string }) {
  const navigate = useNavigate();
  const trip = useTrip();
  return (
    <ComingSoon
      title={title}
      subtitle={trip.name || undefined}
      bottomNav={<BottomNav />}
      onHome={() => navigate('/inicio')}
    />
  );
}
```
`DocumentosComingSoon` (usado só por `/documentos`) **não muda** — Documentos não é escopo de uma viagem específica.

**`src/screens/ComingSoon.tsx`** — repassar a nova prop pro `AppBar` interno (cuidado: `ComingSoon` já tem suas próprias `title`/`subtitle` internas, que são o texto grande "🚧 <title>" + mensagem no corpo da tela, não o header — não confundir os dois. A prop nova do header chama `headerSubtitle` pra não colidir com a prop `title` que o `ComingSoon` já usa pro corpo):
```tsx
interface ComingSoonProps {
  title?: string;
  headerSubtitle?: string;
  message?: string;
  onBack?: () => void;
  onHome?: () => void;
  bottomNav?: ReactNode;
}

export function ComingSoon({
  title = 'Em construção',
  headerSubtitle,
  message = 'Essa seção ainda não foi desenhada nesse bloco do protótipo.',
  onBack,
  onHome,
  bottomNav,
}: ComingSoonProps) {
  return (
    <ScreenShell appBar={<AppBar title={title} subtitle={headerSubtitle} onBack={onBack} onHome={onHome} />} bottomNav={bottomNav}>
      ...
```
(e em `SectionComingSoon`, no `App.tsx`, usar `headerSubtitle={trip.name || undefined}` em vez de `subtitle`, já que é essa a prop que o `ComingSoon` espera.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Com "Nome da viagem" preenchido (ex.: "Latam"): Central, Convidados, Roteiro (Lista e Mapa) e Custos mostram "Latam" como linha pequena abaixo do título do header. Destinos continua sem subtítulo (o campo já está visível ali). Início e Documentos não mudam.
- Com "Nome da viagem" vazio: os 4 headers ficam exatamente como hoje, sem espaço vazio nem placeholder.
- Nome bem longo: trunca com reticências, não quebra o layout do header, nas duas plataformas (iOS/Android).
- Visual: subtítulo claramente menor/mais discreto que o título (cor `--muted`), sem competir com ele.
