import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Agent Chat — devinedesk',
};

export default async function AgentsLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }

  return <div className="h-screen w-full overflow-hidden bg-app-bg">{children}</div>;
}
