import { useState } from "react";

type MessageToolbarProps = {
  onCollapse?: () => void;
  onCopy: () => void;
};

export function MessageToolbar({ onCollapse, onCopy }: MessageToolbarProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    onCopy();
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button className="toolbar-button" onClick={handleCopy} type="button">
        {copied ? "Copied" : "Copy"}
      </button>

      {onCollapse ? (
        <button className="toolbar-button" onClick={onCollapse} type="button">
          Collapse
        </button>
      ) : null}
    </div>
  );
}