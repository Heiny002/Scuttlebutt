"use client";

import React from "react";
import { DAILY_MESSAGE_LIMIT } from "@/lib/constants";

interface UsageBannerProps {
  messages: number;
  questionnaireComplete: boolean;
}

export default function UsageBanner({
  messages,
  questionnaireComplete,
}: UsageBannerProps) {
  if (!questionnaireComplete) return null;

  const remaining = Math.max(0, DAILY_MESSAGE_LIMIT - messages);
  const percentage = (messages / DAILY_MESSAGE_LIMIT) * 100;
  const isWarning = percentage >= 80;
  const isLimit = remaining === 0;

  return (
    <div
      className={`px-4 py-2 text-center text-xs font-medium ${
        isLimit
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          : isWarning
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
      }`}
    >
      {isLimit
        ? "Daily message limit reached. Come back tomorrow!"
        : `${remaining} message${remaining !== 1 ? "s" : ""} remaining today`}
    </div>
  );
}
