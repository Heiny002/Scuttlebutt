import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";

// Simple AI-like estimate generator based on task characteristics
// In production, this would call an actual AI API
function generateEstimates(name: string, description: string | null) {
  const text = `${name} ${description || ""}`.toLowerCase();

  // Material cost estimation
  let materialEstimate = "$25 - $50";
  if (text.includes("paint") || text.includes("wall")) materialEstimate = "$50 - $100";
  else if (text.includes("plumb") || text.includes("pipe") || text.includes("faucet")) materialEstimate = "$30 - $80";
  else if (text.includes("electric") || text.includes("wire") || text.includes("light")) materialEstimate = "$20 - $60";
  else if (text.includes("roof") || text.includes("deck") || text.includes("floor")) materialEstimate = "$100 - $300";
  else if (text.includes("clean") || text.includes("organize")) materialEstimate = "$10 - $25";
  else if (text.includes("garden") || text.includes("lawn") || text.includes("yard")) materialEstimate = "$20 - $50";
  else if (text.includes("fix") || text.includes("repair")) materialEstimate = "$15 - $40";

  // Time estimation
  let timeEstimate = "1 - 2 hours";
  if (text.includes("paint") || text.includes("floor") || text.includes("roof") || text.includes("deck")) timeEstimate = "4 - 8 hours";
  else if (text.includes("clean") || text.includes("organize")) timeEstimate = "2 - 3 hours";
  else if (text.includes("install")) timeEstimate = "2 - 4 hours";
  else if (text.includes("fix") || text.includes("repair")) timeEstimate = "1 - 3 hours";
  else if (text.includes("build") || text.includes("construct")) timeEstimate = "4 - 6 hours";

  // Difficulty estimation
  let difficulty = "Medium";
  if (text.includes("clean") || text.includes("organize") || text.includes("tidy")) difficulty = "Easy";
  else if (text.includes("electric") || text.includes("plumb") || text.includes("roof")) difficulty = "Hard";
  else if (text.includes("paint") || text.includes("fix") || text.includes("hang")) difficulty = "Medium";
  else if (text.includes("build") || text.includes("install")) difficulty = "Medium-Hard";

  return { materialEstimate, timeEstimate, difficulty };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, description } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Task name is required" }, { status: 400 });
    }

    const estimates = generateEstimates(name, description);
    return NextResponse.json(estimates);
  } catch (error) {
    console.error("Estimate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
