import { NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getClaudeClient, SYSTEM_PROMPT } from "@/lib/claude";
import {
  getUsage,
  updateUsage,
  markQuestionnaireComplete,
  appendConversation,
  isOverMessageLimit,
  isOverCostLimit,
} from "@/lib/storage";
import { checkAndAlert } from "@/lib/twilio";
import { INTAKE_COMPLETE_MARKER } from "@/lib/constants";

export const maxDuration = 60;

interface ChatMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

interface ContentBlock {
  type: "text" | "image";
  text?: string;
  source?: {
    type: "url";
    url: string;
  };
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const usage = await getUsage();

  if (isOverCostLimit(usage)) {
    return new Response(
      JSON.stringify({
        error: "Daily cost limit reached. Please come back tomorrow!",
      }),
      { status: 429 }
    );
  }

  if (isOverMessageLimit(usage)) {
    return new Response(
      JSON.stringify({
        error:
          "Daily message limit reached (30 messages). Please come back tomorrow!",
      }),
      { status: 429 }
    );
  }

  const { messages } = (await request.json()) as { messages: ChatMessage[] };

  // Build Claude messages with proper content blocks
  const claudeMessages = messages.map((msg) => {
    if (typeof msg.content === "string") {
      return { role: msg.role as "user" | "assistant", content: msg.content };
    }
    // Handle image + text content blocks
    return {
      role: msg.role as "user" | "assistant",
      content: msg.content.map((block) => {
        if (block.type === "image" && block.source) {
          return {
            type: "image" as const,
            source: {
              type: "url" as const,
              url: block.source.url,
            },
          };
        }
        return { type: "text" as const, text: block.text || "" };
      }),
    };
  });

  const client = getClaudeClient();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: claudeMessages,
  });

  // Create a TransformStream to process the SSE
  const encoder = new TextEncoder();
  let fullResponse = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta") {
            const delta = event.delta;
            if ("text" in delta) {
              fullResponse += delta.text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: delta.text })}\n\n`)
              );
            }
          } else if (event.type === "message_delta") {
            if ("usage" in event && event.usage) {
              outputTokens = event.usage.output_tokens;
            }
          } else if (event.type === "message_start") {
            if (event.message?.usage) {
              inputTokens = event.message.usage.input_tokens;
            }
          }
        }

        // Check if questionnaire is complete
        const intakeComplete = fullResponse.includes(INTAKE_COMPLETE_MARKER);
        if (intakeComplete) {
          await markQuestionnaireComplete();
        }

        // Only count toward message limit if questionnaire is already complete
        // and this is NOT the message that just completed it
        const currentUsage = await getUsage();
        const countMessage =
          currentUsage.questionnaire_complete && !intakeComplete;

        const updatedUsage = await updateUsage(
          inputTokens,
          outputTokens,
          countMessage
        );

        // Store conversation
        const lastUserMsg = messages[messages.length - 1];
        const userText =
          typeof lastUserMsg.content === "string"
            ? lastUserMsg.content
            : lastUserMsg.content
                .filter((b) => b.type === "text")
                .map((b) => b.text)
                .join(" ");

        await appendConversation([
          { role: "user", content: userText, timestamp: Date.now() },
          {
            role: "assistant",
            content: fullResponse,
            timestamp: Date.now(),
          },
        ]);

        // Check alerts (fire and forget)
        checkAndAlert(updatedUsage).catch(console.error);

        // Send final usage data
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              done: true,
              usage: {
                messages: updatedUsage.messages,
                questionnaire_complete: updatedUsage.questionnaire_complete,
                cost_cents: updatedUsage.cost_cents,
              },
            })}\n\n`
          )
        );
        controller.close();
      } catch (err) {
        console.error("[Chat] Stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
