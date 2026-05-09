import { ModelOption } from "@/lib/chat-data";

type ModelSelectorProps = {
  modelId: string;
  models: ModelOption[];
  onChange: (modelId: string) => void;
};

export function ModelSelector({ modelId, models, onChange }: ModelSelectorProps) {
  return (
    <label className="model-selector flex h-9 items-center gap-2 rounded-lg border px-2 text-xs">
      Model
      <select
        className="max-w-32 bg-transparent text-sm text-[color:var(--text)] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={modelId}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label}
          </option>
        ))}
      </select>
    </label>
  );
}
