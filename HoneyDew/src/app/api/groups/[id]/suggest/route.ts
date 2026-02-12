import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

interface AvailabilityRow {
  user_id: string;
  day_of_week: number;
  time_slot: string;
}

interface MemberRow {
  id: string;
  name: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: groupId } = await params;
    const db = getDb();

    // Verify membership
    const isMember = db.prepare(
      "SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ?"
    ).get(groupId, userId);
    if (!isMember) {
      return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });
    }

    // Get all members
    const members = db.prepare(`
      SELECT u.id, u.name FROM users u
      JOIN group_members gm ON u.id = gm.user_id
      WHERE gm.group_id = ?
    `).all(groupId) as MemberRow[];

    // Get all availability
    const availability = db.prepare(
      "SELECT user_id, day_of_week, time_slot FROM availability WHERE group_id = ?"
    ).all(groupId) as AvailabilityRow[];

    if (availability.length === 0) {
      return NextResponse.json({
        suggestion: null,
        message: "No availability data yet. Ask your crew to set their availability first!",
      });
    }

    // Score each day+time combo by number of available members
    const slotScores: Record<string, { dayOfWeek: number; timeSlot: string; available: string[]; unavailable: string[] }> = {};

    for (let day = 0; day < 7; day++) {
      for (const timeSlot of ["Morning", "Afternoon", "Evening"]) {
        const key = `${day}-${timeSlot}`;
        const availableIds = availability
          .filter((a) => a.day_of_week === day && a.time_slot === timeSlot)
          .map((a) => a.user_id);

        const available = members.filter((m) => availableIds.includes(m.id)).map((m) => m.name);
        const unavailable = members.filter((m) => !availableIds.includes(m.id)).map((m) => m.name);

        slotScores[key] = { dayOfWeek: day, timeSlot, available, unavailable };
      }
    }

    // Sort by most available members, then prefer afternoon > morning > evening
    const ranked = Object.values(slotScores)
      .filter((s) => s.available.length > 0)
      .sort((a, b) => {
        if (b.available.length !== a.available.length) return b.available.length - a.available.length;
        const slotOrder = { Afternoon: 0, Morning: 1, Evening: 2 };
        return (slotOrder[a.timeSlot as keyof typeof slotOrder] ?? 1) - (slotOrder[b.timeSlot as keyof typeof slotOrder] ?? 1);
      });

    if (ranked.length === 0) {
      return NextResponse.json({
        suggestion: null,
        message: "No overlapping availability found. Ask your crew to update their schedules!",
      });
    }

    // Return top suggestion and alternatives
    const top = ranked[0];
    const alternatives = ranked.slice(1, 4);

    return NextResponse.json({
      suggestion: {
        day: DAYS[top.dayOfWeek],
        dayOfWeek: top.dayOfWeek,
        timeSlot: top.timeSlot,
        available: top.available,
        unavailable: top.unavailable,
        totalMembers: members.length,
      },
      alternatives: alternatives.map((alt) => ({
        day: DAYS[alt.dayOfWeek],
        dayOfWeek: alt.dayOfWeek,
        timeSlot: alt.timeSlot,
        available: alt.available,
        unavailable: alt.unavailable,
        totalMembers: members.length,
      })),
      message: null,
    });
  } catch (error) {
    console.error("Suggest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
