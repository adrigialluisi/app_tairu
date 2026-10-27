# Ajuste 99d (PENDENTE) — fotos dos hotéis com licença livre

**Status:** anotado em 27/out/2026, **não aplicar agora**. Aplicar quando os testes de usabilidade terminarem, antes de usar telas do protótipo no portfólio, em apresentação pública ou de divulgar o link de forma ampla.

**Motivo:** as fotos dos hotéis em `hotels.json` vieram dos sites oficiais e não têm licença de uso livre. O protótipo está no GitHub Pages, que é acessível a qualquer pessoa com o link.

**O que fazer:**
1. Pra cada hotel, buscar foto do próprio hotel no Wikimedia Commons.
2. Se não houver, usar foto ilustrativa com licença livre (quarto ou fachada genérica da cidade), marcada `representative: true`.
3. Registrar `author`, `license` e `sourceUrl`, como nos lugares, e incluir na tela `/creditos` (ajuste 99c).
4. Apagar as imagens antigas dos sites oficiais.
5. `npm run lint`, `npm test`, `npm run build`. Commit: `ajuste 99d: fotos de hotéis com licença livre`.
