'use client';

import PageShell from '@/components/PageShell';
import AcademixTealDashboard from '@/components/Dashboard';
import { useApplications } from '@/lib/useApplications';
import { seedApplications } from '@/lib/seedData';

function SyncFooter() {
  const { isLive } = useApplications(seedApplications);
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-2 w-2 rounded-full ${
          isLive ? 'bg-[#9fb89a] animate-pulse' : 'bg-[#b7c9b0]'
        }`}
      />
      <span className="text-[#5a5a5a]">
        {isLive ? 'Firestore live sync' : 'Local demo data'}
      </span>
    </div>
  );
}

export default function HomeClient() {
  return (
    <PageShell activePath="/" footer={<SyncFooter />}>
      <AcademixTealDashboard initialApplications={seedApplications} />
    </PageShell>
  );
}
