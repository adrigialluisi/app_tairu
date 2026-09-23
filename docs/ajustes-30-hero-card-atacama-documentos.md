# Ajuste 30 — Card de destaque da viagem (com foto real), Deserto do Atacama no cenário, Meus documentos como item

Feedback da Adriana (14/set/2026):

> "Faltou também um destaque para viagem atual na tela inicial. Tem que ser um card maior com foto da viagem atual que está sendo planejada que é Buenos Aires e Santiago e Deserto do Atacama. Vamos adicionar Deserto do Atacama no nosso roteiro fixo. Assim mistura cidade com um pouco de natureza e temos um cenário mais completo para testar. Meus documentos pode ser mais um item na tela inicial como um link para acessa a parte interna."

Três partes: (1) card de destaque maior com foto real na Início, (2) terceiro destino no cenário fixo de teste — **já curado e escrito nos arquivos de dados, só falta copiar pra `src/data/`** —, (3) "Meus documentos" vira uma linha própria, não mais um link pequeno perto do cabeçalho.

## 1. Deserto do Atacama no cenário — dados já curados, só falta copiar

Pesquisei atrações reais de San Pedro de Atacama (povoado que é a porta de entrada do deserto — é o destino concreto que entra no autocomplete, não "Deserto do Atacama" como texto livre) e já escrevi os dados nos arquivos de curadoria:

- **`docs/dados/places.json`** ganhou 10 lugares novos (`cityId: "san-pedro-de-atacama-cl"`): Valle de la Luna, Valle de la Muerte, Laguna Cejar, Ojos del Salar, Laguna Chaxa (flamingos, Reserva Los Flamencos), Lagunas Altiplânicas Miscanti e Miñiques, Géiseres del Tatio, Pukará de Quitor, Igreja de San Pedro de Atacama, Restaurante Adobe. Maioria `natureza` (o próprio motivo do destino — "mistura cidade com um pouco de natureza"), 2 `cultura`, 1 `gastronomia`.
- **`docs/dados/local-tips.json`** ganhou o bloco de dicas locais de San Pedro de Atacama, mesmas 4 categorias dos outros destinos (transporte, dinheiro, segurança, costumes) — focadas em altitude, excursões com vaga limitada, e noites frias no deserto.
- Já conferi que os dois arquivos continuam JSON válido depois da adição (53 lugares, 3 cidades no total).

**O que falta fazer no código** (isso sim é trabalho pro Claude Code):

1. **`src/data/cities.json`** — adicionar a entrada nova, no mesmo formato das outras:
   ```json
   { "id": "san-pedro-de-atacama-cl", "city": "San Pedro de Atacama", "country": "Chile", "currencyCode": "CLP" }
   ```
2. **`src/data/places.json`** — copiar o conteúdo atualizado de `docs/dados/places.json` (os 10 lugares novos já estão no final do arquivo — dá pra copiar o arquivo inteiro, ou só adicionar as 10 entradas novas se preferir preservar `wikiTitle` que já foram corrigidos manualmente em `src/data/places.json` e ainda não foram copiados de volta pra `docs/dados/` — **conferir isso antes de sobrescrever o arquivo inteiro**, pra não perder essas correções).
3. **`src/data/localTips.json`** — mesma lógica, copiar o bloco novo de `docs/dados/local-tips.json` (esse arquivo não tinha diferença nenhuma entre as duas cópias, então dá pra copiar o arquivo inteiro sem risco).
4. `npm run lint`/`npm run build` depois, pra garantir que o dataset maior não quebrou nada (early return de "sem destino"/`EmptyTripState`, contagem de categorias etc. — tudo já é dinâmico, não deveria precisar de mudança de código nenhuma, só dado novo).

Isso já habilita escolher San Pedro de Atacama como destino em Destinos, com sugestões de lugares e dicas locais reais — sem mexer em nenhum componente.

## 2. Card de destaque maior, com foto real, na Início

Substitui o card pequeno "Sua viagem" (texto só) do `ajustes-29` por um card maior, com foto no topo — mesma ideia visual de "hero card" de apps de viagem, reaproveitando a mesma busca de foto ao vivo na Wikipedia que já existe (`usePlaceThumbnail`, do `ajustes-24`), agora buscando pelo nome da cidade do primeiro destino da viagem, não por um ponto turístico específico.

**`Home.tsx`** — trocar o bloco do card antigo por:

```tsx
import { usePlaceThumbnail } from '../hooks/usePlaceThumbnail';
// ...demais imports que já existem...

function TripHeroCard({ trip, onClick }: { trip: ReturnType<typeof useTrip>; onClick: () => void }) {
  const heroCity = trip.destinations[0]?.city ?? '';
  const thumbnailUrl = usePlaceThumbnail(heroCity);

  return (
    <button type="button" className={styles.heroCard} onClick={onClick}>
      <div className={styles.heroPhotoWrap}>
        {heroCity && thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.heroPhoto} />
        ) : (
          <span className={styles.heroPhotoFallback} aria-hidden="true">🧳</span>
        )}
        <span className={styles.heroBadge}>Sua viagem</span>
      </div>
      <div className={styles.heroContent}>
        <span className={styles.heroName}>{trip.name.trim() || 'Viagem sem nome'}</span>
        <span className={styles.heroMeta}>
          {formatDestinationsLabel(trip.destinations)} · {formatDatesLabel(trip.destinations)}
        </span>
        <span className={styles.heroMeta}>{formatCompanionsLabel(trip.companions.length)}</span>
      </div>
    </button>
  );
}
```

