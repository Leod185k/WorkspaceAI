"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatArea } from "@/components/Chat/ChatArea";
import { AuthScreen } from "@/components/AuthScreen";
import { InputBar } from "@/components/InputBar/InputBar";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Conversation, Message, Provider, Role, createId } from "@/lib/chat-data";
import type { Session } from "@supabase/supabase-js";

type Theme = "light" | "dark";
type ViewMode = "home" | "new" | "conversation";
type DbConversation = { id: string; title: string; created_at: string; updated_at: string };
type DbMessage = {
  id: string;
  conversation_id: string;
  role: Role;
  content: string;
  provider: Provider | null;
  model: string | null;
  raw_provider_output: string | null;
  collapsed: boolean;
  created_at: string;
};

const toConversation = (item: DbConversation): Conversation => ({
  id: item.id,
  title: item.title,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const toMessage = (item: DbMessage): Message => ({
  id: item.id,
  conversationId: item.conversation_id,
  role: item.role,
  content: item.content,
  provider: item.provider ?? undefined,
  model: item.model ?? undefined,
  rawProviderOutput: item.raw_provider_output ?? undefined,
  collapsed: item.collapsed,
  createdAt: item.created_at,
});

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
  if (!session) throw new Error("Your session expired. Sign in again.");
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function ChatApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState("");

  const activeMessages = useMemo(
    () => messages.filter((message) => message.conversationId === activeConversationId),
    [activeConversationId, messages],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_OUT") {
        setConversations([]);
        setMessages([]);
        setActiveConversationId("");
        setViewMode("home");
        setPasswordRecovery(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const authenticatedUserId = session?.user.id;
  useEffect(() => {
    if (!authenticatedUserId) return;
    api<DbConversation[]>("/api/conversations")
      .then((rows) => setConversations(rows.map(toConversation)))
      .catch((error) => setChatError(error instanceof Error ? error.message : "Could not load chats."));
  }, [authenticatedUserId]);

  async function handleNewConversation() {
    try {
      const row = await api<DbConversation>("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ title: "New Chat" }),
      });
      const conversation = toConversation(row);
      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(conversation.id);
      setViewMode("new");
    } catch (error) {
      console.error("Could not create chat in Supabase:", error);
    }
  }

  async function handleDeleteConversation(conversationId: string) {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;

    try {
      await api(`/api/conversations/${conversationId}`, { method: "DELETE" });
      setConversations((current) => current.filter((item) => item.id !== conversationId));
      setMessages((current) => current.filter((item) => item.conversationId !== conversationId));
      if (conversationId === activeConversationId) {
        setActiveConversationId("");
        setViewMode("home");
      }
    } catch (error) {
      console.error("Could not delete chat from Supabase:", error);
    }
  }

  function handleHome() {
    setActiveConversationId("");
    setViewMode("home");
  }

  async function handleSelectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setViewMode("conversation");
    try {
      const rows = await api<DbMessage[]>(`/api/messages?conversation_id=${encodeURIComponent(conversationId)}`);
      setMessages((current) => [
        ...current.filter((item) => item.conversationId !== conversationId),
        ...rows.map(toMessage),
      ]);
    } catch (error) {
      console.error("Could not load chat messages from Supabase:", error);
    }
  }

  function touchConversation(conversationId: string, title?: string) {
    const patch = title ? { title } : { touch: true };
    setConversations((current) =>
      current.map((item) =>
        item.id === conversationId
          ? { ...item, title: title ?? item.title, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
    void api<DbConversation>(`/api/conversations/${conversationId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).then((row) => {
      setConversations((current) => current.map((item) => (item.id === row.id ? toConversation(row) : item)));
    }).catch((error) => console.error("Could not update chat in Supabase:", error));
  }

  function handleRenameConversation(conversationId: string, title: string) {
    touchConversation(conversationId, title.trim() || "Untitled chat");
  }

  function updateMessage(messageId: string, patch: Partial<Message>) {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, ...patch } : message)),
    );
    const dbPatch: Record<string, unknown> = {};
    if (patch.content !== undefined) dbPatch.content = patch.content;
    if (patch.collapsed !== undefined) dbPatch.collapsed = patch.collapsed;
    if (patch.rawProviderOutput !== undefined) dbPatch.raw_provider_output = patch.rawProviderOutput;
    if (Object.keys(dbPatch).length) {
      void api(`/api/messages/${messageId}`, { method: "PATCH", body: JSON.stringify(dbPatch) })
        .catch((error) => console.error("Could not update message in Supabase:", error));
    }
  }

  async function handleSend(content: string) {
    if (isSending) return;
    setIsSending(true);
    setChatError("");
    let pendingAssistant: Message | null = null;
    let assistantContent = "";

    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const row = await api<DbConversation>("/api/conversations", {
          method: "POST",
          body: JSON.stringify({ title: "New Chat" }),
        });
        const conversation = toConversation(row);
        conversationId = conversation.id;
        setConversations((current) => [conversation, ...current]);
        setActiveConversationId(conversationId);
        setViewMode("conversation");
      }

      const title = content.slice(0, 42) || "Untitled chat";
      touchConversation(conversationId, title);
      const userRow = await api<DbMessage>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ conversation_id: conversationId, role: "user", content }),
      });
      const userMessage = toMessage(userRow);
      const conversationMessages = [...activeMessages, userMessage];
      setMessages((current) => [...current, userMessage]);

      const { data: { session: currentSession } } = await getSupabaseBrowserClient().auth.getSession();
      if (!currentSession) throw new Error("Your session expired. Sign in again.");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: JSON.stringify({
          messages: conversationMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? `Request failed (${response.status})`);
      }
      if (!response.body) throw new Error("The response did not include a readable stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pendingData = "";
      pendingAssistant = {
        id: createId("pending"), conversationId, role: "assistant", provider: "openai",
        model: "GPT-4o mini", content: "", rawProviderOutput: "", collapsed: false,
        createdAt: new Date().toISOString(),
      };
      setMessages((current) => [...current, pendingAssistant!]);

      const consumeLine = (line: string): string | null => {
        if (!line.trim()) return null;
        const event = JSON.parse(line) as { type: string; text?: string; error?: string };
        if (event.type === "text" && event.text) {
          assistantContent += event.text;
          setMessages((current) => current.map((item) => item.id === pendingAssistant!.id
            ? { ...item, content: assistantContent, rawProviderOutput: assistantContent }
            : item));
        } else if (event.type === "error") {
          return event.error ?? "The response was interrupted. Please try again.";
        }
        return null;
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        pendingData += decoder.decode(value, { stream: true });
        const lines = pendingData.split("\n");
        pendingData = lines.pop() ?? "";
        for (const line of lines) {
          const error = consumeLine(line);
          if (error) throw new Error(error);
        }
      }
      pendingData += decoder.decode();
      if (pendingData.trim()) {
        const error = consumeLine(pendingData);
        if (error) throw new Error(error);
      }

      const savedAssistant = await api<DbMessage>("/api/messages", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId, role: "assistant", provider: "openai",
          model: "GPT-4o mini", content: assistantContent, raw_provider_output: assistantContent,
        }),
      });
      setMessages((current) => current.map((item) => item.id === pendingAssistant!.id ? toMessage(savedAssistant) : item));
    } catch (error) {
      console.error("Chat submission failed:", error);
      const message = error instanceof Error ? error.message : "Could not send the message. Please try again.";
      setChatError(message);
      if (pendingAssistant) {
        const displayContent = assistantContent || "Response failed. Please try again.";
        setMessages((current) => current.map((item) => item.id === pendingAssistant!.id
          ? { ...item, content: displayContent, rawProviderOutput: assistantContent }
          : item));
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleSignOut() {
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    if (error) setChatError(error.message);
  }

  if (authLoading) {
    return <main className="app-shell flex min-h-dvh items-center justify-center text-sm text-[color:var(--muted)]">Checking your session…</main>;
  }

  if (!session || passwordRecovery) {
    return <AuthScreen passwordRecovery={passwordRecovery} onRecoveryComplete={() => setPasswordRecovery(false)} />;
  }

  return (
    <div className="app-shell flex h-dvh overflow-hidden">
      <Sidebar
        activeConversationId={activeConversationId}
        conversations={conversations}
        onCreate={handleNewConversation}
        onRename={handleRenameConversation}
        onSelect={handleSelectConversation}
        onDelete={handleDeleteConversation}
        search={search}
        setSearch={setSearch}
        theme={theme}
        toggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        email={session.user.email ?? "Signed in"}
        onSignOut={handleSignOut}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        {chatError ? (
          <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300" role="alert">
            {chatError}
            <button className="ml-3 underline" onClick={() => setChatError("")} type="button">Dismiss</button>
          </div>
        ) : null}
        <ChatArea
          messages={activeMessages}
          onCollapse={(messageId) => updateMessage(messageId, { collapsed: true })}
          onExpand={(messageId) => updateMessage(messageId, { collapsed: false })}
          onHome={handleHome}
          theme={theme}
          toggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          viewMode={viewMode}
        />
        <InputBar isSending={isSending} onSend={handleSend} />
      </main>
    </div>
  );
}
