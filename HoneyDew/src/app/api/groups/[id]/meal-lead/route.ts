import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

interface MemberRow {
  user_id: string;
  name: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const db = getDb();

    const group = db.prepare("SELECT meal_lead_id FROM groups WHERE id = ?").get(groupId) as { meal_lead_id: string | null } | undefined;
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    let mealLead = null;
    if (group.meal_lead_id) {
      const user = db.prepare("SELECT name FROM users WHERE id = ?").get(group.meal_lead_id) as { name: string } | undefined;
      if (user) {
        mealLead = { id: group.meal_lead_id, name: user.name };
      }
    }

    return NextResponse.json({ mealLead });
  } catch (error) {
    console.error("Get meal lead error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const db = getDb();

    const isMember = db.prepare(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    ).get(groupId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    // Get all members
    const members = db.prepare(`
      SELECT gm.user_id, u.name FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      WHERE gm.group_id = ?
    `).all(groupId) as MemberRow[];

    if (members.length === 0) {
      return NextResponse.json({ error: "No members in group" }, { status: 400 });
    }

    // Random selection
    const selected = members[Math.floor(Math.random() * members.length)];

    db.prepare("UPDATE groups SET meal_lead_id = ? WHERE id = ?").run(selected.user_id, groupId);

    return NextResponse.json({
      mealLead: { id: selected.user_id, name: selected.name },
    });
  } catch (error) {
    console.error("Assign meal lead error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
