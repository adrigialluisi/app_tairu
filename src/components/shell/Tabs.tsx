import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs as UiTabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlatform } from '../../context/PlatformContext';

export interface TabItem {
  value: string;
  label: string;
  /** nome completo pro leitor de tela quando `label` é um rótulo curto ("San Pedro", ajustes-95b) */
  ariaLabel?: string;
  /** ícone lucide opcional — usado quando iconOnly e no variant="full" (ícone + texto) */
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
  /**
   * 'segmented' (padrão, visual atual), 'pill-date' (pills de duas linhas, rolagem horizontal) ou
   * 'full' (controle segmentado de largura total, ícone + texto, 44px, igual nas duas plataformas —
   * o Lista | Mapa do Roteiro, ajustes-97), 'main' (o mesmo de 'full' com 48px — o "Sugestões |
   * Agenda" do Roteiro, ajustes-101, o controle mais forte da tela) ou 'soft' (largura total, 44px,
   * ícone + texto de 16px, trilho mais claro e inativo em texto normal — o Lista | Mapa da Agenda
   * desde o ajustes-101d, que não pode competir com o 'main')
   */
  variant?: 'segmented' | 'pill-date' | 'full' | 'main' | 'soft';
  /**
   * fica preso no topo da área rolável ao rolar (ajustes-85, "Navegação interna fixa" no CLAUDE.md).
   * O pai precisa envolver todo o conteúdo que as abas trocam — o sticky só vale dentro dele.
   */
  sticky?: boolean;
  /**
   * abas que podem não caber na largura (cidades do Roteiro, ajustes-95b): rolagem horizontal sem
   * barra, como as pílulas de data, cada aba do tamanho do texto. Vale também pro pill-date.
   */
  scrollable?: boolean;
}

/*
  Faixa do sticky: fundo do miolo (--page) de ponta a ponta (-mx-4/px-4 cobre a margem lateral de
  16px do ScreenShell) pra nada aparecer por trás; -my-2/py-2 dá 8px de respiro sob a AppBar quando
  presa, sem mudar o espaçamento da tela parada. `-top-6`: o sticky conta a partir do padding do
  miolo (24px); sem isso a faixa prendia 24px abaixo da AppBar, com conteúdo passando no vão.
  `z-20` (ajustes-93): o chip do shadcn (ToggleGroupItem) é `relative` e ganha `z-10` com foco — o
  tipo recém-escolhido em Outros passava por cima das abas, que também eram z-10 e vêm antes no DOM.
*/
const stickyBar = 'sticky -top-6 z-20 -mx-4 -my-2 bg-(--page) px-4 py-2';

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
  - iconOnly: segmentado pequeno alinhado à direita, nas duas plataformas;
  - full (Lista | Mapa, ajustes-97 — o iconOnly ficava apagado na ponta das pílulas): trilho
    stone-200 de largura total e 44px, nas duas plataformas; ativa branca com sombra leve, texto
    stone-900 peso 600; inativa stone-600 (--muted, 6.08:1 no stone-200), ícone + texto;
  - main (Sugestões | Agenda, ajustes-101): o full com 48px;
  - soft (Lista | Mapa desde o ajustes-101d): largura total, 44px, ícone e texto de 16px; trilho
    #EDECEB (stone-200 a 55% sobre o --page), mais claro que o stone-200 do main — o stone-100 puro
    sumiria, é a cor do miolo; inativa stone-600 em peso 400 (--muted nele, 6.47:1); ativa branca com
    sombra leve, stone-900 em 600 — a mesma do main;
  - pill-date: branca com borda stone-200 (mês 11px stone-500, dia 18px); a
    selecionada é bordô com TODO o texto branco, inclusive "Todos os dias".
    Barra de rolagem escondida (no-scrollbar).
  Alvo de toque: as abas de 36px do trilho ganham 4px em cima e embaixo pelo
  ::before (44px no total). `bg-transparent` sempre: sem o preflight, um
  <button> sem fundo herda o cinza padrão do navegador.
*/
type Look = 'ios' | 'android' | 'icon' | 'pillDate' | 'full' | 'main' | 'soft';

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
  full: 'h-11 gap-1 rounded-lg bg-(--bg-mid) p-0.5 group-data-horizontal/tabs:h-11',
  main: 'h-12 gap-1 rounded-lg bg-(--bg-mid) p-0.5 group-data-horizontal/tabs:h-12',
  soft: 'h-11 gap-1 rounded-lg bg-[color-mix(in_srgb,var(--bg-mid)_55%,var(--page))] p-0.5 group-data-horizontal/tabs:h-11',
};

/* rolável (ajustes-95b): cada aba do tamanho do texto; o trilho do iOS rola junto */
const scrollList = 'no-scrollbar overflow-x-auto overflow-y-hidden';
const scrollTrigger = 'flex-none';

