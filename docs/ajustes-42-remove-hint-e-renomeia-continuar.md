# Ajuste 42 — Remove o aviso itálico "o perfil aparece depois..." e renomeia o botão de rodapé pra "Continuar"

Feedback da Adriana (22/set/2026), vendo Destinos com o Passo 2 ainda travado: remover o texto "O perfil da viagem aparece aqui depois que você salvar os destinos." E: o botão de rodapé (criado no `ajustes-41`) tem que se chamar "Continuar", não "Ir pra Central".

## 1. Remover o aviso itálico do Passo 2 travado

**`src/screens/CreateTrip.tsx`** — o bloco atual:
```tsx
{perfilUnlocked ? (
  <StepSection ...>
    ...
  </StepSection>
) : (
  <p className={styles.lockedHint}>O perfil da viagem aparece aqui depois que você salvar os destinos.</p>
)}
```
vira, sem o `else`:
```tsx
{perfilUnlocked && (
  <StepSection ...>
    ...
  </StepSection>
)}
```
(quando `perfilUnlocked` é `false`, a seção do Passo 2 simplesmente não aparece — nada substitui o aviso.)

**`src/screens/CreateTrip.module.css`** — remover a classe `.lockedHint` (não é mais usada em lugar nenhum):
```css
.lockedHint {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  font-style: italic;
}
```

## 2. Renomear o botão de rodapé pra "Continuar"

**`src/screens/CreateTrip.tsx`** — no `footer` do `<ScreenShell>` (criado no `ajustes-41`), trocar só o texto do botão:
```tsx
footer={
  trip.perfilSaved && trip.companions.length === 0 ? (
    <Button fullWidth onClick={() => navigate('/central')}>
      Continuar
    </Button>
  ) : undefined
}
```
(nada mais muda — mesma condição, mesmo destino `/central`, só o rótulo.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Nova viagem, antes de salvar Destinos: a seção "Perfil da viagem" não aparece, e não sobra nenhum texto/aviso no lugar dela.
- Depois de salvar Destino e Perfil da viagem: o botão de rodapé mostra "Continuar" (não mais "Ir pra Central"), continua levando pra `/central`.
