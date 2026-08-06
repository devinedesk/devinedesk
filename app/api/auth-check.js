import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]/route";
import { env } from "@/src/lib/env";

/**
 * Validates either a valid NextAuth session OR a local desktop API key.
 * @param {Request} request 
 * @returns {Promise<boolean>}
 */
export async function validateRequest(request) {
  // 1. Check Session (Web UI)
  const session = await getServerSession(authOptions);
  if (session && session.user) {
    return { authorized: true, user: session.user, method: 'session' };
  }

  // 2. Check API Key (Desktop/Local execution)
  const apiKey = request.headers.get("x-api-key");
  const localKey = env.LOCAL_API_KEY;
  
  if (apiKey === localKey) {
    return { authorized: true, user: null, method: 'api-key' };
  }

  return { authorized: false, user: null, method: 'none' };
}
