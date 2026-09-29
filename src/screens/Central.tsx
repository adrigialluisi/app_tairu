import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { Tabs } from '../components/shell/Tabs';
import { TransportSection } from '../components/central/TransportSection';
import { StaySection } from '../components/central/StaySection';
import { OtherSection } from '../components/central/OtherSection';
import { useTrip } from '../context/TripContext';

const TABS_NAME = 'central-tabs';

export function Central() {
  const navigate = useNavigate();
  const trip = useTrip();
  const [tab, setTab] = useState<'transporte' | 'estadia' | 'outros'>('transporte');

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
          { value: 'estadia', label: 'Estadia' },
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
