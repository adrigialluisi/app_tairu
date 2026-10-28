# Ajuste 100 — Roteiro numa tela só: cidade em select, Dicas por cidade, sugestões dentro do "Adicionar", sugestões dos convidados no topo

Origem: sessões de teste de 27 e 28/out/2026.
- Todos os participantes tiveram dificuldade com a faixa de abas "Roteiro · Sugestões do app · Dicas locais".
- As Dicas locais são de uma cidade, mas ficavam no mesmo nível do roteiro.
- Na Parte 2, as sugestões da Marina e do Rodrigo não apareceram: o "Simular: uma semana antes da viagem" fica desabilitado, sem aviso, quando os e-mails do convite não batem com os do cenário.
- O interruptor "Mostrar planos do grupo" não foi entendido.

Substitui a estrutura de sub-abas dos ajustes 95 e 97. Antes de começar: ler o `CLAUDE.md`. Ao terminar: `npm run lint`, `npm test` e `npm run build`. Commit: `ajuste 100: roteiro numa tela só, dicas por cidade e sugestões no adicionar`.

---

## 1. Simulação à prova de erro de digitação

"Simular: uma semana antes da viagem" passa a fazer o mesmo que o "durante a viagem" já faz: se a Marina e/ou o Rodrigo não estiverem convidados com o e-mail exato do cenário, **convida automaticamente quem faltar** e roda a simulação. O botão só fica desabilitado se não houver destino com datas, ou se a simulação já rodou.

## 2. Uma tela só: sai a faixa de sub-abas

- Remover as sub-abas "Roteiro · Sugestões do app · Dicas locais". A tela Roteiro mostra direto o roteiro.
- Remover o interruptor "Mostrar planos do grupo", se ainda existir. Os planos do grupo ficam sempre visíveis no fim de cada dia (bloco PLANOS DO GRUPO, borda tracejada).

Ordem da tela, de cima pra baixo:
1. **Cidade + Dicas** (seção 3), fixo no topo.
2. **Lista | Mapa** (controle segmentado de largura total, ajuste 97), fixo no topo junto com a cidade.
3. Pílulas de data (rolam com a página).
4. **Sugestões dos convidados** (seção 6), só quando houver.
5. Cards dos dias.
6. Botão flutuante **"+ Adicionar"** (seção 4).

## 3. Cidade num select e botão "Dicas"

- No lugar das abas de cidade: um **select grande**, largura flexível, altura 48px, ícone de pino + nome da cidade + chevron: **"📍 Buenos Aires ▾"**. Opções: **Todas as cidades**, depois as cidades da viagem na ordem das datas. Usar o select do shadcn já usado no projeto (ou `NativeSelect`), com 16px de fonte (iPhone).
- À direita do select, um botão secundário **"Dicas"** com ícone de lâmpada (`Lightbulb` do lucide), 48px de altura.
  - Abre a tela **Dicas locais daquela cidade**, numa rota própria (ex.: `/roteiro/dicas/:destinationId`), sem menu fixo, com voltar pro Roteiro na mesma cidade.
  - O conteúdo é o mesmo da antiga aba Dicas locais, incluindo o atalho do conversor em "Dinheiro e câmbio".
  - Com "Todas as cidades" selecionado, o botão **não aparece**.
- A cidade escolhida continua sendo a referência da tela: as pílulas de data, o mapa, o bloco de convidados e a folha "Adicionar" usam essa cidade. Em "Todas as cidades", a folha pergunta a cidade (ajuste 97).
- Remover o componente de abas de cidade da tela Roteiro, se não for mais usado em outro lugar.

## 4. Sugestões do app dentro do "Adicionar"

O botão flutuante passa a se chamar **"+ Adicionar"** e é o único caminho pra colocar algo no roteiro.

A folha (ajuste 97) abre assim, de cima pra baixo:
1. Título "Adicionar a {cidade}".
2. **"Em qual dia?"** (como no ajuste 99: padrão = dia selecionado; sem dia, botão desabilitado "Escolha um dia").
3. **Campo de busca** (ajustes 97/99, sem mudança na lógica).
4. **Com o campo vazio**, a folha mostra as **sugestões do app pra essa cidade**, no mesmo formato da antiga aba Sugestões:
   - as seções por perfil ("Porque vocês gostam de Gastronomia", "Pontos turísticos", "Fora do circuito"…), cada uma em carrossel, com o "Por que" curto;
   - "Eventos nas suas datas";
   - cada card mantém o "+" (adiciona no dia escolhido em "Em qual dia?"; se nenhum dia estiver escolhido, o "+" abre a prévia pedindo o dia).
5. **Com texto no campo**, as sugestões dão lugar aos resultados da busca (ajustes 97/99).

As "Escolhas dos convidados" **não** entram na folha: ficam no topo do roteiro (seção 6).

## 5. Dia vazio

Dia sem nenhum lugar mostra, no card: *"Ainda nada por aqui"* e o botão secundário **"Ver sugestões pra {cidade}"**, que abre a folha "Adicionar" já com aquele dia escolhido.

## 6. "Sugestões dos convidados" no topo

- Logo acima dos cards dos dias, quando houver plano de convidado **sem resposta** da participante na cidade escolhida (ou em qualquer cidade, em "Todas as cidades"): bloco **"Sugestões dos convidados · N"**.
- Uma linha por lugar, igual à lista do ajuste 95 item 5: miniatura, nome, avatar colorido + "Marina vai", filete na cor do convidado e o círculo "+" que vira ✓.
- Tocar no "+": o lugar entra no roteiro da participante (regra do 95b) e a linha **sai do bloco**. O bloco some quando não sobrar nenhuma.
- Tocar no resto da linha: rola até o plano provisório no dia dele.

## 7. Navegação que apontava pras abas antigas

- Novidades da Início, "N lugares sugeridos em {cidade}": abre o Roteiro com essa cidade no select e o bloco da seção 6 visível.
- "Ver o dia de hoje" (durante a viagem): abre o Roteiro com a cidade de hoje e o dia de hoje.
- Qualquer outro `navigate('/roteiro', { state: { tab: … } })`: trocar por cidade (+ dia, quando houver). Procurar todos.

## 8. Conferir

- Testar em 375px, 390px (iPhone) e 360px (Android): select + Dicas cabem lado a lado sem quebrar; nada sai da tela.
- Atualizar o `CLAUDE.md` (seção Roteiro: tela única, select de cidade, Dicas por cidade, sugestões na folha, bloco de convidados, sem interruptor).

---

## Checklist de aceite
- [ ] Com convites digitados errado (ou sem convites), "Simular: uma semana antes da viagem" funciona e traz as sugestões da Marina e do Rodrigo.
- [ ] Roteiro sem sub-abas; sem interruptor de planos.
- [ ] Select de cidade com "Todas as cidades"; botão "Dicas" abre as dicas da cidade e some em "Todas".
- [ ] "+ Adicionar" abre a folha com as sugestões do app por perfil e os eventos; digitar troca pelas buscas.
- [ ] Dia vazio com "Ver sugestões pra {cidade}".
- [ ] Bloco "Sugestões dos convidados" no topo; "+" vira ✓ e a linha sai.
- [ ] Novidades da Início levam ao Roteiro na cidade certa.
- [ ] `npm run lint`, `npm test` e `npm run build` ok.
