# Ajuste 101b — "Adicionar à agenda" sem escolher dia (volta a proximidade) e mudar de dia também pelo mapa

Origem: Adriana testando o ajuste 101 (28/out/2026). Pedir o dia em cada "Adicionar à agenda" fixa todos os lugares e o app perde a divisão por proximidade, que era uma das vantagens do roteiro. A pessoa pode mudar o dia depois, direto na Agenda — e também pelo mapa, não só pela lista.

Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 101b: adicionar sem dia e mudar de dia pelo mapa`.

---

## 1. "Adicionar à agenda" nas Sugestões não pede dia

- Tocar em **"Adicionar à agenda"** no card adiciona na hora, **sem folha e sem "Em qual dia?"**. O lugar entra **sem fixação** (sem `pinnedDayISO`) e a divisão por proximidade (ajustes 80/88) decide o dia.
- Toast: **"Adicionado à agenda · dom, 15/11 · Ver"** (dia calculado depois de redistribuir; "Ver" leva à Agenda nesse dia, com o card piscando).
- O card mostra **"✓ Na agenda · dom 15"** com o dia **atual** do lugar. Se adicionar outros lugares redistribuir os dias, o rótulo acompanha.
- Tocar no "✓ Na agenda" abre o menu curto (ajuste 101): "Ver na agenda" / "Mudar de dia" / "Tirar da agenda".
- **Eventos:** "Adicionar à agenda" também adiciona direto, no dia e horário do evento (sem perguntar).
- **Busca das Sugestões** ("Buscar um lugar em {cidade}"): ao adicionar um resultado, também sem dia — entra pela proximidade. Esconder o "Em qual dia?" quando a folha é aberta a partir das Sugestões.
- **Botão flutuante "+ Adicionar" da Agenda:** continua com "Em qual dia?" (padrão = dia selecionado nas pílulas), porque ali a pessoa está olhando um dia. Lugar adicionado por ele fica fixado nesse dia, como hoje.
- **Sugestões dos convidados:** sem mudança (entram no dia do plano do convidado).

## 2. Mudar de dia na Agenda (lista)

Já existe em "Alterar → Mudar de dia" (ajustes 95/97). Conferir que:
- mudar de dia **fixa** o lugar no dia novo (ícone de alfinete);
- "Deixar o app escolher o dia" solta a fixação e devolve o lugar à proximidade.

## 3. Mudar de dia pelo mapa

Na Agenda → **Mapa**:
- Tocar num pino abre o popup do lugar com: foto pequena, nome, **"dom, 15/11"** (dia atual) e dois botões: **"Mudar de dia"** e **"Tirar da agenda"**.
- "Mudar de dia" abre as pílulas com os dias da cidade (o dia atual marcado); ao tocar num dia, o lugar muda, fica fixado, o pino troca de cor/número pro dia novo e aparece o toast "Movido pra seg, 16/11".
- No mapa filtrado por um dia, o lugar movido some desse filtro (comportamento esperado) e o toast tem "Ver" pra ir ao dia novo.
- Alvos de toque ≥ 44px no popup; o popup não pode ficar escondido atrás do botão flutuante nem sair da tela em 360px.

## 4. Eventos na agenda funcionam como lugares

Hoje, tocar num evento na AGENDA DO DIA abre a folha de busca (ajuste 100), o que não faz sentido pra algo já agendado. Trocar: o evento ganha as mesmas ações de uma parada — **"Foto"**, **"Gasto"** e **"Alterar"** (no Alterar de evento: só "Tirar da agenda", já que a data é a do evento).

---

## Checklist de aceite
- [ ] "Adicionar à agenda" em Sugestões adiciona direto, sem pedir dia; o card mostra o dia calculado e acompanha redistribuições.
- [ ] Busca das Sugestões adiciona sem dia; "+ Adicionar" da Agenda continua pedindo o dia.
- [ ] Adicionar 6 lugares de Buenos Aires pelas Sugestões distribui por proximidade (não ficam todos no mesmo dia).
- [ ] Mapa: tocar no pino → "Mudar de dia" → o lugar vai pro dia novo e fica fixado.
- [ ] Evento na agenda com Foto / Gasto / Alterar.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
