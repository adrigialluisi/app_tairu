# Ajuste 24 — Fotos reais dos pontos turísticos na lista de Lugares (Roteiro)

Feedback da Adriana (11/set/2026): "na parte do roteiro acho que é muito bom trazer imagens dos pontos turísticos e atrações. Thumbs pra ajudar a pessoa a identificar." Escopo confirmado por ela: buscar a foto real ao vivo numa fonte pública (Wikipedia/Wikimedia), mesma categoria de exceção de internet que já existe hoje só pro mapa (`docs/ajustes-10-mapa-no-roteiro.md`), com um quadradinho de inicial no lugar da foto quando não encontrar — nunca uma imagem inventada (segue o princípio "dados reais, sem IA generativa" do `CLAUDE.md`).

**Escopo desta rodada:** só a lista de seleção de lugares (aba "Lugares" dentro do Roteiro, componente `PlaceRow`). As abas "Roteiro" (dia a dia) e "Dicas locais" (`getAlsoWorthVisiting`) ficam de fora por enquanto — podem ganhar o mesmo tratamento depois, como uma rodada separada, se fizer sentido.

## 1. Por que Wikipedia/Wikimedia, e como funciona

A API pública da Wikipedia (`/api/rest_v1/page/summary/{título}`) devolve um resumo do artigo, incluindo `thumbnail.source` (URL de uma imagem real do tópico) quando existe — sem chave de API, sem custo, com CORS liberado pra uso direto do navegador. Não é geração de imagem nem IA — é a foto que já está no artigo da Wikipedia sobre aquele lugar.

**Dois idiomas em sequência, não só um:** tenta primeiro `pt.wikipedia.org` (мesmo idioma das pessoas testando o protótipo), e se não achar, tenta `es.wikipedia.org` (espanhol) — como os lugares são todos na Argentina e no Chile, muita coisa local (restaurantes, mercados, bairros) tem mais chance de ter artigo em espanhol do que em português. Se nenhum dos dois achar nada, mostra o quadradinho de inicial — nunca quebra a tela, nunca mostra uma foto errada só pra preencher espaço.

## 2. `src/data/index.ts` — `PlaceEntry` ganha campo opcional `wikiTitle`

```ts
export interface PlaceEntry {
  id: string;
  cityId: string;
  name: string;
  neighborhood: string;
  categories: string[];
  description: string;
  lat: number;
  lng: number;
  /** opcional — só quando o nome do lugar não bate com o título exato do artigo na Wikipedia (ex.: precisa de desambiguação) */
  wikiTitle?: string;
}
```

Sem valor padrão pra preencher agora — a busca usa `wikiTitle ?? name` (ver item 4). Se, na hora de testar, algum lugar específico não encontrar foto (ou encontrar a foto errada, de um homônimo), aí sim vale voltar em `places.json` e preencher `wikiTitle` só pra esse lugar, com o título exato do artigo certo.

## 3. Novo hook: `src/hooks/usePlaceThumbnail.ts`

```ts
import { useEffect, useState } from 'react';

const WIKI_HOSTS = ['pt.wikipedia.org', 'es.wikipedia.org'];

// Cache em memória do módulo — evita rebuscar o mesmo lugar toda vez que a
// lista re-renderiza ou a pessoa troca de aba e volta, na mesma sessão.
const cache = new Map<string, string | null>();

async function fetchThumbnail(title: string): Promise<string | null> {
  for (const host of WIKI_HOSTS) {
    try {
      const res = await fetch(`https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.thumbnail?.source) return data.thumbnail.source as string;
      }
    } catch {
      // sem internet ou host fora do ar — tenta o próximo idioma, ou desiste no fim do loop
    }
  }
  return null;
}

/**
 * Busca ao vivo a foto real do lugar na Wikipedia (mesma categoria de
 * exceção de internet já documentada pro mapa — ver
 * docs/ajustes-10-mapa-no-roteiro.md — agora estendida pras fotos, ver
 * docs/ajustes-24-fotos-reais-dos-lugares.md). Devolve null enquanto
 * carrega ou quando não encontra imagem em nenhum dos dois idiomas — quem
 * chama decide o que mostrar nesse caso (nunca uma imagem inventada).
 */
