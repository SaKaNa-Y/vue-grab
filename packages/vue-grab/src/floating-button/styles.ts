export const STYLES = `
  :host {
    all: initial;
    font-family: var(--vg-font-sans);
    /* Accent active-state fills (single accent; --vg-* tokens live in base.css). */
    --grab-toolbar-active-bg: var(--vg-accent-bg);
    --grab-control-active-bg: var(--vg-accent-bg);
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
    border: 1px solid var(--vg-border);
    background: var(--vg-surface);
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
    color: var(--vg-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .toolbar-btn:hover {
    color: var(--vg-text);
    background: var(--vg-hover);
  }
  /* Single accent for EVERY feature's active state — no per-feature branding. */
  .grab-btn.active,
  .context-btn.active,
  .gear-btn.active,
  .a11y-btn.active,
  .render-scan-btn.active,
  .render-scan-btn.panel-open,
  .logs-btn.active,
  .magnifier-btn.active,
  .measurer-btn.active,
  .network-btn.active {
    color: var(--vg-accent);
    box-shadow: inset 0 0 0 1.5px var(--vg-accent);
    background: var(--vg-accent-bg);
  }
  .toolbar-divider {
    width: 1px;
    height: 18px;
    background: var(--vg-hover-strong);
    margin: 0 2px;
  }
  .logs-btn {
    position: relative;
  }
  .render-scan-btn.disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .magnifier-btn.disabled {
    opacity: 0.35;
    cursor: not-allowed;
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
    color: var(--vg-text);
  }
  .a11y-rescan-btn {
    background: var(--vg-hover);
    border: 1px solid var(--vg-hover-strong);
    border-radius: 6px;
    color: var(--vg-text);
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }
  .a11y-rescan-btn:hover {
    background: var(--vg-hover-strong);
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
    border: 1px solid var(--vg-hover);
    background: var(--vg-surface-sunken);
    color: var(--vg-faint);
    font-size: 12px;
    line-height: 1.35;
  }
  .a11y-summary-count {
    color: var(--vg-text);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .a11y-summary-count.pass { color: var(--vg-success); }
  .a11y-summary-count.fail { color: var(--vg-warning); }
  .a11y-summary-count.neutral { color: var(--vg-muted); }
  .a11y-summary-separator {
    color: var(--vg-faint);
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
    background: var(--vg-hover);
    color: var(--vg-muted);
    font-variant-numeric: tabular-nums;
  }
  .a11y-row {
    transition: background 0.12s ease;
    cursor: default;
  }
  .a11y-row:hover {
    background: var(--vg-hover);
  }
  .a11y-row-icon.pass { color: var(--vg-success); }
  .a11y-row-icon.fail { color: var(--vg-warning); }
  .a11y-row-icon.neutral { color: var(--vg-faint); }
  .a11y-row-name {
    font-family: var(--vg-font-mono);
    color: var(--vg-accent);
  }
  .a11y-row-file {
    word-break: break-all;
  }
  .a11y-row-detail {
    display: block;
    font-family: var(--vg-font-mono);
    color: var(--vg-muted);
  }
  .a11y-row-detail.warning { color: var(--vg-warning); }
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
    color: var(--vg-faint);
    font-size: 10px;
    transition: transform 0.15s ease;
  }
  .a11y-row-chevron.open {
    transform: rotate(90deg);
  }
  .a11y-row-count {
    background: color-mix(in srgb, var(--vg-warning) 16%, transparent);
    color: var(--vg-warning);
  }
  .a11y-status-chip.pass {
    background: color-mix(in srgb, var(--vg-success) 14%, transparent);
    color: var(--vg-success);
  }
  .a11y-status-chip.fail {
    background: color-mix(in srgb, var(--vg-warning) 16%, transparent);
    color: var(--vg-warning);
  }
  .a11y-status-chip.neutral {
    background: var(--vg-border-subtle);
    color: var(--vg-muted);
  }
  .a11y-child-details {
    display: none;
    padding: 0 12px 12px 56px;
    border-bottom: 1px solid var(--vg-border-subtle);
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
    box-shadow: inset 0 0 0 1px var(--vg-border-subtle);
  }
  .a11y-child-row {
    font-size: 11px;
    padding: 5px 7px;
    border-radius: 5px;
    background: var(--vg-hover);
  }
  .a11y-child-tag {
    color: var(--vg-muted);
    font-family: var(--vg-font-mono);
    font-size: 11px;
  }
  .a11y-child-msg {
    font-size: 11px;
    line-height: 1.35;
    margin-top: 2px;
  }
  .a11y-child-msg.warning { color: var(--vg-warning); }
  .a11y-child-msg.pass { color: var(--vg-success); }
  .a11y-child-msg.neutral { color: var(--vg-faint); font-style: italic; }
  .a11y-empty {
    color: var(--vg-faint);
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
    color: var(--vg-text);
    font-family: var(--vg-font-sans);
    font-size: 13px;
    cursor: default;
    touch-action: pan-y;
    user-select: text;
    border-radius: 12px;
    border: 1px solid var(--vg-border);
    background: var(--vg-surface);
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
    background: var(--vg-hover-strong);
    border-radius: 3px;
  }

  /* ── Tabs (inside settings content) ── */
  .tab-bar {
    display: flex;
    padding: 0 14px;
    border-bottom: 1px solid var(--vg-hover);
    gap: 0;
    flex-shrink: 0;
    overflow-x: auto;
  }
  .tab-btn {
    background: none;
    border: none;
    color: var(--vg-faint);
    font-size: 12px;
    font-family: inherit;
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color 0.15s ease, border-color 0.15s ease;
    white-space: nowrap;
  }
  .tab-btn:hover {
    color: var(--vg-text);
  }
  .tab-btn.active {
    color: var(--vg-accent);
    border-bottom-color: var(--vg-accent);
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
    color: var(--vg-faint);
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
    border: 1px solid var(--vg-border);
    background: var(--vg-border-subtle);
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
    color: var(--vg-muted);
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
  }
  .dock-mode-option:hover {
    color: var(--vg-text);
    background: var(--vg-border-subtle);
  }
  .dock-mode-option.active {
    color: var(--vg-accent);
    background: rgba(0,0,0,0.32);
    box-shadow: inset 0 0 0 1px var(--vg-hover);
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
    color: var(--vg-text);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.35;
  }
  .setting-toggle-description {
    color: var(--vg-faint);
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
    background: var(--vg-hover-strong);
    box-shadow: inset 0 0 0 1px var(--vg-border);
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
    background: var(--vg-accent);
    box-shadow: inset 0 0 0 1px var(--vg-border);
  }
  .setting-toggle-input:checked + .setting-toggle-switch::after {
    transform: translateX(16px);
  }
  .setting-toggle-input:focus-visible + .setting-toggle-switch {
    box-shadow: 0 0 0 2px var(--vg-accent);
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
    color: var(--vg-faint);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .dock-entry-group-count {
    color: var(--vg-faint);
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
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    color: var(--vg-accent);
    background: var(--grab-control-active-bg);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
  }
  .dock-entry-group-toggle:hover {
    color: #fff;
    background: var(--vg-border);
  }
  .dock-entry-group-toggle.is-partial {
    color: var(--vg-muted);
    background: var(--vg-border);
  }
  .dock-entry-group-toggle:disabled {
    color: var(--vg-faint);
    background: var(--vg-border-subtle);
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
    background: var(--vg-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--vg-accent) 45%, transparent);
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
    color: var(--vg-faint);
    font-size: 18px;
    line-height: 1;
    cursor: grab;
    user-select: none;
  }
  .dock-entry-drag:hover {
    color: var(--vg-muted);
    background: var(--vg-hover);
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
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    color: var(--vg-accent);
    background: var(--grab-control-active-bg);
    cursor: pointer;
    font-family: inherit;
    font-size: 15px;
    line-height: 1;
  }
  .dock-entry-check:hover {
    color: #fff;
    background: var(--vg-border);
  }
  .dock-entry-check.is-hidden {
    color: var(--vg-faint);
    background: var(--vg-border-subtle);
  }
  .dock-entry-check:disabled {
    color: var(--vg-faint);
    background: var(--vg-border-subtle);
    cursor: not-allowed;
  }
  .dock-entry-icon {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--vg-muted);
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
    background: color-mix(in srgb, var(--vg-warning) 16%, transparent);
    color: var(--vg-warning);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--vg-warning) 28%, transparent);
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
    background: var(--vg-border-subtle);
    color: var(--vg-muted);
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    line-height: 1;
  }
  .dock-entry-move:hover {
    background: var(--vg-border);
    color: #fff;
  }
  .dock-entry-move:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .dock-entry-lock {
    color: var(--vg-faint);
    font-size: 11px;
    padding: 3px 6px;
    border-radius: 6px;
    background: var(--vg-border-subtle);
  }

  /* Section label */
  .section-label {
    font-size: 11px;
    color: var(--vg-faint);
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
    border: 1px solid var(--vg-hover);
    background: var(--vg-surface-sunken);
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
    border-bottom: 1px solid var(--vg-border-subtle);
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
    color: var(--vg-muted);
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
    color: var(--vg-text);
    font-size: 13px;
    font-weight: 650;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .setting-row-description {
    display: block;
    color: var(--vg-faint);
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
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    background: rgba(0,0,0,0.32);
    color: var(--vg-text);
    font-family: var(--vg-font-mono);
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
    color: var(--vg-faint);
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    line-height: 1;
  }
  .shortcut-remove-btn:hover {
    background: var(--vg-border);
    color: #fff;
  }
  .shortcut-recording-chip {
    animation: pulse 1.5s ease-in-out infinite;
    border-color: var(--vg-accent);
    box-shadow: 0 0 0 1px var(--vg-accent);
  }
  .shortcut-empty {
    color: var(--vg-faint);
    font-size: 12px;
  }
  .shortcut-error {
    width: 100%;
    color: var(--vg-error);
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
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    padding: 4px 10px;
    font-family: var(--vg-font-mono);
    font-size: 12px;
    color: var(--vg-text);
    min-width: 80px;
    justify-content: center;
    flex: 1;
  }
  kbd.recording {
    border-color: var(--vg-accent);
    box-shadow: 0 0 0 1px var(--vg-accent);
    animation: pulse 1.5s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  .record-btn {
    background: var(--vg-border-subtle);
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    color: var(--vg-text);
    padding: 5px 11px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
  }
  .record-btn:hover {
    background: var(--vg-hover-strong);
    color: #fff;
  }

  /* Select dropdown */
  .editor-select {
    width: 100%;
    min-width: 180px;
    padding: 7px 30px 7px 10px;
    background-color: rgba(0,0,0,0.32);
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    color: var(--vg-text);
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
    border-color: var(--vg-accent);
  }
  .editor-select option {
    background: var(--vg-bg);
    color: var(--vg-text);
  }

  /* Open file button */
  .open-file-btn {
    padding: 7px 12px;
    background: var(--vg-accent);
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
    color: var(--vg-faint);
    word-break: break-all;
    font-family: var(--vg-font-mono);
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
    background: var(--vg-border);
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
    background: var(--vg-accent);
    cursor: pointer;
  }
  .slider-value {
    font-size: 11px;
    color: var(--vg-muted);
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
    min-width: min(820px, 100%);
    min-height: 100%;
    box-sizing: border-box;
    color: var(--vg-text);
    background: transparent;
  }
  .render-scan-shell {
    min-height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.62fr);
  }
  .render-scan-main {
    min-width: 0;
    padding: 14px;
    border-right: 1px solid var(--vg-hover);
  }
  .render-scan-list-pane {
    min-width: 0;
    padding: 14px;
    background: rgba(0,0,0,0.10);
  }
  .render-scan-panel .settings-list {
    background: var(--vg-surface-sunken);
  }
  .render-scan-section-label:not(:first-child) {
    margin-top: 16px;
  }
  .render-scan-overview-list,
  .render-scan-summary-list,
  .render-scan-detail,
  .render-scan-list {
    margin-bottom: 0;
  }
  .render-scan-overview-row {
    grid-template-columns: 28px minmax(0, 1fr) minmax(150px, auto);
  }
  .render-scan-title-icon {
    color: var(--vg-accent);
  }
  .render-scan-title-icon,
  .render-scan-summary-icon,
  .render-scan-selected-icon,
  .render-scan-metrics-icon,
  .render-scan-row-icon,
  .render-scan-empty-icon,
  .render-scan-note-icon {
    align-self: center;
    justify-self: center;
    flex: 0 0 28px;
    box-sizing: border-box;
    line-height: 1;
  }
  .render-scan-title-icon svg {
    width: 18px;
    height: 18px;
  }
  .render-scan-title {
    color: var(--vg-text);
  }
  .render-scan-meta {
    color: var(--vg-faint);
  }
  .render-scan-actions {
    flex-wrap: nowrap;
    gap: 6px;
  }
  .render-scan-toggle,
  .render-scan-clear,
  .render-scan-open {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 26px;
    min-height: 26px;
    border: 1px solid var(--vg-border);
    border-radius: 6px;
    background: var(--vg-border-subtle);
    color: var(--vg-text);
    padding: 0 10px;
    font: inherit;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    white-space: nowrap;
    box-sizing: border-box;
  }
  .render-scan-toggle {
    color: var(--vg-accent);
    border-color: var(--vg-accent-border);
    background: var(--vg-accent-bg);
  }
  .render-scan-toggle:hover,
  .render-scan-clear:hover,
  .render-scan-open:hover {
    color: #fff;
    background: var(--vg-border);
  }
  .render-scan-clear:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .render-scan-summary-row {
    grid-template-columns: 28px minmax(0, 1fr) minmax(210px, auto);
  }
  .render-scan-summary-icon,
  .render-scan-selected-icon,
  .render-scan-metrics-icon {
    color: var(--vg-accent);
  }
  .render-scan-summary {
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .render-scan-stat {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    height: 24px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    color: var(--vg-faint);
    background: var(--vg-border-subtle);
    font-size: 11px;
    line-height: 1;
    white-space: nowrap;
    box-sizing: border-box;
  }
  .render-scan-stat-number {
    display: inline-flex;
    align-items: center;
    color: var(--vg-text);
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .render-scan-detail {
    min-height: 0;
  }
  .render-scan-detail-kicker {
    margin-bottom: 8px;
  }
  .render-scan-detail-title {
    color: var(--vg-text);
    font-size: 18px;
    line-height: 1.2;
    white-space: normal;
    word-break: break-word;
  }
  .render-scan-detail-file {
    font-family: var(--vg-font-mono);
  }
  .render-scan-detail-grid {
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  .render-scan-detail-heading,
  .render-scan-detail-metrics,
  .render-scan-detail-note-row {
    align-items: center;
  }
  .render-scan-severity-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: var(--vg-border-subtle);
    color: var(--vg-faint);
    font-size: 11px;
    font-weight: 650;
    line-height: 1;
    text-transform: capitalize;
    box-sizing: border-box;
  }
  .render-scan-severity-chip.warning {
    background: color-mix(in srgb, var(--vg-warning) 16%, transparent);
    color: var(--vg-warning);
  }
  .render-scan-severity-chip.danger {
    background: color-mix(in srgb, var(--vg-error) 16%, transparent);
    color: var(--vg-error);
  }
  .render-scan-detail-note {
    white-space: normal;
  }
  .render-scan-empty-card {
    min-height: 72px;
  }
  .render-scan-open {
    color: var(--vg-accent);
    border-color: var(--vg-accent-border);
    background: var(--vg-accent-bg);
  }
  .render-scan-open-control {
    align-self: center;
    align-items: center;
  }
  .render-scan-search-row {
    margin-bottom: 12px;
  }
  .render-scan-search {
    width: 100%;
    height: 34px;
    border: 1px solid var(--vg-hover);
    border-radius: 8px;
    background: var(--vg-border-subtle);
    color: var(--vg-text);
    padding: 0 12px;
    font: inherit;
    font-size: 12px;
    outline: none;
    box-sizing: border-box;
  }
  .render-scan-search::placeholder {
    color: var(--vg-faint);
  }
  .render-scan-search:focus {
    border-color: var(--vg-accent-border);
    box-shadow: 0 0 0 2px var(--vg-accent-bg);
  }
  .render-scan-list {
    max-height: calc(100% - 46px);
    overflow-y: auto;
  }
  .render-scan-row.setting-row {
    width: 100%;
    grid-template-columns: 28px minmax(0, 1fr) minmax(54px, auto);
    min-height: 54px;
    border: 0;
    border-bottom: 1px solid var(--vg-border-subtle);
    border-radius: 0;
    color: inherit;
    background: transparent;
    text-align: left;
    cursor: pointer;
    font: inherit;
  }
  .render-scan-row:hover {
    background: var(--vg-hover);
  }
  .render-scan-row.selected {
    background: var(--grab-control-active-bg);
    box-shadow: inset 3px 0 0 var(--vg-accent);
  }
  .render-scan-row:focus-visible {
    outline: 2px solid var(--vg-accent);
    outline-offset: -2px;
  }
  .render-scan-row-icon {
    color: var(--vg-accent);
  }
  .render-scan-row-dot {
    display: block;
    flex: 0 0 auto;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--vg-accent);
    box-shadow: 0 0 0 4px var(--vg-accent-bg);
  }
  .render-scan-row-dot.warning {
    background: var(--vg-warning);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--vg-warning) 14%, transparent);
  }
  .render-scan-row-dot.danger {
    background: var(--vg-error);
    box-shadow: 0 0 0 4px rgba(239,68,68,0.12);
  }
  .render-scan-row-name {
    color: var(--vg-text);
  }
  .render-scan-row-file {
    color: var(--vg-faint);
  }
  .render-scan-row-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 24px;
    min-width: 36px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: var(--vg-accent-bg);
    color: var(--vg-accent);
    font-size: 12px;
    font-weight: 750;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    box-sizing: border-box;
  }
  .render-scan-empty-list {
    min-height: 126px;
  }
  .render-scan-empty-row {
    min-height: 126px;
  }
  .render-scan-empty-icon,
  .render-scan-note-icon {
    color: var(--vg-muted);
  }
  @media (max-width: 760px) {
    .render-scan-shell {
      grid-template-columns: 1fr;
    }
    .render-scan-main {
      border-right: 0;
      border-bottom: 1px solid var(--vg-hover);
    }
    .render-scan-list {
      max-height: none;
    }
  }
  @media (max-width: 520px) {
    .render-scan-overview-row,
    .render-scan-summary-row,
    .render-scan-row.setting-row {
      grid-template-columns: 28px minmax(0, 1fr);
    }
    .render-scan-actions,
    .render-scan-summary,
    .render-scan-detail-grid,
    .render-scan-row-control,
    .render-scan-open-control {
      grid-column: 2;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
    .render-scan-detail-title {
      font-size: 16px;
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
    color: var(--vg-text);
  }
  .logs-clear-btn {
    background: var(--vg-hover);
    border: 1px solid var(--vg-hover-strong);
    border-radius: 6px;
    color: var(--vg-text);
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
  }
  .logs-clear-btn:hover {
    background: var(--vg-hover-strong);
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
    color: var(--vg-text);
    font-size: 13px;
    font-weight: 650;
    line-height: 1.25;
  }
  .logs-panel-meta {
    color: var(--vg-faint);
    font-size: 12px;
    line-height: 1.3;
  }
  .logs-panel .logs-clear-btn {
    flex: 0 0 auto;
    padding: 5px 11px;
    border-color: var(--vg-border);
    background: var(--vg-border-subtle);
    color: var(--vg-text);
  }
  .logs-panel .logs-clear-btn:hover {
    background: var(--vg-border);
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
    background: var(--vg-hover);
    color: var(--vg-faint);
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
    background: var(--vg-border-subtle);
    border-color: var(--vg-hover);
    color: var(--vg-muted);
    letter-spacing: 0.02em;
  }
  .logs-panel .logs-pill:hover {
    background: var(--vg-border);
    color: var(--vg-text);
  }
  .logs-panel .logs-pill.active {
    background: color-mix(in srgb, var(--c) 14%, rgba(0,0,0,0.28));
    color: var(--c);
    border-color: color-mix(in srgb, var(--c) 32%, var(--vg-hover));
  }
  .logs-panel .logs-pill .count {
    color: var(--vg-text);
    font-variant-numeric: tabular-nums;
  }
  .logs-search-row {
    margin-bottom: 14px;
  }
  .logs-search {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 8px;
    background: var(--vg-hover);
    border: 1px solid var(--vg-hover);
    border-radius: 6px;
    color: var(--vg-text);
    padding: 5px 8px;
    font-size: 12px;
    font-family: inherit;
    outline: none;
  }
  .logs-search:focus {
    border-color: var(--vg-accent-border);
  }
  .logs-panel .logs-search {
    margin-bottom: 0;
    padding: 7px 10px;
    border-color: var(--vg-border);
    background: rgba(0,0,0,0.28);
    border-radius: 6px;
  }
  .logs-panel .logs-search:focus {
    border-color: var(--vg-accent);
  }
  .logs-list {
    overflow: hidden;
    border-radius: 8px;
    border: 1px solid var(--vg-hover);
    background: var(--vg-surface-sunken);
  }
  .log-row {
    padding: 8px 10px;
    border-radius: 6px;
    margin-bottom: 4px;
    border-left: 3px solid var(--c, var(--vg-faint));
    background: color-mix(in srgb, var(--c, var(--vg-faint)) 5%, transparent);
    transition: background 0.1s ease;
  }
  .log-row:hover {
    background: color-mix(in srgb, var(--c, var(--vg-faint)) 10%, transparent);
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
    border-bottom: 1px solid var(--vg-border-subtle);
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
    background: var(--c, var(--vg-faint));
    opacity: 0.9;
  }
  .logs-panel .log-row:hover {
    background: color-mix(in srgb, var(--c, var(--vg-faint)) 7%, transparent);
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
    outline: 2px solid var(--vg-accent);
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
    color: var(--vg-faint);
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--vg-hover);
    flex-shrink: 0;
    text-transform: lowercase;
  }
  .logs-panel .log-row-source {
    min-width: 44px;
    padding: 2px 6px;
    border-radius: 5px;
    color: var(--vg-muted);
    background: var(--vg-border-subtle);
    text-align: center;
  }
  .log-row-msg {
    font-size: 12px;
    color: var(--vg-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }
  .logs-panel .log-row-msg {
    color: var(--vg-text);
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
    color: var(--vg-faint);
    flex-shrink: 0;
  }
  .logs-panel .log-row-time {
    min-width: 74px;
    color: var(--vg-faint);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .log-row-chevron {
    display: inline-block;
    transition: transform 0.15s ease;
    font-size: 10px;
    color: var(--vg-faint);
    flex-shrink: 0;
  }
  .logs-panel .log-row-chevron {
    width: 12px;
    color: var(--vg-faint);
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
    border: 1px solid var(--vg-hover);
    background: rgba(0,0,0,0.24);
  }
  .log-row-stack {
    font-size: 11px;
    font-family: var(--vg-font-mono);
    color: var(--vg-muted);
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
    border: 1px solid var(--vg-border-subtle);
    background: rgba(0,0,0,0.28);
  }
  .log-row-vue-info {
    font-size: 11px;
    color: var(--vg-muted);
    margin-bottom: 6px;
  }
  .logs-panel .log-row-vue-info {
    color: var(--vg-accent);
    line-height: 1.35;
  }
  .log-row-actions {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .log-action-btn {
    background: var(--vg-hover);
    border: 1px solid var(--vg-hover-strong);
    border-radius: 6px;
    color: var(--vg-text);
    padding: 3px 10px;
    font-size: 11px;
    cursor: pointer;
    font-family: inherit;
    white-space: nowrap;
  }
  .log-action-btn:hover {
    background: var(--vg-hover-strong);
    color: #fff;
  }
  .log-action-btn.primary {
    background: var(--vg-accent-bg);
    border-color: var(--vg-accent-border);
    color: var(--vg-accent);
  }
  .log-action-btn.primary:hover {
    background: var(--vg-accent-border);
    color: var(--vg-text);
  }
  .logs-panel .log-action-btn {
    padding: 5px 10px;
  }
  .logs-panel .log-row-actions {
    flex-wrap: wrap;
  }
  .logs-empty {
    color: var(--vg-faint);
    text-align: center;
    padding: 20px;
    font-size: 12px;
  }
  .logs-panel .logs-empty {
    color: var(--vg-faint);
    padding: 24px 14px;
    background: var(--vg-surface-sunken);
  }
  .logs-panel .logs-empty-compact {
    margin-top: 2px;
    padding: 9px 10px;
    border-radius: 6px;
    border: 1px solid var(--vg-hover);
    background: var(--vg-hover);
    color: var(--vg-faint);
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
    background: var(--vg-surface-sunken);
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
    color: var(--vg-muted);
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
    background: var(--vg-border-subtle);
    color: var(--vg-faint);
    font-size: 11px;
    white-space: nowrap;
  }
  .logs-stat-number {
    color: var(--vg-text);
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
    border-color: var(--vg-hover);
    color: var(--vg-muted);
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
    background: var(--vg-border-subtle);
    border-color: var(--vg-border);
    color: var(--vg-text);
  }
  .logs-panel .logs-pill.active {
    background: rgba(0,0,0,0.28);
    color: var(--vg-text);
    border-color: var(--vg-hover-strong);
    box-shadow: inset 0 0 0 1px var(--vg-hover);
  }
  .logs-panel .logs-pill.active::before {
    background: var(--c);
    opacity: 0.95;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 16%, transparent);
  }
  .logs-panel .logs-pill .count {
    color: var(--vg-muted);
    font-weight: 650;
  }
  .logs-panel .logs-pill.active .count {
    color: var(--vg-text);
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
    border-color: var(--vg-hover);
    background: var(--vg-surface-sunken);
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
    background: var(--vg-hover-strong);
    border-radius: 3px;
  }
  .logs-panel .log-row {
    border-bottom: 1px solid var(--vg-border-subtle);
    background: transparent;
  }
  .logs-panel .log-row:last-child {
    border-bottom: 0;
  }
  .logs-panel .log-row::before {
    display: none;
  }
  .logs-panel .log-row:hover {
    background: color-mix(in srgb, var(--c, var(--vg-faint)) 5%, transparent);
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
    color: var(--c, var(--vg-faint));
  }
  .log-row-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--c, var(--vg-faint));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--c, var(--vg-faint)) 12%, transparent);
  }
  .logs-panel .log-row-copy {
    min-width: 0;
  }
  .logs-panel .log-row-msg {
    color: var(--vg-text);
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
    color: var(--c, var(--vg-muted));
    background: color-mix(in srgb, var(--c, var(--vg-muted)) 12%, transparent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c, var(--vg-muted)) 24%, transparent);
  }
  .logs-panel .log-row-source {
    min-width: 0;
    color: var(--vg-muted);
    background: var(--vg-border-subtle);
    text-transform: lowercase;
  }
  .logs-panel .log-row-control {
    gap: 8px;
    flex-wrap: nowrap;
  }
  .logs-panel .log-row-count {
    color: var(--c, var(--vg-muted));
    background: color-mix(in srgb, var(--c, var(--vg-muted)) 12%, transparent);
    font-variant-numeric: tabular-nums;
  }
  .logs-panel .log-row-time {
    min-width: 74px;
    color: var(--vg-faint);
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
    color: var(--vg-faint);
  }
  .logs-panel .log-row-header:hover .log-row-chevron {
    background: var(--vg-border-subtle);
    color: var(--vg-text);
  }
  .logs-panel .log-row-details {
    margin: 0;
    padding: 0 14px 12px 56px;
    border-top: 0;
  }
  .logs-panel .log-row-detail-surface {
    padding: 10px;
    border-radius: 6px;
    border: 1px solid var(--vg-border-subtle);
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
    background: var(--vg-border-subtle);
    border-color: var(--vg-border);
    font-size: 11px;
  }
  .logs-panel .log-action-btn.primary {
    background: var(--grab-control-active-bg);
    border-color: var(--vg-accent-border);
    color: var(--vg-accent);
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
    color: var(--vg-faint);
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
  .context-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    min-width: min(560px, 100%);
    overflow: hidden;
    padding: 14px;
    box-sizing: border-box;
  }
  .context-panel .settings-list {
    background: var(--vg-surface-sunken);
  }
  .context-panel .section-label:not(:first-child) {
    margin-top: 16px;
  }
  .context-section-label,
  .context-overview-list,
  .context-selected-list,
  .context-action-list {
    flex: 0 0 auto;
  }
  .context-overview-list,
  .context-selected-list,
  .context-action-list {
    margin-bottom: 0;
  }
  .context-overview-row,
  .context-selected-row,
  .context-action-row {
    min-height: 58px;
  }
  .context-overview-icon,
  .context-selected-icon,
  .context-action-icon {
    color: var(--vg-muted);
  }
  .context-overview-icon svg,
  .context-selected-icon svg,
  .context-action-icon svg {
    width: 18px;
    height: 18px;
  }
  .context-overview-control,
  .context-actions {
    flex-wrap: wrap;
  }
  .context-panel-meta {
    color: var(--vg-faint);
    font-size: 12px;
    line-height: 1.3;
  }
  .context-actions {
    gap: 6px;
  }
  .context-preview {
    flex: 1 1 auto;
    min-height: 0;
    margin: 0;
    padding: 12px;
    overflow: auto;
    border-radius: 8px;
    border: 1px solid var(--vg-hover);
    background: var(--vg-surface-sunken);
    color: var(--vg-text);
    font: 11px/1.45 var(--vg-font-mono);
    white-space: pre-wrap;
    word-break: break-word;
    box-sizing: border-box;
  }
  .context-preview::-webkit-scrollbar {
    width: 6px;
  }
  .context-preview::-webkit-scrollbar-track {
    background: transparent;
  }
  .context-preview::-webkit-scrollbar-thumb {
    background: var(--vg-hover-strong);
    border-radius: 3px;
  }

  .network-btn {
    position: relative;
  }
  .network-btn.active {
    color: var(--vg-accent);
    box-shadow: inset 0 0 0 1.5px var(--vg-accent);
    background: var(--vg-accent-bg);
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
    background: var(--vg-surface-sunken);
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
    color: var(--vg-muted);
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
    border-color: var(--vg-border);
    background: var(--vg-border-subtle);
    color: var(--vg-text);
  }
  .network-panel .logs-clear-btn:hover {
    background: var(--vg-border);
    color: #fff;
  }
  .network-panel-meta {
    color: var(--vg-faint);
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
    border: 1px solid var(--vg-hover);
    background: rgba(0,0,0,0.16);
    color: var(--vg-muted);
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
    background: var(--vg-border-subtle);
    border-color: var(--vg-border);
    color: var(--vg-text);
  }
  .net-pill.active {
    background: rgba(0,0,0,0.28);
    color: var(--vg-text);
    border-color: var(--vg-hover-strong);
    box-shadow: inset 0 0 0 1px var(--vg-hover);
  }
  .net-pill.active::before {
    background: var(--c);
    opacity: 0.95;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 16%, transparent);
  }
  .net-pill .count {
    color: var(--vg-muted);
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  .net-pill.active .count {
    color: var(--vg-text);
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
    border-color: var(--vg-hover);
    background: var(--vg-surface-sunken);
    box-sizing: border-box;
  }
  .net-row {
    border-bottom: 1px solid var(--vg-border-subtle);
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
    background: color-mix(in srgb, var(--c, var(--vg-faint)) 5%, transparent);
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
    color: var(--c, var(--vg-faint));
  }
  .net-row-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: var(--c, var(--vg-faint));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--c, var(--vg-faint)) 12%, transparent);
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
    background: var(--vg-border);
    color: var(--vg-text);
    font-family: var(--vg-font-mono);
  }
  .net-row-status {
    min-width: 0;
    background: color-mix(in srgb, var(--c) 12%, transparent);
    color: var(--c);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 24%, transparent);
    font-variant-numeric: tabular-nums;
  }
  .net-row-url {
    color: var(--vg-text);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.25;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .net-row-duration {
    color: var(--vg-faint);
    background: var(--vg-border-subtle);
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
    color: var(--vg-faint);
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
    color: var(--vg-faint);
  }
  .net-row-header:hover .net-row-chevron {
    background: var(--vg-border-subtle);
    color: var(--vg-text);
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
    border: 1px solid var(--vg-border-subtle);
    background: rgba(0,0,0,0.22);
  }
  .net-section-title {
    font-size: 10px;
    color: var(--vg-faint);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 8px 0 4px;
  }
  .net-kv {
    font-size: 11px;
    font-family: var(--vg-font-mono);
    color: var(--vg-muted);
    padding: 1px 0;
    word-break: break-all;
  }
  .net-kv .k { color: var(--vg-accent); }
  .net-body {
    font-size: 11px;
    font-family: var(--vg-font-mono);
    color: var(--vg-text);
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
    background: var(--vg-border-subtle);
    border-color: var(--vg-border);
    font-size: 11px;
  }
  .network-panel .log-action-btn.primary {
    background: var(--grab-control-active-bg);
    border-color: var(--vg-accent-border);
    color: var(--vg-accent);
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
    color: var(--vg-faint);
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
