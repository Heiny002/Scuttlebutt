import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface AvailabilityRow {
  id: string;
  user_id: string;
  group_id: string;
  day_of_week: number;
  time_slot: string;
}

// GET all availability for a group (all members)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const availability = db.prepare(
      "SELECT * FROM availability WHERE group_id = ?"
    ).all(groupId) as AvailabilityRow[];

    return NextResponse.json({ availability });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT to set availability (replaces all slots for current user in this group)
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

    const { slots } = await req.json();
    // slots: Array<{ dayOfWeek: number, timeSlot: string }>

    // Delete existing availability for this user in this group
    db.prepare("DELETE FROM availability WHERE user_id = ? AND group_id = ?").run(userId, groupId);

    // Insert new slots
    const insert = db.prepare(
      "INSERT INTO availability (id, user_id, group_id, day_of_week, time_slot) VALUES (?, ?, ?, ?, ?)"
    );

    for (const slot of slots) {
      insert.run(uuidv4(), userId, groupId, slot.dayOfWeek, slot.timeSlot);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
