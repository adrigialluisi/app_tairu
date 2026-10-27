# Ajuste 99c — Créditos das fotos num lugar só

Origem: pedido da Adriana em 27/out/2026. Commit: `ajuste 99c: créditos das fotos centralizados`.

---

1. **Sugestões do app:** saiu o "Créditos das fotos" recolhido do fim de cada seção, em todas as cidades. O componente `PhotoCredits` foi apagado.
2. **Créditos espalhados também saíram:**
   - Viagem passada: o link "Créditos das fotos" do rodapé (`PhotoCreditsDialog`, ajustes-95) foi apagado. A linha "Fotos de exemplo…" do álbum agora aponta pra tela nova.
   - Foto aberta da viagem passada: o `ExamplePhotoDialog` não mostra mais autor, licença e link, só a marca "Foto de exemplo · Wikimedia Commons". A foto continua marcada como exemplo (regra do CLAUDE.md).
   - A parada do Roteiro não mostrava crédito. A linha "Fotos de exemplo · Wikimedia Commons" do mapa da recordação ficou: é a marca de exemplo, não um crédito.
3. **Tela "Créditos das fotos"** (`/creditos`, `src/screens/PhotoCredits.tsx`): sem menu fixo, voltar pra Início. Agrupa por cidade, na ordem do `cities.json`:
   - todas as fotos locais dos lugares (`places.json`);
   - depois as cidades da viagem passada de exemplo (Lisboa e Porto), com a nota "Viagem passada de exemplo · …".
   - Cada linha: "Lugar — autor · licença · Wikimedia Commons" (link pra página da foto, nova aba), com "(foto ilustrativa)" nas fotos representativas.
   - A tela lê os mesmos dados do app, então foto nova entra sozinha.
   - **Ficam de fora**, por não terem autor nem licença guardados: as fotos dos hotéis (site oficial, ajustes-52) e as buscadas ao vivo na Wikipedia.
4. **Acesso:** link pequeno "Créditos das fotos" no rodapé da Início, logo abaixo do "Nova viagem" (dentro da faixa fixa do rodapé), em `--muted` (7.63:1 no branco), 44px de toque.
