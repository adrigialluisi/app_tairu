/*
  Cor fixa de cada membro da viagem (ajustes-94, item 3) — o único lugar que decide quem fica com
  qual cor. Os valores moram em src/styles/tokens.css (--member-*), com o contraste anotado lá:
  todas passam de 4.5:1 com texto branco (a tag "Marina" no canto do cartão) e, a 8% sobre o
  branco (o fundo tingido do cartão), deixam --text em mais de 15:1 e --muted em mais de 6.6:1.

  Você = bordô do Tairu. Marina e Rodrigo (convidados do cenário fixo, src/data/mockCompanions.ts)
  têm cor própria, a mesma em todo teste; qualquer outro convidado pega a próxima livre da lista,
  na ordem do convite. Módulo puro (sem imports de valor), como o settlement.ts.
*/

const YOU_COLOR = 'var(--accent)';

/** cenário fixo: mesma cor em todo teste, mesmo que a ordem dos convites mude */
const SCENARIO_COLORS: Record<string, string> = {
  'marina.duarte@email.com': 'var(--member-teal)',
  'rodrigo.antunes@email.com': 'var(--member-indigo)',
};

/** convidados fora do cenário, na ordem do convite (volta ao começo depois do último) */
const NEXT_COLORS = [
  'var(--member-sky)',
  'var(--member-orange)',
  'var(--member-violet)',
  'var(--member-teal)',
  'var(--member-indigo)',
];

interface ColorableMember {
  id: string;
  email?: string;
}

/** id do membro → cor (CSS var). Quem não está na lista (pessoa "Outro" de Custos) fica sem cor. */
export function assignMemberColors(members: ColorableMember[], youId = 'voce'): Map<string, string> {
  const colors = new Map<string, string>();
  const used = new Set<string>();
  for (const m of members) {
    if (m.id === youId) {
      colors.set(m.id, YOU_COLOR);
      continue;
    }
    const fixed = m.email ? SCENARIO_COLORS[m.email.trim().toLowerCase()] : undefined;
    if (fixed) {
      colors.set(m.id, fixed);
      used.add(fixed);
    }
  }
  let next = 0;
  for (const m of members) {
    if (colors.has(m.id) || !m.email) continue;
    const free = NEXT_COLORS.find((c) => !used.has(c)) ?? NEXT_COLORS[next++ % NEXT_COLORS.length];
    colors.set(m.id, free);
    used.add(free);
  }
  return colors;
}

/** fundo bem suave na cor da pessoa (~8%), pro cartão escolhido por convidado */
export function memberTint(color: string): string {
  return `color-mix(in srgb, ${color} 8%, var(--card))`;
}
