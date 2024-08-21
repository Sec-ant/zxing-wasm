/// <reference types="./src/stream/media-track-shims" />

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { StreamBarcodeDetector } from "./src/react/components/StreamBarcodeDetector.js";

import type { InitConstraints } from "./src/stream/index.js";

const App = () => {
  const [initConstraints] = useState<InitConstraints>({
    video: {
      aspectRatio: undefined,
    },
  });

  const [videoConstraints] = useState<MediaTrackConstraints>({
    advanced: [
      {
        exposureMode: "continuous",
      },
    ],
  });

  return (
    <StreamBarcodeDetector
      onScanDetect={(r) => {
        console.log(r);
      }}
      onStreamInspect={(c) => {
        console.log(c);
      }}
      initConstraints={initConstraints}
      videoConstraints={videoConstraints}
      scanThrottle={0}
      negativeDebounce={0}
      formats={["QRCode"]}
    />
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
