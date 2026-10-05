"use client";

import { useEffect, useMemo, useState } from "react";
import { ChatArea } from "@/components/Chat/ChatArea";
import { InputBar } from "@/components/InputBar/InputBar";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Conversation, Message, createId, seedConversations, seedMessages } from "@/lib/chat-data";

type Theme = "light" | "dark";
type ViewMode = "home" | "new" | "conversation";

export function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [viewMode, setViewMode] = useState<ViewMode>("home");

  const activeMessages = useMemo(
    () => messages.filter((message) => message.conversationId === activeConversationId),
    [activeConversationId, messages],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function touchConversation(conversationId: string, title?: string) {
    const updatedAt = new Date().toISOString();
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, title: title ?? conversation.title, updatedAt }
          : conversation,
      ),
    );
  }

  function handleNewConversation() {
  const now = new Date().toISOString();
  const conversationId = createId("conv");

  const conversation: Conversation = {
    id: conversationId,
    title: "New Chat",
    createdAt: now,
    updatedAt: now,
  };

  setConversations((current) => [conversation, ...current]);
  setActiveConversationId(conversationId);
  setViewMode("new");
}
function handleDeleteConversation(conversationId: string) {
  const confirmed = window.confirm("Are you sure you want to delete this chat?");

  if (!confirmed) {
    return;
  }

  setConversations((current) =>
    current.filter((conversation) => conversation.id !== conversationId),
  );

  setMessages((current) =>
    current.filter((message) => message.conversationId !== conversationId),
  );

  if (conversationId === activeConversationId) {
    setActiveConversationId("");
    setViewMode("home");
  }
}

  function handleHome() {
    setActiveConversationId("");
    setViewMode("home");
  }

  function handleSelectConversation(conversationId: string) {
    setActiveConversationId(conversationId);
    setViewMode("conversation");
  }

  function handleRenameConversation(conversationId: string, title: string) {
    const cleanTitle = title.trim() || "Untitled chat";
    touchConversation(conversationId, cleanTitle);
  }

  function updateMessage(messageId: string, patch: Partial<Message>) {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, ...patch } : message)),
    );
  }

  function handleSend(content: string) {
    let conversationId = activeConversationId;
    const createdAt = new Date().toISOString();

    if (!conversationId) {
      conversationId = createId("conv");
      const conversation: Conversation = {
        id: conversationId,
        title: content.slice(0, 42) || "Untitled chat",
        createdAt,
        updatedAt: createdAt,
      };

      setConversations((current) => [conversation, ...current]);
      setActiveConversationId(conversationId);
      setViewMode("conversation");
    }

    const userMessage: Message = {
      id: createId("msg"),
      conversationId,
      role: "user",
      content,
      collapsed: false,
      createdAt,
    };

    setMessages((current) => [...current, userMessage]);
    touchConversation(conversationId, content.slice(0, 42) || undefined);
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
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatArea
          messages={activeMessages}
          onCollapse={(messageId) => updateMessage(messageId, { collapsed: true })}
          onExpand={(messageId) => updateMessage(messageId, { collapsed: false })}
          onHome={handleHome}
          theme={theme}
          toggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          viewMode={viewMode}
        />
        <InputBar onSend={handleSend} />
      </main>
    </div>
  );
}