const segmentActive =
  'data-active:bg-background data-active:font-semibold data-active:text-foreground data-active:hover:text-foreground';

const triggerByLook: Record<Look, string> = {
  ios: cn('h-9 flex-1 rounded-md', hitArea, segmentActive),
  android: cn(
    'h-11 flex-none rounded-none data-active:font-semibold data-active:text-foreground data-active:hover:text-foreground',
    'group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 after:bg-primary',
  ),
  icon: cn('h-9 w-11 flex-none rounded-md px-0 text-base', hitArea, segmentActive),
  full: cn('h-10 flex-1 gap-1.5 rounded-md text-(length:--text-base)', segmentActive, 'data-active:shadow-sm'),
  main: cn('h-11 flex-1 gap-2 rounded-md text-(length:--text-base)', segmentActive, 'data-active:shadow-sm'),
  soft: cn('h-10 flex-1 gap-1.5 rounded-md text-[16px] font-normal', segmentActive, 'data-active:shadow-sm'),
  pillDate: cn(
    'group/pill h-14 min-w-14 flex-none flex-col gap-0.5 rounded-lg border border-border bg-background px-2 text-foreground',
    'group-data-[variant=default]/tabs-list:data-active:shadow-none',
    'data-active:border-primary data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground',
  ),
};

/**
 * Faixa rolável (pílulas de data e abas `scrollable`, ajustes-95b): a aba ativa rola sozinha pra
 * dentro da faixa ao abrir e ao trocar, sem mexer na rolagem vertical da tela; e, enquanto houver
 * aba escondida à direita, um degradê suave na cor do miolo (--page) avisa que tem mais.
 */
function useScrollStrip(enabled: boolean, activeId: string, itemsKey: string) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  useEffect(() => {
    const list = wrapRef.current?.querySelector<HTMLElement>('[role="tablist"]');
    if (!enabled || !list) return;
    const update = () => setMoreRight(list.scrollLeft + list.clientWidth < list.scrollWidth - 1);
    update();
    list.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => {
      list.removeEventListener('scroll', update);
      observer.disconnect();
    };
    // itemsKey: as pílulas mudam com a cidade sem a faixa mudar de largura
  }, [enabled, itemsKey]);

  useEffect(() => {
    const list = wrapRef.current?.querySelector<HTMLElement>('[role="tablist"]');
    const tab = document.getElementById(activeId);
    if (!enabled || !list || !tab || !list.contains(tab)) return;
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();
    const margin = 16;
    if (tabBox.right > listBox.right - margin) list.scrollLeft += tabBox.right - listBox.right + margin;
    else if (tabBox.left < listBox.left) list.scrollLeft -= listBox.left - tabBox.left + margin;
  }, [enabled, activeId]);

  return { wrapRef, moreRight };
}

export function Tabs({
  name,
  items,
  value,
  onChange,
  label,
  iconOnly = false,
  variant = 'segmented',
  sticky = false,
  scrollable = false,
}: TabsProps) {
  const { platform } = usePlatform();
  const look: Look =
    variant === 'pill-date'
      ? 'pillDate'
      : variant === 'full' || variant === 'main' || variant === 'soft'
        ? variant
        : iconOnly
          ? 'icon'
          : platform;
  const strip = scrollable || variant === 'pill-date';
  const { wrapRef, moreRight } = useScrollStrip(strip, `${name}-tab-${value}`, items.map((i) => i.value).join('|'));

  const tabs = (
    // `contents`: o Root do Radix só dá o contexto, sem caixa própria — o
    // tablist continua sendo o elemento que ocupa o lugar na tela, como antes
    <UiTabs value={value} onValueChange={onChange} className="contents">
      <TabsList
        variant={look === 'android' ? 'line' : 'default'}
        aria-label={label}
        className={cn(listBase, listByLook[look], scrollable && scrollList, scrollable && look === 'android' && 'pb-px')}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value}
            id={`${name}-tab-${item.value}`}
            aria-controls={`${name}-panel-${item.value}`}
            title={iconOnly && item.icon ? item.label : undefined}
            aria-label={item.ariaLabel}
            className={cn(
              triggerBase,
              triggerByLook[look],
              scrollable && scrollTrigger,
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
            ) : (look === 'full' || look === 'main' || look === 'soft') && item.icon ? (
              <>
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
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

  const content = strip ? (
    // min-w-0: dentro de uma linha flex (pílulas + Lista/Mapa) a faixa encolhe e rola, sem empurrar a tela
    <div ref={wrapRef} className="relative min-w-0">
      {tabs}
      {moreRight && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent to-(--page)"
        />
      )}
    </div>
  ) : (
    tabs
  );

  return sticky ? <div className={stickyBar}>{content}</div> : content;
}
