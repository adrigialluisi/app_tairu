# Ajuste 19 — Desligar autofill do navegador nos campos de texto

Feedback da Adriana (11/set/2026), com print do campo "Nome da viagem" mostrando "LATAM" com fundo azul: ao digitar, o navegador está sugerindo/preenchendo um valor salvo de outro lugar (autofill nativo do Safari/Chrome, não é dado do app) e aplica um destaque visual (fundo azul) que quebra completamente a identidade visual do campo.

## Por que isso é grave pra este protótipo especificamente

Todo o `CLAUDE.md` é construído em cima de **"nada pré-preenchido"**: cada participante do teste de usabilidade tem que ver o app inteiramente vazio, sem nenhum dado de exemplo. O autofill do navegador quebra esse princípio por fora do controle do app — cada participante pode ver um valor salvo diferente (ou nenhum) dependendo do histórico do próprio computador, o que é **pior que inconsistente: é imprevisível dentro de uma sessão de teste moderada**. Precisa ser desligado explicitamente em todo campo de texto livre do protótipo.

## Isso pode ser a causa raiz do bug "o menu não aparece"

Autofill nativo do navegador em campo controlado do React (`value`/`onChange`) é uma causa clássica de dessincronia: o navegador escreve o texto direto no `<input>` do DOM sem necessariamente dar o evento `input` que o `onChange` do React escuta — então **o campo mostra "LATAM" na tela, mas `trip.name` no estado do React pode continuar vazio**. Se for esse o caso, `markTripStarted()` nunca dispara (a condição `trip.name.trim().length > 0` falha mesmo com texto visível), o que bate exatamente com o relato anterior de "o menu não aparece" mesmo depois de digitar um nome. **Depois de aplicar o `autoComplete="off"` abaixo, testar de novo o fluxo do menu fixo** (`docs/ajustes-16-menu-aparece-so-ao-confirmar-nome.md`) — pode ser que os dois relatos sejam o mesmo bug.

## 1. Desligar autofill nos 3 usos de `TextField`

Adicionar `autoComplete="off"` em todos, mesmo padrão que `DestinationField.tsx` e `DateRangeField.tsx` já usam nos próprios inputs:

- **`CreateTrip.tsx`, campo "Nome da viagem"** (o do print) — adicionar `autoComplete="off"`.
- **`InviteCompanions.tsx`, campo "E-mail do convidado"** — adicionar `autoComplete="off"`. (Em produção normalmente se quer autofill de e-mail, mas aqui o cenário de teste é fixo e moderado — o mesmo raciocínio de "nada pré-preenchido" vale: cada participante deve digitar o e-mail do roteiro do teste, sem sugestão de histórico do navegador puxando algo salvo no computador de outro participante.)
- **`Itinerary.tsx`, campo "Não achou o que procurava? Adicione um lugar"** — adicionar `autoComplete="off"`.

```tsx
<TextField
  id="trip-name"
  label="Nome da viagem"
  placeholder="Ex.: Réveillon em família"
  value={trip.name}
  onChange={trip.setName}
  onBlur={() => { if (trip.name.trim().length > 0) trip.markTripStarted(); }}
  onKeyDown={(e) => { if (e.key === 'Enter' && trip.name.trim().length > 0) trip.markTripStarted(); }}
  autoComplete="off"
  required
/>
```

(Mesma ideia nos outros dois — só adicionar a prop, sem mexer em mais nada.)

## 2. Neutralizar o estilo de autofill como segunda camada de proteção

`autoComplete="off"` nem sempre impede 100% o Safari de aplicar o próprio destaque visual de autofill (alguns navegadores ignoram esse atributo pra campos que reconhecem por heurística própria). Como segunda camada, sobrescrever o estilo do autofill em `TextField.module.css` pra ele respeitar as cores do design system em vez do azul/amarelo padrão do navegador:

```css
.input:-webkit-autofill,
.input:-webkit-autofill:hover,
.input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text);
  box-shadow: 0 0 0 1000px var(--card) inset;
  -webkit-box-shadow: 0 0 0 1000px var(--card) inset;
  transition: background-color 9999s ease-in-out 0s;
}
```

(O truque do `box-shadow` inset gigante é a forma padrão de sobrescrever o fundo que o `-webkit-autofill` aplica, já que `background-color` sozinho não tem prioridade suficiente nesse pseudo-estado em navegadores baseados em WebKit/Blink.)

## Checklist antes de considerar pronto

- `npm run lint` e `npm run build` sem erro.
- Testar especificamente em Safari (é onde o autofill com fundo azul apareceu no print) — digitar no campo "Nome da viagem" não deve mais sugerir nem preencher nenhum valor salvo.
- Mesmo teste nos campos de e-mail (Convidar) e "Adicionar lugar por conta própria".
- Reconfirmar o fluxo do menu fixo depois desse ajuste: digitar um nome de viagem, clicar fora (ou Enter), e o menu aparecer imediatamente — ver nota acima sobre isso poder ser a mesma causa do bug relatado antes.
- Se o navegador ainda assim aplicar o próprio destaque de autofill em algum campo, o fundo/cor do texto continuam os do design system (creme/`--text`), não azul/amarelo do navegador.
- Nenhum outro campo de texto livre do app ficou de fora — conferir se surgirem novos campos de texto no futuro (regra geral, não pontual pra esta tela).
