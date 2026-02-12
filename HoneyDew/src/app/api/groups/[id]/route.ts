import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

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

interface MemberRow {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface TaskRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  material_estimate: string | null;
  time_estimate: string | null;
  difficulty: string | null;
  completed: number;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();

    // Check membership
    const isMember = db.prepare(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    ).get(id, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    const group = db.prepare("SELECT * FROM groups WHERE id = ?").get(id) as GroupRow | undefined;
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get members
    const members = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ?
      ORDER BY gm.joined_at
    `).all(id) as MemberRow[];

    // Get all members' tasks
    const memberIds = members.map((m) => m.id);
    const placeholders = memberIds.map(() => "?").join(",");
    const allTasks = memberIds.length > 0
      ? db.prepare(`SELECT * FROM tasks WHERE user_id IN (${placeholders}) ORDER BY created_at DESC`).all(...memberIds) as TaskRow[]
      : [];

    // Group tasks by member
    const memberTasks: Record<string, TaskRow[]> = {};
    for (const member of members) {
      memberTasks[member.id] = allTasks.filter((t) => t.user_id === member.id);
    }

    return NextResponse.json({
      group,
      members,
      memberTasks,
      isCreator: group.creator_id === userId,
    });
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
