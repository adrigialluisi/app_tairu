# Ajuste 86 — Campos: busca de aeroporto e de moeda, data e hora padronizadas, campos do voo, "Atacama" na busca

Origem: teste de 13/out/2026. Todos os itens são de **campo de formulário**. A ideia é padronizar: um componente por tipo de dado, usado no app inteiro.

Antes de começar: ler o `CLAUDE.md` (regra "reaproveitar componentes existentes"). Ao terminar: `npm run lint` e `npm run build`. Commit: `ajuste 86: campos de busca, data e hora padronizados`.

---

## 1. Busca de destino acha regiões conhecidas ("Deserto do Atacama" → San Pedro de Atacama)

**Problema:** digitar "Deserto do Atacama" ou "Atacama" retorna "Nenhuma cidade encontrada". O próprio nome da viagem do cenário fala em "Deserto do Atacama", então a participante tende a buscar assim.

**Fazer:**
- `src/data/cities.json`: campo opcional novo `aliases: string[]` por cidade. Preencher pelo menos:
  - San Pedro de Atacama: `["Deserto do Atacama", "Atacama", "Desierto de Atacama"]`
  - Bariloche (se existir): `["Patagônia argentina"]` — só onde for verdade; não inventar.
- `searchCities` em `src/data/index.ts`: também casar com `aliases` (mesma normalização sem acento/maiúscula).
- No item da lista, quando o casamento foi por alias, mostrar uma linha de apoio: "San Pedro de Atacama, Chile · base pra visitar o Deserto do Atacama".

## 2. Busca de aeroporto nos campos Origem e Destino do voo

**Problema:** Origem e Destino do voo são texto livre ("São Paulo Guarulhos", "Buenos Aires ezeiza"). Cada pessoa escreve de um jeito, e o app não consegue usar o dado depois.

**Fazer:**
- Novo `src/data/airports.json` (dado real, embutido, sem API). Campos: `iata`, `name` (nome do aeroporto), `city`, `country`, `cityId` (ligando com `cities.json` quando existir).
- Conteúdo mínimo: principais do Brasil (GRU, CGH, VCP, GIG, SDU, BSB, CNF, POA, CWB, REC, SSA, FOR, FLN) e os de todas as cidades do `cities.json`. Obrigatórios do cenário: **GRU, CGH, VCP, EZE, AEP, SCL, CJC (Calama)**.
- Novo `AirportField.tsx` em `components/inputs/`, **reaproveitando o `SearchCombobox`** (mesmo padrão do `DestinationField` e da busca de hotel).
  - Busca por cidade, nome do aeroporto ou código: "guaru", "são paulo" e "gru" levam todos a **São Paulo – Guarulhos (GRU)**.
  - Item da lista: "**GRU** · São Paulo – Guarulhos, Brasil".
  - Valor salvo: o código IATA + o texto de exibição. Manter compatível com itens já salvos em texto (se o valor antigo não for um IATA, só exibir o texto).
- Sugestão automática no voo cadastrado num destino: ao abrir a lista sem ter digitado nada, mostrar primeiro os aeroportos da cidade daquele destino (em Buenos Aires: EZE e AEP).
- Usar em `TransportItemForm.tsx`, só no tipo **Voo** (Origem e Destino). Ônibus, trem e carro continuam como estão.
- A leitura do voucher (ajuste 84) deve preencher o campo com o aeroporto correspondente (EZE, SCL), não com texto solto.

## 3. Data e hora: um componente só pro app inteiro (regra geral)

**Problema:** no teste apareceram 3 jeitos diferentes de digitar data: Destinos e Hospedagem têm máscara + calendário (bom); Transporte tem "Data/hora" em texto livre, sem máscara; Lançar gasto tem data em texto livre. A participante digitou 20/10 (outubro) num voo de novembro e o app aceitou calado.

**Fazer:**
- Novo `DateField.tsx` (data única) em `components/inputs/`, **derivado do `DateRangeField`**: mesma máscara aplicada durante a digitação (a pessoa digita só números, as barras entram sozinhas: "20112026" → "20/11/2026"), mesmo calendário em popover, sincronizados nos dois sentidos.
  - O calendário abre no mês da viagem (primeira data de destino), não no mês atual.
  - Prop opcional `tripRange` pra mostrar aviso (não bloqueio) quando a data cai fora da viagem: "Essa data é antes do início da viagem (20/11). Confere?" / "… depois do fim da viagem …". Aviso em texto de apoio, cor de atenção, não vermelho de erro.
