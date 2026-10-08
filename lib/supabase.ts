import "server-only";

import { createClient } from "@supabase/supabase-js";

export async function getAuthenticatedSupabase(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return { response: Response.json({ error: "Supabase is not configured on the server." }, { status: 503 }) };
  }
  if (!token) {
    return { response: Response.json({ error: "Sign in to continue." }, { status: 401 }) };
  }

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return { response: Response.json({ error: "Your session is invalid or expired. Sign in again." }, { status: 401 }) };
    }
    return { supabase, user: data.user };
  } catch (error) {
    console.error("Supabase session verification failed:", error);
    return { response: Response.json({ error: "Could not verify your session. Please try again." }, { status: 503 }) };
  }
}
