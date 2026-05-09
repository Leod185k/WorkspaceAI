import { CollapsedMessage } from "@/components/CollapsedMessage/CollapsedMessage";
import { MarkdownRenderer } from "@/components/Message/MarkdownRenderer";
import { MessageToolbar } from "@/components/MessageToolbar/MessageToolbar";
import { Message, formatClock } from "@/lib/chat-data";

type MessageCardProps = {
  message: Message;
  onCollapse: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onExclude: (messageId: string, excludedFromContext: boolean) => void;
  onExpand: (messageId: string) => void;
};

export function MessageCard({
  message,
  onCollapse,
  onDelete,
  onExclude,
  onExpand,
}: MessageCardProps) {
  if (message.role === "assistant" && message.collapsed) {
    return <CollapsedMessage message={message} onExpand={onExpand} />;
  }

  if (message.role === "user") {
    return (
      <article className="user-message ml-auto max-w-[82%] rounded-2xl px-4 py-2.5 text-sm">
        <div className="whitespace-pre-wrap leading-6">{message.content}</div>
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-[color:var(--muted)]">
          <span>{formatClock(message.createdAt)}</span>
          <MessageToolbar
            excludedFromContext={message.excludedFromContext}
            onCopy={() => navigator.clipboard.writeText(message.content)}
            onDelete={() => onDelete(message.id)}
            onExclude={(excluded) => onExclude(message.id, excluded)}
          />
        </div>
      </article>
    );
  }

  return (
    <article className="assistant-card rounded-xl border shadow-sm">
      <header className="assistant-card-header flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="model-badge rounded-md border px-1.5 py-0.5 text-xs font-medium">
            {message.model}
          </span>
          <span className="text-xs text-[color:var(--muted)]">{formatClock(message.createdAt)}</span>
          {message.excludedFromContext ? (
            <span className="status-badge warning rounded px-1.5 py-0.5 text-xs">
              excluded
            </span>
          ) : null}
          {message.streaming ? (
            <span className="status-badge streaming rounded px-1.5 py-0.5 text-xs">
              streaming
            </span>
          ) : null}
        </div>
        <MessageToolbar
          excludedFromContext={message.excludedFromContext}
          onCollapse={() => onCollapse(message.id)}
          onCopy={() => navigator.clipboard.writeText(message.content)}
          onDelete={() => onDelete(message.id)}
          onExclude={(excluded) => onExclude(message.id, excluded)}
        />
      </header>
      <div className="px-4 py-3 text-sm text-[color:var(--text)]">
        <MarkdownRenderer content={message.content} />
      </div>
    </article>
  );
}
