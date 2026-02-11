import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getUsage } from "@/lib/storage";
import { DAILY_MESSAGE_LIMIT, DAILY_COST_LIMIT_CENTS } from "@/lib/constants";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getUsage();

  return NextResponse.json({
    messages: usage.messages,
    message_limit: DAILY_MESSAGE_LIMIT,
    questionnaire_complete: usage.questionnaire_complete,
    cost_cents: usage.cost_cents,
    cost_limit_cents: DAILY_COST_LIMIT_CENTS,
  });
}
