import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { TripProvider, useTrip } from './context/TripContext';
import { PlatformSwitcher } from './components/shell/PlatformSwitcher';
import { BottomNav } from './components/shell/BottomNav';
import { Splash } from './screens/Splash';
import { Home } from './screens/Home';
import { CreateTrip } from './screens/CreateTrip';
import { InviteCompanions } from './screens/InviteCompanions';
import { Itinerary } from './screens/Itinerary';
import { Central } from './screens/Central';
import { ComingSoon } from './screens/ComingSoon';

/**
 * Aplica data-platform="ios" | "android" na raiz visível — é esse atributo
 * que as regras `:global([data-platform='...'])` dos módulos CSS (formato
 * de cantos, tipografia) e o global.css (font-family) usam pra trocar a
 * casca de navegação sem duplicar telas.
 */
function PlatformRoot({ children }: { children: ReactNode }) {
  const { platform } = usePlatform();
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

/** Custos — seção de topo do menu fixo, ainda não desenhada. */
function SectionComingSoon({ title }: { title: string }) {
  const navigate = useNavigate();
  const trip = useTrip();
  return (
    <ComingSoon
      title={title}
      headerSubtitle={trip.name || undefined}
      bottomNav={<BottomNav />}
      onHome={() => navigate('/inicio')}
    />
  );
}

/**
 * Documentos saiu do menu fixo (ver docs/ajustes-26-central-inicio-documentos-splash.md)
 * — não é mais uma das seções de dentro de uma viagem, é acessível só pela
 * Início. Por isso usa `onBack` voltando pra Início, sem `bottomNav`.
 */
function DocumentosComingSoon() {
  const navigate = useNavigate();
  return (
    <ComingSoon
      title="Documentos"
      message="Seus documentos de viagem (passaporte, visto, vacina) entram aqui — ainda não desenhado nesse bloco do protótipo."
      onBack={() => navigate('/inicio')}
    />
  );
}

export function App() {
  return (
    <PlatformProvider>
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
              <Route path="/custos" element={<SectionComingSoon title="Custos" />} />
              <Route path="/documentos" element={<DocumentosComingSoon />} />
            </Routes>
          </HashRouter>
        </PlatformRoot>
      </TripProvider>
    </PlatformProvider>
  );
}
