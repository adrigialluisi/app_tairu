# Ajuste 41 — "Ir pra Central" deixa de ser card amarelo, vira botão fixo no rodapé

Feedback da Adriana (22/set/2026), vendo Destinos com os 2 passos já salvos (print confirma o `ajustes-40` funcionando: Destino e Perfil da viagem aparecem como resumo depois de ir pra Central e voltar): "em vez de ter esse box amarelo no final, ter só um botão de continuar vermelho no bottom da página, acima do menu."

## O que muda

O `SuggestionCard` (card creme com mensagem + botão + "×" de dispensar) sai do fluxo de conteúdo rolável e vira um botão simples, vermelho sólido (padrão, igual aos outros `Button` do app), fixo na parte de baixo da tela — acima do `BottomNav`, mesma posição que o `ScreenShell` já usa pra ações de rodapé em outras telas (prop `footer`, com borda superior separando do conteúdo). Sem card, sem texto de mensagem, sem "×" de dispensar.

**Escopo só desta tela** (Destinos → sugestão de ir pra Central) — o outro uso do `SuggestionCard` (Roteiro → sugestão de convidar companheiros) não muda, a Adriana só comentou sobre este.

### `src/screens/CreateTrip.tsx`

- Remover o import de `SuggestionCard` (`import { SuggestionCard } from '../components/shell/SuggestionCard';`) — o componente continua existindo, só não é mais usado aqui.
- Remover o bloco no fim do conteúdo:
  ```tsx
  {trip.perfilSaved && trip.companions.length === 0 && (
    <SuggestionCard
      message="Tudo pronto! Já pode organizar transporte e hospedagem na Central."
      actionLabel="Ir pra Central"
      to="/central"
      storageKey="ir-pra-central"
    />
  )}
  ```
- Adicionar a prop `footer` no `<ScreenShell>` (que já suporta isso — ver `src/components/shell/ScreenShell.tsx`, prop `footer`, renderizada como `<footer>` com borda superior, fora da área rolável, entre o conteúdo e o `bottomNav`):
  ```tsx
  <ScreenShell
    appBar={<AppBar title="Destinos e datas" onHome={() => navigate('/inicio')} />}
    bottomNav={<BottomNav />}
    footer={
      trip.perfilSaved && trip.companions.length === 0 ? (
        <Button fullWidth onClick={() => navigate('/central')}>
          Ir pra Central
        </Button>
      ) : undefined
    }
    toast={<SaveToast visible={visible} message={message} />}
  >
  ```
  (mesma condição de antes — só aparece depois do Perfil salvo e enquanto não há convidados —, mesmo destino `/central`, mesmo texto de botão "Ir pra Central". `Button` já é importado nesse arquivo.)

Não precisa mexer em `ScreenShell.tsx` nem em `SuggestionCard.tsx` — o mecanismo de rodapé já existe, só não estava sendo usado nesta tela.

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Fluxo: salvar Destino → salvar Perfil da viagem → o botão "Ir pra Central" aparece fixo no rodapé da tela (acima do menu inferior), vermelho sólido, sem card/mensagem/"×" ao redor.
- Rolar a tela pra cima e pra baixo: o botão de rodapé fica fixo (não rola junto com o conteúdo).
- Convidar um companheiro (Convidados): o botão de rodapé some (mesma regra de antes, `trip.companions.length === 0`).
- Testar em 375px/390px, nas duas plataformas (iOS/Android).
