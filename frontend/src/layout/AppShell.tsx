import { Suspense, useState } from 'react';
import { Header } from './Header';
import { TabNavigation, type TabId } from './TabNavigation';
import { PixTransactionTab } from '../pix/PixTransactionTab';
import { DictSimulatorTab } from '../dict/DictSimulatorTab';
import { BucketMonitorTab } from '../buckets/BucketMonitorTab';
import { Spinner } from '../shared/Spinner';

export function AppShell() {
  const [tab, setTab] = useState<TabId>('pix');

  return (
    <div className="app-shell">
      <Header />
      <TabNavigation active={tab} onChange={setTab} />
      <div className="tab-content">
        <Suspense fallback={<Spinner large />}>
          {tab === 'pix' && <PixTransactionTab />}
          {tab === 'dict' && <DictSimulatorTab />}
          {tab === 'monitor' && <BucketMonitorTab />}
        </Suspense>
      </div>
    </div>
  );
}
