"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
}

interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
}

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
  const [tab, setTab] = useState<"members" | "availability" | "meeting" | "chat" | "grouplist">("members");

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

  // Group list state
  const [groupListItems, setGroupListItems] = useState<GroupListItem[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [showAddToList, setShowAddToList] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  const fetchGroupList = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/list`);
      if (res.ok) {
        const data = await res.json();
        setGroupListItems(data.items);
      }
    } catch { /* ignore */ }
  }, [groupId]);

  const fetchMyTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setMyTasks(data.tasks);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch { /* ignore */ }
  }, [groupId]);

  useEffect(() => {
    fetchGroup();
    fetchAvailability();
    fetchSuggestion();
    fetchMessages();
    fetchGroupList();
    fetchMyTasks();
  }, [fetchGroup, fetchAvailability, fetchSuggestion, fetchMessages, fetchGroupList, fetchMyTasks]);

  // Poll for new messages when on chat tab
  useEffect(() => {
    if (tab !== "chat") return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [tab, fetchMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  async function handleAddToGroupList(taskId: string) {
    await fetch(`/api/groups/${groupId}/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });
    fetchGroupList();
    setShowAddToList(false);
  }

  async function handleRemoveFromGroupList(taskId: string) {
    await fetch(`/api/groups/${groupId}/list?taskId=${taskId}`, { method: "DELETE" });
    fetchGroupList();
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const items = [...groupListItems];
    const [dragged] = items.splice(dragIdx, 1);
    items.splice(idx, 0, dragged);
    setGroupListItems(items);
    setDragIdx(idx);
  }

  async function saveOrder() {
    const order = groupListItems.map((item, i) => ({ taskId: item.task_id, position: i }));
    await fetch(`/api/groups/${groupId}/list/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
  }

  function randomizeOrder() {
    const items = [...groupListItems];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setGroupListItems(items);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatInput }),
      });
      if (res.ok) {
        setChatInput("");
        fetchMessages();
      }
    } finally {
      setSendingMessage(false);
    }
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
          <button
            onClick={() => setTab("grouplist")}
            className={`px-4 py-2 rounded font-bold border-2 border-black transition-all ${
              tab === "grouplist"
                ? "bg-honey-500 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Group List
          </button>
          <button
            onClick={() => setTab("chat")}
            className={`px-4 py-2 rounded font-bold border-2 border-black transition-all ${
              tab === "chat"
                ? "bg-pop-400 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Chat
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
                <p className="text-gray-600 mb-4">
                  Your crew is all set. Time to dew this!
                </p>
                <Button size="lg" onClick={() => router.push(`/groups/${groupId}/dewday`)}>
                  Start Dew Day! 🚀
                </Button>
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

        {tab === "grouplist" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Group Task List</h2>
              <div className="flex gap-2">
                {groupListItems.length > 1 && (
                  <>
                    <Button variant="secondary" size="sm" onClick={randomizeOrder}>
                      Shuffle
                    </Button>
                    <Button variant="ghost" size="sm" onClick={saveOrder}>
                      Save Order
                    </Button>
                  </>
                )}
                <Button onClick={() => { fetchMyTasks(); setShowAddToList(true); }} size="sm">
                  + Add My Task
                </Button>
              </div>
            </div>

            {groupListItems.length > 1 && (
              <p className="text-xs text-gray-500 mb-3">Drag items to reorder locations. Click Shuffle for a random order.</p>
            )}

            {groupListItems.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-gray-500">No tasks in the group list yet. Add some!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {groupListItems.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDragIdx(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={() => { setDragIdx(null); }}
                    className={`cursor-grab active:cursor-grabbing ${dragIdx === idx ? "opacity-50" : ""}`}
                  >
                    <Card className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-mono text-sm w-6">{idx + 1}.</span>
                        <div>
                          <h3 className="font-bold">{item.task_name}</h3>
                          {item.task_location && (
                            <p className="text-xs text-gray-500">📍 {item.task_location}</p>
                          )}
                          <p className="text-xs text-dew-600 mt-1">Added by {item.added_by_name}</p>
                        </div>
                      </div>
                      {item.added_by === currentUserId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromGroupList(item.task_id)}
                        >
                          Remove
                        </Button>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            )}

            {/* Add Task Modal */}
            {showAddToList && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-dark"
                onClick={(e) => { if (e.target === e.currentTarget) setShowAddToList(false); }}>
                <div className="bg-white rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-black mb-4">Select a Task to Add</h3>
                  {myTasks.filter((t) => !groupListItems.some((gl) => gl.task_id === t.id)).length === 0 ? (
                    <p className="text-gray-500 text-sm">All your tasks are already in the group list!</p>
                  ) : (
                    <div className="space-y-2">
                      {myTasks
                        .filter((t) => !groupListItems.some((gl) => gl.task_id === t.id))
                        .map((task) => (
                          <button
                            key={task.id}
                            onClick={() => handleAddToGroupList(task.id)}
                            className="w-full text-left bg-honey-50 border-2 border-black rounded p-3 hover:bg-honey-100 transition-colors"
                          >
                            <p className="font-bold text-sm">{task.name}</p>
                            {task.location && <p className="text-xs text-gray-500">📍 {task.location}</p>}
                          </button>
                        ))}
                    </div>
                  )}
                  <Button variant="ghost" onClick={() => setShowAddToList(false)} className="mt-4 w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {tab === "chat" && (
          <Card noPadding>
            <div className="h-[500px] flex flex-col">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 mt-8">No messages yet. Start the conversation!</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.user_id === currentUserId;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] rounded-lg p-3 border-2 border-black ${
                          isMe ? "bg-honey-200" : "bg-white"
                        }`}>
                          {!isMe && (
                            <p className="text-xs font-bold text-dew-600 mb-1">{msg.user_name}</p>
                          )}
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="border-t-2 border-black p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-honey-400"
                />
                <Button type="submit" disabled={sendingMessage || !chatInput.trim()} size="sm">
                  Send
                </Button>
              </form>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
