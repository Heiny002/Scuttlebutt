"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface BadgeInfo {
  badge_type: string;
  name: string;
  description: string;
  emoji: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (!data.user.onboarded) {
          router.push("/onboarding");
          return;
        }
        setUser(data.user);
        // Fetch badges
        fetch("/api/user/badges")
          .then((r) => r.json())
          .then((d) => setBadges(d.badges || []))
          .catch(() => {});
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-honey-50">
        <p className="text-xl font-bold">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-honey-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">HoneyDew</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
          >
            Log Out
          </Button>
        </div>

        <Card>
          <h2 className="text-2xl font-black mb-4">Hey {user.name}!</h2>
          <p className="text-gray-600 mb-4">
            Welcome to your HoneyDew dashboard.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push("/tasks")}
              className="bg-honey-100 border-2 border-black rounded-lg p-4 text-left hover:bg-honey-200 transition-colors"
            >
              <h3 className="font-bold text-lg mb-2">My Tasks</h3>
              <p className="text-gray-500 text-sm">View and manage your Honey-Do list</p>
            </button>
            <button
              onClick={() => router.push("/groups")}
              className="bg-dew-100 border-2 border-black rounded-lg p-4 text-left hover:bg-dew-200 transition-colors"
            >
              <h3 className="font-bold text-lg mb-2">My Groups</h3>
              <p className="text-gray-500 text-sm">Create or join a group with friends</p>
            </button>
          </div>
        </Card>

        {/* Badges Section */}
        <Card className="mt-6">
          <h2 className="text-xl font-black mb-3">My Badges</h2>
          {badges.length === 0 ? (
            <p className="text-gray-500 text-sm">No badges yet. Start completing tasks to earn some!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.badge_type}
                  className="bg-honey-100 border-2 border-black rounded-lg p-3 text-center min-w-[100px]"
                  title={badge.description}
                >
                  <div className="text-2xl mb-1">{badge.emoji}</div>
                  <p className="text-xs font-bold">{badge.name}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
