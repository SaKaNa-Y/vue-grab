import type { CapturedLog } from "@sakana-y/vue-grab-shared";

export function buildLogPrompt(log: CapturedLog): string {
  const header = log.source === "console" ? log.level : `${log.source}/${log.level}`;
  let prompt = `[${header}] ${log.message}\n`;

  if (log.stack) {
    prompt += `\n\`\`\`\n${log.stack}\n\`\`\`\n`;
  }

  if (log.vueInfo) {
    prompt += `\nVue lifecycle: ${log.vueInfo}\n`;
  }

  if (log.componentStack && log.componentStack.length > 0) {
    prompt += `\nComponent stack:\n`;
    for (const comp of log.componentStack) {
      prompt += `- ${comp.name}`;
      if (comp.filePath) prompt += ` (${comp.filePath}${comp.line ? `:${comp.line}` : ""})`;
      prompt += "\n";
    }
  }

  if (log.sourceFile) {
    prompt += `\nSource: ${log.sourceFile}`;
    if (log.sourceLine) prompt += `:${log.sourceLine}`;
    prompt += `\n`;
  }

  return prompt;
}
