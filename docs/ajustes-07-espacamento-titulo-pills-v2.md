# Ajuste 07 — Espaço título→pills ainda curto (v2 do ajuste 06)

Confirmado direto no arquivo: o ajuste 06 (`gap: var(--space-3)` → `gap: var(--space-4)`, ou seja 12px → 16px) **foi aplicado corretamente** em `src/components/quiz/OptionChipGroup.module.css`. Não é um problema de cache/servidor não atualizar — é que 4px de diferença é sutil demais pra ficar visualmente óbvio, ainda mais em print. A Adriana revisou de novo (reiniciou o servidor, deu refresh) e o espaço ainda parece "grudado".

## O que mudar

Em `src/components/quiz/OptionChipGroup.module.css`, classe `.fieldset`:

```css
.fieldset {
  ...
  gap: var(--space-6); /* era var(--space-4) — 16px → 24px, mudança visível de verdade */
}
```

- 24px ainda fica hierarquicamente menor que o espaço entre perguntas (`--space-8`, 32px, no `ScreenShell.module.css`) — a diferenciação grupo→grupo continua valendo.
- Atualizar de novo o comentário em `tokens.css` (o mesmo citado no ajuste 06) pra refletir "--space-2 a --space-6, 8-24px".

## Depois de aplicar, antes de avisar que está pronto

- Confirmar visualmente comparando com o print anterior — a diferença tem que ser óbvia a olho nu, não só nos números.
- Rodar `npm run build` limpo.
- Se por acaso a Adriana ainda achar pouco depois desse, o próximo passo intermediário seria `--space-4` + um ajuste manual maior só nesse componente (ex.: 28-32px direto, sem token) — mas comece por `--space-6` primeiro.
