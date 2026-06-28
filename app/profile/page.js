import PageShell from '@/components/PageShell';
import ProfilePage from '@/components/ProfilePage';

export const metadata = {
  title: 'My Profile — Academix',
};

export default function ProfileRoute() {
  return (
    <PageShell activePath="/profile">
      <ProfilePage />
    </PageShell>
  );
}
