import { Message, formatClock } from "@/lib/chat-data";

type CollapsedMessageProps = {
  message: Message;
  onExpand: (messageId: string) => void;
};

export function CollapsedMessage({ message, onExpand }: CollapsedMessageProps) {
  return (
    <article className="collapsed-card rounded-xl border px-3 py-2 shadow-sm transition">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-sm text-[color:var(--muted-strong)]">
          <span className="font-medium text-[color:var(--text)]">{message.model}</span>
          <span className="text-[color:var(--muted)]"> - </span>
          <span>Response Hidden</span>
          <span className="text-[color:var(--muted)]"> - </span>
          <span>{message.content.length.toLocaleString()} chars</span>
          <span className="text-[color:var(--muted)]"> - </span>
          <span>{formatClock(message.createdAt)}</span>
        </div>
        <button
          className="toolbar-button"
          onClick={() => onExpand(message.id)}
          type="button"
        >
          Expand
        </button>
      </div>
    </article>
  );
}
