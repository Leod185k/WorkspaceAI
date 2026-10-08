import "server-only";

import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { checkChatRateLimit } from "@/lib/chat-rate-limit";
import { getAuthenticatedSupabase } from "@/lib/supabase";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 12_000;
const MAX_TOTAL_CHARS = 32_000;
const MAX_OUTPUT_TOKENS = 700;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const auth = await getAuthenticatedSupabase(request);
  if ("response" in auth) return auth.response;

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return Response.json({ error: "OpenAI is not configured on the server." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64_000) {
    return Response.json({ error: "The request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 64_000) return Response.json({ error: "The request is too large." }, { status: 413 });
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  const messages = parseMessages(body);
  if (!messages) {
    return Response.json({ error: "Messages must contain up to 40 user or assistant turns, with a 32,000 character total." }, { status: 400 });
  }

  try {
    const rateLimit = await checkChatRateLimit(auth.supabase);
    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Chat request limit reached. Try again after the limit resets." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }
  } catch (error) {
    console.error("Could not check chat rate limit:", error);
    return Response.json({ error: "Chat is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }

  try {
    const result = streamText({
      model: createOpenAI({ apiKey: openAiKey })("gpt-4o-mini"),
      messages,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      maxRetries: 0,
      timeout: 60_000,
      abortSignal: request.signal,
      onError: ({ error }) => console.error("OpenAI stream error:", error),
    });

    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const part of result.stream) {
            if (part.type === "text-delta") {
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: "text", text: part.text })}\n`));
            } else if (part.type === "error") {
              console.error("OpenAI response stream returned an error:", part.error);
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", error: "The response was interrupted. Please try again." })}\n`));
              return;
            }
          }
          if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify({ type: "done" })}\n`));
        } catch (error) {
          console.error("OpenAI response stream failed:", error);
          if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify({ type: "error", error: "The response was interrupted. Please try again." })}\n`));
        } finally {
          if (!cancelled) controller.close();
        }
      },
      cancel() {
        cancelled = true;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not start OpenAI response:", error);
    return Response.json({ error: "Could not start the response. Please try again." }, { status: 502 });
  }
}

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const input = (body as { messages: unknown[] }).messages;
  if (input.length === 0 || input.length > MAX_MESSAGES) return null;

  const messages: ChatMessage[] = [];
  let totalChars = 0;
  for (const item of input) {
    if (!item || typeof item !== "object") return null;
    const message = item as { role?: unknown; content?: unknown };
    if ((message.role !== "user" && message.role !== "assistant") || typeof message.content !== "string") return null;
    if (message.content.length > MAX_MESSAGE_CHARS) return null;
    totalChars += message.content.length;
    if (totalChars > MAX_TOTAL_CHARS) return null;
    messages.push({ role: message.role, content: message.content });
  }

  if (messages[messages.length - 1].role !== "user") return null;
  return messages;
}
