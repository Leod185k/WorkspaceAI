import { useState } from "react";
import { Conversation, formatRelative } from "@/lib/chat-data";

type SidebarProps = {
  activeConversationId: string;
  conversations: Conversation[];
  onCreate: () => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
  onSelect: (conversationId: string) => void;
  search: string;
  setSearch: (value: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
};

export function Sidebar({
  activeConversationId,
  conversations,
  onCreate,
  onRename,
  onDelete,
  onSelect,
  search,
  setSearch,
  theme,
  toggleTheme,
}: SidebarProps) {
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const filteredConversations = conversations.filter((conversation) =>
    conversation.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className="sidebar-surface hidden w-[260px] shrink-0 border-r md:flex md:flex-col">
      <div className="sidebar-section border-b p-3">
        <button
          className="primary-soft-button h-9 w-full rounded-md px-3 text-left text-sm font-medium transition"
          onClick={onCreate}
          type="button"
        >
          + New Chat
        </button>
        <label className="mt-3 block">
          <span className="sr-only">Search chats</span>
          <input
            className="field-surface h-8 w-full rounded-md border px-2.5 text-sm outline-none transition"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats"
            value={search}
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filteredConversations.map((conversation) => {
          const selected = conversation.id === activeConversationId;

          return (
            <div
              className={`group mb-1 rounded-md border px-2 py-2 transition ${
                selected
                  ? "conversation-item-selected"
                  : "conversation-item hover:border-[color:var(--border)] hover:bg-[color:var(--hover)]"
              }`}
              key={conversation.id}
            >
              <button
                className="block w-full text-left"
                onClick={() => onSelect(conversation.id)}
                type="button"
              >
                <span className="block truncate text-sm font-medium text-[color:var(--text)]">
                  {conversation.title}
                </span>
                <span className="mt-0.5 block text-xs text-[color:var(--muted)]">
                  Updated {formatRelative(conversation.updatedAt)} ago
                </span>
              </button>
              <div className="mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
  <button
    className="mini-button"
  onClick={() => {
    setRenamingConversationId(conversation.id);
    setRenameValue(conversation.title);
  }}
  type="button"
>
  Rename
  </button>

  <button
    className="mini-button"
    onClick={() => onDelete(conversation.id)}
    type="button"
  >
    Delete
  </button>
</div>
            </div>
          );
        })}
      </div>
      <div className="sidebar-section space-y-2 border-t p-3">
        <button
          className="secondary-button h-8 w-full rounded-md text-sm transition"
          onClick={() => setSettingsOpen((open) => !open)}
          type="button"
        >
          Settings
        </button>
        {settingsOpen ? (
          <div className="settings-panel rounded-lg border p-2">
            <div className="mb-2 text-xs font-medium text-[color:var(--muted)]">Appearance</div>
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
      {renamingConversationId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="settings-panel w-[320px] rounded-lg border p-4 shadow-lg">
            <h2 className="mb-3 text-sm font-medium">Rename chat</h2>

            <input
              autoFocus
              className="field-surface h-9 w-full rounded-md border px-3 text-sm outline-none"
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  const title = renameValue.trim();

                  if (title) {
                    onRename(renamingConversationId, title);
                    setRenamingConversationId(null);
                  }
                }

                if (event.key === "Escape") {
                  setRenamingConversationId(null);
                }
              }}
              value={renameValue}
            />

            <div className="mt-3 flex justify-end gap-2">
              <button
                className="secondary-button h-8 rounded-md px-3 text-sm"
                onClick={() => setRenamingConversationId(null)}
                type="button"
              >
                Cancel
              </button>

              <button
                className="primary-soft-button h-8 rounded-md px-3 text-sm"
                onClick={() => {
                  const title = renameValue.trim();

                  if (title) {
                    onRename(renamingConversationId, title);
                    setRenamingConversationId(null);
                  }
                }}
                type="button"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
