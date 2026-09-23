# Ajuste 06 — Espaço entre título da pergunta e os pills (Quiz)

Ver print da Adriana: mesmo depois do ajuste de espaçamento geral (ver `CLAUDE.md`, "Espaçamento e organização visual"), o espaço entre o título de cada pergunta (ex.: "Relax ou urbano?") e a fileira de pills logo abaixo ainda está apertado — o espaço grupo→grupo (32px, `--space-8`, no `ScreenShell.module.css`) já está correto e bem diferenciado, o problema é só a distância título→opções dentro de cada grupo.

## Causa

`src/components/quiz/OptionChipGroup.module.css`, classe `.fieldset`:
```css
.fieldset {
  ...
  gap: var(--space-3); /* 12px — curto demais entre legend e options */
}
```
Esse mesmo `.fieldset` é reaproveitado pelo `MultiOptionChipGroup` (pergunta de Interesses), então o ajuste corrige as 6 perguntas de uma vez.

## O que mudar

- Trocar `gap: var(--space-3)` por `gap: var(--space-4)` (12px → 16px) em `.fieldset`, em `OptionChipGroup.module.css`.
- Atualizar o comentário equivalente em `tokens.css` (linhas ~67-69) que hoje descreve o espaço dentro de um grupo como "--space-2 a --space-3, 8-12px" — passa a ser "--space-2 a --space-4, 8-16px", pra documentação não ficar desatualizada.
- Não mexer no `gap: var(--space-8)` do `.content` em `ScreenShell.module.css` — esse já está correto (é o espaço grupo→grupo).
- Esse componente (`OptionChipGroup`/`MultiOptionChipGroup`) é usado só na tela de Quiz por enquanto — o ajuste não afeta Criar viagem nem Convidar.

## Checklist

- `npm run build` limpo.
- Comparar visualmente: título→pills agora com respiro claramente maior que antes, mas ainda visivelmente menor que o espaço entre uma pergunta e a próxima (32px).
- Testar em 375px e 390px — a fileira de pills não pode quebrar de forma estranha com o novo espaçamento.
