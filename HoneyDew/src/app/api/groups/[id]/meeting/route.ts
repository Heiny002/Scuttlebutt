import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const db = getDb();

    // Verify membership
    const isMember = db.prepare(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    ).get(groupId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const { action, day, timeSlot } = await req.json();

    if (action === "accept") {
      // Lock in the meeting day
      db.prepare(
        "UPDATE groups SET meeting_day = ?, meeting_time = ?, meeting_confirmed = 1 WHERE id = ?"
      ).run(day, timeSlot, groupId);

      return NextResponse.json({ success: true, message: "Meeting day locked in!" });
    }

    if (action === "reject") {
      // Clear the current suggestion (no-op since suggestion is computed dynamically)
      // Just return success — the frontend will request next suggestion
      return NextResponse.json({ success: true, message: "No problem! Try another suggestion." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Meeting action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
