export const STYLES = `
  :host { all: initial; }

  .measurer-container {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2147483645;
    display: none;
  }
  .measurer-container.active {
    display: block;
  }

  svg {
    width: 100%;
    height: 100%;
  }

  .dim-rect {
    fill: none;
    stroke-dasharray: 4 3;
  }
  .dim-rect-selected {
    fill: none;
    stroke-dasharray: none;
  }
  .dim-label {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 11px;
    pointer-events: none;
  }
  .dim-label-bg {
    rx: 3;
    ry: 3;
  }
  .spacing-line {
    stroke-dasharray: none;
  }
  .spacing-label {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
    font-size: 11px;
    font-weight: 600;
    pointer-events: none;
  }
  .spacing-label-bg {
    rx: 3;
    ry: 3;
  }
  .guide-line {
    stroke-dasharray: 6 4;
    opacity: 0.6;
  }
`;
