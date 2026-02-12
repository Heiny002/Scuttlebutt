"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Modal } from "@/components/ui";

interface Group {
  id: string;
  name: string;
  creator_id: string;
  invite_code: string;
  memberCount: number;
}

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinPhone, setJoinPhone] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchGroups() {
    try {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setGroups(data.groups);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    if (!groupName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error);
        return;
      }
      const data = await res.json();
      setShowCreate(false);
      setGroupName("");
      router.push(`/groups/${data.group.id}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim() && !joinPhone.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: joinCode || undefined,
          phone: joinPhone || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setShowJoin(false);
      setJoinCode("");
      setJoinPhone("");
      router.push(`/groups/${data.group.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-honey-50">
        <p className="text-xl font-bold">Loading groups...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-honey-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black">My Groups</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
            <Button variant="secondary" size="sm" onClick={() => { setError(""); setShowJoin(true); }}>
              Join Group
            </Button>
            <Button onClick={() => { setError(""); setShowCreate(true); }}>
              Create Group
            </Button>
          </div>
        </div>

        {groups.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-xl font-black mb-2">No groups yet!</h2>
            <p className="text-gray-600 mb-4">
              Create a group or join one to start tackling tasks with friends.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowCreate(true)}>Create Group</Button>
              <Button variant="secondary" onClick={() => setShowJoin(true)}>Join Group</Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Card
                key={group.id}
                className="cursor-pointer hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                onClick={() => router.push(`/groups/${group.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black">{group.name}</h3>
                    <p className="text-gray-600 text-sm">
                      {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400 font-mono">
                    Code: {group.invite_code}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create a Group">
        {error && (
          <div className="bg-pop-100 border-2 border-pop-500 text-pop-600 px-4 py-2 rounded mb-4 text-sm font-bold">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <Input
            id="groupName"
            label="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder='e.g., "Weekend Warriors"'
          />
          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={saving || !groupName.trim()} className="flex-1">
              {saving ? "Creating..." : "Create Group"}
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Join Group Modal */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="Join a Group">
        {error && (
          <div className="bg-pop-100 border-2 border-pop-500 text-pop-600 px-4 py-2 rounded mb-4 text-sm font-bold">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <Input
            id="inviteCode"
            label="Invite Code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="e.g., ABC123"
          />
          <div className="text-center text-sm text-gray-400 font-bold">OR</div>
          <Input
            id="joinPhone"
            label="Creator&apos;s Phone Number"
            type="tel"
            value={joinPhone}
            onChange={(e) => setJoinPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />
          <div className="flex gap-3">
            <Button
              onClick={handleJoin}
              disabled={saving || (!joinCode.trim() && !joinPhone.trim())}
              className="flex-1"
            >
              {saving ? "Joining..." : "Join Group"}
            </Button>
            <Button variant="ghost" onClick={() => setShowJoin(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
