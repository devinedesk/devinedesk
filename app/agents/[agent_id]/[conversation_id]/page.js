import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../api/auth/[...nextauth]/route";
import AgentChatClient from "../AgentChatClient";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function generateMetadata({ params }) {
  return {
    title: `Agent Chat — devinedesk`,
  };
}

export default async function AgentConversationPage({ params }) {
  const { agent_id, conversation_id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  console.log(`[ConvPage] Loading for agent: ${agent_id}, conv: ${conversation_id}, user: ${session.user.id}`);

  const agent = await prisma.agent.findUnique({
    where: { slug: agent_id }
  });

  if (!agent) {
    return <div className="p-8">Agent not found.</div>;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversation_id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });

  let initialHistory = null;
  if (conversation && conversation.userId === session.user.id) {
    initialHistory = conversation.messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      created_at: m.createdAt.toISOString()
    }));
  }

  const agentDetails = {
    ...agent,
    system_prompt: agent.systemPrompt,
    agent_id: agent.id
  };

  const userData = {
    balance: session.user.credits || 0,
    email: session.user.email,
    name: session.user.name
  };

  return (
    <AgentChatClient 
      agentDetails={agentDetails} 
      initialHistory={initialHistory} 
      userData={userData}
    />
  );
}
