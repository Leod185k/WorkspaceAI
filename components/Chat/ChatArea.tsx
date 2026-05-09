import { useState } from "react";
import { MessageCard } from "@/components/Message/MessageCard";
import { Message } from "@/lib/chat-data";

type ChatAreaProps = {
  contextCount: number;
  messages: Message[];
  onCollapse: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onExclude: (messageId: string, excludedFromContext: boolean) => void;
  onExpand: (messageId: string) => void;
  onHome: () => void;
  onStartPrompt: (prompt: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

const starterPrompts = [
  "Summarize a document",
  "Draft an email",
  "Plan a project",
  "Explain code",
  "Brainstorm ideas",
  "Review notes",
];

export function ChatArea({
  contextCount,
  messages,
  onCollapse,
  onDelete,
  onExclude,
  onExpand,
  onHome,
  onStartPrompt,
  theme,
  toggleTheme,
}: ChatAreaProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showHome = messages.length === 0;

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="topbar-surface flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div>
          <button
            className="text-left text-sm font-semibold text-[color:var(--text)] transition hover:text-[color:var(--accent-strong)]"
            onClick={onHome}
            type="button"
          >
            Workspace AI
          </button>
          <p className="text-xs text-[color:var(--muted)]">New chat</p>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            className="secondary-button h-8 rounded-md px-2 text-xs transition md:hidden"
            onClick={() => setSettingsOpen((open) => !open)}
            type="button"
          >
            Settings
          </button>
          <div className="stat-pill rounded-md border px-2 py-1 text-xs">
            {contextCount} in context
          </div>
          {settingsOpen ? (
            <div className="settings-popover settings-panel absolute right-0 top-10 z-10 w-48 rounded-lg border p-2 shadow-lg md:hidden">
              <div className="mb-2 text-xs font-medium text-[color:var(--muted)]">
                Appearance
              </div>
              <button
                className="secondary-button h-8 w-full rounded-md text-sm transition"
                onClick={toggleTheme}
                type="button"
              >
                {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              </button>
            </div>
          ) : null}
        </div>
      </header>
      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6">
        {showHome ? (
          <div className="home-panel mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center py-10">
            <div className="mb-8">
              <p className="mb-3 text-sm font-medium text-[color:var(--muted-strong)]">
                Start here
              </p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[color:var(--text)] sm:text-4xl">
                What are we working on?
              </h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {starterPrompts.map((prompt) => (
                <button
                  className="starter-card rounded-xl border p-3 text-left text-sm leading-5 transition"
                  key={prompt}
                  onClick={() => onStartPrompt(prompt)}
                  type="button"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onCollapse={onCollapse}
                onDelete={onDelete}
                onExclude={onExclude}
                onExpand={onExpand}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
