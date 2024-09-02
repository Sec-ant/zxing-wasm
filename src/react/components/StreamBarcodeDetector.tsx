import { type ComponentPropsWithRef, type ComponentPropsWithoutRef, memo, useEffect, useMemo, useRef } from "react";
import { frameClass, overlayClass, wrapperClass } from "../../index.css.js";
import type { ReaderOptions } from "../../reader/index.js";
import {
  type UseUserMediaStreamOptions,
  type UseVideoScannerOptions,
  useUserMediaStream,
  useVideoScanner,
} from "../hooks/index.js";

export interface StreamBarcodeDetectorProps
  extends UseUserMediaStreamOptions,
    UseVideoScannerOptions,
    ReaderOptions,
    ComponentPropsWithRef<"div"> {
  overlayCanvasProps?: ComponentPropsWithoutRef<"canvas">;
  frameCanvasProps?: ComponentPropsWithoutRef<"canvas">;
}

export const StreamBarcodeDetector = memo(
  ({
    /**
     * stream options
     */
    streaming = true,
    initConstraints,
    videoConstraints,
    audioConstraints,
    getCapabilitiesTimeout,
    onStreamStart,
    onStreamStop,
    onStreamUpdate,
    onStreamInspect,

    /**
     * scanner options
     */
    scanning = true,
    wasmLocation,
    readerOptions,
    scanThrottle,
    negativeDebounce,
    onScanDetect,
    onScanUpdate,
    onScanStart,
    onScanStop,
    onScanClose,
    onRepaint,

    /**
     * reader options
     */
    formats,
    tryHarder,
    tryRotate,
    tryInvert,
    tryDownscale,
    binarizer,
    isPure,
    downscaleThreshold,
    downscaleFactor,
    minLineCount,
    maxNumberOfSymbols,
    tryCode39ExtendedMode,
    validateCode39CheckSum,
    validateITFCheckSum,
    returnCodabarStartEnd,
    returnErrors,
    eanAddOnSymbol,
    textMode,
    characterSet,

    /**
     * inner element props
     */
    overlayCanvasProps,
    frameCanvasProps,

    /**
     * element options
     */
    children,
    ref,
    ...wrapperProps
  }: StreamBarcodeDetectorProps = {}) => {
    const resolvedReaderOptions = useMemo<ReaderOptions>(
      () => ({
        formats: formats ?? readerOptions?.formats,
        tryHarder: tryHarder ?? readerOptions?.tryHarder,
        tryRotate: tryRotate ?? readerOptions?.tryRotate,
        tryInvert: tryInvert ?? readerOptions?.tryInvert,
        tryDownscale: tryDownscale ?? readerOptions?.tryDownscale,
        binarizer: binarizer ?? readerOptions?.binarizer,
        isPure: isPure ?? readerOptions?.isPure,
        downscaleFactor: downscaleFactor ?? readerOptions?.downscaleFactor,
        downscaleThreshold: downscaleThreshold ?? readerOptions?.downscaleThreshold,
        minLineCount: minLineCount ?? readerOptions?.minLineCount,
        maxNumberOfSymbols: maxNumberOfSymbols ?? readerOptions?.maxNumberOfSymbols,
        tryCode39ExtendedMode: tryCode39ExtendedMode ?? readerOptions?.tryCode39ExtendedMode,
        validateCode39CheckSum: validateCode39CheckSum ?? readerOptions?.validateCode39CheckSum,
        validateITFCheckSum: validateITFCheckSum ?? readerOptions?.validateITFCheckSum,
        returnCodabarStartEnd: returnCodabarStartEnd ?? readerOptions?.returnCodabarStartEnd,
        returnErrors: returnErrors ?? readerOptions?.returnErrors,
        eanAddOnSymbol: eanAddOnSymbol ?? readerOptions?.eanAddOnSymbol,
        textMode: textMode ?? readerOptions?.textMode,
        characterSet: characterSet ?? readerOptions?.characterSet,
      }),
      [
        readerOptions,
        formats,
        tryHarder,
        tryRotate,
        tryInvert,
        tryDownscale,
        binarizer,
        isPure,
        downscaleFactor,
        downscaleThreshold,
        minLineCount,
        maxNumberOfSymbols,
        tryCode39ExtendedMode,
        validateCode39CheckSum,
        validateITFCheckSum,
        returnCodabarStartEnd,
        returnErrors,
        eanAddOnSymbol,
        textMode,
        characterSet,
      ],
    );

    const streamVideoRefCallback = useUserMediaStream({
      streaming,
      initConstraints,
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
      onStreamStart,
      onStreamStop,
      onStreamUpdate,
      onStreamInspect,
    });

    const {
      videoRefCallback: scannerVideoRefCallback,
      overlayCanvasElementRef,
      frameCanvasElementRef,
    } = useVideoScanner({
      /**
       * scanner options
       */
      scanning,
      wasmLocation,
      readerOptions: resolvedReaderOptions,
      scanThrottle,
      negativeDebounce,
      onScanDetect,
      onScanUpdate,
      onScanStart,
      onScanStop,
      onScanClose,
      onRepaint,
    });

    const videoElementRef = useRef(document.createElement("video"));

    useEffect(() => {
      streamVideoRefCallback(videoElementRef.current);
      scannerVideoRefCallback(videoElementRef.current);
    }, [streamVideoRefCallback, scannerVideoRefCallback]);

    return (
      <div className={wrapperClass} ref={ref} {...wrapperProps}>
        <canvas className={frameClass} ref={frameCanvasElementRef} {...frameCanvasProps}>
          {frameCanvasProps?.children}
        </canvas>
        <canvas className={overlayClass} ref={overlayCanvasElementRef} {...overlayCanvasProps}>
          {overlayCanvasProps?.children}
        </canvas>
        {children}
      </div>
    );
  },
);

export default StreamBarcodeDetector;