export function usePlaceThumbnail(title: string): string | null {
  const [url, setUrl] = useState<string | null>(cache.get(title) ?? null);

  useEffect(() => {
    if (cache.has(title)) {
      setUrl(cache.get(title) ?? null);
      return;
    }
    let cancelled = false;
    fetchThumbnail(title).then((thumb) => {
      cache.set(title, thumb);
      if (!cancelled) setUrl(thumb);
    });
    return () => {
      cancelled = true;
    };
  }, [title]);

  return url;
}
```

## 4. `PlaceRow.tsx` — thumbnail com fallback de inicial

```tsx
import { usePlaceThumbnail } from '../../hooks/usePlaceThumbnail';
import styles from './PlaceRow.module.css';

interface PlaceRowProps {
  name: string;
  neighborhood?: string;
  categoriesLabel?: string;
  wikiTitle?: string;
  selected: boolean;
  onToggle: () => void;
}

export function PlaceRow({ name, neighborhood, categoriesLabel, wikiTitle, selected, onToggle }: PlaceRowProps) {
  const thumbnailUrl = usePlaceThumbnail(wikiTitle ?? name);

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={`${styles.row} ${selected ? styles.rowSelected : ''}`}
      onClick={onToggle}
    >
      <span className={styles.thumbnail}>
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" loading="lazy" className={styles.thumbnailImg} />
        ) : (
          <span className={styles.thumbnailFallback} aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className={`${styles.checkbox} ${selected ? styles.checkboxSelected : ''}`} aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
      <span className={styles.info}>
        <span className={styles.name}>{name}</span>
        {neighborhood && <span className={styles.neighborhood}>{neighborhood}</span>}
      </span>
      {categoriesLabel && <span className={styles.categories}>{categoriesLabel}</span>}
    </button>
  );
}
```

`alt=""` na imagem é intencional, não esquecimento: o nome do lugar já aparece como texto ao lado (`.name`), então a foto é decorativa pra quem usa leitor de tela — repetir o nome como alt seria redundante.

**`PlaceRow.module.css`** — adicionar:

```css
.thumbnail {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-android-card);
  overflow: hidden;
  background: var(--bg-top);
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumbnailImg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnailFallback {
  font-size: 18px;
  font-weight: 800;
  color: var(--accent-dark);
}
```

(`.row` já tem `align-items: flex-start; gap: var(--space-3);` — a thumbnail entra como primeiro item da linha, antes do checkbox, sem precisar mudar o container.)

## 5. `Itinerary.tsx` — passar `wikiTitle` pro `PlaceRow`

No único call site (dentro da aba "Lugares"):

```tsx
<PlaceRow
  name={place.name}
  neighborhood={place.neighborhood}
  categoriesLabel={formatCategories(place.categories)}
  wikiTitle={place.wikiTitle}
  selected={selectedIdsForDestination.has(place.id)}
  onToggle={() => {
    const wasSelected = selectedIdsForDestination.has(place.id);
    trip.togglePlace(activeDestinationId, { placeId: place.id, categories: place.categories });
    if (!wasSelected) show('Lugar adicionado');
  }}
/>
```

(Só a prop nova — o resto da linha não muda.)

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Abrir a aba Lugares de Buenos Aires e de Santiago com internet: a maioria dos lugares conhecidos (Casa Rosada, Cristo Redentor, La Cabrera etc.) mostra uma foto real de verdade, não um placeholder genérico.
- Lugares sem artigo em nenhum dos dois idiomas (comum em restaurantes menores) mostram o quadradinho com a primeira letra do nome, sem erro no console nem espaço quebrado no layout.
- **Conferir manualmente pelo menos os lugares que aparecem no roteiro de teste de usabilidade** — checar se a foto que apareceu é realmente do lugar certo, não de um homônimo (nome parecido que a Wikipedia possa ter confundido). Se achar algum caso errado, preencher `wikiTitle` só pra esse lugar em `places.json` com o título exato do artigo correto.
- Sem internet (ou com internet lenta), a lista continua funcionando normalmente — só sem fotos (quadradinho de inicial em todos), sem travar a tela nem dar erro visível pra quem está testando.
- Trocar de destino (aba dentro de Lugares) e voltar não rebusca as mesmas fotos de novo (cache em memória funcionando).
- Testar em 375px e 390px, e nas duas variantes iOS/Android — a thumbnail de 48px não aperta o resto da linha (nome, bairro, categoria continuam legíveis).
