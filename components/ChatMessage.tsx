"use client";

import React from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  images?: string[];
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  images,
  isStreaming,
}: ChatMessageProps) {
  const isUser = role === "user";

  // Strip the brief and markers from displayed content
  const displayContent = content
    .replace(/\[BRIEF_START\][\s\S]*?\[BRIEF_END\]/g, "")
    .replace(/\[INTAKE_COMPLETE\]/g, "")
    .trim();

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {images && images.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Uploaded image ${i + 1}`}
                className="max-h-48 rounded-lg object-cover"
              />
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {displayContent}
          {isStreaming && (
            <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-current" />
          )}
        </div>
      </div>
    </div>
  );
}
