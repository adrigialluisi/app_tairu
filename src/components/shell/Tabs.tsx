import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs as UiTabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatform } from '../../context/PlatformContext';

export interface TabItem {
  value: string;
  label: string;
  /** ícone lucide opcional — só usado quando iconOnly */
  icon?: LucideIcon;
  /** só usado com variant="pill-date": linha de cima do pill (ex.: mês abreviado) */
  pillTop?: string;
  /** só usado com variant="pill-date": linha de baixo do pill (ex.: número do dia) */
  pillBottom?: string;
}

interface TabsProps {
  /** prefixo único de id, pra não colidir quando há mais de um Tabs na mesma tela */
  name: string;
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** quando true, mostra só o icon de cada item (label vira texto oculto + title) */
  iconOnly?: boolean;
  /** 'segmented' (padrão, visual atual) ou 'pill-date' (pills de duas linhas, rolagem horizontal) */
  variant?: 'segmented' | 'pill-date';
}

/*
  Miolo do shadcn (ui/tabs.tsx = Radix Tabs, ver docs/ajustes-69-...md): o
  Radix cuida de role/aria e do teclado (setas com volta, Home/End, foco
  seleciona). Os painéis continuam nas telas, ligados pelos mesmos ids de
  antes (`${name}-tab-*` / `${name}-panel-*`), que passamos por cima dos do Radix.
  Visual do docs/ajustes-72-virada-visual-shadcn.md, seção 4:
  - iOS: trilho stone-200 sem borda (sobre o miolo stone-100, docs/ajustes-73-...md),
    4px de folga; aba ativa branca com shadow-sm, texto stone-900/600; inativa
    stone-600 (6.08:1 no stone-200). Sem bordô;
  - Android: sem trilho, texto; sublinhado de 2px bordô na ativa e linha de
    base stone-300 na linha toda;
  - iconOnly (Lista/Mapa): segmentado pequeno alinhado à direita, nas duas plataformas;
  - pill-date: branca com borda stone-200 (mês 11px stone-500, dia 18px); a
    selecionada é bordô com TODO o texto branco, inclusive "Todos os dias".
    Barra de rolagem escondida (no-scrollbar).
  Alvo de toque: as abas de 36px do trilho ganham 4px em cima e embaixo pelo
  ::before (44px no total). `bg-transparent` sempre: sem o preflight, um
  <button> sem fundo herda o cinza padrão do navegador.
*/
type Look = 'ios' | 'android' | 'icon' | 'pillDate';

const listBase =
  'h-auto w-full justify-start rounded-none p-0 text-foreground group-data-horizontal/tabs:h-auto';
const triggerBase =
  'h-auto border-0 bg-transparent px-4 py-0 text-sm font-medium text-muted-foreground shadow-none hover:text-foreground focus-visible:ring-0';
const hitArea = "before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']";

const listByLook: Record<Look, string> = {
  ios: 'gap-1 rounded-lg bg-(--bg-mid) p-1',
  android: 'gap-0 border-b border-border-strong bg-transparent',
  icon: 'ml-auto w-fit gap-1 rounded-lg bg-(--bg-mid) p-1',
  pillDate: '-m-1 no-scrollbar gap-2 overflow-x-auto bg-transparent p-1',
};

const segmentActive =
  'data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:hover:text-foreground';

const triggerByLook: Record<Look, string> = {
  ios: cn('h-9 flex-1 rounded-md', hitArea, segmentActive),
  android: cn(
    'h-11 flex-none rounded-none data-active:font-semibold data-active:text-foreground data-active:hover:text-foreground',
    'group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 after:bg-primary',
  ),
  icon: cn('h-9 w-11 flex-none rounded-md px-0 text-base', hitArea, segmentActive),
  pillDate: cn(
    'group/pill h-14 min-w-14 flex-none flex-col gap-0.5 rounded-lg border border-border bg-background px-2 text-foreground',
    'group-data-[variant=default]/tabs-list:data-active:shadow-none',
    'data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground',
  ),
};

export function Tabs({ name, items, value, onChange, label, iconOnly = false, variant = 'segmented' }: TabsProps) {
  const { platform } = usePlatform();
  const look: Look = variant === 'pill-date' ? 'pillDate' : iconOnly ? 'icon' : platform;

  return (
    // `contents`: o Root do Radix só dá o contexto, sem caixa própria — o
    // tablist continua sendo o elemento que ocupa o lugar na tela, como antes
    <UiTabs value={value} onValueChange={onChange} className="contents">
      <TabsList
        variant={look === 'android' ? 'line' : 'default'}
        aria-label={label}
        className={cn(listBase, listByLook[look])}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            id={`${name}-tab-${item.value}`}
            aria-controls={`${name}-panel-${item.value}`}
            title={iconOnly && item.icon ? item.label : undefined}
            className={cn(
              triggerBase,
              triggerByLook[look],
            )}
          >
            {variant === 'pill-date' && item.pillTop && item.pillBottom ? (
              <>
                <span
                  className="text-[11px] font-medium tracking-wide text-input uppercase group-data-active/pill:text-primary-foreground"
                  aria-hidden="true"
                >
                  {item.pillTop}
                </span>
                <span
                  className="text-lg leading-tight font-semibold text-foreground group-data-active/pill:text-primary-foreground"
                  aria-hidden="true"
                >
                  {item.pillBottom}
                </span>
                <span className="visually-hidden">{item.label}</span>
              </>
            ) : iconOnly && item.icon ? (
              <>
                <item.icon className="size-4" aria-hidden="true" />
                <span className="visually-hidden">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </UiTabs>
  );
}
