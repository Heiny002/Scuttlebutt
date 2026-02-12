import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

interface GroupRow {
  creator_id: string;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, memberId } = await params;
    const db = getDb();

    // Only creator can remove members
    const group = db.prepare("SELECT creator_id FROM groups WHERE id = ?").get(id) as GroupRow | undefined;
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (group.creator_id !== userId) {
      return NextResponse.json({ error: "Only the group creator can remove members" }, { status: 403 });
    }
    if (memberId === userId) {
      return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
    }

    db.prepare("DELETE FROM group_members WHERE group_id = ? AND user_id = ?").run(id, memberId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
