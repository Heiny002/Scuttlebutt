import { NextResponse } from "next/server";
import { isAuthenticated, getUserName } from "@/lib/auth";
import { getUsage, getConversation } from "@/lib/storage";
import { DAILY_MESSAGE_LIMIT, DAILY_COST_LIMIT_CENTS } from "@/lib/constants";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userName = await getUserName();
  const user = userName || "unknown";
  const usage = await getUsage(user);
  const conversation = await getConversation(user);

  return NextResponse.json({
    messages: usage.messages,
    message_limit: DAILY_MESSAGE_LIMIT,
    questionnaire_complete: usage.questionnaire_complete,
    cost_cents: usage.cost_cents,
    cost_limit_cents: DAILY_COST_LIMIT_CENTS,
    userName,
    conversation,
  });
}
