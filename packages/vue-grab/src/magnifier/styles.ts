const BRACKET_INSET = 25;
const BRACKET_LEN = 20;

export const STYLES = `
  :host { all: initial; }

  .magnifier-container {
    position: fixed;
    pointer-events: none;
    z-index: 2147483645;
    display: none;
  }
  .magnifier-container.active {
    display: block;
  }

  .loupe {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.2),
      0 0 30px rgba(74, 222, 128, 0.12),
      0 4px 24px rgba(0, 0, 0, 0.5);
  }

  /* 鈹€鈹€ Cloned page content 鈹€鈹€ */
  .clone-wrapper {
    overflow: hidden;
    border-radius: 50%;
    position: relative;
    background: transparent;
  }
  .page-clone {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    transform-origin: 0 0;
  }

  /* 鈹€鈹€ Green glass tint overlay 鈹€鈹€ */
  .glass-tint {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(0, 35, 18, 0.4);
    mix-blend-mode: multiply;
    z-index: 1;
  }

  /* 鈹€鈹€ Full-size crosshair lines 鈹€鈹€ */
  .crosshair-h {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    height: 1px;
    background: rgba(255, 255, 255, 0.18);
    z-index: 4;
    transform: translateY(-0.5px);
  }
  .crosshair-v {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(255, 255, 255, 0.18);
    z-index: 4;
    transform: translateX(-0.5px);
  }
  /* Small bright dot at center */
  .crosshair-dot {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(74, 222, 128, 0.7);
    transform: translate(-50%, -50%);
    z-index: 5;
  }

  /* 鈹€鈹€ Corner bracket marks 鈹€鈹€ */
  .bracket {
    position: absolute;
    width: ${BRACKET_LEN}px;
    height: ${BRACKET_LEN}px;
    z-index: 4;
  }
  .bracket::before,
  .bracket::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.35);
  }
  /* Top-left 鈹?*/
  .bracket.tl {
    top: ${BRACKET_INSET}%;
    left: ${BRACKET_INSET}%;
  }
  .bracket.tl::before { top: 0; left: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.tl::after  { top: 0; left: 0; width: 1.5px; height: ${BRACKET_LEN}px; }
  /* Top-right 鈹?*/
  .bracket.tr {
    top: ${BRACKET_INSET}%;
    right: ${BRACKET_INSET}%;
  }
  .bracket.tr::before { top: 0; right: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.tr::after  { top: 0; right: 0; width: 1.5px; height: ${BRACKET_LEN}px; }
  /* Bottom-left 鈹?*/
  .bracket.bl {
    bottom: ${BRACKET_INSET}%;
    left: ${BRACKET_INSET}%;
  }
  .bracket.bl::before { bottom: 0; left: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.bl::after  { bottom: 0; left: 0; width: 1.5px; height: ${BRACKET_LEN}px; }
  /* Bottom-right 鈹?*/
  .bracket.br {
    bottom: ${BRACKET_INSET}%;
    right: ${BRACKET_INSET}%;
  }
  .bracket.br::before { bottom: 0; right: 0; width: ${BRACKET_LEN}px; height: 1.5px; }
  .bracket.br::after  { bottom: 0; right: 0; width: 1.5px; height: ${BRACKET_LEN}px; }

  /* 鈹€鈹€ HTML element label (compact green pill) 鈹€鈹€ */
  .html-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 10px);
    background: rgba(74, 222, 128, 0.85);
    color: #0a0a0a;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 4px;
    white-space: nowrap;
    max-width: 75%;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 5;
    pointer-events: none;
  }

  /* 鈹€鈹€ Coordinate info at bottom 鈹€鈹€ */
  .info-label {
    position: absolute;
    bottom: 14%;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.4);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    white-space: nowrap;
    z-index: 5;
    pointer-events: none;
  }
`;
