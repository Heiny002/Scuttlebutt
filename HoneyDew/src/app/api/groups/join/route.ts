import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

interface GroupRow {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
}

interface UserRow {
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { inviteCode, phone } = await req.json();
    const db = getDb();
    let group: GroupRow | undefined;

    if (inviteCode) {
      group = db.prepare("SELECT * FROM groups WHERE invite_code = ?").get(inviteCode) as GroupRow | undefined;
      if (!group) {
        return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
      }
    } else if (phone) {
      // Find group creator by phone number
      const creator = db.prepare("SELECT id FROM users WHERE phone = ?").get(phone) as UserRow | undefined;
      if (!creator) {
        return NextResponse.json({ error: "No user found with that phone number" }, { status: 404 });
      }
      group = db.prepare("SELECT * FROM groups WHERE creator_id = ? ORDER BY created_at DESC LIMIT 1").get(creator.id) as GroupRow | undefined;
      if (!group) {
        return NextResponse.json({ error: "No group found for that phone number" }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: "Invite code or phone number required" }, { status: 400 });
    }

    // Check if already a member
    const existing = db.prepare(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    ).get(group.id, userId);

    if (existing) {
      return NextResponse.json({ error: "You're already a member of this group" }, { status: 409 });
    }

    db.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)").run(group.id, userId);

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
