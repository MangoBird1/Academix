import PageShell from '@/components/PageShell';
import AnalyticsPage from '@/components/AnalyticsPage';

export const metadata = {
  title: 'Analytics — Academix',
};

export default function AnalyticsRoute() {
  return (
    <PageShell activePath="/analytics">
      <AnalyticsPage />
    </PageShell>
  );
}
