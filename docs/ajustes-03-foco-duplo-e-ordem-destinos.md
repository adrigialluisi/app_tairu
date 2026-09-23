# Ajustes — anel de foco duplicado + ordem do campo de destinos (08/set/2026)

## 1. Anel de foco feio/duplicado (bug em 3 dos 4 componentes de input)

O que a Adriana viu no campo de Destinos: ao focar o input, aparecem **dois contornos vermelhos sobrepostos e desalinhados** (um menor por dentro, um maior por fora) — feio, parece erro visual, não uma borda de foco intencional.

**Causa raiz:** `src/styles/global.css` tem uma regra global `:focus-visible { outline: 3px solid var(--focus-ring); outline-offset: 2px; }` que se aplica a *qualquer* elemento focável, incluindo o `<input>` em si. Só que o padrão de campo com moldura (`.inputWrap`/`.wrap` por fora do `<input>`) também desenha o próprio anel de foco via `:focus-within` no wrapper. Sem suprimir o `:focus-visible` nativo do `<input>`, os dois anéis desenham ao mesmo tempo, com caixas de tamanho e raio diferentes — daí o efeito de traço duplo/desalinhado.

`src/components/inputs/TextField.module.css` já resolve isso certo, com:
```css
.input:focus-visible {
  outline: none;
}
```
(o wrapper continua sendo o único a mostrar o anel, via `.inputWrap:focus-within`).

**Essa mesma correção falta em:**
- `src/components/inputs/DestinationField.module.css` (o campo do print, mas com mesmo padrão `.inputWrap`/`.input`)
- `src/components/inputs/DateRangeField.module.css` (mesmo padrão `.inputWrap`/`.input`)
- `src/components/inputs/CurrencySelect.module.css` (usa `.wrap:focus-within` — checar qual é o nome da classe do elemento focável interno ali e aplicar a mesma lógica: suprimir o `:focus-visible` nativo dele, deixando só o wrapper desenhar o anel)

Aplicar a mesma correção (suprimir o outline nativo do elemento focável interno, manter só o anel do wrapper) nos três. Depois, testar clicando/tabulando em cada um dos quatro tipos de campo (texto simples, datas, destino, moeda) pra confirmar que sobrou só **um** anel de foco, limpo, em todos.

## 2. Campo de destino não pode se mover conforme adiciona pills

Hoje em `DestinationField.tsx`, a ordem de renderização é: label → **lista de chips dos destinos já adicionados** → campo de busca/autocomplete → erro → lista de moedas por destino. Isso faz o campo de busca "descer" na tela toda vez que um destino novo é adicionado (os chips empilham por cima, empurrando o campo pra baixo) — ruim pra usabilidade, porque o alvo que a pessoa mais usa (o campo onde ela digita o próximo destino) fica se movendo.

**Trocar a ordem pra:** label → **campo de busca/autocomplete primeiro** → lista de chips dos destinos já adicionados **depois, abaixo do campo** → erro → lista de moedas por destino.

Assim o campo de busca fica sempre na mesma posição (logo abaixo do label), e quem for adicionando destinos vê os chips se acumulando abaixo dele, sem o campo em si se mexer.

## Checklist antes de considerar pronto
- `npm run build` limpo.
- Testar foco (clique e Tab) nos 4 tipos de campo — só um anel de foco por vez, sem duplicação.
- Adicionar 3+ destinos e confirmar que o campo de busca não muda de posição — só a lista de chips cresce abaixo dele.
- Testar em 375px e 390px de largura.
