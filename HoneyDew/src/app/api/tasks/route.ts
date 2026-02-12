import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

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

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = getDb();
    const tasks = db
      .prepare("SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC")
      .all(userId) as TaskRow[];

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, description, location } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const id = uuidv4();
    const db = getDb();
    db.prepare(
      "INSERT INTO tasks (id, user_id, name, description, location) VALUES (?, ?, ?, ?, ?)"
    ).run(id, userId, name, description || null, location || null);

    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow;

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
