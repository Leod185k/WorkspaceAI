type MarkdownRendererProps = {
  content: string;
};

function renderInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code className="inline-code rounded px-1 py-0.5 text-[0.92em]" key={index}>
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

function isTable(block: string) {
  const rows = block.split("\n").filter(Boolean);
  return rows.length >= 2 && rows[0].includes("|") && rows[1].includes("---");
}

function renderTable(block: string, key: number) {
  const rows = block
    .split("\n")
    .filter((row) => row.trim())
    .map((row) =>
      row
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean),
    );
  const [head, , ...body] = rows;

  return (
    <div className="overflow-x-auto" key={key}>
      <table className="my-2 w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((cell) => (
              <th className="markdown-cell border px-2 py-1 text-left font-medium" key={cell}>
                {renderInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td className="markdown-cell border px-2 py-1" key={`${cell}-${cellIndex}`}>
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = content.split(/\n{2,}/);
  let inCodeFence = false;
  let codeLanguage = "";
  let codeLines: string[] = [];
  const rendered = [];

  for (const [index, block] of blocks.entries()) {
    if (block.startsWith("```")) {
      const lines = block.split("\n");
      inCodeFence = true;
      codeLanguage = lines[0].replace("```", "").trim();
      codeLines = lines.slice(1);

      if (block.endsWith("```")) {
        codeLines = codeLines.slice(0, -1);
        rendered.push(
          <pre className="code-block my-2 overflow-x-auto rounded-lg border p-3 text-xs leading-5" key={index}>
            <code>{codeLines.join("\n")}</code>
          </pre>,
        );
        inCodeFence = false;
      }

      continue;
    }

    if (inCodeFence) {
      const lines = block.split("\n");
      const closes = block.endsWith("```");
      codeLines.push(...(closes ? lines.slice(0, -1) : lines));

      if (closes) {
        rendered.push(
          <pre className="code-block my-2 overflow-x-auto rounded-lg border p-3 text-xs leading-5" key={index}>
            <code data-language={codeLanguage}>{codeLines.join("\n")}</code>
          </pre>,
        );
        inCodeFence = false;
      }

      continue;
    }

    if (isTable(block)) {
      rendered.push(renderTable(block, index));
      continue;
    }

    if (block.split("\n").every((line) => line.startsWith("- "))) {
      rendered.push(
        <ul className="my-2 list-disc space-y-1 pl-5" key={index}>
          {block.split("\n").map((line) => (
            <li key={line}>{renderInline(line.slice(2))}</li>
          ))}
        </ul>,
      );
      continue;
    }

    rendered.push(
      <p className="my-2 leading-6" key={index}>
        {block.split("\n").map((line, lineIndex) => (
          <span key={`${line}-${lineIndex}`}>
            {lineIndex > 0 ? <br /> : null}
            {renderInline(line)}
          </span>
        ))}
      </p>,
    );
  }

  return <div className="markdown-compact">{rendered}</div>;
}
