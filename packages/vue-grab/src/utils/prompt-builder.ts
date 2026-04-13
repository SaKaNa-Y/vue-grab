import type { CapturedError } from "@sakana-y/vue-grab-shared";

export function buildErrorPrompt(error: CapturedError): string {
  let prompt = `[${error.type}] ${error.message}\n`;

  if (error.stack) {
    prompt += `\n\`\`\`\n${error.stack}\n\`\`\`\n`;
  }

  if (error.vueInfo) {
    prompt += `\nVue lifecycle: ${error.vueInfo}\n`;
  }

  if (error.componentStack && error.componentStack.length > 0) {
    prompt += `\nComponent stack:\n`;
    for (const comp of error.componentStack) {
      prompt += `- ${comp.name}`;
      if (comp.filePath) prompt += ` (${comp.filePath}${comp.line ? `:${comp.line}` : ""})`;
      prompt += "\n";
    }
  }

  if (error.sourceFile) {
    prompt += `\nSource: ${error.sourceFile}`;
    if (error.sourceLine) prompt += `:${error.sourceLine}`;
    prompt += `\n`;
  }

  return prompt;
}
