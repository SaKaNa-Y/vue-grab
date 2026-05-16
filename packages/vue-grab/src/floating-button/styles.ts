export const STYLES = `
  :host {
    all: initial;
    --grab-toolbar-active-bg: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, transparent);
    --grab-control-active-bg: color-mix(in srgb, var(--grab-color, #4f46e5) 12%, rgba(255,255,255,0.04));
    --lvl-log: #9ca3af;
    --lvl-info: #60a5fa;
    --lvl-warn: #f59e0b;
    --lvl-error: #ef4444;
    --lvl-debug: #a78bfa;
  }

  /* ── FAB wrapper (flex column: bar + panel) ── */
  .fab-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .fab-wrapper.expand-up {
    flex-direction: column-reverse;
  }
  .fab-wrapper.expand-right {
    flex-direction: row;
    align-items: center;
  }
  .fab-wrapper.expand-left {
    flex-direction: row-reverse;
    align-items: center;
  }
  .fab-wrapper.edge {
    gap: 0;
    align-items: stretch;
  }
  .fab-wrapper.edge.edge-left,
  .fab-wrapper.edge.edge-right {
    height: 100vh;
    flex-direction: row;
  }
  .fab-wrapper.edge.edge-right {
    flex-direction: row-reverse;
  }
  .fab-wrapper.edge.edge-top,
  .fab-wrapper.edge.edge-bottom {
    width: 100vw;
    flex-direction: column;
  }
  .fab-wrapper.edge.edge-bottom {
    flex-direction: column-reverse;
  }
  /* ── Toolbar (compact bar) ── */
  .toolbar {
    display: inline-flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30,30,30,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    cursor: grab;
    user-select: none;
    touch-action: none;
    position: relative;
  }
  .fab-wrapper.edge .toolbar {
    border-radius: 0;
  }
  .fab-wrapper.edge.edge-left .toolbar,
  .fab-wrapper.edge.edge-right .toolbar {
    width: 36px;
    height: 100vh;
    justify-content: center;
  }
  .fab-wrapper.edge.edge-top .toolbar,
  .fab-wrapper.edge.edge-bottom .toolbar {
    width: 100vw;
    height: 36px;
    align-items: center;
  }
  .toolbar.dragging {
    cursor: grabbing;
    box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  }

  /* ── Button row ── */
  .toolbar-row {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 4px;
    gap: 2px;
    flex-shrink: 0;
  }

  .toolbar-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #a0a0a0;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .toolbar-btn:hover {
    color: #e0e0e0;
    background: rgba(255,255,255,0.08);
  }
  .grab-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: var(--grab-toolbar-active-bg);
  }
  .gear-btn.active {
    color: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1.5px var(--grab-color, #4f46e5);
    background: var(--grab-toolbar-active-bg);
  }
  .toolbar-divider {
    width: 1px;
    height: 18px;
    background: rgba(255,255,255,0.12);
    margin: 0 2px;
  }
  .a11y-btn.active {
    color: #4ade80;
    box-shadow: inset 0 0 0 1.5px #4ade80;
    background: rgba(74, 222, 128, 0.12);
  }
  .logs-btn {
    position: relative;
  }
  .render-scan-btn.active {
    color: #22d3ee;
    box-shadow: inset 0 0 0 1.5px #22d3ee;
    background: rgba(34, 211, 238, 0.12);
  }
  .render-scan-btn.panel-open {
    color: #a78bfa;
    box-shadow: inset 0 0 0 1.5px #a78bfa;
    background: rgba(167, 139, 250, 0.12);
  }
  .render-scan-btn.disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .logs-btn.active {
    color: #f59e0b;
    box-shadow: inset 0 0 0 1.5px #f59e0b;
    background: rgba(245, 158, 11, 0.12);
  }
  .magnifier-btn.active {
    color: #c084fc;
    box-shadow: inset 0 0 0 1.5px #c084fc;
    background: rgba(192, 132, 252, 0.12);
  }
  .magnifier-btn.disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .measurer-btn.active {
    color: #06b6d4;
    box-shadow: inset 0 0 0 1.5px #06b6d4;
    background: rgba(6, 182, 212, 0.12);
  }
  .logs-badge {
    position: absolute;
    top: 1px;
    right: 1px;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--lvl-warn);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    padding: 0 3px;
    pointer-events: none;
  }
  .logs-badge.has-error {
    background: var(--lvl-error);
  }

  /* ── A11y panel ── */
  .a11y-panel { padding: 14px; }
  .a11y-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }
  .a11y-title {
    font-size: 13px;
    font-weight: 650;
    color: #e8e8e8;
  }
  .a11y-rescan-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }
  .a11y-rescan-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }
  .a11y-summary-strip {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 16px;
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
    color: #888;
    font-size: 12px;
    line-height: 1.35;
  }
  .a11y-summary-count {
    color: #e8e8e8;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .a11y-summary-count.pass { color: #4ade80; }
  .a11y-summary-count.fail { color: #ffcb6b; }
  .a11y-summary-count.neutral { color: #aaa; }
  .a11y-summary-separator {
    color: #555;
    padding: 0 2px;
  }
  .a11y-audit-list {
    margin-bottom: 16px;
  }
  .a11y-group-label {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .a11y-group-count,
  .a11y-row-count,
  .a11y-status-chip {
    font-size: 10px;
    line-height: 1.2;
    border-radius: 10px;
    padding: 2px 7px;
    background: rgba(255,255,255,0.08);
    color: #aaa;
    font-variant-numeric: tabular-nums;
  }
  .a11y-row {
    transition: background 0.12s ease;
    cursor: default;
  }
  .a11y-row:hover {
    background: rgba(255,255,255,0.04);
  }
  .a11y-row-icon.pass { color: #4ade80; }
  .a11y-row-icon.fail { color: #ffcb6b; }
  .a11y-row-icon.neutral { color: #6b6b6b; }
  .a11y-row-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #7dd3fc;
  }
  .a11y-row-file {
    word-break: break-all;
  }
  .a11y-row-detail {
    display: block;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #999;
  }
  .a11y-row-detail.warning { color: #ffcb6b; }
  .a11y-row-control {
    align-self: stretch;
  }
  .a11y-row-toggle {
    cursor: pointer;
  }
  .a11y-row-toggle .a11y-row {
    cursor: pointer;
  }
  .a11y-row-chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin-right: 4px;
    color: #666;
    font-size: 10px;
    transition: transform 0.15s ease;
  }
  .a11y-row-chevron.open {
    transform: rotate(90deg);
  }
  .a11y-row-count {
    background: rgba(255,203,107,0.14);
    color: #ffcb6b;
  }
  .a11y-status-chip.pass {
    background: rgba(74,222,128,0.12);
    color: #4ade80;
  }
  .a11y-status-chip.fail {
    background: rgba(255,203,107,0.14);
    color: #ffcb6b;
  }
  .a11y-status-chip.neutral {
    background: rgba(255,255,255,0.06);
    color: #8a8a8a;
  }
  .a11y-child-details {
    display: none;
    padding: 0 12px 12px 56px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .a11y-child-details.open {
    display: block;
  }
  .a11y-audit-list > .a11y-row-toggle {
    display: contents;
  }
  .a11y-audit-list > .a11y-row-toggle:last-child .a11y-row,
  .a11y-audit-list > .a11y-row-toggle:last-child .a11y-child-details {
    border-bottom: 0;
  }
  .a11y-child-surface {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
    border-radius: 6px;
    background: rgba(0,0,0,0.18);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
  }
  .a11y-child-row {
    font-size: 11px;
    padding: 5px 7px;
    border-radius: 5px;
    background: rgba(255,255,255,0.025);
  }
  .a11y-child-tag {
    color: #c792ea;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
  }
  .a11y-child-msg {
    font-size: 11px;
    line-height: 1.35;
    margin-top: 2px;
  }
  .a11y-child-msg.warning { color: #ffcb6b; }
  .a11y-child-msg.pass { color: #4ade80; }
  .a11y-child-msg.neutral { color: #666; font-style: italic; }
  .a11y-empty {
    color: #777;
    text-align: center;
    padding: 24px;
    font-size: 12px;
  }
  .a11y-rescan-btn--loading {
    opacity: 0.6;
    pointer-events: none;
  }
  @media (max-width: 520px) {
    .a11y-row-control {
      grid-column: 2;
      justify-content: flex-start;
    }
    .a11y-child-details {
      padding-left: 42px;
    }
  }

  /* ── Expand body (separate card below/above bar) ── */
  .expand-body {
    display: none;
    flex-direction: column;
    overflow-y: auto;
    height: min(500px, 65vh);
    width: min(900px, 85vw);
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    cursor: default;
    touch-action: pan-y;
    user-select: text;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(30,30,30,0.85);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
    box-sizing: border-box;
  }
  .expand-body.open {
    display: flex;
  }
  .fab-wrapper.edge .expand-body {
    border-radius: 0;
    margin: 0;
    box-shadow: 0 0 24px rgba(0,0,0,0.4);
  }
  .fab-wrapper.edge.edge-left .expand-body,
  .fab-wrapper.edge.edge-right .expand-body {
    width: min(900px, calc(100vw - 36px));
    height: 100vh;
    max-height: 100vh;
  }
  .fab-wrapper.edge.edge-top .expand-body,
  .fab-wrapper.edge.edge-bottom .expand-body {
    width: 100vw;
    height: min(520px, calc(100vh - 36px));
    max-height: calc(100vh - 36px);
  }
  .expand-body::-webkit-scrollbar {
    width: 6px;
  }
  .expand-body::-webkit-scrollbar-track {
    background: transparent;
  }
  .expand-body::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }

  /* ── Tabs (inside settings content) ── */
  .tab-bar {
    display: flex;
    padding: 0 14px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    gap: 0;
    flex-shrink: 0;
    overflow-x: auto;
  }
  .tab-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 12px;
    font-family: inherit;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }
  .tab-btn:hover {
    color: #ccc;
  }
  .tab-btn.active {
    color: var(--grab-color, #4f46e5);
    border-bottom-color: var(--grab-color, #4f46e5);
  }
  .tab-content {
    padding: 14px;
    display: none;
  }
  .tab-content.active {
    display: block;
  }

  /* Dock controls */
  .setting-help {
    color: #888;
    font-size: 12px;
    line-height: 1.35;
    margin: -4px 0 10px;
  }
  .dock-mode-group {
    display: inline-flex;
    max-width: 100%;
    gap: 2px;
    padding: 4px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.07);
    box-sizing: border-box;
  }
  .dock-mode-option {
    min-width: 76px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 6px 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #999;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }
  .dock-mode-option:hover {
    color: #ddd;
    background: rgba(255,255,255,0.07);
  }
  .dock-mode-option.active {
    color: var(--grab-color, #4f46e5);
    background: rgba(0,0,0,0.32);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
  }
  .dock-mode-icon {
    flex: 0 0 auto;
  }
  .dock-settings-list {
    margin-bottom: 16px;
  }
  .dock-mode-row .setting-row-control {
    min-width: 174px;
  }
  .setting-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
  }
  .setting-toggle-row {
    cursor: pointer;
  }
  .setting-toggle-copy {
    min-width: 0;
  }
  .setting-toggle-title {
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }
  .setting-toggle-description {
    color: #888;
    font-size: 12px;
    line-height: 1.35;
    margin-top: 2px;
  }
  .setting-toggle-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .setting-toggle-switch {
    position: relative;
    flex: 0 0 auto;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: rgba(255,255,255,0.14);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12);
    transition: background 0.15s ease, box-shadow 0.15s ease;
  }
  .setting-toggle-switch::after {
    content: "";
    position: absolute;
    top: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    transition: transform 0.15s ease;
  }
  .setting-toggle-input:checked + .setting-toggle-switch {
    background: var(--grab-color, #4f46e5);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
  }
  .setting-toggle-input:checked + .setting-toggle-switch::after {
    transform: translateX(16px);
  }
  .setting-toggle-input:focus-visible + .setting-toggle-switch {
    box-shadow: 0 0 0 2px var(--grab-color, #4f46e5);
  }
  .dock-entry-manager {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .dock-entry-group {
    overflow: visible;
  }
  .dock-entry-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 8px;
  }
  .dock-entry-group-title {
    color: #888;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .dock-entry-group-count {
    color: #888;
    font-size: 12px;
    margin-left: 4px;
  }
  .dock-entry-group-toggle {
    margin-left: auto;
    width: 26px;
    height: 26px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--grab-color, #4f46e5);
    background: var(--grab-control-active-bg);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
  }
  .dock-entry-group-toggle:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
  }
  .dock-entry-group-toggle.is-partial {
    color: #bbb;
    background: rgba(255,255,255,0.09);
  }
  .dock-entry-group-toggle:disabled {
    color: #777;
    background: rgba(255,255,255,0.06);
    cursor: not-allowed;
  }
  .dock-entry-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) minmax(210px, auto);
    align-items: center;
    position: relative;
  }
  .dock-entry-row.is-dragging {
    opacity: 0.45;
  }
  .dock-entry-row.is-drop-before::before,
  .dock-entry-row.is-drop-after::after {
    content: "";
    position: absolute;
    left: 12px;
    right: 12px;
    height: 2px;
    border-radius: 999px;
    background: var(--grab-color, #4f46e5);
    box-shadow: 0 0 8px color-mix(in srgb, var(--grab-color, #4f46e5) 45%, transparent);
  }
  .dock-entry-row.is-drop-before::before {
    top: 0;
  }
  .dock-entry-row.is-drop-after::after {
    bottom: 0;
  }
  .dock-entry-drag {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    color: #666;
    font-size: 18px;
    line-height: 1;
    cursor: grab;
    user-select: none;
  }
  .dock-entry-drag:hover {
    color: #bbb;
    background: rgba(255,255,255,0.08);
  }
  .dock-entry-drag:active {
    cursor: grabbing;
  }
  .dock-entry-check {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 6px;
    color: var(--grab-color, #4f46e5);
    background: var(--grab-control-active-bg);
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
    line-height: 1;
  }
  .dock-entry-check:hover {
    color: #fff;
    background: rgba(255,255,255,0.1);
  }
  .dock-entry-check.is-hidden {
    color: #777;
    background: rgba(255,255,255,0.05);
  }
  .dock-entry-check:disabled {
    color: #777;
    background: rgba(255,255,255,0.05);
    cursor: not-allowed;
  }
  .dock-entry-icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #9a9a9a;
  }
  .dock-entry-icon svg {
    width: 18px;
    height: 18px;
  }
  .dock-entry-label {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dock-entry-label-text {
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dock-entry-badge {
    flex: 0 0 auto;
    padding: 1px 5px;
    border-radius: 999px;
    background: rgba(251,191,36,0.14);
    color: #fbbf24;
    box-shadow: inset 0 0 0 1px rgba(251,191,36,0.28);
    font-size: 9px;
    font-weight: 700;
    line-height: 1.35;
    text-transform: uppercase;
  }
  .dock-entry-move {
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
    color: #aaa;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
  }
  .dock-entry-move:hover {
    background: rgba(255,255,255,0.13);
    color: #fff;
  }
  .dock-entry-move:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .dock-entry-lock {
    color: #888;
    font-size: 11px;
    padding: 3px 6px;
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
  }

  /* Section label */
  .section-label {
    font-size: 11px;
    color: #888;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .section-label:not(:first-child) {
    margin-top: 14px;
  }

  /* Settings command rows */
  .settings-list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
  }
  .settings-list + .section-label {
    margin-top: 16px;
  }
  .setting-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) minmax(170px, auto);
    align-items: center;
    gap: 14px;
    min-height: 58px;
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    box-sizing: border-box;
  }
  .setting-row:last-child {
    border-bottom: 0;
  }
  .setting-row-icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #9a9a9a;
  }
  .setting-row-icon svg {
    width: 18px;
    height: 18px;
  }
  .setting-row-copy {
    min-width: 0;
  }
  .setting-row-title {
    display: block;
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .setting-row-description {
    display: block;
    color: #7d7d7d;
    font-size: 12px;
    line-height: 1.35;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .setting-row-control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    min-width: 0;
  }
  .dock-entry-controls {
    gap: 6px;
    flex-wrap: nowrap;
  }
  .setting-row-control.stack {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .shortcut-controls {
    justify-content: flex-end;
    flex-wrap: wrap;
  }
  .shortcut-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 26px;
    padding: 0 4px 0 9px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    background: rgba(0,0,0,0.32);
    color: #ddd;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .shortcut-remove-btn {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #888;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    line-height: 1;
  }
  .shortcut-remove-btn:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
  .shortcut-recording-chip {
    animation: pulse 1.5s ease-in-out infinite;
    border-color: var(--grab-color, #4f46e5);
    box-shadow: 0 0 0 1px var(--grab-color, #4f46e5);
  }
  .shortcut-empty {
    color: #777;
    font-size: 12px;
  }
  .shortcut-error {
    width: 100%;
    color: #ff8a8a;
    font-size: 11px;
    text-align: right;
  }
  .hotkey-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  kbd {
    display: inline-flex;
    align-items: center;
    background: rgba(0,0,0,0.32);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #ddd;
    min-width: 80px;
    justify-content: center;
    flex: 1;
  }
  kbd.recording {
    border-color: var(--grab-color, #4f46e5);
    box-shadow: 0 0 0 1px var(--grab-color, #4f46e5);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .record-btn {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #ccc;
    padding: 5px 11px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }
  .record-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }

  /* Select dropdown */
  .editor-select {
    width: 100%;
    min-width: 180px;
    padding: 7px 30px 7px 10px;
    background-color: rgba(0,0,0,0.32);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #ddd;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;
  }
  .editor-select:focus {
    outline: none;
    border-color: var(--grab-color, #4f46e5);
  }
  .editor-select option {
    background: #1e1e1e;
    color: #ddd;
  }

  /* Open file button */
  .open-file-btn {
    padding: 7px 12px;
    background: var(--grab-color, #4f46e5);
    border: none;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .open-file-btn:hover {
    opacity: 0.85;
  }
  .open-file-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .file-path-display {
    font-size: 11px;
    color: #777;
    word-break: break-all;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    line-height: 1.35;
  }
  .slider-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .slider-row input[type="range"] {
    flex: 1;
    min-width: 140px;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(255,255,255,0.12);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }
  .slider-row input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--grab-color, #4f46e5);
    cursor: pointer;
  }
  .slider-value {
    font-size: 11px;
    color: #aaa;
    min-width: 42px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 520px) {
    .setting-row {
      grid-template-columns: 28px minmax(0, 1fr);
    }
    .setting-row-control {
      grid-column: 2;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .setting-row-description {
      white-space: normal;
    }
  }

  /* Vertical layout */
  .toolbar.vertical .toolbar-row {
    flex-direction: column;
    height: auto;
    width: 36px;
    padding: 4px 0;
  }
  .toolbar.vertical .toolbar-divider {
    width: 18px;
    height: 1px;
    margin: 2px 0;
  }
  /* When expanded vertically + vertical toolbar, override to horizontal row */
  .fab-wrapper.expanded:not(.edge):not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-row {
    flex-direction: row;
    width: auto;
    height: 36px;
    padding: 0 4px;
  }
  .fab-wrapper.expanded:not(.edge):not(.expand-left):not(.expand-right) .toolbar.vertical .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
  }

  /* Render Scan panel */
  .render-scan-panel {
    min-width: min(760px, 100%);
    min-height: 100%;
    box-sizing: border-box;
    color: #e8e8e8;
    background:
      linear-gradient(135deg, rgba(34,211,238,0.08), transparent 28%),
      linear-gradient(315deg, rgba(167,139,250,0.12), transparent 30%);
  }
  .render-scan-shell {
    min-height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.8fr);
  }
  .render-scan-main {
    min-width: 0;
    padding: 14px;
    border-right: 1px solid rgba(255,255,255,0.08);
  }
  .render-scan-list-pane {
    min-width: 0;
    padding: 14px;
    background: rgba(0,0,0,0.14);
  }
  .render-scan-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  .render-scan-title-wrap {
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 10px;
  }
  .render-scan-title-icon {
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: #22d3ee;
    background: rgba(34,211,238,0.12);
    box-shadow: inset 0 0 0 1px rgba(34,211,238,0.24);
  }
  .render-scan-title-icon svg {
    width: 18px;
    height: 18px;
  }
  .render-scan-title-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .render-scan-title {
    color: #f8fafc;
    font-size: 14px;
    font-weight: 700;
  }
  .render-scan-meta {
    color: #8a8a8a;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .render-scan-actions {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
  }
  .render-scan-toggle,
  .render-scan-clear,
  .render-scan-open {
    min-height: 28px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 7px;
    background: rgba(255,255,255,0.07);
    color: #d6d6d6;
    padding: 0 10px;
    font: inherit;
    font-size: 11px;
    cursor: pointer;
  }
  .render-scan-toggle {
    color: #67e8f9;
    border-color: rgba(34,211,238,0.26);
    background: rgba(34,211,238,0.10);
  }
  .render-scan-toggle:hover,
  .render-scan-clear:hover,
  .render-scan-open:hover {
    color: #fff;
    background: rgba(255,255,255,0.12);
  }
  .render-scan-clear:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .render-scan-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }
  .render-scan-stat {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 7px;
    color: #9ca3af;
    background: rgba(0,0,0,0.20);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.07);
    font-size: 11px;
  }
  .render-scan-stat-number {
    color: #f8fafc;
    font-size: 14px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .render-scan-detail {
    min-height: 250px;
    padding: 14px;
    border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.22);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .render-scan-detail-kicker {
    color: #8a8a8a;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }
  .render-scan-detail-title {
    color: #f8fafc;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.15;
    margin-bottom: 14px;
    word-break: break-word;
  }
  .render-scan-detail-grid {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr);
    gap: 8px 12px;
    margin-bottom: 14px;
    font-size: 12px;
  }
  .render-scan-detail-grid span {
    color: #777;
  }
  .render-scan-detail-grid strong {
    min-width: 0;
    color: #d8d8d8;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .render-scan-severity {
    text-transform: capitalize;
  }
  .render-scan-severity.warning {
    color: #fbbf24;
  }
  .render-scan-severity.danger {
    color: #f87171;
  }
  .render-scan-detail-note,
  .render-scan-empty-card,
  .render-scan-empty-list {
    color: #8a8a8a;
    font-size: 12px;
    line-height: 1.45;
  }
  .render-scan-empty-card {
    min-height: 210px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .render-scan-open {
    margin-top: 12px;
    color: #c4b5fd;
    border-color: rgba(167,139,250,0.28);
    background: rgba(167,139,250,0.12);
  }
  .render-scan-search-row {
    margin-bottom: 10px;
  }
  .render-scan-search {
    width: 100%;
    height: 32px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    background: rgba(255,255,255,0.07);
    color: #e8e8e8;
    padding: 0 10px;
    font: inherit;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
  }
  .render-scan-search:focus {
    border-color: rgba(34,211,238,0.42);
    box-shadow: 0 0 0 2px rgba(34,211,238,0.12);
  }
  .render-scan-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .render-scan-row {
    width: 100%;
    display: grid;
    grid-template-columns: 10px minmax(0, 1fr) auto;
    align-items: center;
    gap: 9px;
    min-height: 46px;
    padding: 7px 9px;
    border: 1px solid transparent;
    border-radius: 8px;
    color: inherit;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }
  .render-scan-row:hover {
    background: rgba(255,255,255,0.05);
  }
  .render-scan-row.selected {
    border-color: rgba(167,139,250,0.34);
    background: rgba(167,139,250,0.16);
  }
  .render-scan-row-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22d3ee;
    box-shadow: 0 0 10px rgba(34,211,238,0.5);
  }
  .render-scan-row-dot.warning {
    background: #f59e0b;
    box-shadow: 0 0 10px rgba(245,158,11,0.45);
  }
  .render-scan-row-dot.danger {
    background: #ef4444;
    box-shadow: 0 0 10px rgba(239,68,68,0.45);
  }
  .render-scan-row-copy {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .render-scan-row-name {
    min-width: 0;
    color: #f1f5f9;
    font-size: 12px;
    font-weight: 650;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .render-scan-row-file {
    min-width: 0;
    color: #777;
    font-size: 11px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .render-scan-row-count {
    color: #c084fc;
    font-size: 12px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .render-scan-empty-list {
    min-height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  @media (max-width: 680px) {
    .render-scan-shell {
      grid-template-columns: 1fr;
    }
    .render-scan-main {
      border-right: 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
  }
  @media (max-width: 520px) {
    .render-scan-header {
      align-items: flex-start;
      flex-direction: column;
    }
    .render-scan-actions {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .render-scan-detail-grid {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }

  /* Dock toolbar layout */
  .fab-wrapper.edge.edge-left .toolbar .toolbar-row,
  .fab-wrapper.edge.edge-right .toolbar .toolbar-row {
    flex-direction: column;
    height: auto;
    width: 36px;
    padding: 4px 0;
  }
  .fab-wrapper.edge.edge-left .toolbar .toolbar-divider,
  .fab-wrapper.edge.edge-right .toolbar .toolbar-divider {
    width: 18px;
    height: 1px;
    margin: 2px 0;
  }
  .fab-wrapper.edge.edge-top .toolbar .toolbar-row,
  .fab-wrapper.edge.edge-bottom .toolbar .toolbar-row {
    flex-direction: row;
    width: auto;
    height: 36px;
    padding: 0 4px;
  }
  .fab-wrapper.edge.edge-top .toolbar .toolbar-divider,
  .fab-wrapper.edge.edge-bottom .toolbar .toolbar-divider {
    width: 1px;
    height: 18px;
    margin: 0 2px;
  }

  /* ── Console (logs) panel ── */
  .logs-panel {
    padding: 14px;
    min-width: min(420px, 100%);
    box-sizing: border-box;
  }
  .logs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .logs-title {
    font-size: 13px;
    font-weight: 600;
    color: #e0e0e0;
  }
  .logs-clear-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }
  .logs-clear-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }
  .logs-panel .logs-header {
    margin-bottom: 14px;
    gap: 14px;
  }
  .logs-panel-heading {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .logs-panel .logs-title {
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.25;
  }
  .logs-panel-meta {
    color: #7d7d7d;
    font-size: 12px;
    line-height: 1.3;
  }
  .logs-panel .logs-clear-btn {
    flex: 0 0 auto;
    padding: 5px 11px;
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.07);
    color: #ccc;
  }
  .logs-panel .logs-clear-btn:hover {
    background: rgba(255,255,255,0.13);
    color: #fff;
  }
  .logs-section-label {
    margin-bottom: 8px;
  }
  .logs-filter-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }
  .logs-panel .logs-filter-bar {
    gap: 6px;
    margin-bottom: 12px;
  }
  .logs-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 999px;
    cursor: pointer;
    user-select: none;
    border: 1px solid transparent;
    background: rgba(255,255,255,0.04);
    color: #888;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .logs-pill[data-level="log"]   { --c: var(--lvl-log); }
  .logs-pill[data-level="info"]  { --c: var(--lvl-info); }
  .logs-pill[data-level="warn"]  { --c: var(--lvl-warn); }
  .logs-pill[data-level="error"] { --c: var(--lvl-error); }
  .logs-pill[data-level="debug"] { --c: var(--lvl-debug); }
  .logs-pill.active {
    background: color-mix(in srgb, var(--c) 15%, transparent);
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 40%, transparent);
  }
  .logs-pill .count {
    opacity: 0.8;
    font-weight: 500;
  }
  .logs-panel .logs-pill {
    min-height: 26px;
    padding: 0 8px;
    border-radius: 6px;
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.08);
    color: #999;
    letter-spacing: 0.02em;
  }
  .logs-panel .logs-pill:hover {
    background: rgba(255,255,255,0.1);
    color: #ddd;
  }
  .logs-panel .logs-pill.active {
    background: color-mix(in srgb, var(--c) 14%, rgba(0,0,0,0.28));
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 32%, rgba(255,255,255,0.08));
  }
  .logs-panel .logs-pill .count {
    color: #d0d0d0;
    font-variant-numeric: tabular-nums;
  }
  .logs-search-row {
    margin-bottom: 14px;
  }
  .logs-search {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 8px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 6px;
    color: #e0e0e0;
    padding: 5px 8px;
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }
  .logs-search:focus {
    border-color: rgba(99,102,241,0.5);
  }
  .logs-panel .logs-search {
    margin-bottom: 0;
    padding: 7px 10px;
    border-color: rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.28);
    border-radius: 6px;
  }
  .logs-panel .logs-search:focus {
    border-color: var(--grab-color, #4f46e5);
  }
  .logs-list {
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
  }
  .log-row {
    padding: 8px 10px;
    border-radius: 6px;
    margin-bottom: 4px;
    border-left: 3px solid var(--c, #666);
    background: color-mix(in srgb, var(--c, #666) 5%, transparent);
    transition: background 0.1s ease;
  }
  .log-row:hover {
    background: color-mix(in srgb, var(--c, #666) 10%, transparent);
  }
  .log-row[data-level="log"]   { --c: var(--lvl-log); }
  .log-row[data-level="info"]  { --c: var(--lvl-info); }
  .log-row[data-level="warn"]  { --c: var(--lvl-warn); }
  .log-row[data-level="error"] { --c: var(--lvl-error); }
  .log-row[data-level="debug"] { --c: var(--lvl-debug); }
  .logs-panel .log-row {
    position: relative;
    padding: 0;
    margin-bottom: 0;
    border-left: 0;
    border-radius: 0;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: transparent;
  }
  .logs-panel .log-row:last-child {
    border-bottom: 0;
  }
  .logs-panel .log-row::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--c, #666);
    opacity: 0.9;
  }
  .logs-panel .log-row:hover {
    background: color-mix(in srgb, var(--c, #666) 7%, transparent);
  }
  .log-row-header {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .logs-panel .log-row-header {
    width: 100%;
    min-height: 44px;
    padding: 9px 12px 9px 14px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
  }
  .logs-panel .log-row-header:focus-visible {
    outline: 2px solid var(--grab-color, #4f46e5);
    outline-offset: -2px;
  }
  .log-row-level {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 18%, transparent);
    color: var(--c);
    border-radius: 4px;
    padding: 1px 5px;
    font-weight: 600;
    flex-shrink: 0;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .logs-panel .log-row-level {
    min-width: 40px;
    padding: 2px 6px;
    border-radius: 5px;
    text-align: center;
    box-sizing: border-box;
  }
  .log-row-source {
    font-size: 9px;
    color: #888;
    padding: 1px 4px;
    border-radius: 3px;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
    text-transform: lowercase;
  }
  .logs-panel .log-row-source {
    min-width: 44px;
    padding: 2px 6px;
    border-radius: 5px;
    color: #aaa;
    background: rgba(255,255,255,0.06);
    text-align: center;
  }
  .log-row-msg {
    font-size: 12px;
    color: #e0e0e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .logs-panel .log-row-msg {
    color: #e6e6e6;
    line-height: 1.35;
  }
  .log-row-count {
    font-size: 10px;
    background: color-mix(in srgb, var(--c) 20%, transparent);
    color: var(--c);
    border-radius: 8px;
    padding: 0 5px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .logs-panel .log-row-count {
    border-radius: 999px;
    padding: 1px 6px;
    font-variant-numeric: tabular-nums;
  }
  .log-row-time {
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .logs-panel .log-row-time {
    min-width: 74px;
    color: #777;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .log-row-chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
    color: #666;
    flex-shrink: 0;
  }
  .logs-panel .log-row-chevron {
    width: 12px;
    color: #777;
  }
  .log-row-chevron.open {
    transform: rotate(90deg);
  }
  .log-row-details {
    display: none;
    margin-top: 8px;
  }
  .log-row-details.open {
    display: block;
  }
  .logs-panel .log-row-details {
    margin: 0;
    padding: 0 12px 10px 29px;
  }
  .logs-panel .log-row-details.open {
    display: block;
  }
  .log-row-detail-surface {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.24);
  }
  .log-row-stack {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #999;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
    padding: 6px 8px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
    margin-bottom: 6px;
  }
  .logs-panel .log-row-stack {
    max-height: 170px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(0,0,0,0.28);
  }
  .log-row-vue-info {
    font-size: 11px;
    color: #c792ea;
    margin-bottom: 6px;
  }
  .logs-panel .log-row-vue-info {
    color: #d8b4fe;
    line-height: 1.35;
  }
  .log-row-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .log-action-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    color: #ccc;
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .log-action-btn:hover {
    background: rgba(255,255,255,0.14);
    color: #fff;
  }
  .log-action-btn.primary {
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.3);
    color: #a5b4fc;
  }
  .log-action-btn.primary:hover {
    background: rgba(99, 102, 241, 0.25);
    color: #c7d2fe;
  }
  .logs-panel .log-action-btn {
    padding: 5px 10px;
  }
  .logs-panel .log-row-actions {
    flex-wrap: wrap;
  }
  .logs-empty {
    color: #555;
    text-align: center;
    padding: 20px;
    font-size: 12px;
  }
  .logs-panel .logs-empty {
    color: #777;
    padding: 24px 14px;
    background: rgba(12,12,12,0.36);
  }
  .logs-panel .logs-empty-compact {
    margin-top: 2px;
    padding: 9px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #888;
    font-size: 12px;
    line-height: 1.35;
  }

  .logs-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: min(560px, 100%);
    overflow: hidden;
    box-sizing: border-box;
  }
  .logs-panel .settings-list {
    background: rgba(12,12,12,0.36);
  }
  .logs-panel .section-label:not(:first-child) {
    margin-top: 16px;
  }
  .logs-section-label,
  .logs-overview-list,
  .logs-level-list {
    flex: 0 0 auto;
  }
  .logs-overview-list,
  .logs-level-list,
  .logs-list {
    margin-bottom: 0;
  }
  .logs-overview-row,
  .logs-level-row {
    min-height: 58px;
  }
  .logs-overview-icon,
  .logs-level-icon {
    color: #9a9a9a;
  }
  .logs-overview-icon svg,
  .logs-level-icon svg {
    width: 18px;
    height: 18px;
  }
  .logs-overview-control,
  .logs-level-controls {
    flex-wrap: wrap;
  }
  .logs-panel .logs-level-controls {
    flex-wrap: nowrap;
    height: 24px;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .logs-panel .logs-level-controls,
  .network-panel .network-status-controls {
    scrollbar-width: none;
  }
  .logs-panel .logs-level-controls::-webkit-scrollbar,
  .network-panel .network-status-controls::-webkit-scrollbar {
    display: none;
  }
  .logs-stat-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: rgba(255,255,255,0.06);
    color: #888;
    font-size: 11px;
    white-space: nowrap;
  }
  .logs-stat-number {
    color: #e8e8e8;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .logs-panel .logs-filter-bar {
    margin: 0;
    gap: 5px;
  }
  .logs-panel .logs-pill {
    flex: 0 0 auto;
    position: relative;
    height: 24px;
    box-sizing: border-box;
    padding: 0 8px 0 18px;
    border-radius: 6px;
    background: rgba(0,0,0,0.16);
    border-color: rgba(255,255,255,0.08);
    color: #929292;
    box-shadow: none;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  }
  .logs-panel .logs-pill::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 50%;
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.45;
    transform: translateY(-50%);
  }
  .logs-panel .logs-pill:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
    color: #cfcfcf;
  }
  .logs-panel .logs-pill.active {
    background: rgba(0,0,0,0.28);
    color: #e5e5e5;
    border-color: rgba(255,255,255,0.16);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.035);
  }
  .logs-panel .logs-pill.active::before {
    background: var(--c);
    opacity: 0.95;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 16%, transparent);
  }
  .logs-panel .logs-pill .count {
    color: #9c9c9c;
    font-weight: 650;
  }
  .logs-panel .logs-pill.active .count {
    color: #c7c7c7;
  }
  .logs-entries-section {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .logs-panel .logs-search-row {
    flex: 0 0 auto;
    margin-bottom: 8px;
  }
  .logs-panel .logs-search {
    min-height: 34px;
    padding: 7px 10px;
    border-radius: 8px;
    border-color: rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
  }
  .logs-panel .logs-list {
    flex: 0 0 auto;
    border-radius: 8px;
  }
  .logs-panel .logs-list:not(.logs-empty-list) {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }
  .logs-panel .logs-list::-webkit-scrollbar,
  .network-panel .network-list::-webkit-scrollbar {
    width: 6px;
  }
  .logs-panel .logs-list::-webkit-scrollbar-track,
  .network-panel .network-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .logs-panel .logs-list::-webkit-scrollbar-thumb,
  .network-panel .network-list::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.15);
    border-radius: 3px;
  }
  .logs-panel .log-row {
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: transparent;
  }
  .logs-panel .log-row:last-child {
    border-bottom: 0;
  }
  .logs-panel .log-row::before {
    display: none;
  }
  .logs-panel .log-row:hover {
    background: color-mix(in srgb, var(--c, #666) 5%, transparent);
  }
  .logs-panel .log-row-header.setting-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) minmax(150px, auto);
    gap: 14px;
    min-height: 54px;
    padding: 10px 14px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
  }
  .logs-panel .log-row-icon {
    color: var(--c, #888);
  }
  .log-row-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--c, #888);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--c, #888) 12%, transparent);
  }
  .logs-panel .log-row-copy {
    min-width: 0;
  }
  .logs-panel .log-row-msg {
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .logs-panel .log-row-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin-top: 3px;
  }
  .logs-panel .log-row-level,
  .logs-panel .log-row-source,
  .logs-panel .log-row-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 20px;
    padding: 0 7px;
    border-radius: 999px;
    font-size: 10px;
    line-height: 1;
    font-weight: 650;
    flex: 0 0 auto;
  }
  .logs-panel .log-row-level {
    min-width: 0;
    color: var(--c, #aaa);
    background: color-mix(in srgb, var(--c, #aaa) 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c, #aaa) 24%, transparent);
  }
  .logs-panel .log-row-source {
    min-width: 0;
    color: #aaa;
    background: rgba(255,255,255,0.06);
    text-transform: lowercase;
  }
  .logs-panel .log-row-control {
    gap: 8px;
    flex-wrap: nowrap;
  }
  .logs-panel .log-row-count {
    color: var(--c, #aaa);
    background: color-mix(in srgb, var(--c, #aaa) 12%, transparent);
    font-variant-numeric: tabular-nums;
  }
  .logs-panel .log-row-time {
    min-width: 74px;
    color: #777;
    font-size: 11px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .logs-panel .log-row-chevron {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    color: #777;
  }
  .logs-panel .log-row-header:hover .log-row-chevron {
    background: rgba(255,255,255,0.07);
    color: #ddd;
  }
  .logs-panel .log-row-details {
    margin: 0;
    padding: 0 14px 12px 56px;
    border-top: 0;
  }
  .logs-panel .log-row-detail-surface {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(0,0,0,0.22);
  }
  .logs-panel .log-row-actions {
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .logs-panel .log-action-btn {
    min-height: 26px;
    padding: 0 10px;
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.12);
    font-size: 11px;
  }
  .logs-panel .log-action-btn.primary {
    background: var(--grab-control-active-bg);
    border-color: rgba(99,102,241,0.26);
    color: #a5b4fc;
  }
  .logs-panel .logs-empty-list {
    flex: 1 1 auto;
    min-height: 180px;
    justify-content: center;
  }
  .logs-panel .logs-empty,
  .logs-panel .logs-empty-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 18px 14px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #777;
    text-align: center;
    font-size: 12px;
  }
  @media (max-width: 520px) {
    .logs-panel .logs-level-row,
    .logs-panel .logs-overview-row,
    .logs-panel .log-row-header.setting-row {
      grid-template-columns: 28px minmax(0, 1fr);
    }
    .logs-panel .logs-overview-control,
    .logs-panel .log-row-control {
      grid-column: 2;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .logs-panel .logs-level-controls {
      grid-column: 2;
      justify-content: flex-start;
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
    }
    .logs-panel .log-row-details {
      padding-left: 42px;
    }
    .logs-panel .log-row-time {
      min-width: 0;
    }
  }

  /* ── Network panel ── */
  .network-btn {
    position: relative;
  }
  .network-btn.active {
    color: #60a5fa;
    box-shadow: inset 0 0 0 1.5px #60a5fa;
    background: rgba(96,165,250,0.12);
  }
  .network-badge {
    position: absolute;
    top: 1px;
    right: 1px;
    min-width: 14px;
    height: 14px;
    border-radius: 7px;
    background: var(--lvl-warn);
    color: #fff;
    font-size: 9px;
    font-weight: 700;
    line-height: 14px;
    text-align: center;
    padding: 0 3px;
    pointer-events: none;
  }
  .network-badge.has-error {
    background: var(--lvl-error);
  }
  .network-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: min(560px, 100%);
    overflow: hidden;
    padding: 14px;
    box-sizing: border-box;
  }
  .network-panel .settings-list {
    background: rgba(12,12,12,0.36);
  }
  .network-panel .section-label:not(:first-child) {
    margin-top: 16px;
  }
  .network-section-label,
  .network-overview-list,
  .network-status-list {
    flex: 0 0 auto;
  }
  .network-overview-list,
  .network-status-list,
  .network-list {
    margin-bottom: 0;
  }
  .network-overview-row,
  .network-status-row {
    min-height: 58px;
  }
  .network-overview-icon,
  .network-status-icon {
    color: #9a9a9a;
  }
  .network-overview-icon svg,
  .network-status-icon svg {
    width: 18px;
    height: 18px;
  }
  .network-overview-control,
  .network-status-controls {
    flex-wrap: wrap;
  }
  .network-panel .network-status-controls {
    flex-wrap: nowrap;
    height: 24px;
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .network-panel .logs-filter-bar {
    margin: 0;
    gap: 5px;
  }
  .network-panel .logs-clear-btn {
    flex: 0 0 auto;
    padding: 5px 11px;
    border-color: rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.07);
    color: #ccc;
  }
  .network-panel .logs-clear-btn:hover {
    background: rgba(255,255,255,0.13);
    color: #fff;
  }
  .network-panel-meta {
    color: #7d7d7d;
    font-size: 12px;
    line-height: 1.3;
  }
  .net-pill {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    height: 24px;
    box-sizing: border-box;
    padding: 0 8px 0 18px;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(0,0,0,0.16);
    color: #929292;
    font-family: inherit;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    position: relative;
    box-shadow: none;
    transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  }
  .net-pill::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 50%;
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.45;
    transform: translateY(-50%);
  }
  .net-pill[data-status="2xx"]    { --c: var(--lvl-log); }
  .net-pill[data-status="3xx"]    { --c: var(--lvl-info); }
  .net-pill[data-status="4xx"]    { --c: var(--lvl-warn); }
  .net-pill[data-status="5xx"]    { --c: var(--lvl-error); }
  .net-pill[data-status="failed"] { --c: var(--lvl-error); }
  .net-pill:hover {
    background: rgba(255,255,255,0.06);
    border-color: rgba(255,255,255,0.12);
    color: #cfcfcf;
  }
  .net-pill.active {
    background: rgba(0,0,0,0.28);
    color: #e5e5e5;
    border-color: rgba(255,255,255,0.16);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.035);
  }
  .net-pill.active::before {
    background: var(--c);
    opacity: 0.95;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 16%, transparent);
  }
  .net-pill .count {
    color: #9c9c9c;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  .net-pill.active .count {
    color: #c7c7c7;
  }
  .network-requests-section {
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
    flex-direction: column;
    overflow: hidden;
  }
  .net-search-row {
    flex: 0 0 auto;
    margin-bottom: 8px;
  }
  .network-panel .net-search {
    width: 100%;
    min-height: 34px;
    padding: 7px 10px;
    border-radius: 8px;
    border-color: rgba(255,255,255,0.08);
    background: rgba(12,12,12,0.36);
    box-sizing: border-box;
  }
  .net-row {
    border-bottom: 1px solid rgba(255,255,255,0.07);
    background: transparent;
  }
  .network-panel .network-list:not(.network-empty-list) {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }
  .net-row:last-child {
    border-bottom: 0;
  }
  .net-row:hover {
    background: color-mix(in srgb, var(--c, #666) 5%, transparent);
  }
  .net-row[data-status="2xx"]    { --c: var(--lvl-log); }
  .net-row[data-status="3xx"]    { --c: var(--lvl-info); }
  .net-row[data-status="4xx"]    { --c: var(--lvl-warn); }
  .net-row[data-status="5xx"]    { --c: var(--lvl-error); }
  .net-row[data-status="failed"] { --c: var(--lvl-error); }
  .net-row-header.setting-row {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) minmax(170px, auto);
    gap: 14px;
    min-height: 54px;
    width: 100%;
    padding: 10px 14px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;
    text-align: left;
    box-sizing: border-box;
  }
  .net-row-icon {
    color: var(--c, #888);
  }
  .net-row-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--c, #888);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--c, #888) 12%, transparent);
  }
  .net-row-copy {
    min-width: 0;
  }
  .net-row-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin-top: 3px;
  }
  .net-row-method,
  .net-row-status,
  .net-row-duration,
  .net-row-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 20px;
    padding: 0 7px;
    border-radius: 999px;
    font-size: 10px;
    line-height: 1;
    font-weight: 650;
    flex: 0 0 auto;
  }
  .net-row-method {
    background: rgba(255,255,255,0.1);
    color: #ddd;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .net-row-status {
    min-width: 0;
    background: color-mix(in srgb, var(--c) 12%, transparent);
    color: var(--c);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 24%, transparent);
    font-variant-numeric: tabular-nums;
  }
  .net-row-url {
    color: #e8e8e8;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .net-row-duration {
    color: #888;
    background: rgba(255,255,255,0.06);
    font-variant-numeric: tabular-nums;
  }
  .net-row-count {
    background: color-mix(in srgb, var(--c) 20%, transparent);
    color: var(--c);
    font-variant-numeric: tabular-nums;
  }
  .net-row-control {
    gap: 8px;
    flex-wrap: nowrap;
  }
  .net-row-time {
    min-width: 74px;
    color: #777;
    font-size: 11px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .net-row-chevron {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    color: #777;
  }
  .net-row-header:hover .net-row-chevron {
    background: rgba(255,255,255,0.07);
    color: #ddd;
  }
  .net-row-chevron.open {
    transform: rotate(90deg);
  }
  .net-row-details {
    display: none;
    margin: 0;
    padding: 0 14px 12px 56px;
    border-top: 0;
  }
  .net-row-details.open {
    display: block;
  }
  .net-row-detail-surface {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(0,0,0,0.22);
  }
  .net-section-title {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 8px 0 4px;
  }
  .net-kv {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #bbb;
    padding: 1px 0;
    word-break: break-all;
  }
  .net-kv .k { color: #7dd3fc; }
  .net-body {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    color: #ddd;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 200px;
    overflow-y: auto;
    padding: 6px 8px;
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
  }
  .net-row-error {
    font-size: 11px;
    color: var(--lvl-error);
    margin-bottom: 6px;
  }
  .network-panel .log-row-actions {
    margin-top: 8px;
    flex-wrap: wrap;
  }
  .network-panel .log-action-btn {
    min-height: 26px;
    padding: 0 10px;
    border-radius: 6px;
    background: rgba(255,255,255,0.07);
    border-color: rgba(255,255,255,0.12);
    font-size: 11px;
  }
  .network-panel .log-action-btn.primary {
    background: var(--grab-control-active-bg);
    border-color: rgba(99,102,241,0.26);
    color: #a5b4fc;
  }
  .network-empty-list {
    flex: 1 1 auto;
    min-height: 180px;
    justify-content: center;
  }
  .net-empty,
  .net-empty-compact {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 18px 14px;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: #777;
    text-align: center;
    font-size: 12px;
  }
  @media (max-width: 520px) {
    .network-panel .network-status-row,
    .network-panel .network-overview-row,
    .network-panel .net-row-header.setting-row {
      grid-template-columns: 28px minmax(0, 1fr);
    }
    .network-panel .network-overview-control,
    .network-panel .net-row-control {
      grid-column: 2;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .network-panel .network-status-controls {
      grid-column: 2;
      justify-content: flex-start;
      flex-wrap: nowrap;
      overflow-x: auto;
      overflow-y: hidden;
    }
    .network-panel .net-row-details {
      padding-left: 42px;
    }
    .network-panel .net-row-time {
      min-width: 0;
    }
  }
`;
