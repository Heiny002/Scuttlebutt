import { kv } from "@vercel/kv";
import {
  DAILY_MESSAGE_LIMIT,
  DAILY_COST_LIMIT_CENTS,
  INPUT_COST_PER_MILLION,
  OUTPUT_COST_PER_MILLION,
} from "./constants";

export interface UsageData {
  messages: number;
  input_tokens: number;
  output_tokens: number;
  cost_cents: number;
  questionnaire_complete: boolean;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  images?: string[];
}

function todayKey(prefix: string, user: string): string {
  const d = new Date();
  const date = d.toISOString().split("T")[0];
  return `${prefix}:${user.toLowerCase()}:${date}`;
}

export async function getUsage(user: string): Promise<UsageData> {
  try {
    const data = await kv.get<UsageData>(todayKey("usage", user));
    return (
      data ?? {
        messages: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_cents: 0,
        questionnaire_complete: false,
      }
    );
  } catch {
    // KV not configured — return defaults for local dev
    return {
      messages: 0,
      input_tokens: 0,
      output_tokens: 0,
      cost_cents: 0,
      questionnaire_complete: false,
    };
  }
}

export async function updateUsage(
  user: string,
  inputTokens: number,
  outputTokens: number,
  countMessage: boolean
): Promise<UsageData> {
  const usage = await getUsage(user);

  const addedCost =
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION;

  usage.input_tokens += inputTokens;
  usage.output_tokens += outputTokens;
  usage.cost_cents += Math.round(addedCost);

  if (countMessage) {
    usage.messages += 1;
  }

  try {
    await kv.set(todayKey("usage", user), usage, { ex: 60 * 60 * 36 }); // expire after 36h
  } catch {
    // KV not configured — skip in local dev
  }

  return usage;
}

export async function markQuestionnaireComplete(user: string): Promise<void> {
  const usage = await getUsage(user);
  usage.questionnaire_complete = true;
  try {
    await kv.set(todayKey("usage", user), usage, { ex: 60 * 60 * 36 });
  } catch {
    // KV not configured
  }
}

export async function getConversation(user: string): Promise<ConversationMessage[]> {
  try {
    const data = await kv.get<ConversationMessage[]>(todayKey("conversation", user));
    return data ?? [];
  } catch {
    return [];
  }
}

export async function appendConversation(
  user: string,
  messages: ConversationMessage[]
): Promise<void> {
  const existing = await getConversation(user);
  const updated = [...existing, ...messages];
  try {
    await kv.set(todayKey("conversation", user), updated, { ex: 60 * 60 * 72 }); // 3 days
  } catch {
    // KV not configured
  }
}

export function isOverMessageLimit(usage: UsageData): boolean {
  return usage.questionnaire_complete && usage.messages >= DAILY_MESSAGE_LIMIT;
}

export function isOverCostLimit(usage: UsageData): boolean {
  return usage.cost_cents >= DAILY_COST_LIMIT_CENTS;
}

export function calculateCostCents(
  inputTokens: number,
  outputTokens: number
): number {
  return Math.round(
    (inputTokens / 1_000_000) * INPUT_COST_PER_MILLION +
      (outputTokens / 1_000_000) * OUTPUT_COST_PER_MILLION
  );
}
