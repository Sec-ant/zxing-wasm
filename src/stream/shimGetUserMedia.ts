import { detectBrowser } from "webrtc-adapter/dist/utils";

/**
 * Provide a shim for getUserMedia API across different browsers.
 *
 * This function ensures compatibility of the getUserMedia API with various browsers by applying
 * necessary shims provided by the 'webrtc-adapter' package. It detects the browser and applies the
 * appropriate shim. The function is designed to be called once to set up the shims and will not
 * re-apply the shims on subsequent calls.
 *
 * @returns A promise that resolves once the appropriate shim (if any) has been applied. It resolves
 *   to `void` as its purpose is to configure the environment rather than return a value.
 */
export const shimGetUserMedia = (() => {
  let called = false;
  return async () => {
    // Ensure the shim is applied only once
    if (called) {
      return;
    }

    // Detect the current browser
    const browserDetails = detectBrowser(window);

    // Apply browser-specific shim for getUserMedia
    switch (browserDetails.browser) {
      case "chrome":
        (
          await import("webrtc-adapter/dist/chrome/getusermedia")
        ).shimGetUserMedia(window, browserDetails);
        break;
      case "firefox":
        (
          await import("webrtc-adapter/dist/firefox/getusermedia")
        ).shimGetUserMedia(window, browserDetails);
        break;
      case "safari":
        (
          await import("webrtc-adapter/dist/safari/safari_shim")
        ).shimGetUserMedia(window);
        break;
      default:
        // Handle other browsers or runtimes in a non-disruptive way
        break;
    }

    // Mark the shim as applied
    called = true;
  };
})();
