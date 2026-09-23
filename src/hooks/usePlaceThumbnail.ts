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
