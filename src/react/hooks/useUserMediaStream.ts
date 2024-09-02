import {
  type RefCallback,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type UserMediaStream,
  type UserMediaStreamOptions,
  attachMediaStream,
  createUserMediaStream,
} from "../../stream/index.js";

export interface UseUserMediaStreamOptions extends UserMediaStreamOptions {
  /**
   * control the activation of streaming
   */
  streaming?: boolean;
}

export function useUserMediaStream({
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
}: UseUserMediaStreamOptions) {
  const userMediaStreamRef = useRef<UserMediaStream>(
    createUserMediaStream({
      initConstraints,
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
      onStreamStart,
      onStreamStop,
      onStreamUpdate,
      onStreamInspect,
    }),
  );

  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      if (streaming) {
        const stream = await userMediaStreamRef.current.start();
        setStream(stream);
        userMediaStreamRef.current.inspect();
      } else {
        await userMediaStreamRef.current.stop();
        setStream(null);
      }
    })();
  }, [streaming]);

  const videoRefCallback = useCallback<RefCallback<HTMLVideoElement>>(
    (videoElement) => {
      if (stream !== null && videoElement !== null) {
        attachMediaStream(videoElement, stream);
        videoElement.play();
      }
    },
    [stream],
  );

  useEffect(() => {
    userMediaStreamRef.current.setOptions({
      initConstraints,
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
      onStreamStart,
      onStreamStop,
      onStreamUpdate,
      onStreamInspect,
    });
  }, [
    initConstraints,
    videoConstraints,
    audioConstraints,
    getCapabilitiesTimeout,
    onStreamStart,
    onStreamStop,
    onStreamUpdate,
    onStreamInspect,
  ]);

  return videoRefCallback;
}
