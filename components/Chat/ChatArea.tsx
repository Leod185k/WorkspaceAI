import { useState } from "react";
import { MessageCard } from "@/components/Message/MessageCard";
import { Message } from "@/lib/chat-data";

type ChatAreaProps = {
  contextCount: number;
  hiddenExcludedCount: number;
  hideExcluded: boolean;
  messages: Message[];
  onCollapse: (messageId: string) => void;
  onExclude: (messageId: string, excludedFromContext: boolean) => void;
  onExpand: (messageId: string) => void;
  onHome: () => void;
  onToggleHideExcluded: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  viewMode: "home" | "new" | "conversation";
};

export function ChatArea({
  contextCount,
  hiddenExcludedCount,
  hideExcluded,
  messages,
  onCollapse,
  onExclude,
  onExpand,
  onHome,
  onToggleHideExcluded,
  theme,
  toggleTheme,
  viewMode,
}: ChatAreaProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showHome = viewMode === "home";
  const showNewChat = viewMode === "new" && messages.length === 0;

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
          <p className="text-xs text-[color:var(--muted)]">Workspace</p>
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
          <button
            className={`secondary-button h-8 rounded-md px-2 text-xs transition ${
              hideExcluded ? "is-active" : ""
            }`}
            onClick={onToggleHideExcluded}
            type="button"
          >
            {hideExcluded ? `Show Excluded${hiddenExcludedCount ? ` (${hiddenExcludedCount})` : ""}` : "Hide Excluded"}
          </button>
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
          <EmptyChatState title="What are we working on?" />
        ) : showNewChat ? (
          <EmptyChatState title="What are we working on?" />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-2.5">
            {messages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onCollapse={onCollapse}
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

function EmptyChatState({ title }: { title: string }) {
  return (
    <div className="home-panel mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center py-10 text-center">
      <div className="workspace-mark mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border text-lg font-semibold">
        W
      </div>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-[color:var(--text)] sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}
