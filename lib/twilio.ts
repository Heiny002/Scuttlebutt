import twilio from "twilio";
import {
  DAILY_MESSAGE_LIMIT,
  DAILY_COST_LIMIT_CENTS,
  MESSAGE_WARNING_THRESHOLD,
  COST_WARNING_THRESHOLD,
} from "./constants";
import type { UsageData } from "./storage";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

async function sendSMS(body: string): Promise<void> {
  const client = getClient();
  if (!client) {
    console.log("[Twilio] Not configured, skipping SMS:", body);
    return;
  }

  const from = process.env.TWILIO_FROM_NUMBER;
  const to = process.env.ALERT_TO_NUMBER;
  if (!from || !to) {
    console.log("[Twilio] Missing phone numbers, skipping SMS:", body);
    return;
  }

  try {
    await client.messages.create({ body, from, to });
    console.log("[Twilio] SMS sent:", body);
  } catch (err) {
    console.error("[Twilio] Failed to send SMS:", err);
  }
}

// Track which alerts we've already sent today to avoid duplicates
const sentAlerts = new Set<string>();

function alertKey(type: string): string {
  const date = new Date().toISOString().split("T")[0];
  return `${date}:${type}`;
}

export async function checkAndAlert(usage: UsageData): Promise<void> {
  const messagePercent = usage.messages / DAILY_MESSAGE_LIMIT;
  const costPercent = usage.cost_cents / DAILY_COST_LIMIT_CENTS;

  // 80% messages
  if (
    messagePercent >= MESSAGE_WARNING_THRESHOLD &&
    messagePercent < 1 &&
    !sentAlerts.has(alertKey("msg80"))
  ) {
    sentAlerts.add(alertKey("msg80"));
    await sendSMS(
      `ShareClaude: ${usage.messages}/${DAILY_MESSAGE_LIMIT} messages used today (${Math.round(messagePercent * 100)}%)`
    );
  }

  // 100% messages
  if (messagePercent >= 1 && !sentAlerts.has(alertKey("msg100"))) {
    sentAlerts.add(alertKey("msg100"));
    await sendSMS(
      `ShareClaude: Daily message limit reached (${DAILY_MESSAGE_LIMIT}/${DAILY_MESSAGE_LIMIT})`
    );
  }

  // 80% cost
  if (
    costPercent >= COST_WARNING_THRESHOLD &&
    costPercent < 1 &&
    !sentAlerts.has(alertKey("cost80"))
  ) {
    sentAlerts.add(alertKey("cost80"));
    await sendSMS(
      `ShareClaude: $${(usage.cost_cents / 100).toFixed(2)} / $${(DAILY_COST_LIMIT_CENTS / 100).toFixed(2)} cost today (${Math.round(costPercent * 100)}%)`
    );
  }

  // 100% cost
  if (costPercent >= 1 && !sentAlerts.has(alertKey("cost100"))) {
    sentAlerts.add(alertKey("cost100"));
    await sendSMS(
      `ShareClaude: Daily cost limit reached ($${(usage.cost_cents / 100).toFixed(2)}). Hard stop active.`
    );
  }
}
