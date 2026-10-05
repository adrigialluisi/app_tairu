import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { Tabs } from '../components/shell/Tabs';
import { TransportSection } from '../components/central/TransportSection';
import { StaySection } from '../components/central/StaySection';
import { OtherSection } from '../components/central/OtherSection';
import { useTrip } from '../context/TripContext';

const TABS_NAME = 'central-tabs';

type CentralTab = 'transporte' | 'estadia' | 'outros';
const CENTRAL_TABS: CentralTab[] = ['transporte', 'estadia', 'outros'];

export function Central() {
  const navigate = useNavigate();
  const trip = useTrip();
  // aba inicial pode vir da navegação (ex.: tocar num item da Agenda do dia no Roteiro, ajustes-63)
  const requestedTab = (useLocation().state as { tab?: CentralTab } | null)?.tab;
  const [tab, setTab] = useState<CentralTab>(
    requestedTab && CENTRAL_TABS.includes(requestedTab) ? requestedTab : 'transporte',
  );

  return (
    <ScreenShell
      appBar={<AppBar title="Central da viagem" subtitle={trip.name || undefined} onHome={() => navigate('/inicio')} />}
      bottomNav={<BottomNav />}
    >
      <Tabs
        name={TABS_NAME}
        label="Seções da Central"
        items={[
          { value: 'transporte', label: 'Transporte' },
          { value: 'estadia', label: 'Hospedagem' },
          { value: 'outros', label: 'Outros' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as typeof tab)}
      />
      <div role="tabpanel">
        {tab === 'transporte' ? <TransportSection /> : tab === 'estadia' ? <StaySection /> : <OtherSection />}
      </div>
    </ScreenShell>
  );
}
