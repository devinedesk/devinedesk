import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import AgentChatClient from "./AgentChatClient";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export async function generateMetadata({ params }) {
  const { agent_id } = await params;
  return {
    title: `Agent Chat — devinedesk`,
  };
}

export default async function AgentPage({ params }) {
  const { agent_id } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  console.log(`[AgentPage] Loading page for agent slug: ${agent_id}, user: ${session.user.id}`);

  const agent = await prisma.agent.findUnique({
    where: { slug: agent_id }
  });

  if (!agent) {
    return <div className="p-8">Agent not found.</div>;
  }

  // Format to match old ai-agent expectations if necessary
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
      initialHistory={null} 
      userData={userData}
    />
  );
}
