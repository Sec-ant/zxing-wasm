/**
 * Determines whether the provided value is an HTMLVideoElement.
 *
 * @param el - The value to be checked.
 * @returns True if the value is an HTMLVideoElement, false otherwise.
 */
export function isHTMLVideoElement(el: unknown): el is HTMLVideoElement {
  try {
    return (
      el instanceof
      ((el as Node)?.ownerDocument?.defaultView?.HTMLVideoElement as never)
    );
  } catch {
    return false;
  }
}
