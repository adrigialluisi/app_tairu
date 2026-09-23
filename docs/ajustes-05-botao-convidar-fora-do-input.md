# Ajuste 05 — Botão "Convidar" fora do campo de e-mail

Ver print enviado pela Adriana: o botão "+" está embutido dentro da pílula do input de e-mail, colado na borda direita. Isso confunde — parece parte do campo, não uma ação separada. Mesmo tipo de problema já corrigido no chevron do `CurrencySelect` (ajuste 04): elemento de ação não pode ficar espremido dentro do contorno de um campo de formulário.

## O que mudar

Na tela de Convidar (etapa 2, `docs/tela-02-convidar-companheiros.md` já atualizado com essa regra):

- Tirar o botão "+"/"Convidar" de dentro do input. O campo de e-mail deve ser só o campo, sem nenhum elemento sobreposto dentro da pílula.
- Colocar o botão "Convidar" **abaixo do campo**, como um botão próprio — mesmo padrão visual dos outros botões secundários do protótipo (contorno ou preenchimento sólido, altura mínima de toque 44px, texto "Convidar" visível, não só ícone).
- Manter o comportamento: ao clicar em "Convidar" com um e-mail válido no campo, adiciona a pessoa na lista abaixo e limpa o campo pra permitir o próximo convite.
- Se o e-mail estiver vazio ou inválido, o botão "Convidar" fica desabilitado (ou clicável mas mostra a mensagem de erro já existente) — sem alterar a regra de validação já especificada.

## Checklist

- `npm run build` limpo.
- Campo de e-mail sem nenhum ícone/botão dentro da pílula.
- Botão "Convidar" claramente separado, abaixo do campo, com rótulo de texto visível.
- Alvo de toque do botão ≥44px.
- Testar em 375px e 390px — o botão não pode espremer ou quebrar o layout.
- Alternar iOS/Android — o layout não quebra.
