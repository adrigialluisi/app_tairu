# Tela 3 — Quiz de perfil da viagem


> **Atualizado em 10/set/2026 (revisado de novo no mesmo dia):** esta tela deixa de ser rota própria e vira a aba "Perfil da viagem" dentro da tela de Destinos, ao lado da aba "Destino" (alternador leve — dois links de texto, não mais o componente `Tabs` cheio) — o conteúdo das perguntas vive em `TripProfileQuiz.tsx` (componente reaproveitável, sem `ScreenShell` próprio). Continuam sendo 6 perguntas: "Interesses da viagem" e "Já conhece algum desses destinos" chegaram a virar campos por destino e foram revertidas pra gerais de novo, agora com um parágrafo pedindo pra considerar todos os destinos da viagem. Ver `docs/ajustes-17-perfil-geral-e-abas-mais-sutil.md` (substitui `docs/ajustes-14-interesses-por-destino.md`) e `docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md`.
Ver `../../Site_Publicado/14-fluxo-proposto-mes2.html`, etapa 3, pro racional completo (por que é curto, por viagem — não fixo no cadastro como no app atual, que tem 7 telas de quiz, uma pergunta por vez).

## Objetivo

Perguntas rápidas sobre o perfil **desta viagem específica**, numa rolagem só — não uma tela por pergunta como o app atual faz hoje. Cresceu de 3 pra 6 perguntas (decisão de 09/set/2026) pra dar mais insumo às dicas locais (etapa 5) e ao roteiro combinado (etapa 4), mas continua "rapidinho": toda pergunta é seletor de toque único ou multi-toque, nenhuma exige digitação.

## Perguntas

### Já validadas por pesquisa (Padrão 4, confirmado em 9/10 entrevistados) — não alterar texto nem opções

1. **Relax ou urbano?** — Relax / Equilibrado / Urbano. **Múltipla escolha desde 11/set/2026** (ver `docs/ajustes-18-pace-multi-select.md`) — uma viagem pode ter os dois perfis ao mesmo tempo (ex.: dias mais urbanos e dias mais relax na mesma viagem). Texto e opções continuam os mesmos do achado de pesquisa original — só o modelo de interação mudou, de seleção única pra múltipla escolha, igual "Interesses da viagem".
2. **Ritmo do dia a dia?** — Tranquilo / Moderado / Corrido
3. **Orçamento aproximado?** — Econômico / Moderado / Confortável

### Novas (decisão de 09/set/2026 — não são achado de pesquisa como as 3 acima, são hipótese de produto pra testar no Mês 2)

4. **Interesses da viagem** — múltipla escolha, pode marcar mais de um: Gastronomia / Cultura e história / Natureza / Vida noturna / Compras. Usa o mesmo padrão visual de chip das outras perguntas, mas com estado "marcado" persistente pra vários ao mesmo tempo (não é um grupo exclusivo como as perguntas 1-3 e 5-6). É a que mais impacta a etapa 5 (dicas locais): hoje o app só distingue dica "cultural" x "de descanso" pelo eixo relax/urbano — este campo dá um filtro de tema direto (ex.: alguém marcou "Gastronomia" e "Vida noturna" recebe dicas de restaurante e balada antes de dica de museu).
5. **Já conhece algum desses destinos?** — Sim, já conheço / Não, primeira vez. Pergunta em nível de viagem (não pergunta destino por destino) — ajusta a profundidade da dica: quem nunca foi recebe primeiro o essencial/turístico; quem já conhece recebe sugestões mais "fora do óbvio".
6. **Como vai ser essa viagem?** — Sozinho(a) / Casal / Amigos / Família com crianças. Sobre o **tom** da viagem, não é uma contagem de participantes — é independente de quem foi convidado na Tela 2 (dá pra viajar "em família" mesmo sem ter mandado nenhum convite pelo app ainda, ou convidar 3 amigos e marcar "Casal" se só o casal decide junto). Muda o tom das sugestões (ex.: dica de vida noturna x dica kid-friendly).

Usar seletores em formato chip/segmented control (toque único pra selecionar, visualmente claro qual está selecionado) pra 2, 3, 5 e 6 — não radio button tradicional, que é mais lento de usar no celular. As perguntas 1 (Relax ou urbano, desde 11/set/2026) e 4 (Interesses) usam o mesmo visual de chip mas permitem vários marcados ao mesmo tempo.

## Estado (TripContext)

Atualizar `src/context/TripContext.tsx`:

```ts
export type QuizPace = 'relax' | 'equilibrado' | 'urbano';
export type QuizRhythm = 'tranquilo' | 'moderado' | 'corrido';
export type QuizBudget = 'economico' | 'moderado' | 'confortavel';
export type QuizInterest = 'gastronomia' | 'cultura' | 'natureza' | 'vida-noturna' | 'compras';
export type QuizKnowsDestination = 'sim' | 'nao';
export type QuizCompanionType = 'sozinho' | 'casal' | 'amigos' | 'familia-criancas';

export interface QuizAnswers {
  pace: QuizPace | null;
  rhythm: QuizRhythm | null;
  budget: QuizBudget | null;
  interests: QuizInterest[];
  knowsDestination: QuizKnowsDestination | null;
  companionType: QuizCompanionType | null;
}
```

- `initialQuiz` passa a incluir `interests: []`, `knowsDestination: null`, `companionType: null`.
- `setQuizAnswer` (já existe) continua servindo pras perguntas de seleção única (pace, rhythm, budget, knowsDestination, companionType).
- Nova função `toggleQuizInterest(interest: QuizInterest)`: adiciona o interesse ao array `interests` se ainda não estiver lá, remove se já estiver — mesma lógica de toggle usada nos chips de seleção múltipla.

## Comportamento

- As respostas alimentam (mais adiante, em telas futuras) o roteiro sugerido e as dicas locais — não precisa implementar essa lógica de sugestão ainda, só guardar a resposta no estado da viagem.
- Botão "Continuar" habilita quando as 6 perguntas estiverem respondidas — pra "Interesses" (múltipla escolha), considerar respondida com pelo menos 1 item marcado.
- Como a próxima tela real (seleção de lugares) ainda não existe neste bloco, pode navegar pra uma tela simples de "Em construção — próxima tela" ao final, só pra fechar o fluxo clicável até aqui.

## Acessibilidade

- Cada grupo de opções precisa de um label de pergunta associado corretamente (não só texto solto acima) — inclusive o grupo de múltipla escolha (pergunta 4), que precisa deixar claro por leitor de tela que é possível marcar mais de uma opção.
- Estado selecionado/marcado não pode depender só de cor — usar também contorno/ícone de check (já é o padrão das perguntas 1-3, replicar em todas).
- Ver também a seção "Espaçamento e organização visual" do `CLAUDE.md` — aplica-se a esta tela em especial, por ter 6 grupos de perguntas agora (mais fácil de ficar visualmente espremido do que com 3).

## Fora de escopo deste bloco (anotado, não construir agora)

A interface de quem *recebe* o convite (visão do convidado aceitando participar da viagem, possivelmente respondendo seu próprio perfil) é uma tela futura, fora deste bloco — decisão de 09/set/2026: só fica anotada aqui e na memória do projeto, não entra na fila de construção agora.
