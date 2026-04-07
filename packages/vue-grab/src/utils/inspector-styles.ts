/** Shared CSS for inspector / devtools UI elements (`.dt-*` classes). */
export const INSPECTOR_STYLES = `
  .dt-section {
    margin-bottom: 14px;
  }
  .dt-section-title {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .dt-component-name {
    font-size: 14px;
    font-weight: 600;
    color: #7dd3fc;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .dt-file-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }
  .dt-file-path {
    font-size: 12px;
    color: #999;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    word-break: break-all;
    flex: 1;
  }
  .dt-open-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 4px;
    color: #aaa;
    cursor: pointer;
    padding: 3px 6px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
  }
  .dt-open-btn:hover {
    color: #fff;
    background: rgba(255,255,255,0.14);
  }
  .dt-selector {
    font-size: 12px;
    color: #bbb;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    margin-top: 4px;
    word-break: break-all;
  }
  .dt-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .dt-stack-item {
    color: #7dd3fc;
  }
  .dt-stack-sep {
    color: #555;
  }
  .dt-rule-group {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .dt-rule-source {
    font-size: 11px;
    color: #888;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dt-rule-source-file {
    flex: 1;
    word-break: break-all;
  }
  .dt-rule {
    padding: 8px 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }
  .dt-rule + .dt-rule {
    border-top: 1px solid rgba(255,255,255,0.04);
  }
  .dt-rule-selector {
    color: #c792ea;
    margin-bottom: 4px;
  }
  .dt-prop-row {
    display: flex;
    align-items: center;
    padding: 2px 0 2px 16px;
    gap: 4px;
  }
  .dt-prop-name {
    color: #82aaff;
    white-space: nowrap;
  }
  .dt-prop-colon {
    color: #555;
  }
  .dt-prop-value {
    flex: 1;
    min-width: 0;
  }
  .dt-prop-input {
    width: 100%;
    background: rgba(255,255,255,0.06);
    border: 1px solid transparent;
    border-radius: 3px;
    color: #c3e88d;
    font-family: inherit;
    font-size: 12px;
    padding: 2px 6px;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .dt-prop-input:focus {
    outline: none;
    border-color: var(--grab-color, #4f46e5);
    background: rgba(255,255,255,0.1);
  }
  .dt-prop-input:read-only {
    background: transparent;
    border-color: transparent;
    color: #aaa;
    cursor: default;
  }
  .dt-prop-priority {
    color: #ff5370;
    font-size: 11px;
    white-space: nowrap;
  }
  .dt-prop-semi {
    color: #555;
  }
  .dt-empty {
    color: #555;
    text-align: center;
    padding: 20px;
    font-size: 12px;
  }
`;
