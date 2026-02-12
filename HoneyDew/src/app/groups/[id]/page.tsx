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

interface AvailabilitySlot {
  id: string;
  user_id: string;
  group_id: string;
  day_of_week: number;
  time_slot: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

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
  const [tab, setTab] = useState<"members" | "availability" | "meeting">("members");

  // Availability state
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [mySlots, setMySlots] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Meeting suggestion state
  interface Suggestion {
    day: string;
    dayOfWeek: number;
    timeSlot: string;
    available: string[];
    unavailable: string[];
    totalMembers: number;
  }
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [alternatives, setAlternatives] = useState<Suggestion[]>([]);
  const [suggestionMessage, setSuggestionMessage] = useState<string>("");
  const [suggestionIdx, setSuggestionIdx] = useState(0);
  const [meetingAction, setMeetingAction] = useState(false);

  const fetchGroup = useCallback(async () => {
    try {
      const [groupRes, meRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch("/api/auth/me"),
      ]);
      if (!groupRes.ok) {
        router.push("/groups");
        return;
      }
      const data = await groupRes.json();
      setGroup(data.group);
      setMembers(data.members);
      setMemberTasks(data.memberTasks);
      setIsCreator(data.isCreator);

      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUserId(meData.user.id);
      }
    } catch {
      router.push("/groups");
    } finally {
      setLoading(false);
    }
  }, [groupId, router]);

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/availability`);
      if (res.ok) {
        const data = await res.json();
        setAvailability(data.availability);
      }
    } catch { /* ignore */ }
  }, [groupId]);

  const fetchSuggestion = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/suggest`);
      if (res.ok) {
        const data = await res.json();
        setSuggestion(data.suggestion);
        setAlternatives(data.alternatives || []);
        setSuggestionMessage(data.message || "");
        setSuggestionIdx(0);
      }
    } catch { /* ignore */ }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    fetchAvailability();
    fetchSuggestion();
  }, [fetchGroup, fetchAvailability, fetchSuggestion]);

  // Initialize mySlots when availability or currentUserId changes
  useEffect(() => {
    if (currentUserId) {
      const slots = new Set<string>();
      availability
        .filter((a) => a.user_id === currentUserId)
        .forEach((a) => slots.add(`${a.day_of_week}-${a.time_slot}`));
      setMySlots(slots);
    }
  }, [availability, currentUserId]);

  function toggleSlot(dayOfWeek: number, timeSlot: string) {
    const key = `${dayOfWeek}-${timeSlot}`;
    setMySlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function saveAvailability() {
    setSavingAvailability(true);
    try {
      const slots = Array.from(mySlots).map((key) => {
        const [d, ...rest] = key.split("-");
        return { dayOfWeek: parseInt(d), timeSlot: rest.join("-") };
      });
      await fetch(`/api/groups/${groupId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      fetchAvailability();
    } finally {
      setSavingAvailability(false);
    }
  }

  // Count how many members are available for each slot
  function getSlotCount(dayOfWeek: number, timeSlot: string): number {
    return availability.filter(
      (a) => a.day_of_week === dayOfWeek && a.time_slot === timeSlot
    ).length;
  }

  function getMembersForSlot(dayOfWeek: number, timeSlot: string): string[] {
    const memberIds = availability
      .filter((a) => a.day_of_week === dayOfWeek && a.time_slot === timeSlot)
      .map((a) => a.user_id);
    return members.filter((m) => memberIds.includes(m.id)).map((m) => m.name);
  }

  const currentSuggestion = suggestionIdx === 0 ? suggestion : alternatives[suggestionIdx - 1];

  async function handleMeetingAction(action: "accept" | "reject") {
    if (!currentSuggestion) return;
    setMeetingAction(true);
    try {
      if (action === "accept") {
        await fetch(`/api/groups/${groupId}/meeting`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "accept",
            day: currentSuggestion.day,
            timeSlot: currentSuggestion.timeSlot,
          }),
        });
        fetchGroup();
      } else {
        // Move to next suggestion
        if (suggestionIdx < alternatives.length) {
          setSuggestionIdx(suggestionIdx + 1);
        } else {
          setSuggestionMessage("No more suggestions! Ask your crew to update their availability.");
        }
      }
    } finally {
      setMeetingAction(false);
    }
  }

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("members")}
            className={`px-4 py-2 rounded font-bold border-2 border-black transition-all ${
              tab === "members"
                ? "bg-honey-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setTab("availability")}
            className={`px-4 py-2 rounded font-bold border-2 border-black transition-all ${
              tab === "availability"
                ? "bg-dew-400 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Availability
          </button>
          <button
            onClick={() => setTab("meeting")}
            className={`px-4 py-2 rounded font-bold border-2 border-black transition-all ${
              tab === "meeting"
                ? "bg-mint-400 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Meeting
          </button>
        </div>

        {tab === "members" && (
          <>
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
          </>
        )}

        {tab === "availability" && (
          <>
            <Card className="mb-6">
              <h2 className="text-xl font-black mb-1">Set Your Availability</h2>
              <p className="text-gray-600 text-sm mb-4">
                Tap the slots when you&apos;re free. Your crew will see everyone&apos;s availability at a glance.
              </p>

              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-sm font-bold"></th>
                      {DAYS.map((day, i) => (
                        <th key={i} className="p-2 text-center text-sm font-bold">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot}>
                        <td className="p-2 text-sm font-bold whitespace-nowrap">{slot}</td>
                        {DAYS.map((_, dayIdx) => {
                          const isSelected = mySlots.has(`${dayIdx}-${slot}`);
                          const count = getSlotCount(dayIdx, slot);
                          const names = getMembersForSlot(dayIdx, slot);

                          return (
                            <td key={dayIdx} className="p-1">
                              <button
                                onClick={() => toggleSlot(dayIdx, slot)}
                                title={names.length > 0 ? names.join(", ") : "No one available"}
                                className={`w-full h-12 rounded border-2 border-black text-xs font-bold transition-all ${
                                  isSelected
                                    ? "bg-mint-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    : count > 0
                                    ? "bg-mint-100 text-gray-700"
                                    : "bg-white text-gray-400 hover:bg-gray-50"
                                }`}
                              >
                                {count > 0 && <span>{count}/{members.length}</span>}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-mint-400 border border-black inline-block"></span>
                    Your slot
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded bg-mint-100 border border-black inline-block"></span>
                    Others available
                  </span>
                </div>
                <Button onClick={saveAvailability} disabled={savingAvailability} size="sm">
                  {savingAvailability ? "Saving..." : "Save Availability"}
                </Button>
              </div>
            </Card>

            {/* Group Availability Overview */}
            <Card>
              <h2 className="text-xl font-black mb-3">Group Overview</h2>
              <div className="space-y-2">
                {DAYS.map((day, dayIdx) => {
                  const daySlots = TIME_SLOTS.map((slot) => ({
                    slot,
                    count: getSlotCount(dayIdx, slot),
                    names: getMembersForSlot(dayIdx, slot),
                  })).filter((s) => s.count > 0);

                  if (daySlots.length === 0) return null;

                  return (
                    <div key={dayIdx} className="flex items-start gap-3 py-2 border-b border-gray-200 last:border-b-0">
                      <span className="font-bold text-sm w-10">{day}</span>
                      <div className="flex flex-wrap gap-2">
                        {daySlots.map(({ slot, count, names }) => (
                          <div
                            key={slot}
                            className="bg-mint-100 border border-mint-500 rounded px-2 py-1 text-xs"
                            title={names.join(", ")}
                          >
                            <span className="font-bold">{slot}</span>
                            <span className="text-gray-600 ml-1">({count}/{members.length})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </>
        )}

        {tab === "meeting" && (
          <>
            {group.meeting_confirmed ? (
              <Card className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-black mb-2">Meeting Locked In!</h2>
                <p className="text-lg font-bold text-mint-500 mb-2">
                  {group.meeting_day} - {group.meeting_time}
                </p>
                <p className="text-gray-600">
                  Your crew is all set. Time to dew this!
                </p>
              </Card>
            ) : suggestionMessage && !currentSuggestion ? (
              <Card className="text-center">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-gray-600">{suggestionMessage}</p>
              </Card>
            ) : currentSuggestion ? (
              <Card className="text-center">
                <h2 className="text-xl font-black mb-4">AI Suggests...</h2>
                <div className="bg-mint-100 border-4 border-black rounded-lg p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-3xl font-black mb-1">{currentSuggestion.day}</p>
                  <p className="text-xl font-bold text-gray-700">{currentSuggestion.timeSlot}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {currentSuggestion.available.length}/{currentSuggestion.totalMembers} members available
                  </p>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-bold mb-2">Available:</p>
                  <div className="flex flex-wrap gap-2 justify-center mb-3">
                    {currentSuggestion.available.map((name) => (
                      <Badge key={name} variant="mint">{name}</Badge>
                    ))}
                  </div>
                  {currentSuggestion.unavailable.length > 0 && (
                    <>
                      <p className="text-sm font-bold mb-2">Can&apos;t make it:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {currentSuggestion.unavailable.map((name) => (
                          <Badge key={name} variant="pop">{name}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => handleMeetingAction("accept")}
                    disabled={meetingAction}
                  >
                    {meetingAction ? "..." : "Let's Dew This! 🎯"}
                  </Button>
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => handleMeetingAction("reject")}
                    disabled={meetingAction}
                  >
                    No Can Dew 😅
                  </Button>
                </div>

                {alternatives.length > 0 && (
                  <p className="text-xs text-gray-400 mt-4">
                    Suggestion {suggestionIdx + 1} of {alternatives.length + 1}
                  </p>
                )}
              </Card>
            ) : (
              <Card className="text-center">
                <div className="text-5xl mb-4">📅</div>
                <p className="text-gray-600">Loading suggestions...</p>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
