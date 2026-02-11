"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import UsageBanner from "@/components/UsageBanner";
import Footer from "@/components/Footer";

interface Message {
  role: "user" | "assistant";
  content: string;
  images?: string[];
}

interface UsageInfo {
  messages: number;
  questionnaire_complete: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [usage, setUsage] = useState<UsageInfo>({
    messages: 0,
    questionnaire_complete: false,
  });
  const [limitReached, setLimitReached] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initializedRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch initial usage and send greeting
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    fetch("/api/usage")
      .then((r) => {
        if (r.status === 401) {
          router.push("/");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setUsage({
            messages: data.messages,
            questionnaire_complete: data.questionnaire_complete,
          });
        }
      })
      .catch(() => {});

    // Send initial empty conversation to get Claude's greeting
    sendToApi([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendToApi = async (conversationHistory: Message[]) => {
    setIsStreaming(true);

    // If this is the initial greeting, send a single user message to prompt Claude
    const apiMessages =
      conversationHistory.length === 0
        ? [{ role: "user" as const, content: "Hi! I have a game idea I'd like to explore." }]
        : conversationHistory.map((msg) => {
            if (msg.images && msg.images.length > 0) {
              return {
                role: msg.role,
                content: [
                  ...msg.images.map((url) => ({
                    type: "image" as const,
                    source: { type: "url" as const, url },
                  })),
                  { type: "text" as const, text: msg.content },
                ],
              };
            }
            return { role: msg.role, content: msg.content };
          });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (res.status === 401) {
        router.push("/");
        return;
      }

      if (res.status === 429) {
        const data = await res.json();
        setLimitReached(true);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error },
        ]);
        setIsStreaming(false);
        return;
      }

      if (!res.body) {
        setIsStreaming(false);
        return;
      }

      // Add empty assistant message for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);

          try {
            const data = JSON.parse(jsonStr);

            if (data.error) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  last.content += `\n\nError: ${data.error}`;
                }
                return updated;
              });
              break;
            }

            if (data.text) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === "assistant") {
                  last.content += data.text;
                }
                return [...updated];
              });
            }

            if (data.done && data.usage) {
              setUsage({
                messages: data.usage.messages,
                questionnaire_complete: data.usage.questionnaire_complete,
              });
            }
          } catch {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSend = async (
    text: string,
    images: { file: File; preview: string }[]
  ) => {
    if (isStreaming) return;

    // Upload images first
    const imageUrls: string[] = [];
    for (const img of images) {
      try {
        const formData = new FormData();
        formData.append("file", img.file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          imageUrls.push(data.url);
        }
      } catch {
        console.error("Image upload failed");
      }
      // Clean up preview URL
      URL.revokeObjectURL(img.preview);
    }

    const userMessage: Message = {
      role: "user",
      content: text,
      images: imageUrls.length > 0 ? imageUrls : undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    await sendToApi(updatedMessages);
  };

  return (
    <div className="flex h-dvh flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            ShareClaude
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Game Idea Intake
          </p>
        </div>
      </header>

      {/* Usage Banner */}
      <UsageBanner
        messages={usage.messages}
        questionnaireComplete={usage.questionnaire_complete}
      />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            images={msg.images}
            isStreaming={
              isStreaming && i === messages.length - 1 && msg.role === "assistant"
            }
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming || limitReached}
        placeholder={
          limitReached
            ? "Daily limit reached — come back tomorrow!"
            : "Type your message..."
        }
      />

      <Footer />
    </div>
  );
}
