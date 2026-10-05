import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { ExpenseCategory } from '../../context/TripContext';
import { CATEGORY_META } from '../../utils/costs';
import { formatMoney } from '../../utils/money';

interface CostCategoryChartProps {
  /** categorias com valor > 0, na ordem de EXPENSE_CATEGORIES */
  byCategory: { category: ExpenseCategory; value: number }[];
  total: number;
}

const RADIUS = 6;

/**
 * Barra empilhada horizontal de gastos por categoria (Chart do shadcn = Recharts,
 * docs/ajustes-74-...md): uma barra de 12px, cantos arredondados nas pontas,
 * cores --chart-1 a --chart-6 com uma linha branca entre os segmentos, e tooltip
 * ao tocar com a categoria e o valor em R$. Fica num arquivo próprio pra ser
 * carregada só quando Custos abre (o Recharts é grande — ver CostSummary).
 * A legenda com ícone + nome + valor continua em texto no CostSummary, então o
 * gráfico é só reforço visual pro leitor de tela (aria-hidden).
 */
export default function CostCategoryChart({ byCategory, total }: CostCategoryChartProps) {
  const config = Object.fromEntries(
    byCategory.map((c) => [c.category, { label: CATEGORY_META[c.category].label, color: CATEGORY_META[c.category].color }]),
  ) satisfies ChartConfig;
  const row = { name: 'total', ...Object.fromEntries(byCategory.map((c) => [c.category, c.value])) };
  const last = byCategory.length - 1;

  return (
    <ChartContainer
      config={config}
      initialDimension={{ width: 320, height: 12 }}
      className="aspect-auto h-3 w-full"
      aria-hidden="true"
    >
      <BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
        <XAxis type="number" domain={[0, total]} hide />
        <YAxis type="category" dataKey="name" hide />
        <ChartTooltip
          shared={false}
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4 text-(length:--text-sm)">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: `var(--color-${String(name)})` }}
                    />
                    {CATEGORY_META[name as ExpenseCategory]?.label ?? String(name)}
                  </span>
                  <span className="font-semibold tabular-nums">{formatMoney(Number(value), 'BRL')}</span>
                </div>
              )}
            />
          }
        />
        {byCategory.map((c, i) => (
          <Bar
            key={c.category}
            dataKey={c.category}
            stackId="gastos"
            fill={`var(--color-${c.category})`}
            stroke="var(--card)"
            strokeWidth={1}
            barSize={12}
            radius={
              last === 0
                ? RADIUS
                : i === 0
                  ? [RADIUS, 0, 0, RADIUS]
                  : i === last
                    ? [0, RADIUS, RADIUS, 0]
                    : 0
            }
          />
        ))}
      </BarChart>
    </ChartContainer>
  );
}
