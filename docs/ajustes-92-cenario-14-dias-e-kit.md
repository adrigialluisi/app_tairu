# Ajuste 92 — Cenário de 14 dias (14 a 27/11/2026), vouchers, eventos, aviso de validade e kit do participante

Origem: teste de 13/out/2026. A Adriana achou o cenário antigo (20 a 25/11, 1–2 noites por cidade) corrido demais e definiu uma viagem de 14 dias, saindo de São Paulo, com voo de volta. Este ajuste atualiza **todos os dados simulados** pra bater com o cenário novo. O roteiro de teste (`../Instrucoes/15-roteiro-teste-usabilidade-mes2.md`) é reescrito à parte, fora do código.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 92: cenário de 14 dias, vouchers, eventos e kit`.

---

## 0. Cenário novo (fonte da verdade)

| Trecho | Datas | Como entra no teste |
|---|---|---|
| Voo SP → Buenos Aires | sáb 14/11 — Aerolíneas Argentinas AR 1241, GRU 08:15 → EZE 11:05 | **à mão** (ditado pelo moderador), sem voucher |
| Buenos Aires | 14 a 19/11 (5 noites) | |
| Voo Buenos Aires → Santiago | qui 19/11 — LATAM LA 4550, EZE 14:00 → SCL 16:20 | voucher |
| Santiago | 19 a 23/11 (4 noites) | |
| Voo Santiago → Calama | seg 23/11 — LATAM LA 250, SCL 08:00 → CJC 09:45 | voucher |
| San Pedro de Atacama | 23 a 27/11 (4 noites) | |
| Voo de volta Calama → Santiago → SP | sex 27/11 | voucher **novo** |

Nome da viagem continua "Buenos Aires, Santiago e Deserto do Atacama". Grupo: você + Marina Duarte + Rodrigo Antunes.

## 1. Vouchers e documentos de exemplo (PDFs em `public/mock-vouchers/`)

Os PDFs atuais foram gerados a partir de HTML no Chromium (Creator: Chromium, 600×366 pt). **Regerar com o mesmo visual**, só trocando os dados abaixo. Se existir script/HTML de origem no repositório, reaproveitar; senão, recriar o HTML com o mesmo layout e gerar com o Chromium/Playwright já disponível. Manter em todos o rodapé "Documento de exemplo… não é uma reserva real".

| Arquivo | O que muda |
|---|---|
| `voucher-hotel-buenosaires-magnolia.pdf` | Check-in **14/11/2026, 15:00** · check-out **19/11/2026, 11:00** · "Café da manhã incluso. **5 noites**." |
| `voucher-trem-buenosaires-tigre.pdf` | Data **16/11/2026** (segunda) |
| `voucher-voo-buenosaires-santiago.pdf` | Data **19/11/2026** (horários iguais: 14:00 → 16:20) |
| `voucher-hotel-santiago-cumbreslastarria.pdf` | Check-in **19/11/2026, 17:00** · check-out **23/11/2026, 06:00** (texto do check-out antecipado continua) |
| `voucher-carro-santiago-vinadelmar.pdf` | Retirada **21/11/2026, 09:00** · devolução **21/11/2026, 20:00** |
| `ingresso-festival-cerveja-santiago.pdf` | Continua **22/11/2026 (domingo)** — sem mudança de data |
| `voucher-voo-santiago-calama.pdf` | Data **23/11/2026** (08:00 → 09:45) |
| `voucher-transfer-calama-sanpedro.pdf` | Data **23/11/2026** (10:15 → 11:45) |
| `voucher-pousada-sanpedro-casasolcor.pdf` | Check-in **23/11/2026, 14:00** · check-out **27/11/2026, 11:00** · "… **4 noites**." |
| `ingresso-passeio-valle-de-la-luna-exemplo.pdf` | Continua **24/11/2026** — sem mudança |
| `seguro-viagem-exemplo.pdf` | Vigência **14/11/2026 a 27/11/2026** |
| **NOVO** `voucher-voo-volta-calama-saopaulo.pdf` | LATAM (exemplo), localizador **QXRT4M**, 2 trechos em **27/11/2026**: **LA 341** CJC 12:30 → SCL 14:25 · **LA 8070** SCL 16:30 → GRU 21:40 · Econômica · 1 despachada + 1 de mão |

Atualizar também as entradas correspondentes em `src/data/mockVouchers.ts` (datas, noites), e cadastrar o voo de volta. **Voo com 2 trechos:** se o formulário de voo não comportar conexão, criar o item como **dois voos** (o app adiciona os dois ao ler o voucher, com o aviso verde de conferir) — não inventar um tipo novo de transporte. O voo de volta entra no destino **San Pedro de Atacama**.

Copiar todos os PDFs atualizados (e o novo) para `../Instrucoes/Envio_Participante_Tairu/Arquivos do teste/`, substituindo os antigos.

## 2. Notas fiscais (já atualizadas)

`public/mock-receipts/nota-don-julio-buenosaires.jpg` agora é de **15/11/2026**, e `nota-bocanariz-santiago.jpg` de **21/11/2026** (as imagens já foram trocadas). Atualizar as datas em `src/data/mockReceipts.ts`.

## 3. Gastos simulados dos convidados

Em `src/data/mockCompanions.ts`: transfer do Rodrigo → `dateISO: '2026-11-14'`; tour da Marina (Laguna Cejar) → `dateISO: '2026-11-25'`.

## 4. Eventos (`src/data/events.json`)

- **Recorrentes reais:** mover para uma ocorrência válida dentro das novas datas da cidade, mantendo fonte e `recurring`:
  - Milonga na Glorieta (sáb/dom) → **sáb 14/11** (id passa a terminar com a data nova).
  - Feira de San Telmo (todo domingo) → **dom 15/11**.
  - Persa Biobío (sáb, dom, feriados) → continua **dom 22/11**.
- **Troca da Guarda (La Moneda):** reconferir na fonte o calendário (não acontece todo dia) e escolher uma data válida entre **20 e 22/11** (no dia 23 o grupo sai às 06:00). Se não der pra confirmar, marcar `note: "confirme no site oficial"` e usar a data mais provável.
- **Shows com data fixa** (Miguel Mateos 21/11 em Buenos Aires; CA7RIEL & Paco Amoroso 23/11 em Santiago): **não mudar a data** (é dado real). O de Buenos Aires deixa de aparecer, porque fica fora das datas da cidade; tudo bem. O de Santiago cai no dia em que o grupo sai cedo: manter.
- **Lua cheia no deserto** 24/11 → manter (dentro de 23–27).
- Os templates de `cityEventTemplates.json` continuam garantindo que nenhuma cidade fique sem eventos.
- Atualizar `checkedAt` só dos que forem reconferidos.

## 5. Aviso de validade que sempre aparece (passaporte)

**Problema visto no teste:** com "Me avisar 3 meses antes", o aviso só começaria em dezembro, e a Início não mostrou nada. A tarefa falhou sem culpa da participante.

**Fazer:** além do lembrete escolhido, o app mostra um **aviso fixo na Início** quando um documento **vence até 6 meses depois do fim de uma viagem cadastrada**. Exemplo: "Seu passaporte vence em 10/03/2027, 3 meses depois da volta da viagem. Confira as regras de entrada dos países." Não afirmar regra de país nenhuma (decisão antiga do projeto). Esse aviso não depende do "Me avisar" e some se a validade for atualizada.

No cenário, a validade continua **10/03/2027** (no `passaporte-exemplo.png` e no mock de leitura de documento).

## 6. Fotos do kit do participante

Baixar do **Wikimedia Commons** (licença livre) **5 fotos verticais** (retrato) de **La Boca / Caminito**, já que a participante adiciona fotos na parada do Caminito:
- Salvar em `../Instrucoes/Envio_Participante_Tairu/Arquivos do teste/` como `foto-caminito-1.jpg` … `foto-caminito-5.jpg`, com ~1600px no lado maior.
- **Gravar no EXIF** `DateTimeOriginal` = `2026:11:15 HH:MM:SS` (horários diferentes, entre 10:00 e 13:00), pra que, se a foto entrar por Memórias, o app a coloque no dia certo pela data.
- Criar `../Instrucoes/Envio_Participante_Tairu/Arquivos do teste/creditos-fotos.txt` com autor, licença e link de cada foto.
- Se não houver 5 fotos verticais boas, recortar horizontais para 4:5 (anotar no crédito "recortada").

## 7. Testes automatizados

Atualizar o cenário do teste de divisão de dias (`proximityDays.test.ts`) para Buenos Aires **14 a 19/11** (5 dias, sendo o 19 de deslocamento) e os mesmos critérios de aceite do ajuste 88. Ajustar outros testes que usem as datas antigas.

## 8. `CLAUDE.md`

Atualizar o parágrafo do cenário fixo de teste com a tabela do item 0.

---

## Checklist de aceite
- [ ] 11 PDFs atualizados + o voo de volta novo, mesmo visual, no app e no kit.
- [ ] Ler cada voucher no app preenche as datas novas; o voo de volta entra em San Pedro (como 2 voos, se precisar).
- [ ] Datas das notas e dos gastos simulados atualizadas.
- [ ] Buenos Aires mostra Milonga (14/11) e Feira de San Telmo (15/11) em "Eventos nas suas datas".
- [ ] Aviso fixo de validade na Início com passaporte 10/03/2027, qualquer que seja o "Me avisar".
- [ ] 5 fotos verticais no kit, com data no EXIF e créditos.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
