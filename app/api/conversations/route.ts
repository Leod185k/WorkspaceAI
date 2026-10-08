import { getAuthenticatedSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;

    const { data, error } = await auth.supabase
      .from("conversations")
      .select("id,title,created_at,updated_at")
      .eq("user_id", auth.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load conversations:", error);
      return Response.json({ error: databaseMessage(error) }, { status: error.code === "42501" ? 403 : 500 });
    }
    return Response.json(data);
  } catch (error) {
    console.error("Failed to load conversations:", error);
    return Response.json({ error: "Could not load conversations." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;
    const { title } = await request.json();
    if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
      return Response.json({ error: "A conversation title of 1–120 characters is required." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("conversations")
      .insert({ title: title.trim(), user_id: auth.user.id })
      .select("id,title,created_at,updated_at")
      .single();

    if (error) {
      console.error("Failed to create conversation:", error);
      return Response.json({ error: databaseMessage(error) }, { status: error.code === "42501" ? 403 : 500 });
    }
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return Response.json({ error: "Could not create conversation." }, { status: 500 });
  }
}

function databaseMessage(error: { code?: string; message: string }) {
  if (error.code === "42501") {
    return "Supabase blocked this request with row-level security. Apply an appropriate policy for conversations in the Supabase SQL Editor.";
  }
  return "Could not access conversations in Supabase.";
}
