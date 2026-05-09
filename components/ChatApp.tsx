"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatArea } from "@/components/Chat/ChatArea";
import { InputBar } from "@/components/InputBar/InputBar";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import {
  Conversation,
  Message,
  createId,
  getContextMessages,
  models,
  seedConversations,
  seedMessages,
} from "@/lib/chat-data";

type Theme = "light" | "dark";

const demoResponse =
  "Here is a first pass.\n\nI would start by separating the work into three tracks: what needs to be decided, what needs to be built, and what needs to be verified. That keeps planning concrete while still leaving room for discovery.\n\nA practical structure:\n\n- Define the goal and constraints.\n- List the unknowns that could change the approach.\n- Pick the smallest useful implementation slice.\n- Add checks for the behavior that matters most.\n- Keep notes on decisions that may need to be revisited.\n\n```ts\nconst nextContext = messages.filter((message) => {\n  return !message.deleted && !message.excludedFromContext;\n});\n```\n\nFor the next step, I would choose one slice and turn it into a short implementation checklist with acceptance criteria.";

export function ChatApp() {
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(models[0].id);
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState<Theme>("dark");
  const streamTimerRef = useRef<number | null>(null);

  const activeMessages = useMemo(
    () =>
      messages.filter(
        (message) => message.conversationId === activeConversationId && !message.deleted,
      ),
    [activeConversationId, messages],
  );

  const contextMessages = useMemo(
    () => getContextMessages(messages, activeConversationId),
    [activeConversationId, messages],
  );

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

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
    setActiveConversationId("");
  }

  function handleRenameConversation(conversationId: string, title: string) {
    const cleanTitle = title.trim() || "Untitled chat";
    touchConversation(conversationId, cleanTitle);
  }

  function handleDeleteConversation(conversationId: string) {
    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== conversationId);
      if (conversationId === activeConversationId) {
        setActiveConversationId(next[0]?.id ?? "");
      }
      return next;
    });
    setMessages((current) => current.filter((message) => message.conversationId !== conversationId));
  }

  function updateMessage(messageId: string, patch: Partial<Message>) {
    setMessages((current) =>
      current.map((message) => (message.id === messageId ? { ...message, ...patch } : message)),
    );
  }

  function handleSend(content: string) {
    let conversationId = activeConversationId;
    const selectedModel = models.find((model) => model.id === selectedModelId) ?? models[0];
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
    }

    const userMessage: Message = {
      id: createId("msg"),
      conversationId,
      role: "user",
      content,
      collapsed: false,
      deleted: false,
      excludedFromContext: false,
      createdAt,
    };
    const assistantId = createId("msg");
    const assistantMessage: Message = {
      id: assistantId,
      conversationId,
      role: "assistant",
      provider: selectedModel.provider,
      model: selectedModel.label,
      content: "",
      collapsed: false,
      deleted: false,
      excludedFromContext: false,
      createdAt: new Date().toISOString(),
      streaming: true,
    };

    setMessages((current) => [...current, userMessage, assistantMessage]);
    touchConversation(conversationId, content.slice(0, 42) || undefined);

    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
    }

    let index = 0;
    streamTimerRef.current = window.setInterval(() => {
      index = Math.min(index + 8, demoResponse.length);
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: demoResponse.slice(0, index),
                streaming: index < demoResponse.length,
              }
            : message,
        ),
      );

      if (index >= demoResponse.length && streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }, 24);
  }

  return (
    <div className="app-shell flex h-dvh overflow-hidden">
      <Sidebar
        activeConversationId={activeConversationId}
        conversations={conversations}
        onCreate={handleNewConversation}
        onDelete={handleDeleteConversation}
        onRename={handleRenameConversation}
        onSelect={setActiveConversationId}
        search={search}
        setSearch={setSearch}
        theme={theme}
        toggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatArea
          contextCount={contextMessages.length}
          messages={activeMessages}
          onCollapse={(messageId) => updateMessage(messageId, { collapsed: true })}
          onDelete={(messageId) => updateMessage(messageId, { deleted: true })}
          onExclude={(messageId, excludedFromContext) =>
            updateMessage(messageId, { excludedFromContext })
          }
          onExpand={(messageId) => updateMessage(messageId, { collapsed: false })}
          onHome={handleNewConversation}
          onStartPrompt={handleSend}
          theme={theme}
          toggleTheme={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
        />
        <InputBar
          modelId={selectedModelId}
          models={models}
          onModelChange={setSelectedModelId}
          onSend={handleSend}
        />
      </main>
    </div>
  );
}
