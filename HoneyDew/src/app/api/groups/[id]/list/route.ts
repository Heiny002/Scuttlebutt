import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface GroupListItemRow {
  id: string;
  group_id: string;
  task_id: string;
  added_by: string;
  position: number | null;
  added_at: string;
  task_name: string;
  task_description: string | null;
  task_location: string | null;
  task_completed: number;
  added_by_name: string;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const items = db.prepare(`
      SELECT gl.*, t.name as task_name, t.description as task_description,
             t.location as task_location, t.completed as task_completed,
             u.name as added_by_name
      FROM group_lists gl
      JOIN tasks t ON gl.task_id = t.id
      JOIN users u ON gl.added_by = u.id
      WHERE gl.group_id = ?
      ORDER BY gl.position ASC, gl.added_at ASC
    `).all(groupId) as GroupListItemRow[];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Get group list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { taskId } = await req.json();
    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Verify the task belongs to the user
    const task = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(taskId, userId);
    if (!task) {
      return NextResponse.json({ error: "Task not found or not yours" }, { status: 404 });
    }

    // Check if already in group list
    const existing = db.prepare(
      "SELECT 1 FROM group_lists WHERE group_id = ? AND task_id = ?"
    ).get(groupId, taskId);
    if (existing) {
      return NextResponse.json({ error: "Task already in group list" }, { status: 409 });
    }

    const id = uuidv4();
    db.prepare(
      "INSERT INTO group_lists (id, group_id, task_id, added_by) VALUES (?, ?, ?, ?)"
    ).run(id, groupId, taskId, userId);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Add to group list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const db = getDb();

    const url = new URL(req.url);
    const taskId = url.searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Only allow removing your own tasks
    const item = db.prepare(
      "SELECT 1 FROM group_lists WHERE group_id = ? AND task_id = ? AND added_by = ?"
    ).get(groupId, taskId, userId);
    if (!item) {
      return NextResponse.json({ error: "Item not found or not yours" }, { status: 404 });
    }

    db.prepare("DELETE FROM group_lists WHERE group_id = ? AND task_id = ?").run(groupId, taskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove from group list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
