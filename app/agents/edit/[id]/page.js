import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../api/auth/[...nextauth]/route';
import AgentEditClient from './AgentEditClient';
import { redirect } from 'next/navigation';

export default async function EditAgentPage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/auth/login');
  }

  const userData = {
    balance: session.user.credits || 0,
    email: session.user.email,
    name: session.user.name,
  };

  return <AgentEditClient userData={userData} />;
}
