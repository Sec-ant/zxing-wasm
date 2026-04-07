import { useCallback, useEffect, useRef, useState } from "react";
import { useScanner } from "zxing-wasm/react";
import type { ReadResult } from "zxing-wasm/reader";

function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [results, setResults] = useState<ReadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    ref: scanRef,
    start,
    stop,
    scanning,
  } = useScanner({
    readerOptions: { formats: ["QRCode", "EAN-13", "Code128"] },
    onScan: setResults,
    onError: (err: unknown) => setError(String(err)),
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        video.srcObject = stream;
        video.play().then(start);
      })
      .catch((err) => setError(String(err)));

    return () => {
      const stream = video.srcObject as MediaStream | null;
      for (const track of stream?.getTracks() ?? []) {
        track.stop();
      }
    };
  }, []);

  // Merge refs: assign both scanRef and videoRef to the element.
  // Must be stable (useCallback) — an unstable ref function would cause
  // scanRef(null) → scanRef(node) on every re-render, destroying the loop.
  const mergedRef = useCallback((node: HTMLVideoElement | null) => {
    scanRef(node);
    (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current =
      node;
  }, []);

  return (
    <section>
      <h2>Camera Scanner</h2>
      <div style={{ position: "relative", maxWidth: 640 }}>
        <video
          ref={mergedRef}
          playsInline
          muted
          style={{ width: "100%", borderRadius: 8, background: "#000" }}
        />
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={scanning ? stop : start}>
          {scanning ? "Stop" : "Start"}
        </button>
        <span style={{ marginLeft: 8, color: scanning ? "green" : "gray" }}>
          {scanning ? "Scanning..." : "Stopped"}
        </span>
      </div>
      {error && <p style={{ color: "red" }}>Error: {error}</p>}
      {results.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3>Results</h3>
          <ul>
            {results.map((r) => (
              <li key={`${r.format}-${r.text}`}>
                <strong>{r.format}</strong>: {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ImageScanner() {
  const [src, setSrc] = useState<string>("");
  const [results, setResults] = useState<ReadResult[]>([]);
  const { ref, start } = useScanner({ onScan: setResults });

  return (
    <section>
      <h2>Image Scanner</h2>
      <div>
        <input
          type="text"
          placeholder="Paste image URL..."
          value={src}
          onChange={(e) => setSrc(e.target.value)}
          style={{ width: 400, marginRight: 8 }}
        />
      </div>
      {src && (
        <div style={{ marginTop: 8 }}>
          <img
            ref={ref}
            src={src}
            onLoad={start}
            alt="Barcode"
            style={{ maxWidth: 400, borderRadius: 8 }}
            crossOrigin="anonymous"
          />
        </div>
      )}
      {results.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3>Results</h3>
          <ul>
            {results.map((r) => (
              <li key={`${r.format}-${r.text}`}>
                <strong>{r.format}</strong>: {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: 24, maxWidth: 800 }}>
      <h1>zxing-wasm React Demo</h1>
      <p>
        Demonstrating <code>useScanner</code> hook from{" "}
        <code>zxing-wasm/react</code>.
      </p>
      <hr />
      <CameraScanner />
      <hr style={{ marginTop: 24 }} />
      <ImageScanner />
    </div>
  );
}
