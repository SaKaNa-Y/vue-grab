export { getComponentName } from "./component";
export { esc, escAttr } from "./html";
export { tryReadStorage, trySaveStorage } from "./storage";
export {
  OPEN_SVG,
  groupRulesBySource,
  renderRule,
  renderComponentStack,
  renderInspectorHTML,
  wireInspectorEvents,
  type RuleGroup,
  type InspectorEventCallbacks,
} from "./css-render";
export { INSPECTOR_STYLES } from "./inspector-styles";
export { hasA11yAttributes, extractA11yInfo, scanPageA11y, A11Y_ICON_SVG } from "./a11y";
export { ConsoleCapture, resolveErrorSource } from "./console-capture";
export { buildErrorPrompt } from "./prompt-builder";
