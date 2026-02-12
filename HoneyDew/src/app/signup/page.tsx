"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, Input } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Signup failed");
        return;
      }

      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-honey-50 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-2">HoneyDew</h1>
        <p className="text-center text-gray-600 mb-6">Create your account</p>

        {error && (
          <div className="bg-pop-100 border-2 border-pop-500 text-pop-600 px-4 py-2 rounded mb-4 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            type="text"
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />

          <Input
            id="email"
            type="email"
            label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <Input
            id="phone"
            type="tel"
            label="Phone Number"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-honey-600 font-bold hover:underline">
            Log In
          </Link>
        </p>
      </Card>
    </main>
  );
}
