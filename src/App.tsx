import { useEffect, type ReactNode } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { TripProvider } from './context/TripContext';
import { DocumentsProvider } from './context/DocumentsContext';
import { PlatformSwitcher } from './components/shell/PlatformSwitcher';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { CreateTrip } from './screens/CreateTrip';
import { InviteCompanions } from './screens/InviteCompanions';
import { Itinerary } from './screens/Itinerary';
import { Central } from './screens/Central';
import { Documents } from './screens/Documents';
import { Costs } from './screens/Costs';
import { PastTrip } from './screens/PastTrip';
import { PastTripRecap } from './screens/PastTripRecap';

/**
 * Aplica data-platform="ios" | "android" na raiz visível — é esse atributo
 * que as regras `:global([data-platform='...'])` dos módulos CSS (formato
 * de cantos, tipografia) e o global.css (font-family) usam pra trocar a
 * casca de navegação sem duplicar telas.
 */
function PlatformRoot({ children }: { children: ReactNode }) {
  const { platform } = usePlatform();
  // Também no <html>: componentes do shadcn/Radix que abrem em portal (Dialog, Popover…) ficam
  // fora desta div e precisam herdar a fonte e o raio da plataforma (ver src/index.css).
  useEffect(() => {
    document.documentElement.dataset.platform = platform;
  }, [platform]);
  return <div data-platform={platform}>{children}</div>;
}

/**
 * O switcher fixo global some só na Início (ver docs/ajustes-33-switcher-inline-no-header.md)
 * — ela tem sua própria versão `inline`, dentro do próprio cabeçalho, junto
 * da logo e do ícone de perfil. Nas outras telas continua fixo no canto.
 */
function GlobalPlatformSwitcher() {
  const location = useLocation();
  if (location.pathname === '/inicio') return null;
  return <PlatformSwitcher />;
}

export function App() {
  return (
    <PlatformProvider>
      <DocumentsProvider>
        <TripProvider>
          <PlatformRoot>
            <HashRouter>
              <GlobalPlatformSwitcher />
              <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/inicio" element={<Home />} />
                <Route path="/destinos" element={<CreateTrip />} />
                <Route path="/central" element={<Central />} />
                <Route path="/convidar" element={<InviteCompanions />} />
                <Route path="/roteiro" element={<Itinerary />} />
                <Route path="/custos" element={<Costs />} />
                <Route path="/documentos" element={<Documents />} />
                <Route path="/viagem-passada/:id" element={<PastTrip />} />
                <Route path="/viagem-passada/:id/recordacao" element={<PastTripRecap />} />
              </Routes>
            </HashRouter>
          </PlatformRoot>
        </TripProvider>
      </DocumentsProvider>
    </PlatformProvider>
  );
}
