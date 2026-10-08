import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitRow = { allowed: boolean; retry_after_seconds: number };

async function consume(supabase: SupabaseClient, windowSeconds: number) {
  const { data, error } = await supabase.rpc("consume_chat_rate_limit", {
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
  if (!row) throw new Error("Rate-limit function returned no result.");
  return row;
}

export async function checkChatRateLimit(supabase: SupabaseClient) {
  const perMinute = await consume(supabase, 60);
  if (!perMinute.allowed) return { allowed: false, retryAfter: perMinute.retry_after_seconds };

  const perDay = await consume(supabase, 86400);
  if (!perDay.allowed) return { allowed: false, retryAfter: perDay.retry_after_seconds };

  return { allowed: true, retryAfter: 0 };
}
