import StandaloneShell from '@/components/StandaloneShell';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Studio — devinedesk',
};

export default async function StudioPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  return <StandaloneShell />;
}
