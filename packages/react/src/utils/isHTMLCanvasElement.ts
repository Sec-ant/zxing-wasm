/**
 * Determines whether the provided value is an HTMLCanvasElement.
 *
 * @param el - The value to be checked.
 * @returns True if the value is an HTMLCanvasElement, false otherwise.
 */
export function isHTMLCanvasElement(el: unknown): el is HTMLCanvasElement {
  try {
    return (
      el instanceof
      ((el as Node)?.ownerDocument?.defaultView?.HTMLCanvasElement as never)
    );
  } catch {
    return false;
  }
}
