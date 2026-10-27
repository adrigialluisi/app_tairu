# Ajuste 93 — "Fora do circuito" de verdade em Buenos Aires + botão de upload duplicado em Outros

Origem: teste guiado de 26/out/2026, com a Adriana como participante. Na aba Sugestões de Buenos Aires, a seção "Fora do circuito" mostrava MALBA, Rosedal e Jardim Japonês, que estão em qualquer roteiro de primeira viagem. A seção precisa trazer o que normalmente **não** aparece nos roteiros.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 93: fora do circuito real em Buenos Aires e upload único em Outros`.

---

## 1. Reclassificar 5 lugares de Buenos Aires para `turistico`

Em `src/data/places.json` **e** `docs/dados/places.json`, trocar `popularity` de `"fora-do-circuito"` para `"turistico"`:

| id | Nome |
|---|---|
| `ba-rosedal-palermo` | Parque 3 de Febrero — Rosedal |
| `ba-jardim-japones` | Jardim Japonês |
| `ba-malba` | MALBA |
| `ba-basilica-pilar` | Basílica Nossa Senhora do Pilar (colada no Cemitério da Recoleta) |
| `ba-avenida-corrientes` | Avenida Corrientes |

Continuam `fora-do-circuito`: `ba-el-desnivel`, `ba-ciudad-cultural-konex` e `ba-monumental-river`.

O roteiro de teste pede o MALBA no Capítulo 4. Ele continua existindo, só que na seção Turístico. Não mexer em mais nada dele.

## 2. Oito lugares novos `fora-do-circuito` em Buenos Aires

Adicionar nos dois `places.json`, no mesmo formato dos outros (`id`, `cityId: "buenos-aires-ar"`, `name`, `wikiTitle`, `neighborhood`, `categories`, `description`, `lat`, `lng`, `popularity: "fora-do-circuito"`, `photo`).

| id | name | neighborhood | categories | wikiTitle (es) | lat, lng (aprox.) |
|---|---|---|---|---|---|
| `ba-feria-mataderos` | Feria de Mataderos | Mataderos | gastronomia, cultura | Feria de Mataderos | -34.6563, -58.5040 |
| `ba-las-violetas` | Confitería Las Violetas | Almagro | gastronomia, cultura | Confitería Las Violetas | -34.6110, -58.4207 |
| `ba-bar-el-federal` | Bar El Federal | San Telmo | gastronomia | Bar El Federal *(se não existir artigo, deixar sem)* | -34.6205, -58.3740 |
| `ba-casa-gardel` | Museu Casa Carlos Gardel e Pasaje Gardel | Abasto | cultura | Museo Casa Carlos Gardel | -34.6047, -58.4108 |
| `ba-murais-coghlan` | Murais de Coghlan | Coghlan | cultura | Coghlan (Buenos Aires) | -34.5605, -58.4730 |
| `ba-basilica-maria-auxiliadora` | Basílica María Auxiliadora y San Carlos | Almagro | cultura | Basílica de María Auxiliadora y San Carlos | -34.6125, -58.4205 |
| `ba-parque-memoria` | Parque de la Memoria | Costanera Norte | natureza, cultura | Parque de la Memoria | -34.5440, -58.4470 |
| `ba-reserva-costanera-sur` | Reserva Ecológica Costanera Sur | Puerto Madero | natureza | Reserva Ecológica Costanera Sur | -34.6140, -58.3560 |

**Descrições (português, 1 frase, mesmo tom das existentes):**
- **Feria de Mataderos:** Feira criolla de domingo, com choripán, comida do interior, folclore e artesanato gaúcho, longe do roteiro turístico.
- **Confitería Las Violetas:** Confeitaria de 1884, com vitrais e chá da tarde, frequentada mais por portenhos do que por turistas.
- **Bar El Federal:** Bar notable de esquina, de 1864, com balcão de madeira original, a algumas quadras da feira de San Telmo.
- **Museu Casa Carlos Gardel e Pasaje Gardel:** Casa onde o Gardel viveu, numa rua de fileteado e bares de tango no Abasto.
- **Murais de Coghlan:** Bairro residencial com murais grandes de street art de artistas argentinos e estrangeiros.
- **Basílica María Auxiliadora y San Carlos:** Igreja de Almagro com o interior todo listrado e colorido, pouco visitada por turistas.
- **Parque de la Memoria:** Parque à beira do Rio da Prata, com esculturas e o memorial às vítimas do terrorismo de Estado.
- **Reserva Ecológica Costanera Sur:** Trilhas e lagoas com centenas de espécies de aves, logo ao lado de Puerto Madero.

**Coordenadas:** os valores acima são aproximados. Conferir cada um no OpenStreetMap ou na Wikipedia e corrigir antes de salvar, porque os dias do roteiro são montados por proximidade (ajuste 80).

**Fotos:** seguir exatamente o procedimento do ajuste 87, item 4. Foto real do lugar no Wikimedia Commons, salva em `public/places/{id}.jpg` (~800px, qualidade ~80), com `photo: { src, author, license, sourceUrl }`. Se não houver foto real do lugar, usar uma representativa com licença livre e `representative: true`. Nunca inventar foto. No resumo final, listar quais ficaram representativas.

**Feria de Mataderos:** só funciona aos domingos. No cenário do teste, o domingo em Buenos Aires é 15/11. Não precisa criar evento; se o app já mostra observação de dia de funcionamento em algum lugar, colocar "Só aos domingos".

## 3. Central → Outros: um botão de upload só

**Hoje:** no formulário de "Ingresso ou evento" (e provavelmente em "Seguro viagem" e "Passeio ou excursão") aparecem dois uploads: "Enviar arquivo" no topo ("Tem o ingresso, o voucher ou a apólice? Envie pra preencher os campos.") e "Anexar arquivos" no fim ("Anexe a apólice, o ingresso ou qualquer comprovante").

**Fazer:** deixar **só o "Enviar arquivo" de cima**. O arquivo enviado por ele continua aparecendo como anexado no resumo, como já acontece em Transporte e Hospedagem. Remover o "Anexar arquivos" de baixo nos três tipos de Outros. Conferir se Transporte e Hospedagem têm a mesma duplicidade e, se tiverem, aplicar a mesma regra.

## 4. Investigar: chip do tipo flutuando por cima das abas

No print do teste, rolando o formulário de Outros, o chip "Ingresso ou evento" aparece **por cima** das abas Transporte / Hospedagem / Outros, que são fixas (ajuste 85). Provável causa: o cabeçalho fixo sem fundo opaco, ou com `z-index` menor que o do conteúdo. Corrigir para que o conteúdo passe **por baixo** das abas fixas, em todas as abas da Central.

---

## Checklist de aceite
- [ ] Seção "Fora do circuito" de Buenos Aires mostra os 8 novos + El Desnivel, Konex e Monumental; MALBA, Rosedal, Jardim Japonês, Basílica do Pilar e Corrientes aparecem em Turístico.
- [ ] Os 8 lugares novos com coordenada conferida e foto local com crédito.
- [ ] Dias do roteiro de Buenos Aires continuam sendo montados sem erro com os lugares novos.
- [ ] Outros: só um botão de upload por formulário.
- [ ] Rolando a Central, nada passa por cima das abas fixas.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.

Fontes da curadoria: turismo.buenosaires.gob.ar (Feria de Mataderos, Las Violetas, Patio de los Lecheros), parquedelamemoria.org.ar, thefamilyvoyage.com/buenos-aires-hidden-gems, Buenos Aires Herald (bares notables). O Patio de los Lecheros ficou de fora porque não deu pra confirmar que está aberto hoje.
