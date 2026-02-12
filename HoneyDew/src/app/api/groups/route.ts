import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface GroupRow {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_confirmed: number;
  streak_count: number;
  created_at: string;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = getDb();
    const groups = db.prepare(`
      SELECT g.* FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = ?
      ORDER BY g.created_at DESC
    `).all(userId) as GroupRow[];

    // Add member count for each group
    const groupsWithMembers = groups.map((group) => {
      const memberCount = db.prepare(
        "SELECT COUNT(*) as count FROM group_members WHERE group_id = ?"
      ).get(group.id) as { count: number };
      return { ...group, memberCount: memberCount.count };
    });

    return NextResponse.json({ groups: groupsWithMembers });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    }

    const id = uuidv4();
    const inviteCode = generateInviteCode();
    const db = getDb();

    db.prepare(
      "INSERT INTO groups (id, name, creator_id, invite_code) VALUES (?, ?, ?, ?)"
    ).run(id, name, userId, inviteCode);

    // Add creator as a member
    db.prepare(
      "INSERT INTO group_members (group_id, user_id) VALUES (?, ?)"
    ).run(id, userId);

    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(id) as GroupRow;
    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
