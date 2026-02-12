import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface BadgeRow {
  id: string;
  user_id: string;
  badge_type: string;
  earned_at: string;
}

interface TaskCountRow {
  count: number;
}

const BADGE_DEFINITIONS: Record<string, { name: string; description: string; emoji: string }> = {
  first_task: { name: "First Steps", description: "Created your first task", emoji: "🔨" },
  five_tasks: { name: "Busy Bee", description: "Created 5 tasks", emoji: "🐝" },
  ten_tasks: { name: "Task Master", description: "Created 10 tasks", emoji: "👑" },
  first_complete: { name: "Getting It Done", description: "Completed your first task", emoji: "✅" },
  five_complete: { name: "On a Roll", description: "Completed 5 tasks", emoji: "🔥" },
  ten_complete: { name: "Unstoppable", description: "Completed 10 tasks", emoji: "💪" },
  first_group: { name: "Team Player", description: "Joined your first group", emoji: "👥" },
  meal_lead: { name: "Chef's Kiss", description: "Assigned as Meal Lead", emoji: "🍕" },
};

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = getDb();

    // Check and award badges
    const existingBadges = db.prepare("SELECT badge_type FROM user_badges WHERE user_id = ?")
      .all(userId) as { badge_type: string }[];
    const earned = new Set(existingBadges.map((b) => b.badge_type));

    const taskCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ?")
      .get(userId) as TaskCountRow;
    const completedCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND completed = 1")
      .get(userId) as TaskCountRow;
    const groupCount = db.prepare("SELECT COUNT(*) as count FROM group_members WHERE user_id = ?")
      .get(userId) as TaskCountRow;
    const mealLeadCount = db.prepare("SELECT COUNT(*) as count FROM groups WHERE meal_lead_id = ?")
      .get(userId) as TaskCountRow;

    const insert = db.prepare("INSERT OR IGNORE INTO user_badges (id, user_id, badge_type) VALUES (?, ?, ?)");

    if (taskCount.count >= 1 && !earned.has("first_task")) insert.run(uuidv4(), userId, "first_task");
    if (taskCount.count >= 5 && !earned.has("five_tasks")) insert.run(uuidv4(), userId, "five_tasks");
    if (taskCount.count >= 10 && !earned.has("ten_tasks")) insert.run(uuidv4(), userId, "ten_tasks");
    if (completedCount.count >= 1 && !earned.has("first_complete")) insert.run(uuidv4(), userId, "first_complete");
    if (completedCount.count >= 5 && !earned.has("five_complete")) insert.run(uuidv4(), userId, "five_complete");
    if (completedCount.count >= 10 && !earned.has("ten_complete")) insert.run(uuidv4(), userId, "ten_complete");
    if (groupCount.count >= 1 && !earned.has("first_group")) insert.run(uuidv4(), userId, "first_group");
    if (mealLeadCount.count >= 1 && !earned.has("meal_lead")) insert.run(uuidv4(), userId, "meal_lead");

    // Fetch all badges
    const badges = db.prepare("SELECT * FROM user_badges WHERE user_id = ? ORDER BY earned_at ASC")
      .all(userId) as BadgeRow[];

    const badgesWithInfo = badges.map((b) => ({
      ...b,
      ...BADGE_DEFINITIONS[b.badge_type],
    }));

    return NextResponse.json({ badges: badgesWithInfo, definitions: BADGE_DEFINITIONS });
  } catch (error) {
    console.error("Get badges error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
