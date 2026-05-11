import { FAB_HOST_ID } from "../floating-button";
import { MEASURER_HOST_ID } from "../measurer";
import { OVERLAY_HOST_ID } from "../overlay";

const MAGNIFIER_HOST_ID = "vue-grab-magnifier-host";

export const MAGNIFIER_HOST_IDS = [
  MAGNIFIER_HOST_ID,
  FAB_HOST_ID,
  OVERLAY_HOST_ID,
  MEASURER_HOST_ID,
];

export function removeVueGrabHosts(
  root: ParentNode,
  ids: readonly string[] = MAGNIFIER_HOST_IDS,
): void {
  for (const id of ids) {
    const el = root.querySelector(`#${id}`);
    el?.remove();
  }
}

export function buildCloneTransform(
  clientX: number,
  clientY: number,
  scrollX: number,
  scrollY: number,
  loupeSize: number,
  zoomLevel: number,
): string {
  const halfSize = loupeSize / 2;
  const pageX = clientX + scrollX;
  const pageY = clientY + scrollY;
  const tx = -pageX * zoomLevel + halfSize;
  const ty = -pageY * zoomLevel + halfSize;
  return `translate(${tx}px, ${ty}px) scale(${zoomLevel})`;
}
