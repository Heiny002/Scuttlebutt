import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShareClaude — Game Idea Intake",
  description:
    "Chat with an AI product manager to capture your game idea and build an MVP development brief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
