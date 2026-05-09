type MessageToolbarProps = {
  collapsed?: boolean;
  excludedFromContext: boolean;
  onCollapse?: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onExclude: (excludedFromContext: boolean) => void;
};

export function MessageToolbar({
  collapsed = false,
  excludedFromContext,
  onCollapse,
  onCopy,
  onDelete,
  onExclude,
}: MessageToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button className="toolbar-button danger" onClick={onDelete} type="button">
        Delete
      </button>
      <button className="toolbar-button" onClick={onCopy} type="button">
        Copy
      </button>
      <button
        className={`toolbar-button ${excludedFromContext ? "is-active" : ""}`}
        onClick={() => onExclude(!excludedFromContext)}
        type="button"
      >
        {excludedFromContext ? "Excluded" : "Exclude"}
      </button>
      {!collapsed && onCollapse ? (
        <button className="toolbar-button" onClick={onCollapse} type="button">
          Collapse
        </button>
      ) : null}
    </div>
  );
}