E, dentro de `Home()`, trocar o `{hasActiveTrip && (...)}` do `ajustes-29` por:

```tsx
{hasActiveTrip && <TripHeroCard trip={trip} onClick={() => navigate('/destinos')} />}
```

(`formatDestinationsLabel`/`formatDatesLabel`/`formatCompanionsLabel` continuam vindo de `src/utils/tripSummary.ts`, criado no `ajustes-29` — sem mudança neles.)

**Sobre a foto**: busca pelo nome da cidade do **primeiro destino cadastrado** (`trip.destinations[0]`) — se a viagem for "Buenos Aires, Santiago e Deserto do Atacama" e Buenos Aires foi o primeiro destino adicionado, a foto vem de Buenos Aires. Não tenta combinar fotos de vários destinos num card só (mais simples, e evita ter que decidir qual foto "representa melhor" uma viagem multi-destino). Se algum dia quiser trocar esse critério (por exemplo: destino com mais dias, ou deixar a pessoa escolher a foto), é só ajustar depois — não é uma decisão travada por esse código.

**`Home.module.css`** — remove `.tripCard`/`.tripCardLabel`/`.tripCardName`/`.tripCardMeta` do `ajustes-29` (foram só pro card pequeno, que não existe mais), adiciona:

```css
.heroCard {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-android-card);
  overflow: hidden;
  padding: 0;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.heroPhotoWrap {
  position: relative;
  width: 100%;
  height: 160px;
  background: var(--bg-top);
}

.heroPhoto {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.heroPhotoFallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 40px;
}

.heroBadge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  background: var(--accent);
  color: var(--text-on-dark);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.heroContent {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-4);
}

.heroName {
  font-size: 20px;
  font-weight: 800;
  color: var(--text);
}

.heroMeta {
  font-size: 13px;
  color: var(--muted);
}
```

## 3. "Meus documentos" vira um item de lista, não mais um link perto do cabeçalho

O `ajustes-29` colocou "Documentos" como link de texto ao lado da saudação. Agora vira uma linha própria (ícone + rótulo + `›`), no corpo da tela — sai do cabeçalho.

**`Home.tsx`** — remove o `.greetingRow` (a saudação volta a ser sozinha, sem o link do lado) e adiciona a linha nova, entre o carrossel de viagens passadas e o botão "Nova viagem":

```tsx
<div className={styles.greeting}>
  <h1 className={styles.greetingTitle}>Olá! 👋</h1>
  <p className={styles.greetingSubtitle}>Pra onde vamos dessa vez?</p>
</div>

{/* ...TripHeroCard e carrossel de viagens passadas, sem mudança... */}

<button type="button" className={styles.documentsRow} onClick={() => navigate('/documentos')}>
  <span className={styles.documentsRowIcon} aria-hidden="true">📄</span>
  <span className={styles.documentsRowLabel}>Meus documentos</span>
  <span className={styles.documentsRowChevron} aria-hidden="true">›</span>
</button>

<div className={styles.actions}>
  <Button variant="primary" fullWidth onClick={handleNewTrip}>
    Nova viagem
  </Button>
</div>
```

**`Home.module.css`** — remove `.greetingRow`/`.documentsLink` (do `ajustes-29`), adiciona:

```css
.documentsRow {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  min-height: var(--touch-target);
  background: var(--card);
  border: 1.5px solid var(--card-border);
  border-radius: var(--radius-android-card);
  padding: var(--space-3) var(--space-4);
  color: var(--text);
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
}

.documentsRowIcon {
  font-size: 18px;
}

.documentsRowLabel {
  flex: 1;
}

.documentsRowChevron {
  color: var(--muted);
  font-size: 18px;
}
```

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- `src/data/cities.json` tem a entrada de San Pedro de Atacama; ela aparece no autocomplete de Destinos ao digitar "Atacama" ou "San Pedro".
- `src/data/places.json`/`src/data/localTips.json` atualizados com os dados de San Pedro de Atacama, sem perder nenhum `wikiTitle` que já tinha sido corrigido manualmente em `src/data/places.json`.
- Cadastrar San Pedro de Atacama como destino mostra sugestões de lugares reais (Valle de la Luna, Laguna Cejar etc.) na aba Lugares, e dicas locais reais na aba Dicas.
- Com uma viagem em andamento (nome ou destino preenchido), a Início mostra o card grande com foto no topo, nome da viagem, destinos+datas e convidados — clicável no card inteiro.
- Card de destaque mostra foto real (Wikipedia) do primeiro destino cadastrado; sem internet ou sem foto encontrada, mostra o ícone de mala no lugar (sem quebrar layout).
- "Meus documentos" aparece como uma linha própria (ícone + texto + `›`), não mais perto do cabeçalho.
- Testar em 375px e 390px, e nas duas variantes iOS/Android — a foto de 160px de altura não deve fazer a tela rolar demais antes do botão "Nova viagem".
