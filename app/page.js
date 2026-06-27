import AcademixTealDashboard from '@/components/Dashboard';
import { seedApplications } from '@/lib/seedData';

// The dashboard is a client component (it manages selection state and a live
// Firestore subscription). We pass the seed payload as the initial render so
// the page is populated immediately, then `onSnapshot` takes over when Firebase
// credentials are present.
export default function Home() {
  return <AcademixTealDashboard initialApplications={seedApplications} />;
}
