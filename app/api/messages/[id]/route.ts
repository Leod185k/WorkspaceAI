import { getAuthenticatedSupabase } from "@/lib/supabase";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await getAuthenticatedSupabase(request);
    if ("response" in auth) return auth.response;
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of ["content", "provider", "model", "raw_provider_output", "collapsed"] as const) {
      if (key in body) updates[key] = body[key];
    }
    if (!Object.keys(updates).length) {
      return Response.json({ error: "No message changes provided." }, { status: 400 });
    }

    const { data, error } = await auth.supabase
      .from("messages")
      .update(updates)
      .eq("id", id)
      .select("id,conversation_id,role,content,provider,model,raw_provider_output,collapsed,created_at")
      .single();

    if (error) {
      console.error("Failed to update message:", error);
      return Response.json({ error: error.code === "42501"
        ? "Supabase blocked this request with row-level security. Apply an appropriate policy for messages in the Supabase SQL Editor."
        : "Could not update the message in Supabase." }, { status: error.code === "42501" ? 403 : 500 });
    }
    return Response.json(data);
  } catch (error) {
    console.error("Failed to update message:", error);
    return Response.json({ error: "Could not update message." }, { status: 500 });
  }
}
