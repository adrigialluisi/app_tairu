# Ajustes 98 e 99 — Moeda fora de Destinos, botão fixo, dia obrigatório e busca entre cidades

Origem: pedido da Adriana em 27/out/2026, depois do ajuste 97. Commit: `ajustes 98 e 99: moeda fora de Destinos, botão fixo, dia obrigatório e busca entre cidades`.

---

## Parte A — Moeda sai de Destinos (ajuste 98)

1. **Cartão do destino:** só cidade + datas. O `CurrencySelect` "Moeda" saiu do `DestinationField`, e `trip.setDestinationCurrency` saiu porque ficou sem uso.
2. A moeda continua em `destination.currencyCode`, preenchida pela cidade escolhida (`cities.json`), sem pergunta.
3. **Resumo salvo:** "Buenos Aires, Argentina — 14/11/2026 – 19/11/2026" termina nas datas.
4. **A moeda aparece onde a pessoa lança um valor**, com a da cidade como padrão e editável:
   - **Central → Transporte e Hospedagem:** o custo começava em BRL. Agora começa na moeda do destino do item. Os trechos a mais do voucher de volta seguem a mesma moeda.
   - **Central → Outros:** padrão = moeda do destino do "Vale para" (Viagem toda = BRL). A moeda acompanha o "Vale para" até a pessoa escolher outra ou o arquivo lido trazer uma.
   - **Custos → Lançar gasto:** já funcionava. A moeda muda com o "Onde foi?" e, pela parada do Roteiro, vem a moeda dela.
   - **Conversor:** a moeda de origem é a da cidade que chamou (Dicas locais). Se nenhuma chamou, a do destino de hoje (viagem acontecendo). Se a viagem não começou, a do primeiro destino. Antes era sempre a do primeiro.

## Parte B — Folha "Adicionar lugares" (ajuste 99, corrige o 97)

5. **Botão flutuante sempre visível** na sub-aba Roteiro (no 97 sumia ao rolar). Fica dentro da folha do `ScreenShell`, logo acima do menu fixo, que já guarda a área segura do iPhone. O espaço no fim da aba subiu de 64 para 80px.
6. **Dia obrigatório:** saiu o "Deixar o app escolher" da folha. As pílulas mostram só os dias da cidade.
   - Padrão = o dia das pílulas da tela.
   - Em "Todos os dias", nenhum dia vem marcado e o botão fica desabilitado com o texto "Escolha um dia".
   - O "+ Adicionar '…' como lugar meu" também fica desabilitado sem dia.
   - O "Deixar o app escolher o dia" do menu "Alterar" da parada **fica**: é o jeito de soltar um lugar fixado.
   - A prévia ganhou o "Em qual dia?" também, pra trocar o dia sem voltar.
7. **Busca entre cidades:** grupo novo **"Em outras cidades da viagem"**, entre "Sugestões do app" e "Outros lugares". Mostra lugares do `places.json` e do roteiro das outras cidades que batem com o texto ("MALBA · Buenos Aires · Cultura").
   - Lugar do app: abre a prévia com o aviso âmbar "Esse lugar fica em Buenos Aires". As pílulas de dia passam a ser as de Buenos Aires (começam no dia das pílulas da tela, se ele for de lá), e adicionar põe o lugar em Buenos Aires.
   - Lugar que já está no roteiro de outra cidade: leva até a parada ("Buenos Aires · já no seu roteiro, dia Dom 15/11").
8. **Photon só com o que tem a ver com o texto** (`matchesQuery` em `src/utils/photon.ts`):
   - O nome precisa conter o texto, ignorando acento e maiúscula. Isso inclui começar com ele.
   - Com 6+ letras, aceita 1 erro de digitação (distância de edição ≤ 1 contra cada trecho do nome com o mesmo número de palavras).
   - "malba" não traz "Malta"; "tortonni" acha "Café Tortoni".
   - Testes em `photon.test.ts`.
9. CLAUDE.md: seções Destinos, Custos e Roteiro, e a exceção de internet do Photon.
