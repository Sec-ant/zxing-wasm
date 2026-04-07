import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import type { ReadResult } from "../src/bindings/index.js";
import { useScanner } from "../src/react/index.js";

// Test QR code from the repo's test samples (Wikipedia QR code).
// In browser mode, Vite serves the project root so we can reference test assets.
const QR_IMAGE_URL = "/tests/samples/qrcode/wikipedia.png";

/**
 * Minimal test component that scans an <img> element.
 *
 * NOTE: `ref` from useScanner is passed directly to `<img>` — not wrapped in
 * an unstable merged-ref function. An unstable ref callback would trigger
 * ref(null) → ref(node) on every re-render, destroying the loop each time
 * and leaving `scanning` stuck at false.
 */
function ImageScannerTestComponent({
  onScanResults,
  onScanError,
  imageUrl,
  worker,
}: {
  onScanResults: (results: ReadResult[]) => void;
  onScanError?: (error: unknown) => void;
  imageUrl: string;
  worker?: boolean | string;
}) {
  const { ref, start, stop, scanning } = useScanner({
    onScan: onScanResults,
    onError: onScanError,
    worker,
  });

  return (
    <div>
      <img
        ref={ref}
        src={imageUrl}
        alt="test barcode"
        crossOrigin="anonymous"
        onLoad={() => start()}
      />
      <span data-testid="scanning">{scanning ? "true" : "false"}</span>
      <button type="button" data-testid="stop" onClick={stop}>
        Stop
      </button>
    </div>
  );
}

describe("useScanner (browser integration)", () => {
  test("scans QR code from <img> on main thread", async () => {
    const results = vi.fn<(r: ReadResult[]) => void>();

    const screen = await render(
      <ImageScannerTestComponent
        imageUrl={QR_IMAGE_URL}
        onScanResults={results}
      />,
    );

    // Wait for scanning to start
    await expect
      .element(screen.getByTestId("scanning"))
      .toHaveTextContent("true");

    // Wait for onScan to be called with results
    await vi.waitFor(
      () => {
        expect(results).toHaveBeenCalled();
        const lastCall = results.mock.calls.at(-1)!;
        expect(lastCall[0].length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );

    const scanResults = results.mock.calls.at(-1)![0];
    expect(scanResults[0].format).toBe("QRCode");
    expect(scanResults[0].text).toContain("http");

    // Stop scanning
    await screen.getByTestId("stop").click();
    await expect
      .element(screen.getByTestId("scanning"))
      .toHaveTextContent("false");
  });

  test("scans QR code from <img> in Worker mode", async () => {
    const results = vi.fn<(r: ReadResult[]) => void>();

    const screen = await render(
      <ImageScannerTestComponent
        imageUrl={QR_IMAGE_URL}
        onScanResults={results}
        worker={true}
      />,
    );

    await expect
      .element(screen.getByTestId("scanning"))
      .toHaveTextContent("true");

    await vi.waitFor(
      () => {
        expect(results).toHaveBeenCalled();
        const lastCall = results.mock.calls.at(-1)!;
        expect(lastCall[0].length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );

    const scanResults = results.mock.calls.at(-1)![0];
    expect(scanResults[0].format).toBe("QRCode");
    expect(scanResults[0].text).toContain("http");

    await screen.getByTestId("stop").click();
    await expect
      .element(screen.getByTestId("scanning"))
      .toHaveTextContent("false");
  });

  test("ref detach stops scanning", async () => {
    const onScan = vi.fn<(r: ReadResult[]) => void>();

    function DetachTestComponent() {
      const [show, setShow] = useState(true);
      const { ref, scanning } = useScanner({
        onScan,
      });

      return (
        <div>
          {show && (
            <img
              ref={ref}
              src={QR_IMAGE_URL}
              alt="test barcode"
              crossOrigin="anonymous"
            />
          )}
          <span data-testid="scanning">{scanning ? "true" : "false"}</span>
          <button
            type="button"
            data-testid="detach"
            onClick={() => setShow(false)}
          >
            Detach
          </button>
        </div>
      );
    }

    const screen = await render(<DetachTestComponent />);

    // Detach the element
    await screen.getByTestId("detach").click();

    // Scanning should be false after detach
    await expect
      .element(screen.getByTestId("scanning"))
      .toHaveTextContent("false");
  });

  test("equalityFn gates onScan calls", async () => {
    const onScan = vi.fn<(r: ReadResult[]) => void>();
    const onFrame = vi.fn<(r: ReadResult[]) => void>();

    function EqualityTestComponent() {
      const { ref, start, scanning } = useScanner({
        onScan,
        onFrame,
      });

      return (
        <div>
          <img
            ref={ref}
            src={QR_IMAGE_URL}
            alt="test barcode"
            crossOrigin="anonymous"
            onLoad={() => start()}
          />
          <span data-testid="scanning">{scanning ? "true" : "false"}</span>
        </div>
      );
    }

    const screen = await render(<EqualityTestComponent />);

    await expect
      .element(screen.getByTestId("scanning"))
      .toHaveTextContent("true");

    // Wait for multiple frames to be processed
    await vi.waitFor(
      () => {
        expect(onFrame.mock.calls.length).toBeGreaterThanOrEqual(3);
      },
      { timeout: 15000 },
    );

    // onScan should have been called fewer times than onFrame because
    // the equalityFn suppresses duplicate results
    expect(onScan.mock.calls.length).toBeLessThan(onFrame.mock.calls.length);
    // onScan should have been called exactly once (first non-empty result)
    // since the QR code content doesn't change between frames
    expect(onScan.mock.calls.length).toBe(1);
  });
});
