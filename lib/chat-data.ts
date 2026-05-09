export type Provider = "openai" | "anthropic" | "gemini" | "xai" | "deepseek";

export type Role = "user" | "assistant";

export type ModelOption = {
  id: string;
  label: string;
  provider: Provider;
  shortName: string;
};

export type Message = {
  id: string;
  conversationId: string;
  role: Role;
  provider?: Provider;
  model?: string;
  content: string;
  collapsed: boolean;
  deleted: boolean;
  excludedFromContext: boolean;
  createdAt: string;
  streaming?: boolean;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export const models: ModelOption[] = [
  { id: "gpt-5", label: "GPT-5", provider: "openai", shortName: "OpenAI" },
  { id: "claude-sonnet", label: "Claude", provider: "anthropic", shortName: "Anthropic" },
  { id: "gemini-pro", label: "Gemini", provider: "gemini", shortName: "Gemini" },
  { id: "grok", label: "Grok", provider: "xai", shortName: "xAI" },
  { id: "deepseek-chat", label: "DeepSeek", provider: "deepseek", shortName: "DeepSeek" },
];

const seedNow = new Date("2026-05-09T21:15:00.000Z");
const minutesAgo = (minutes: number) =>
  new Date(seedNow.getTime() - minutes * 60 * 1000).toISOString();

export const seedConversations: Conversation[] = [
  {
    id: "conv-1",
    title: "Model comparison",
    createdAt: minutesAgo(220),
    updatedAt: minutesAgo(4),
  },
  {
    id: "conv-2",
    title: "Provider routing notes",
    createdAt: minutesAgo(420),
    updatedAt: minutesAgo(58),
  },
  {
    id: "conv-3",
    title: "Markdown rendering checks",
    createdAt: minutesAgo(870),
    updatedAt: minutesAgo(190),
  },
];

export const seedMessages: Message[] = [
  {
    id: "msg-1",
    conversationId: "conv-1",
    role: "user",
    content:
      "Compare Claude, ChatGPT, Gemini, Grok, and DeepSeek for a developer research workflow. Include practical strengths, tradeoffs, and where each model fits best.",
    collapsed: false,
    deleted: false,
    excludedFromContext: false,
    createdAt: minutesAgo(18),
  },
  {
    id: "msg-2",
    conversationId: "conv-1",
    role: "assistant",
    provider: "openai",
    model: "GPT-5",
    content:
      "For a developer research workflow, ChatGPT is strongest when the work alternates between synthesis, implementation planning, and code-shaped reasoning. It is useful when one conversation needs to move from discovery notes into architecture sketches, API contracts, tests, and concrete next steps.\n\nThe main advantage is range. You can ask for a compact overview, then drill into API design, then ask for edge cases, then turn the result into a migration plan. That makes it useful for work that crosses product thinking, engineering tradeoffs, and implementation details.\n\nWhere it fits best:\n\n- Turning fuzzy requirements into implementation slices.\n- Comparing libraries, architecture choices, and deployment paths.\n- Drafting schemas, API contracts, UI states, and test plans.\n- Explaining unfamiliar code and converting that understanding into a patch.\n\nTradeoffs: broad capability can produce broad answers. For best results, ask for a specific output shape, include constraints, and separate exploratory questions from final implementation requests.\n\n```ts\nconst context = messages.filter((message) => {\n  return !message.deleted && !message.excludedFromContext;\n});\n```\n\n| Model | Strong fit | Watch for |\n| --- | --- | --- |\n| ChatGPT | Planning and implementation | Over-broad answers |\n| Claude | Careful analysis and writing | May be more verbose |\n| Gemini | Large-context review | Needs focused instructions |",
    collapsed: false,
    deleted: false,
    excludedFromContext: false,
    createdAt: minutesAgo(17),
  },
  {
    id: "msg-3",
    conversationId: "conv-1",
    role: "user",
    content: "Give separate notes for the other models with enough detail to compare them clearly.",
    collapsed: false,
    deleted: false,
    excludedFromContext: true,
    createdAt: minutesAgo(12),
  },
  {
    id: "msg-4",
    conversationId: "conv-1",
    role: "assistant",
    provider: "anthropic",
    model: "Claude",
    content:
      "Claude is often a strong fit for careful analysis, long-form synthesis, and writing that needs nuance. In developer research, it can be helpful when you are sorting through ambiguous requirements, comparing tradeoffs, or trying to turn a messy set of notes into a clear recommendation.\n\nIts answers tend to be readable and deliberate. That is useful when the task involves judgment rather than only code generation: deciding whether a migration is worth it, explaining risk to stakeholders, or outlining a plan that several people need to understand.\n\nStrong fits:\n\n- Requirements analysis.\n- Long-form technical explanation.\n- Policy, product, or design tradeoff writing.\n- Turning rough notes into structured recommendations.\n\nTradeoffs: Claude can be verbose when the task does not need that much prose. It benefits from clear constraints such as desired length, audience, and output format.",
    collapsed: true,
    deleted: false,
    excludedFromContext: false,
    createdAt: minutesAgo(11),
  },
  {
    id: "msg-5",
    conversationId: "conv-1",
    role: "assistant",
    provider: "gemini",
    model: "Gemini",
    content:
      "Gemini is useful when the work involves reviewing a broad set of source material and looking for patterns. A developer might bring API docs, logs, issue comments, benchmark notes, and implementation sketches into the same workflow. Gemini can be a good fit for scanning, comparing, and producing an initial map of the problem.\n\nStrong fits:\n\n- Large document review.\n- Cross-checking notes against requirements.\n- Generating comparison tables.\n- Summarizing several possible approaches before choosing one.\n\nTradeoffs: broad review can drift if the prompt does not define the exact decision being made. It helps to state the criteria up front: performance, maintainability, cost, compatibility, team familiarity, or delivery speed.\n\nFor engineering use, Gemini works best when paired with concrete follow-up prompts. Ask it to identify gaps, then ask for a focused plan, then ask for risks or tests.",
    collapsed: false,
    deleted: false,
    excludedFromContext: false,
    createdAt: minutesAgo(9),
  },
  {
    id: "msg-6",
    conversationId: "conv-1",
    role: "assistant",
    provider: "deepseek",
    model: "DeepSeek",
    content:
      "DeepSeek is most interesting for code-heavy workflows where the questions are specific and technical. It can be useful for implementation sketches, algorithmic reasoning, debugging, and comparing low-level approaches.\n\nStrong fits:\n\n- Reasoning through implementation details.\n- Reviewing code paths or proposed patches.\n- Drafting focused examples.\n- Comparing algorithmic or architectural tradeoffs.\n\nTradeoffs: like any model, it benefits from a tight prompt and good surrounding context. If the task includes product judgment, user experience, or stakeholder communication, it may help to pair the result with a second model that is stronger at synthesis and explanation.\n\nA practical workflow is to ask for a first implementation approach, then ask for failure modes, then ask for a smaller patch plan.",
    collapsed: false,
    deleted: false,
    excludedFromContext: false,
    createdAt: minutesAgo(7),
  },
  {
    id: "msg-7",
    conversationId: "conv-2",
    role: "assistant",
    provider: "gemini",
    model: "Gemini",
    content: "Provider adapters should expose a common streaming interface while preserving raw provider output.",
    collapsed: false,
    deleted: false,
    excludedFromContext: false,
    createdAt: minutesAgo(58),
  },
];

export function getContextMessages(messages: Message[], conversationId: string) {
  return messages.filter(
    (message) =>
      message.conversationId === conversationId &&
      !message.deleted &&
      !message.excludedFromContext,
  );
}

export function formatClock(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRelative(value: string) {
  const diffMs = seedNow.getTime() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h`;
  }

  return `${Math.round(diffHours / 24)}d`;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
