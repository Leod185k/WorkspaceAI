import { Message, formatClock } from "@/lib/chat-data";
import { MessageToolbar } from "@/components/MessageToolbar/MessageToolbar";

type CollapsedMessageProps = {
  message: Message;
  onExpand: (messageId: string) => void;
  onExclude: (messageId: string, excludedFromContext: boolean) => void;
};

export function CollapsedMessage({
  message,
  onExpand,
  onExclude,
}: CollapsedMessageProps) {
  return (
    <article
  className={`collapsed-card rounded-xl border px-3 py-2 shadow-sm transition ${
    message.excludedFromContext
      ? "message-excluded border-[color:var(--warning)]"
      : ""
  }`}
>
   

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
        <div className="flex items-center gap-2">
  <MessageToolbar
    excludedFromContext={message.excludedFromContext}
    onCopy={() => navigator.clipboard.writeText(message.content)}
    onExclude={(excluded) => onExclude(message.id, excluded)}
  />

  <button
    className="toolbar-button"
    onClick={() => onExpand(message.id)}
    type="button"
  >
    Expand
  </button>
</div>
      </div>
    </article>
  );
}
