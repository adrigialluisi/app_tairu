# Ajuste 75 — Fotos por atração: adicionar foto direto na parada do Roteiro

Pedido da Adriana (05/out/2026): quando a pessoa estiver numa atração (ponto turístico, restaurante, evento), ela adiciona ali mesmo as fotos que tirou daquele lugar, e isso vai compondo as Memórias.

**O que já existe e continua:** Memórias com fotos por dia (ajuste 64), campo "Onde foi?" no visualizador (texto livre ou lugares do dia), "Fotos do dia" no cartão do dia, Retrospectiva (ajuste 65).

**O que muda na lógica:** a foto passa a se ligar à **parada do roteiro** (por id), não só a um texto com o nome. Assim ela sabe de qual lugar é mesmo que o lugar mude de dia.

Regras visuais: ajustes 72 e 73 (cartões brancos, ícones lucide, botão secundário branco com borda bordô, 44px de toque).

---

## 1. Modelo — `src/context/TripContext.tsx`

`TripPhoto` ganha:
```ts
/** parada do roteiro a que a foto pertence: TripPlaceSelection.id; null = sem lugar ligado */
placeSelectionId: string | null;
/** evento escolhido a que a foto pertence: EventEntry.id; null = nenhum */
eventId: string | null;
```
- `placeLabel` continua existindo pro caso "Outro" (texto livre) e como **rótulo de exibição**. Quando houver `placeSelectionId` ou `eventId`, o rótulo exibido vem do lugar/evento (nome atual), não do texto salvo.
- Fotos antigas: `placeSelectionId: null`, `eventId: null` (nada quebra).

## 2. Adicionar a partir da parada — Roteiro → Lista

Em cada `TimelineStop` de **lugar** (não pulado e pulado também) e em cada linha de **evento** da Agenda do dia:
- Botão **"Adicionar foto"** com ícone lucide `Camera`, estilo link/ícone pequeno junto das outras ações da parada (mover, Pulei), alvo 44px. `aria-label="Adicionar foto de {nome do lugar}"`.
- Abre `<input type="file" accept="image/*" multiple>` (no celular oferece câmera ou galeria).
- Cada foto entra com:
  - `dayISO` = **o dia em que a parada está no roteiro** (não a data do arquivo) e `dayManual: true`;
  - `placeSelectionId` = id da parada (ou `eventId` do evento);
  - `placeLabel` = nome do lugar.
- Toast: "2 fotos adicionadas em {nome do lugar}".
- **Parada criada à mão** ("Adicionado por você") também ganha o botão; o rótulo é o texto dela.

## 3. Miniaturas na parada

Abaixo da descrição da parada (e da linha do evento), quando houver fotos dela:
- Faixa de até **4 miniaturas** quadradas de 56px, `rounded-md`, gap 4px; se tiver mais, a 4ª mostra "+N" por cima (fundo escuro 50%, texto branco).
- Tocar numa miniatura abre o **visualizador de Memórias** (`PhotoViewer`, Dialog da onda 4) já nessa foto, navegando só entre as fotos daquela parada.
- Sem fotos: nada aparece (só o botão da seção 2).

## 4. Se a parada mudar de dia ou for removida
- **Mover a parada pra outro dia:** as fotos ligadas a ela continuam ligadas e **não mudam de dia sozinhas**. Na hora de mover, se houver fotos, mostrar no toast: "Lugar movido. As fotos continuam no dia {dd/mm}." (A foto é registro do que aconteceu; o dia é o da foto.)
- **"Pulei":** fotos continuam guardadas e visíveis na parada pulada.
- **Remover o lugar do roteiro (Sugestões, desmarcar):** as fotos **não somem**: viram `placeSelectionId: null`, mantendo `placeLabel` com o nome, e ficam em Memórias no mesmo dia.
- **Remover o evento:** mesma regra (`eventId: null`, mantém o rótulo).

## 5. Memórias — agrupar por lugar dentro do dia

Na aba Fotos de Memórias, dentro de cada dia:
- Subgrupos por lugar, na ordem das paradas do dia: cabeçalho pequeno `MapPin` + nome do lugar + "4 fotos" (13px, stone-600), grade de 3 colunas abaixo.
- Depois, **"Outras do dia"** com as fotos sem lugar ligado (inclui as de "Outro" texto livre, agrupadas pelo texto se houver).
- Grupo "Sem dia" continua no fim.
- No `PhotoViewer`, o campo **"Onde foi?"** passa a escolher entre as paradas e eventos do dia (gravando `placeSelectionId`/`eventId`) ou "Outro" (texto livre, como hoje). Trocar o dia da foto limpa o lugar se ele não for daquele dia.

## 6. Retrospectiva
- Card de **cidade**: foto principal = 1º destaque ⭐ daquela cidade; se não houver, **a primeira foto ligada a uma parada** daquela cidade; só então a foto da Wikipedia.
- Texto da cidade passa a citar primeiro os lugares **que têm foto** (são os que a pessoa de fato viveu), depois os demais.
- Card de **números**: novo tile `Camera` "lugares com foto" quando > 0.

## 7. Conferir
- [ ] Roteiro → Lista → Cemitério da Recoleta → "Adicionar foto" → 2 fotos → miniaturas aparecem na parada; toast com o nome do lugar.
- [ ] Mesmas fotos aparecem em Memórias no dia da parada, no subgrupo "Cemitério da Recoleta".
- [ ] Tocar na miniatura abre o visualizador naquela foto; setas navegam só pelas fotos do lugar.
- [ ] Mover a Recoleta pra outro dia → fotos ficam no dia original, com aviso no toast.
- [ ] Desmarcar a Recoleta em Sugestões → fotos continuam em Memórias, em "Outras do dia" com o nome.
- [ ] Evento escolhido (ex.: Feira de San Telmo) também aceita fotos pela Agenda do dia.
- [ ] Retrospectiva gerada usa a foto tirada no lugar no card da cidade.
- [ ] `npm run build` passa; commit "ajuste 75: fotos por atração".
