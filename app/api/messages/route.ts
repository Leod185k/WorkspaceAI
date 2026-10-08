import { getAuthenticatedSupabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;
    const conversationId = new URL(request.url).searchParams.get("conversation_id");
    if (!conversationId) {
      return Response.json({ error: "conversation_id is required." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("messages")
      .select("id,conversation_id,role,content,provider,model,raw_provider_output,collapsed,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load messages:", error);
      return Response.json({ error: databaseMessage(error) }, { status: error.code === "42501" ? 403 : 500 });
    }
    return Response.json(data);
  } catch (error) {
    console.error("Failed to load messages:", error);
    return Response.json({ error: "Could not load messages." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;
    const body = await request.json();
    if (!body.conversation_id || !["user", "assistant"].includes(body.role) || typeof body.content !== "string" || body.content.length > 40_000) {
      return Response.json({ error: "conversation_id, role, and content are required." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("messages")
      .insert({
        conversation_id: body.conversation_id,
        role: body.role,
        content: body.content,
        provider: body.provider ?? null,
        model: body.model ?? null,
        raw_provider_output: body.raw_provider_output ?? null,
        collapsed: body.collapsed ?? false,
      })
      .select("id,conversation_id,role,content,provider,model,raw_provider_output,collapsed,created_at")
      .single();

    if (error) {
      console.error("Failed to save message:", error);
      return Response.json({ error: databaseMessage(error) }, { status: error.code === "42501" ? 403 : 500 });
    }
    return Response.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to save message:", error);
    return Response.json({ error: "Could not save message." }, { status: 500 });
  }
}

function databaseMessage(error: { code?: string }) {
  if (error.code === "42501") {
    return "Supabase blocked this request with row-level security. Apply an appropriate policy for messages in the Supabase SQL Editor.";
  }
  return "Could not access messages in Supabase.";
}
