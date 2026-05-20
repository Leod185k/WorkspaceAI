import { ModelOption } from "@/lib/chat-data";

type ModelSelectorProps = {
  modelId: string;
  models: ModelOption[];
  onChange: (modelId: string) => void;
};

export function ModelSelector({ modelId, models, onChange }: ModelSelectorProps) {
  return (
    <label className="model-selector flex h-9 shrink-0 items-center gap-2 rounded-lg border px-2 text-xs">
      <span className="hidden sm:inline">Model</span>
      <span className="sm:hidden">AI</span>
      <select
        className="model-select max-w-28 appearance-none bg-transparent pr-4 text-sm outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={modelId}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
      <span className="select-chevron" aria-hidden="true">
        v
      </span>
    </label>
  );
}
