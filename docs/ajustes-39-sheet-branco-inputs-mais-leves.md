# Ajuste 39 — Branco na área de interação, não só atrás do AppBar; inputs mais leves

Feedback da Adriana (15/set/2026), vendo Destinos depois do `ajustes-38`: "branco deveria ser na parte onde tem o maior nível de interação. E os componentes aqui não mudaram em nada para se adequar à referência."

Ela está certa em duas frentes:

1. O `ajustes-38` só deixou branca a faixa atrás do `AppBar` (área sem interação nenhuma, só título/navegação) — o "sheet" (onde ficam os campos, botões, tudo que a pessoa realmente usa) continuou com o creme `--card` de sempre. O branco tinha que estar no lugar errado.
2. Os componentes de formulário (campo de texto, chip, seletor) usam uma borda de 1.5px bem carregada e cantos quase retos no Android (`--radius-android-input: 8px`) — nenhum dos dois combina com o visual mais leve/clean das referências, mesmo já com o restyle de tokens (`ajustes-34`) valendo.

## 1. O "sheet" (área de interação) vira branco

**`src/components/shell/ScreenShell.module.css`** — trocar `.sheet`:

```css
.sheet {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-top: 1px solid var(--card-border);
}
```

(Era `background: var(--card)`, sem borda — agora é branco, com uma linha fina de separação em cima pra manter visível o canto arredondado contra a faixa do `AppBar`, que também já é branca desde o `ajustes-38`. O resto do arquivo — raio de canto por plataforma, `.content`, `.footer` — não muda.)

## 2. Inputs com borda mais leve e cantos mais macios no Android

**`src/styles/tokens.css`** — trocar só este valor:

```css
--radius-android-input: 14px; /* era 8px — mais próximo do visual arredondado das referências, sem virar pílula completa (isso é só o iOS) */
```

(Afeta de uma vez todo campo/chip que já usa esse token — `TextField`, `DestinationField`, `DateRangeField`, `CurrencySelect`, `Chip` — sem precisar editar cada componente.)

**`src/components/inputs/TextField.module.css`** — trocar a borda de `.inputWrap`:

```css
.inputWrap {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--field-border);
}
```

(Só a espessura muda, de 1.5px pra 1px — a cor `--field-border` continua a mesma, já validada em contraste 3:1. O fundo do campo continua `--card` de propósito: agora que o "sheet" ao redor é branco, o campo em creme fica mais fácil de distinguir visualmente de onde a pessoa deve tocar, sem precisar só da borda pra isso.)

## Checklist antes de considerar pronto

- `npm run lint`/`npm run build` sem erro.
- Nas 5 telas do menu fixo, a área onde ficam os campos/botões (não só a faixa do topo) aparece branca, com os cards/inputs em creme se destacando por cima.
- Cantos dos inputs/chips no Android visivelmente mais arredondados que antes (14px), sem virar pílula.
- Bordas dos campos de texto mais finas/leves.
- O botão "Salvar destinos" aparecendo "lavado"/rosa claro com o formulário vazio é esperado (estado desabilitado, `opacity: 0.45` do próprio `Button`) — não é bug, some assim que o campo obrigatório for preenchido.
- Testar em 375px/390px, nas duas plataformas.
