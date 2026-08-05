import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import AgentCreateClient from "./AgentCreateClient";
import { redirect } from "next/navigation";

export default async function CreateAgentPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/auth/login");
  }

  const userData = {
    balance: session.user.credits || 0,
    email: session.user.email,
    name: session.user.name
  };

  return (
    <AgentCreateClient userData={userData} />
  );
}
