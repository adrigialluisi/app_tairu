import { useEffect, useState } from 'react';

const WIKI_HOSTS = ['pt.wikipedia.org', 'es.wikipedia.org'];

/** limite da API da Wikipedia pro parâmetro `titles` numa consulta só */
const BATCH_SIZE = 50;
/** janela pra juntar os títulos pedidos por todos os cartões que montam juntos */
const BATCH_DELAY_MS = 30;
/** sem Retry-After na resposta: espera isto antes de tentar de novo */
const DEFAULT_RETRY_MS = 10_000;
const MAX_ATTEMPTS = 3;

/*
  Por que em lote (docs/ajustes-73-fundo-cinza-botao-secundario-e-bugs.md, item 5):
  a Wikipedia passou a limitar pedidos anônimos — com um pedido por lugar, a aba
  Sugestões disparava dezenas de buscas de uma vez e quase todas voltavam 429
  (Too Many Requests). A resposta era tratada como "sem foto" e guardada no cache
  da sessão, então nenhuma foto aparecia. Agora os títulos pedidos no mesmo
  instante viram UMA consulta (action=query&prop=pageimages, até 50 títulos), em
  português e, só pros que faltarem, em espanhol. Falha temporária (429, sem
  internet) não entra no cache: tenta de novo depois do tempo pedido pelo servidor.
*/

// Cache em memória do módulo — só resultado definitivo (URL ou "não tem foto").
const cache = new Map<string, string | null>();
// Quem está esperando cada título (vários cartões podem pedir o mesmo lugar).
const listeners = new Map<string, Set<(url: string | null) => void>>();
const queue = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

class RateLimitError extends Error {
  constructor(readonly retryMs: number) {
    super('rate limited');
  }
}

/** Uma consulta pra até 50 títulos num idioma. Devolve título pedido → URL (ou null se a página não tem foto). */
async function queryHost(host: string, titles: string[]): Promise<Map<string, string | null>> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    redirects: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '400',
    pilimit: String(BATCH_SIZE),
    titles: titles.join('|'),
  });
  const res = await fetch(`https://${host}/w/api.php?${params}`);
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after'));
    throw new RateLimitError(retryAfter > 0 ? retryAfter * 1000 : DEFAULT_RETRY_MS);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const query = data?.query ?? {};

  // título pedido → título final da página (normalização de grafia e redirecionamento)
  const finalTitle = new Map<string, string>(titles.map((t) => [t, t]));
  const follow = (list: { from: string; to: string }[] | undefined) => {
    for (const { from, to } of list ?? []) {
      for (const [asked, current] of finalTitle) if (current === from) finalTitle.set(asked, to);
    }
  };
  follow(query.normalized);
  follow(query.redirects);

  const thumbByPage = new Map<string, string | null>();
  for (const page of query.pages ?? []) {
    thumbByPage.set(page.title, page.missing ? null : (page.thumbnail?.source ?? null));
  }
  return new Map(titles.map((t) => [t, thumbByPage.get(finalTitle.get(t) ?? t) ?? null]));
}

function resolve(title: string, url: string | null) {
  cache.set(title, url);
  for (const notify of listeners.get(title) ?? []) notify(url);
  listeners.delete(title);
}

async function runBatch(titles: string[], attempt: number) {
  let pending = titles;
  try {
    for (const host of WIKI_HOSTS) {
      if (pending.length === 0) break;
      const found = await queryHost(host, pending);
      const missing: string[] = [];
      for (const t of pending) {
        const url = found.get(t);
        if (url) resolve(t, url);
        else missing.push(t);
      }
      pending = missing;
    }
    // nenhum dos dois idiomas tem foto: resultado definitivo, mostra o ícone da categoria
    for (const t of pending) resolve(t, null);
  } catch (err) {
    if (attempt >= MAX_ATTEMPTS) {
      // desiste por agora sem gravar no cache: a próxima tela que pedir tenta de novo
      for (const t of pending) {
        for (const notify of listeners.get(t) ?? []) notify(null);
        listeners.delete(t);
      }
      return;
    }
    const wait = err instanceof RateLimitError ? err.retryMs : DEFAULT_RETRY_MS;
    setTimeout(() => void runBatch(pending, attempt + 1), wait);
  }
}

function flush() {
  timer = null;
  const titles = [...queue];
  queue.clear();
  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    void runBatch(titles.slice(i, i + BATCH_SIZE), 1);
  }
}

function request(title: string, onResult: (url: string | null) => void): () => void {
  const set = listeners.get(title) ?? new Set();
  const alreadyRequested = listeners.has(title);
  set.add(onResult);
  listeners.set(title, set);
  if (!alreadyRequested) {
    queue.add(title);
    if (!timer) timer = setTimeout(flush, BATCH_DELAY_MS);
  }
  return () => {
    set.delete(onResult);
  };
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
    // sem título (ex.: card sem cidade, parada de texto livre): nada a buscar
    if (!title) {
      setUrl(null);
      return;
    }
    if (cache.has(title)) {
      setUrl(cache.get(title) ?? null);
      return;
    }
    setUrl(null);
    return request(title, setUrl);
  }, [title]);

  return url;
}
