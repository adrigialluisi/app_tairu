import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar } from '../components/shell/AppBar';
import { ScreenShell } from '../components/shell/ScreenShell';
import { BottomNav } from '../components/shell/BottomNav';
import { Tabs } from '../components/shell/Tabs';
import { TransportSection } from '../components/central/TransportSection';
import { useTrip } from '../context/TripContext';
import styles from './Central.module.css';

const TABS_NAME = 'central-tabs';

const PANELS: Record<'estadia' | 'outros', { icon: string; message: string }> = {
  estadia: { icon: '🏨', message: 'Hospedagens entram aqui — ainda não desenhado nesse bloco do protótipo.' },
  outros: { icon: '📋', message: 'Seguro viagem e outros itens práticos entram aqui — ainda não desenhado nesse bloco do protótipo.' },
};

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
        {tab === 'transporte' ? (
          <TransportSection />
        ) : (
          <div className={styles.wrap}>
            <span className={styles.icon} aria-hidden="true">{PANELS[tab].icon}</span>
            <p className={styles.message}>{PANELS[tab].message}</p>
          </div>
        )}
      </div>
    </ScreenShell>
  );
}
