import type { CapturedLog, CapturedRequest } from "@sakana-y/vue-grab-shared";
import { toRelativePath } from "./path";

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
      if (comp.filePath)
        prompt += ` (${toRelativePath(comp.filePath)}${comp.line ? `:${comp.line}` : ""})`;
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

export function buildRequestPrompt(req: CapturedRequest): string {
  const statusLabel =
    req.statusClass === "failed"
      ? `FAILED${req.error ? ` (${req.error})` : ""}`
      : `${req.status}${req.statusText ? ` ${req.statusText}` : ""}`;
  let prompt = `[${req.initiator}] ${req.method} ${req.url} → ${statusLabel}\n`;
  if (req.duration != null) prompt += `Duration: ${Math.round(req.duration)}ms\n`;
  if (req.count > 1) prompt += `Repeated: ×${req.count}\n`;

  if (req.requestHeaders && Object.keys(req.requestHeaders).length > 0) {
    prompt += `\nRequest headers:\n`;
    for (const [k, v] of Object.entries(req.requestHeaders)) prompt += `  ${k}: ${v}\n`;
  }
  if (req.requestBody) {
    prompt += `\nRequest body:\n\`\`\`\n${req.requestBody}\n\`\`\`\n`;
  }
  if (req.responseHeaders && Object.keys(req.responseHeaders).length > 0) {
    prompt += `\nResponse headers:\n`;
    for (const [k, v] of Object.entries(req.responseHeaders)) prompt += `  ${k}: ${v}\n`;
  }
  if (req.responseBody) {
    prompt += `\nResponse body:\n\`\`\`\n${req.responseBody}\n\`\`\`\n`;
  }
  if (req.sourceFile) {
    prompt += `\nInitiator: ${req.sourceFile}`;
    if (req.sourceLine) prompt += `:${req.sourceLine}`;
    prompt += `\n`;
  }

  return prompt;
}
