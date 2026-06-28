import PageShell from '@/components/PageShell';
import SettingsPage from '@/components/SettingsPage';

export const metadata = {
  title: 'Settings — Academix',
};

export default function SettingsRoute() {
  return (
    <PageShell activePath="/settings">
      <SettingsPage />
    </PageShell>
  );
}
