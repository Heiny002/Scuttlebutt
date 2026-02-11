import { cookies } from "next/headers";
import { COOKIE_NAME } from "./constants";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  if (!token) return false;

  // The cookie value is a simple signed token: "authenticated:<timestamp>"
  // We just check it exists and starts with our prefix
  return token.value.startsWith("authenticated:");
}
