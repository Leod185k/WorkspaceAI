import { FormEvent, KeyboardEvent, useState } from "react";

type InputBarProps = {
  isSending: boolean;
  onSend: (content: string) => void | Promise<void>;
};

export function InputBar({ isSending, onSend }: InputBarProps) {
  const [value, setValue] = useState("");

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const content = value.trim();

    if (!content) {
      return;
    }

    onSend(content);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      submit();
      event.preventDefault();
    }
  }

  return (
    <form className="composer-wrap border-t p-3" onSubmit={submit}>
      <div className="composer mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border p-2 shadow-lg">
        <button
          className="secondary-button hidden h-9 w-9 shrink-0 rounded-lg transition sm:block"
          title="Attach"
          type="button"
        >
          +
        </button>
        <textarea
          className="max-h-36 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-[color:var(--text)] outline-none placeholder:text-[color:var(--muted)]"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Workspace AI..."
          rows={1}
          value={value}
        />
        <button
          className="send-button h-9 rounded-lg px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!value.trim() || isSending}
          type="submit"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
