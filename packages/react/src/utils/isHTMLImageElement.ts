/**
 * Determines whether the provided value is an HTMLImageElement.
 *
 * @param el - The value to be checked.
 * @returns True if the value is an HTMLImageElement, false otherwise.
 */
export function isHTMLImageElement(el: unknown): el is HTMLImageElement {
  try {
    return (
      el instanceof
      ((el as Node)?.ownerDocument?.defaultView?.HTMLImageElement as never)
    );
  } catch {
    return false;
  }
}