- Novo `TimeField.tsx`: máscara hh:mm durante a digitação ("0815" → "08:15"), validação 00:00–23:59, e `inputMode="numeric"`. Botão de relógio que abre um seletor simples (lista de horas e de minutos de 5 em 5). Se ficar complexo, `<input type="time">` nativo é aceitável como seletor, mantendo a máscara no campo visível.
- **Transporte** (`TransportItemForm.tsx`): trocar todo "Data/hora de …" por **dois campos lado a lado**: Data (`DateField`) + Hora (`TimeField`). Vale pra voo, ônibus, trem e carro locado. A data de chegada já vem preenchida com a data de partida (a pessoa só muda se virar o dia).
- **Outros** (`OtherItemForm.tsx`), **Lançar gasto** (`ExpenseForm.tsx`) e **Documentos** (Emissão e Validade em `DocumentForm.tsx`): todo campo de data passa a ser `DateField`. Em Documentos, sem `tripRange` (documento não é da viagem).
- O modelo de dados pode continuar guardando data e hora juntas, se for mais simples; o que muda é a interface.
- **Regra no `CLAUDE.md`** (seção nova "Campos de data e hora"): todo campo de data do app usa `DateRangeField` (intervalo) ou `DateField` (data única); todo campo de hora usa `TimeField`. Proibido campo de data ou hora em texto livre.

## 4. Voo: Localizador, Classe e Bagagem

**Problema:** o voucher tem o código da reserva (localizador), classe e bagagem, mas o formulário de voo não tem onde guardar. O localizador é o dado que mais se procura no check-in.

**Fazer:**
- `TransportItemForm.tsx`, tipo Voo: campos novos **Localizador** (opcional), **Classe** (opcional, texto) e **Bagagem** (opcional, texto curto).
- Leitura do voucher (ajuste 84): preencher os três com os dados do `voucher-voo-buenosaires-santiago.pdf` (EEPMS7 · Econômica · 1 despachada + 1 de mão) e do `voucher-voo-santiago-calama.pdf`.
- Cartão do voo (`TransportItemCard.tsx`): mostrar o localizador em destaque (ex.: "Localizador **EEPMS7**"), com botão de copiar.

## 5. Seletor de moeda com busca + data da cotação visível

**Problema:** escolher moeda é rolar uma lista longa. E no Conversor a data da cotação existe, mas fica lá embaixo, fora da tela.

**Fazer:**
- Trocar o miolo do `CurrencySelect.tsx` de `<select>` nativo por `SearchCombobox`, mantendo as props atuais (pra nenhuma tela quebrar).
  - Busca por código, nome ou país: "peso", "chile", "clp" acham Peso chileno.
  - **Moedas da viagem primeiro** (as dos destinos + BRL), num grupo "Da viagem"; depois "Todas".
  - Campo fechado continua mostrando código + nome curto.
  - Altura 44px, foco igual ao `TextField`.
- **Conversor** (`CurrencyConverter.tsx`): mover a linha "Cotação de 02/10/2026 (…). Pode variar na hora da compra." para **logo abaixo do resultado** (o bloco "CLP 10.000 = R$ 53,27").

## 6. Formulários da Central: botão Cancelar

**Problema:** depois do ajuste 85, os formulários da Central só abrem ao tocar em "+ Adicionar". Mas desde o ajuste 56 eles não têm "Cancelar", então a única saída é salvar.

**Fazer:** nos formulários de Transporte, Hospedagem e Outros, adicionar "Cancelar" (botão secundário) ao lado de "Salvar". Em item novo, fecha sem criar nada; em edição, volta ao cartão sem alterar. Isso **substitui a decisão do ajuste 56** (que tirou o Cancelar quando o formulário abria sozinho).

---

## Checklist de aceite
- [ ] "Atacama" e "Deserto do Atacama" acham San Pedro de Atacama.
- [ ] "guaru", "são paulo" e "gru" acham GRU; Buenos Aires sugere EZE e AEP sem digitar.
- [ ] Voucher do voo preenche os aeroportos pelo código, e também localizador, classe e bagagem.
- [ ] Nenhum campo de data ou hora em texto livre no app (Transporte, Outros, Gasto, Documentos).
- [ ] Data digitada só com números ganha as barras sozinha; hora idem com os dois-pontos.
- [ ] Data fora da viagem mostra aviso, sem bloquear.
- [ ] Moeda com busca e moedas da viagem primeiro, em todas as telas.
- [ ] Data da cotação logo abaixo do resultado do Conversor.
- [ ] "Cancelar" em todos os formulários da Central.
- [ ] Regras novas no `CLAUDE.md`.
- [ ] `npm run lint` e `npm run build` ok.
