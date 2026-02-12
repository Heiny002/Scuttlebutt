import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface MessageRow {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
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

    const messages = db.prepare(`
      SELECT m.*, u.name as user_name FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = ?
      ORDER BY m.created_at ASC
    `).all(groupId) as MessageRow[];

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
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

    const { content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const id = uuidv4();
    db.prepare(
      "INSERT INTO messages (id, group_id, user_id, content) VALUES (?, ?, ?, ?)"
    ).run(id, groupId, userId, content.trim());

    const message = db.prepare(`
      SELECT m.*, u.name as user_name FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(id) as MessageRow;

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
