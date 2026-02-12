import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShareClaude — Idea Intake",
  description:
    "Chat with an AI product manager to capture your idea and build an MVP development brief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
