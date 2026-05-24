import type {
  CapturedLog,
  CapturedRequest,
  ComponentInfo,
  GrabResult,
} from "@sakana-y/vue-grab-shared";

import { toRelativePath } from "./path";

const CONTEXT_HTML_MAX_LENGTH = 2000;
const CONTEXT_INLINE_MAX_LENGTH = 180;
const CONTEXT_MAX_LOGS = 12;
const CONTEXT_MAX_NETWORK = 12;

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

export interface ContextPromptInput {
  result: GrabResult | null;
  logs: CapturedLog[];
  network: CapturedRequest[];
}

export function buildContextPrompt(input: ContextPromptInput): string {
  const logs = newestFirst(input.logs).slice(0, CONTEXT_MAX_LOGS);
  const network = newestFirst(input.network).slice(0, CONTEXT_MAX_NETWORK);
  const lines: string[] = [
    "# Vue Grab Context Packet",
    "",
    "Use this packet to restore UI debugging context after chat compaction or in a fresh agent session.",
    "",
  ];

  appendGrabSection(lines, input.result);
  appendLogSection(lines, logs, input.logs.length);
  appendNetworkSection(lines, network, input.network.length);

  return lines.join("\n").trimEnd() + "\n";
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

function appendGrabSection(lines: string[], result: GrabResult | null): void {
  lines.push("## Selected Element");
  if (!result) {
    lines.push(
      "No element has been grabbed yet. Capture an element to include selector, HTML, component stack, and a11y context.",
      "",
    );
    return;
  }

  lines.push(`- Selector: \`${result.selector}\``);
  const first = result.componentStack[0];
  if (first) lines.push(`- Component: ${formatComponent(first)}`);
  lines.push(
    `- A11y: ${result.a11y.hasA11y ? "attributes present" : "no explicit a11y attributes"}`,
  );

  if (result.a11y.attributes.length > 0) {
    lines.push("", "### A11y Attributes");
    for (const attr of result.a11y.attributes) {
      lines.push(`- ${attr.name}="${truncateInline(attr.value)}"`);
    }
  }

  if (result.a11y.audit.length > 0) {
    lines.push("", "### A11y Audit");
    for (const item of result.a11y.audit) {
      lines.push(`- ${item.severity}: ${truncateInline(item.message)}`);
    }
  }

  if (result.componentStack.length > 0) {
    lines.push("", "### Component Stack");
    for (const comp of result.componentStack) lines.push(`- ${formatComponent(comp)}`);
  }

  lines.push(
    "",
    "### HTML",
    fence("html", truncateBlock(result.html, CONTEXT_HTML_MAX_LENGTH)),
    "",
  );
}

function appendLogSection(lines: string[], logs: CapturedLog[], total: number): void {
  lines.push("## Console");
  if (total === 0) {
    lines.push("No console entries captured.", "");
    return;
  }

  lines.push(`${logs.length} of ${total} most recent entries:`);
  for (const log of logs) lines.push(formatLogSummary(log));
  lines.push("");
}

function appendNetworkSection(lines: string[], network: CapturedRequest[], total: number): void {
  lines.push("## Network");
  if (total === 0) {
    lines.push("No network activity captured.", "");
    return;
  }

  lines.push(`${network.length} of ${total} most recent requests:`);
  for (const req of network) lines.push(formatRequestSummary(req));
  lines.push("");
}

function formatComponent(comp: ComponentInfo): string {
  let out = comp.name;
  if (comp.filePath) {
    out += ` (${toRelativePath(comp.filePath)}${comp.line ? `:${comp.line}` : ""})`;
  }
  return out;
}

function formatLogSummary(log: CapturedLog): string {
  const header = log.source === "console" ? log.level : `${log.source}/${log.level}`;
  const count = log.count > 1 ? ` x${log.count}` : "";
  const source = formatLogSource(log);
  return `- [${header}] ${truncateInline(log.message)}${count}${source}`;
}

function formatLogSource(log: CapturedLog): string {
  const comp = log.componentStack?.[0];
  if (comp?.filePath) {
    return ` (${toRelativePath(comp.filePath)}${comp.line ? `:${comp.line}` : ""})`;
  }
  if (log.sourceFile) return ` (${log.sourceFile}${log.sourceLine ? `:${log.sourceLine}` : ""})`;
  return "";
}

function formatRequestSummary(req: CapturedRequest): string {
  const status =
    req.statusClass === "failed"
      ? `FAILED${req.error ? `: ${truncateInline(req.error, 80)}` : ""}`
      : `${req.status ?? req.statusClass}${req.statusText ? ` ${req.statusText}` : ""}`;
  const duration = req.duration != null ? ` ${Math.round(req.duration)}ms` : "";
  const count = req.count > 1 ? ` x${req.count}` : "";
  const source = req.sourceFile
    ? ` (${req.sourceFile}${req.sourceLine ? `:${req.sourceLine}` : ""})`
    : "";
  return `- [${req.initiator}] ${req.method} ${truncateInline(req.url)} -> ${status}${duration}${count}${source}`;
}

function newestFirst<T extends { timestamp: number }>(items: T[]): T[] {
  return items.toSorted((a, b) => b.timestamp - a.timestamp);
}

function truncateInline(value: string, max = CONTEXT_INLINE_MAX_LENGTH): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

function truncateBlock(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}\n<!-- truncated -->` : value;
}

function fence(lang: string, value: string): string {
  return `\`\`\`${lang}\n${value.replace(/```/g, "``\\`")}\n\`\`\``;
}
