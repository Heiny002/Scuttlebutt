"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-amber-50">
        <p className="text-xl font-bold">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-amber-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black">HoneyDew 🍯</h1>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/login");
            }}
            className="px-4 py-2 bg-white border-2 border-black rounded font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Log Out
          </button>
        </div>

        <div className="bg-white rounded-lg border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <h2 className="text-2xl font-black mb-4">
            Hey {user.name}! 👋
          </h2>
          <p className="text-gray-600 mb-4">
            Welcome to your HoneyDew dashboard. Your task list and groups will appear here soon.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-amber-50 border-2 border-black rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">My Tasks</h3>
              <p className="text-gray-500 text-sm">No tasks yet. Add your first one!</p>
            </div>
            <div className="bg-blue-50 border-2 border-black rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">My Groups</h3>
              <p className="text-gray-500 text-sm">No groups yet. Create or join one!</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
