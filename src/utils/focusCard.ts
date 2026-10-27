/** ids dos cartões da aba Sugestões — a lista de convidados rola até eles */
export const placeCardId = (destinationId: string, placeId: string) => `lugar-${destinationId}-${placeId}`;

/**
 * Rola até o cartão (no meio da tela, pra não ficar embaixo das abas e da busca presas no topo)
 * e pisca um anel bordô rápido (ajustes-87). Sem animação pra quem pediu menos movimento.
 * Espera um quadro: o cartão de um lugar recém-adicionado ainda está sendo montado.
 */
export function focusCard(elementId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(elementId);
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center', inline: 'center' });
    if (reduce) return;
    el.animate(
      [
        { boxShadow: '0 0 0 0 transparent' },
        { boxShadow: '0 0 0 3px var(--accent)', offset: 0.25 },
        { boxShadow: '0 0 0 3px var(--accent)', offset: 0.6 },
        { boxShadow: '0 0 0 0 transparent' },
      ],
      { duration: 1400, delay: 300, easing: 'ease-out' },
    );
  });
}
