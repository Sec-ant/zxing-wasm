/**
 * This file declares types for the non-public exports from "webrtc-adapter". As we're only
 * interested in the getUserMedia shims, we use this approach to avoid importing the whole library.
 *
 * This type declaration file is only meant to be used internally.
 */

declare module "webrtc-adapter/dist/chrome/getusermedia" {
  function shimGetUserMedia(
    window: Window,
    browserDetails: import("webrtc-adapter").IAdapter["browserDetails"],
  ): void;
}

declare module "webrtc-adapter/dist/firefox/getusermedia" {
  function shimGetUserMedia(
    window: Window,
    browserDetails: import("webrtc-adapter").IAdapter["browserDetails"],
  ): void;
}

declare module "webrtc-adapter/dist/safari/safari_shim" {
  function shimGetUserMedia(window: Window): void;
}

declare module "webrtc-adapter/dist/utils" {
  function detectBrowser(
    window: Window,
  ): import("webrtc-adapter").IAdapter["browserDetails"];
}
