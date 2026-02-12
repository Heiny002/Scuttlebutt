import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

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
  created_at: string;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(id, userId) as TaskRow | undefined;
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, location, material_estimate, time_estimate, difficulty } = body;

    db.prepare(
      `UPDATE tasks SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        location = COALESCE(?, location),
        material_estimate = COALESCE(?, material_estimate),
        time_estimate = COALESCE(?, time_estimate),
        difficulty = COALESCE(?, difficulty)
      WHERE id = ? AND user_id = ?`
    ).run(
      name ?? null,
      description ?? null,
      location ?? null,
      material_estimate ?? null,
      time_estimate ?? null,
      difficulty ?? null,
      id,
      userId
    );

    const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;
    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const db = getDb();
    const existing = db.prepare("SELECT id FROM tasks WHERE id = ? AND user_id = ?").get(id, userId);
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Remove from any group lists first
    db.prepare("DELETE FROM group_lists WHERE task_id = ?").run(id);
    db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
