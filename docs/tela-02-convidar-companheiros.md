# Tela 2 — Convidar companheiros de viagem


> **Atualizado em 10/set/2026 (revisado no mesmo dia):** esta tela vira item próprio do menu fixo ("Membros"), não link secundário — convidar gente é uma ação sempre disponível, igual Destinos/Roteiro. Sem back button, sem footer de "voltar". Ver `docs/ajustes-15-membros-no-menu-e-perfil-como-aba.md` (substitui a versão anterior deste aviso, que a colocava como tela secundária).
Ver `../../Site_Publicado/14-fluxo-proposto-mes2.html`, etapa 2, pro racional completo.

## Objetivo

Deixar visível a opção de convidar outras pessoas pra viagem — mas **nunca bloqueante**. Metade da amostra de usuários do Mês 1 (Bia, Elba, Emi, Lu, Luis) alterna entre viagens solo e em grupo; um fluxo que obriga convite exclui esse grupo inteiro. O convite de convidados também foi exatamente o que falhou tecnicamente na sessão de uso real com o Nelson — essa tela existe pra corrigir isso, não pra virar um novo obstáculo.

**Regra inegociável: dá pra seguir o fluxo inteiro sem convidar ninguém, sem tela vazia e sem mensagem de erro.** Mesmo princípio já aplicado na tagline da Splash — grupo não é o caso obrigatório.

## Conteúdo

- Campo de e-mail pra convidar uma pessoa por vez: input `type="email"` com `inputmode="email"`, placeholder "email@exemplo.com", validação de formato de e-mail antes de permitir adicionar.
- **Botão "Convidar" separado, fora do campo de input** — não pode ficar embutido dentro da pílula do input (mesmo problema já corrigido no chevron do CurrencySelect: elemento colado na borda interna confunde o que é campo e o que é ação). Layout: campo de e-mail ocupando a largura toda numa linha, e logo abaixo dele um botão "Convidar" com seu próprio contorno/preenchimento, do mesmo padrão dos outros botões secundários já usados no protótipo — nunca um ícone solto sobreposto ao input.
- Cada pessoa convidada aparece como um item de lista (não precisa ser chip como em Destinos — aqui cabe melhor uma lista com e-mail + status), mostrando:
  - O e-mail digitado.
  - Um status: **"Convite enviado"** — é o único status real que dá pra mostrar sem backend (não simular "aceito", isso seria um estado falso que o protótipo não pode cumprir; ver `CLAUDE.md`, princípio de nada fingido/pré-preenchido).
  - Um botão de remover (mesmo padrão do "×" dos chips de Destinos), caso a pessoa queira desfazer um convite antes de continuar.
- **Botão "Continuar sem convidar" (ou "Pular")** com peso visual pelo menos igual ao botão de avançar normal — não pode parecer a opção secundária/escondida. Segue direto pro Quiz, com ou sem ninguém convidado.
- Botão "Continuar" (quando já tem 1+ convidados) — mesmo destino que o "Pular": a próxima tela (Quiz) não muda de comportamento dependendo de ter ou não convidados.

## Estado (TripContext)

Adicionar ao `TripState`/`TripContextValue` em `src/context/TripContext.tsx`, seguindo o mesmo padrão já usado pra `destinations`:

```ts
export interface TripCompanion {
  id: string;
  email: string;
  status: 'convite-enviado'; // único status real possível sem backend
}
```

- `companions: TripCompanion[]` no estado.
- `addCompanion(email: string)`, `removeCompanion(id: string)` — mesmo padrão de `addDestination`/`removeDestination`.

## Navegação

- Rota nova: `/convidar`, entre `/criar-viagem` e `/quiz`.
- `CreateTrip.tsx`: o botão "Continuar" passa a navegar pra `/convidar` (hoje vai direto pra `/quiz` — trocar).
- `Convidar` (tela nova): back leva pra `/criar-viagem`; "Pular"/"Continuar" levam pra `/quiz`.
- `QuizProfile.tsx`: o back do AppBar passa a voltar pra `/convidar` (hoje volta pra `/criar-viagem` — trocar).
- Registrar a rota em `App.tsx` (`<Route path="/convidar" element={<Convidar />} />`), na posição certa entre criar-viagem e quiz.

## Acessibilidade

- Label visível no campo de e-mail (não só placeholder).
- Mensagem de erro de e-mail inválido anunciada de forma acessível, mesmo padrão já usado em Destinos.
- Botão de remover convite operável por teclado.
- Os dois botões finais ("Pular" e "Continuar") precisam ter nomes acessíveis que deixem claro que levam pro mesmo lugar, pra ninguém achar que "pular" é uma penalidade.

## Checklist antes de considerar pronto

- `npm run build` limpo.
- Dá pra chegar no Quiz sem convidar ninguém, sem erro.
- Dá pra convidar 2+ pessoas (repetir o fluxo do roteiro de teste: Marina e Rodrigo) e ver os dois na lista com status "Convite enviado".
- Testar em 375px e 390px.
- Alternar iOS/Android — o layout não quebra.
