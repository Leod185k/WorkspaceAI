import { getAuthenticatedSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const updates: { title?: string; updated_at?: string } = {};

    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if (body.touch === true) updates.updated_at = new Date().toISOString();
    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No conversation changes provided." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .select("id,title,created_at,updated_at")
      .single();

    if (error) {
      console.error("Failed to update conversation:", error);
      return Response.json({ error: databaseMessage(error) }, { status: error.code === "42501" ? 403 : 500 });
    }
    return Response.json(data);
  } catch (error) {
    console.error("Failed to update conversation:", error);
    return Response.json({ error: "Could not update conversation." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const { error } = await auth.supabase.from("conversations").delete().eq("id", id).eq("user_id", auth.user.id);
    if (error) {
      console.error("Failed to delete conversation:", error);
      return Response.json({ error: databaseMessage(error) }, { status: error.code === "42501" ? 403 : 500 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return Response.json({ error: "Could not delete conversation." }, { status: 500 });
  }
}

function databaseMessage(error: { code?: string }) {
  if (error.code === "42501") {
    return "Supabase blocked this request with row-level security. Apply an appropriate policy for conversations in the Supabase SQL Editor.";
  }
  return "Could not change the conversation in Supabase.";
}
