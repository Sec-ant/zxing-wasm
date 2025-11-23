import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { ReadResult } from "zxing-wasm";
import { useScanner } from "../hooks/useScanner";

// Shared results display component
const ScanResults = ({
const ScanResults = ({
  results,
  error,
}: {
  results: ReadResult[];
  error: string | null;
}) => (
  <>
    {error && (
      <div style={{ color: "red", marginBottom: "10px" }}>
        <strong>Error:</strong> {error}
      </div>
    )}

    {results.length > 0 && (
      <div>
        <h3>Scan Results:</h3>
        {results.map((result, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "#f9f9f9",
            }}
          >
            <div>
              <strong>Format:</strong> {result.format}
            </div>
            <div>
              <strong>Text:</strong> {result.text}
            </div>
            {result.eccLevel && (
              <div>
                <strong>ECC Level:</strong> {result.eccLevel}
              </div>
            )}
          </div>
        ))}
      </div>
    )}

    {results.length === 0 && !error && (
      <div style={{ color: "#666" }}>Scanning for barcodes...</div>
    )}
  </>
);

// HTMLImageElement Story
const ImageElementDemo = () => {
  const [results, setResults] = useState<ReadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ref = useScanner({
    onScanResponse: (readResults) => {
      setResults(readResults);
      setError(null);
    },
    onScanError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Scan error:", err);
    },
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>HTMLImageElement - Barcode Scanner</h2>

      <div style={{ marginBottom: "20px" }}>
        <img
          ref={ref}
          src="/wikipedia.png"
          alt="Test barcode"
          style={{ maxWidth: "100%", border: "2px solid #ccc" }}
        />
      </div>

      <ScanResults results={results} error={error} />
    </div>
  );
};

// HTMLVideoElement Story
const VideoElementDemo = () => {
  const [results, setResults] = useState<ReadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ref = useScanner({
    onScanResponse: (readResults) => {
      setResults(readResults);
      setError(null);
    },
    onScanError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Scan error:", err);
    },
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>HTMLVideoElement - Barcode Scanner</h2>

      <div style={{ marginBottom: "20px" }}>
        <video
          ref={ref}
          src="/barcodes.mov"
          autoPlay
          loop
          muted
          playsInline
          style={{ maxWidth: "100%", border: "2px solid #ccc" }}
        />
      </div>

      <ScanResults results={results} error={error} />
    </div>
  );
};

// HTMLCanvasElement Story (待定)
const CanvasElementDemo = () => {
  const [results, setResults] = useState<ReadResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ref = useScanner({
    onScanResponse: (readResults) => {
      setResults(readResults);
      setError(null);
    },
    onScanError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error("Scan error:", err);
    },
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>HTMLCanvasElement - Barcode Scanner</h2>

      <div style={{ marginBottom: "20px" }}>
        <canvas
          ref={ref}
          width={400}
          height={400}
          style={{ border: "2px solid #ccc" }}
        />
      </div>

      <ScanResults results={results} error={error} />

      <div style={{ marginTop: "20px", color: "#999", fontSize: "14px" }}>
        <em>Canvas story is pending implementation</em>
      </div>
    </div>
  );
};

const meta: Meta = {
  title: "Hooks/useScanner",
  parameters: {
    layout: "centered",
  },
};

export default meta;

export const ImageElement: StoryObj<typeof ImageElementDemo> = {
  render: () => <ImageElementDemo />,
};

export const VideoElement: StoryObj<typeof VideoElementDemo> = {
  render: () => <VideoElementDemo />,
};

export const CanvasElement: StoryObj<typeof CanvasElementDemo> = {
  render: () => <CanvasElementDemo />,
};
