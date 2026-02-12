import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = getDb();
    db.prepare("UPDATE users SET onboarded = 1 WHERE id = ?").run(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
