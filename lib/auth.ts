import { cookies } from "next/headers";
import { COOKIE_NAME } from "./constants";

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  if (!token) return false;

  return (
    token.value.startsWith("authenticated:") ||
    token.value.startsWith("test-authenticated:")
  );
}

export async function isTestMode(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);
  if (!token) return false;

  return token.value.startsWith("test-authenticated:");
}
