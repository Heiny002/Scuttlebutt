"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button, Card, Badge } from "@/components/ui";

interface Group {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_confirmed: number;
  streak_count: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Task {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  material_estimate: string | null;
  time_estimate: string | null;
  difficulty: string | null;
  completed: number;
}

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberTasks, setMemberTasks] = useState<Record<string, Task[]>>({});
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const fetchGroup = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) {
        router.push("/groups");
        return;
      }
      const data = await res.json();
      setGroup(data.group);
      setMembers(data.members);
      setMemberTasks(data.memberTasks);
      setIsCreator(data.isCreator);
    } catch {
      router.push("/groups");
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this member from the group?")) return;
    await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
    fetchGroup();
  }

  if (loading || !group) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-honey-50">
        <p className="text-xl font-bold">Loading group...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-honey-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/groups")} className="mb-2">
              &larr; All Groups
            </Button>
            <h1 className="text-3xl font-black">{group.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Invite Code</p>
            <p className="font-mono font-bold text-lg">{group.invite_code}</p>
          </div>
        </div>

        {/* Members Section */}
        <h2 className="text-xl font-black mb-3">Members ({members.length})</h2>
        <div className="space-y-4 mb-8">
          {members.map((member) => {
            const tasks = memberTasks[member.id] || [];
            const isExpanded = expandedMember === member.id;

            return (
              <Card key={member.id}>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dew-200 border-2 border-black flex items-center justify-center font-black">
                      {member.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-sm text-gray-500">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCreator && member.id !== group.creator_id && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(member.id);
                        }}
                      >
                        Remove
                      </Button>
                    )}
                    <span className="text-gray-400">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 border-t-2 border-gray-200 pt-4">
                    {tasks.length === 0 ? (
                      <p className="text-gray-500 text-sm">No tasks yet</p>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between bg-honey-50 border-2 border-black rounded p-3"
                          >
                            <div>
                              <p className="font-bold text-sm">{task.name}</p>
                              {task.location && (
                                <p className="text-xs text-gray-500">📍 {task.location}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              {task.difficulty && (
                                <Badge variant={task.difficulty.toLowerCase().includes("easy") ? "mint" : task.difficulty.toLowerCase().includes("hard") ? "pop" : "honey"}>
                                  {task.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
