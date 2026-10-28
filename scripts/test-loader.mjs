/*
  Carregador do `npm test` (ajustes-101f): deixa o runner nativo do Node testar módulos que importam
  como o Vite — import relativo sem extensão ('../data' → ../data/index.ts, './dateMask' →
  ./dateMask.ts) e JSON sem atributo (vira `export default`). Sem dependência nova.
*/
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function resolve(specifier, context, next) {
  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    for (const suffix of ['', '.ts', '.tsx', '/index.ts']) {
      const url = new URL(specifier + suffix, context.parentURL);
      const path = fileURLToPath(url);
      if (suffix === '' && !/\\.(ts|tsx|json|js|mjs)$/.test(path)) continue;
      if (existsSync(path)) return next(url.href, context);
    }
  }
  return next(specifier, context);
}

export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    return { format: 'module', source: 'export default ' + readFileSync(fileURLToPath(url), 'utf8'), shortCircuit: true };
  }
  return next(url, context);
}
`),
);
