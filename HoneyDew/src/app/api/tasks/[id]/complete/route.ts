import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: taskId } = await params;
    const db = getDb();

    // Get current state
    const task = db.prepare("SELECT completed FROM tasks WHERE id = ?").get(taskId) as { completed: number } | undefined;
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Toggle completion
    const newCompleted = task.completed ? 0 : 1;
    db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(newCompleted, taskId);

    return NextResponse.json({ completed: newCompleted });
  } catch (error) {
    console.error("Complete task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
