"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input } from "@/components/ui";

type Step = "welcome" | "profile" | "contacts" | "first-task" | "done";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  onboarded: number;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data.user.onboarded) {
          router.push("/dashboard");
          return;
        }
        setUser(data.user);
        setName(data.user.name);
        setPhone(data.user.phone);
      })
      .catch(() => router.push("/login"))
      .finally(() => setPageLoading(false));
  }, [router]);

  async function handleProfileSave() {
    setLoading(true);
    try {
      await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      setStep("contacts");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTask() {
    if (!taskName.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName,
          description: taskDescription,
          location: taskLocation,
        }),
      });
      setStep("done");
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    setLoading(true);
    try {
      await fetch("/api/user/onboard", { method: "POST" });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-honey-50">
        <p className="text-xl font-bold">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen flex items-center justify-center bg-honey-50 p-4">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {(["welcome", "profile", "contacts", "first-task", "done"] as Step[]).map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full border-2 border-black ${
                s === step ? "bg-honey-400" : "bg-white"
              }`}
            />
          ))}
        </div>

        {step === "welcome" && (
          <Card className="text-center">
            <div className="text-6xl mb-4">🍯</div>
            <h1 className="text-3xl font-black mb-2">Hey Honey,</h1>
            <h2 className="text-2xl font-black text-honey-600 mb-4">how do you dew?</h2>
            <p className="text-gray-600 mb-6">
              Welcome to HoneyDew! Let&apos;s get you set up so you can start tackling
              home-improvement tasks with your crew.
            </p>
            <Button onClick={() => setStep("profile")} className="w-full" size="lg">
              Let&apos;s Get Started
            </Button>
          </Card>
        )}

        {step === "profile" && (
          <Card>
            <h2 className="text-2xl font-black mb-1">Your Profile</h2>
            <p className="text-gray-600 mb-4">Confirm your details so your crew can find you.</p>
            <div className="space-y-4">
              <Input
                id="name"
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="What should we call you?"
              />
              <Input
                id="phone"
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
              <Button
                onClick={handleProfileSave}
                disabled={loading || !name || !phone}
                className="w-full"
              >
                {loading ? "Saving..." : "Next"}
              </Button>
            </div>
          </Card>
        )}

        {step === "contacts" && (
          <Card className="text-center">
            <div className="text-5xl mb-4">📇</div>
            <h2 className="text-2xl font-black mb-2">Find Your Crew</h2>
            <p className="text-gray-600 mb-6">
              Import your contacts so you can easily invite friends to your HoneyDew group.
            </p>
            <Button
              onClick={() => {
                // In a real app, this would trigger the Contacts API
                // For now, we'll just move to the next step
                setStep("first-task");
              }}
              className="w-full mb-3"
            >
              Import Contacts
            </Button>
            <button
              onClick={() => setStep("first-task")}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Skip for now
            </button>
          </Card>
        )}

        {step === "first-task" && (
          <Card>
            <h2 className="text-2xl font-black mb-1">Your First Task</h2>
            <p className="text-gray-600 mb-4">
              What&apos;s something around the house you&apos;ve been meaning to do?
            </p>
            <div className="space-y-4">
              <Input
                id="taskName"
                label="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder='e.g., "Fix the leaky faucet"'
              />
              <Input
                id="taskDesc"
                label="Description (optional)"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Any details..."
              />
              <Input
                id="taskLocation"
                label="Location (optional)"
                value={taskLocation}
                onChange={(e) => setTaskLocation(e.target.value)}
                placeholder='e.g., "Kitchen", "Garage"'
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateTask}
                  disabled={loading || !taskName.trim()}
                  className="flex-1"
                >
                  {loading ? "Creating..." : "Add Task"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("done")}
                >
                  Skip
                </Button>
              </div>
            </div>
          </Card>
        )}

        {step === "done" && (
          <Card className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black mb-2">You&apos;re All Set!</h2>
            <p className="text-gray-600 mb-6">
              Time to dew great things. Head to your dashboard to manage tasks or create a group
              with friends.
            </p>
            <Button onClick={finishOnboarding} disabled={loading} className="w-full" size="lg">
              {loading ? "Finishing up..." : "Go to Dashboard"}
            </Button>
          </Card>
        )}
      </div>
    </main>
  );
}
