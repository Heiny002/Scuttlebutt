"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";

interface GroupListItem {
  id: string;
  task_id: string;
  added_by: string;
  task_name: string;
  task_description: string | null;
  task_location: string | null;
  task_completed: number;
  added_by_name: string;
  material_estimate: string | null;
  time_estimate: string | null;
  difficulty: string | null;
}

interface Group {
  name: string;
  meeting_day: string | null;
  meeting_time: string | null;
}

export default function DewDayPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [items, setItems] = useState<GroupListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [groupRes, listRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/groups/${groupId}/list`),
      ]);

      if (!groupRes.ok || !listRes.ok) {
        router.push("/groups");
        return;
      }

      const groupData = await groupRes.json();
      const listData = await listRes.json();
      setGroup(groupData.group);
      setItems(listData.items);
    } catch {
      router.push("/groups");
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    fetchData();
    // Poll for real-time updates
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function toggleComplete(taskId: string) {
    await fetch(`/api/tasks/${taskId}/complete`, { method: "PUT" });
    fetchData();
  }

  const totalTasks = items.length;
  const completedTasks = items.filter((i) => i.task_completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const allDone = totalTasks > 0 && completedTasks === totalTasks;

  // Group by location
  const locations: { location: string; tasks: GroupListItem[] }[] = [];
  const locationMap = new Map<string, GroupListItem[]>();
  for (const item of items) {
    const loc = item.task_location || "No Location";
    if (!locationMap.has(loc)) locationMap.set(loc, []);
    locationMap.get(loc)!.push(item);
  }
  for (const [location, tasks] of locationMap) {
    locations.push({ location, tasks });
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-honey-50">
        <p className="text-xl font-bold">Loading Dew Day...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-honey-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/groups/${groupId}`)} className="mb-2">
              &larr; Back to Group
            </Button>
            <h1 className="text-3xl font-black">Dew Day!</h1>
            {group && (
              <p className="text-gray-600 text-sm">
                {group.name} &bull; {group.meeting_day} {group.meeting_time}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-honey-600">{progressPercent}%</p>
            <p className="text-sm text-gray-500">{completedTasks}/{totalTasks} done</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-6 bg-white border-4 border-black rounded-full overflow-hidden mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div
            className={`h-full transition-all duration-500 ${
              allDone ? "bg-mint-400" : "bg-honey-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {allDone && (
          <Card className="text-center mb-8 bg-mint-100">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black mb-2">Dew Day Complete!</h2>
            <p className="text-gray-600">Amazing work, crew! You did it all!</p>
          </Card>
        )}

        {/* Tasks by Location */}
        {locations.map(({ location, tasks }) => {
          const locComplete = tasks.filter((t) => t.task_completed).length;
          return (
            <div key={location} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-black">📍 {location}</h2>
                <Badge variant={locComplete === tasks.length ? "mint" : "neutral"}>
                  {locComplete}/{tasks.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {tasks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleComplete(item.task_id)}
                    className={`w-full text-left flex items-center gap-3 p-4 rounded-lg border-2 border-black transition-all ${
                      item.task_completed
                        ? "bg-mint-100 shadow-none"
                        : "bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded border-2 border-black flex items-center justify-center shrink-0 ${
                      item.task_completed ? "bg-mint-400" : "bg-white"
                    }`}>
                      {item.task_completed && <span className="text-white font-bold">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold ${item.task_completed ? "line-through text-gray-400" : ""}`}>
                        {item.task_name}
                      </p>
                      {item.task_description && (
                        <p className="text-xs text-gray-500 truncate">{item.task_description}</p>
                      )}
                      <p className="text-xs text-dew-600 mt-0.5">By {item.added_by_name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {item.time_estimate && <Badge variant="dew">{item.time_estimate}</Badge>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
