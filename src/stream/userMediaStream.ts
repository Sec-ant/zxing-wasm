import compare from "just-compare";
import type { SetRequired } from "type-fest";
import { subscribeWithSelector } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createStore } from "zustand/vanilla";
import { shimGetUserMedia } from "./shimGetUserMedia.js";

/**
 * The default maximum time in milliseconds to wait for getting the capabilities of a media track.
 */
const GET_CAPABILITIES_TIMEOUT = 500;

/**
 * Media stream constraints for initialization.
 *
 * This can either be a standard `MediaStreamConstraints` object or a function that returns
 * `MediaStreamConstraints`. The function is provided with an argument,
 * `MediaTrackSupportedConstraints`, which represents constraints supported by the **user agent**,
 * and should return either `MediaStreamConstraints` or a promise that resolves to it.
 *
 * Note that `MediaTrackSupportedConstraints` doesn't reflect the constraints supported by the
 * device. It only provides information about which constraint can be understood by the user agent.
 *
 * - [`MediaStreamConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia#constraints)
 * - [`MediaTrackSupportedConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackSupportedConstraints)
 */
export type InitConstraints =
  | MediaStreamConstraints
  | ((
      supportedConstraints: MediaTrackSupportedConstraints,
    ) => MediaStreamConstraints | Promise<MediaStreamConstraints>);

/**
 * Media track constraints specific to video tracks.
 *
 * Can be a `MediaTrackConstraints` object or a function that returns `MediaTrackConstraints`. The
 * function is provided with an argument, `MediaTrackCapabilities`, which reprensents the media
 * track capabilities, and should return either `MediaTrackConstraints` or a promise that resolves
 * to it.
 *
 * Unlike `MediaTrackSupportedConstraints`, `MediaTrackCapabilities` provides the accurate
 * information of the track capabilities supported by your device.
 *
 * - [`MediaTrackConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
 * - [`MediaTrackCapabilities`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities#return_value)
 */
export type VideoConstraints =
  | MediaTrackConstraints
  | undefined
  | ((
      capabilities: MediaTrackCapabilities,
    ) =>
      | MediaTrackConstraints
      | undefined
      | Promise<MediaTrackConstraints | undefined>);

/**
 * Media track constraints specific to audio tracks.
 *
 * Can be a `MediaTrackConstraints` object or a function that returns `MediaTrackConstraints`. The
 * function is provided with an argument, `MediaTrackCapabilities`, which reprensents the media
 * track capabilities, and should return either `MediaTrackConstraints` or a promise that resolves
 * to it.
 *
 * Unlike `MediaTrackSupportedConstraints`, `MediaTrackCapabilities` provides the accurate
 * information of the track capabilities supported by your device.
 *
 * - [`MediaTrackConstraints`](https://developer.mozilla.org/en-US/docs/Web/API/MediaTrackConstraints)
 * - [`MediaTrackCapabilities`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities#return_value)
 */
export type AudioConstraints =
  | MediaTrackConstraints
  | undefined
  | ((
      capabilities: MediaTrackCapabilities,
    ) =>
      | MediaTrackConstraints
      | undefined
      | Promise<MediaTrackConstraints | undefined>);

/**
 * Details the result of a "start" action, including the options used, and the resulting media stream.
 */
interface StartActionResult {
  type: "start";
  options: StartMediaStreamOptions;
  stream: MediaStream;
}

/**
 * Details the result of an "inspect" action, including options used, the media stream inspected,
 * and the capabilities of video and audio tracks.
 */
interface InspectActionResult {
  type: "inspect";
  options: InspectMediaStreamOptions;
  stream: MediaStream;
  videoTracksCapabilities: MediaTrackCapabilities[];
  audioTracksCapabilities: MediaTrackCapabilities[];
}

/**
 * Details the result of a "constrain" action, including the options used and the constrained media stream.
 */
interface ConstrainActionResult {
  type: "constrain";
  options: ConstrainMediaStreamOptions;
  stream: MediaStream;
}

/**
 * Represents the result of a "stop" action.
 */
interface StopActionResult {
  type: "stop";
}

/**
 * Union type representing the possible outcomes of actions performed on a media stream.
 */
type ActionResult =
  | StartActionResult
  | InspectActionResult
  | ConstrainActionResult
  | StopActionResult;

/**
 * Configuration options for the UserMediaStream object, including constraints for initialization,
 * video, and audio tracks, a timeout for capability retrieval, and callbacks for stream lifecycle events.
 */
export interface UserMediaStreamOptions {
  /**
   * Media stream constraints for initialization.
   */
  initConstraints?: InitConstraints;
  /**
   * Media track constraints specific to video tracks.
   */
  videoConstraints?: VideoConstraints;
  /**
   * Media track constraints specific to audio tracks.
   */
  audioConstraints?: AudioConstraints;
  /**
   * The default maximum time (in milliseconds) to wait for getting the capabilities of a media
   * track.
   */
  getCapabilitiesTimeout?: number;
  /**
   * Callback function that is triggered when the stream starts.
   *
   * @param stream - Media stream
   */
  onStreamStart?: (stream: MediaStream) => unknown;
  /**
   * Callback function that is triggered when the stream stops.
   */
  onStreamStop?: () => unknown;
  /**
   * Callback function that is triggered on each application of constraints.
   *
   * @param stream - Media stream
   */
  onStreamUpdate?: (stream: MediaStream) => unknown;
  /**
   * Callback function that is triggered when the stream is inspected.
   *
   * @param streamCapablities - User media stream capabilities
   */
  onStreamInspect?: (
    streamCapablities?: UserMediaStreamCapabilities,
  ) => unknown;
}

/**
 * Represents the capabilities of video and audio tracks within a user media stream.
 */
export interface UserMediaStreamCapabilities {
  videoTracksCapabilities: MediaTrackCapabilities[];
  audioTracksCapabilities: MediaTrackCapabilities[];
}

/**
 * Interface for controlling and interacting with a user media stream, including starting,
 * inspecting, stopping the stream, and updating configuration options.
 */
export interface UserMediaStream {
  start: () => Promise<MediaStream>;
  inspect: () => Promise<UserMediaStreamCapabilities | undefined>;
  stop: () => Promise<void>;
  setOptions: (userMediaStreamOptions: UserMediaStreamOptions) => void;
}

/**
 * Resolved options for the UserMediaStream with default values provided.
 */
type ResolvedUserMediaStreamOptions = SetRequired<
  UserMediaStreamOptions,
  "initConstraints" | "getCapabilitiesTimeout"
>;

/**
 * Resolves and merges the provided UserMediaStreamOptions with default values for unspecified options.
 *
 * @param userMediaStreamOptions - The user-provided configuration options for the UserMediaStream.
 * @returns The resolved configuration options with default values for unspecified options.
 */
function resolveUserMediaStreamOptions(
  userMediaStreamOptions: UserMediaStreamOptions,
): ResolvedUserMediaStreamOptions {
  return {
    initConstraints: userMediaStreamOptions.initConstraints ?? {
      video: true,
      audio: false,
    },
    videoConstraints:
      "videoConstraints" in userMediaStreamOptions
        ? userMediaStreamOptions.videoConstraints
        : undefined,
    audioConstraints:
      "audioConstraints" in userMediaStreamOptions
        ? userMediaStreamOptions.audioConstraints
        : undefined,
    getCapabilitiesTimeout:
      userMediaStreamOptions.getCapabilitiesTimeout ?? GET_CAPABILITIES_TIMEOUT,
    onStreamStart:
      "onStreamStart" in userMediaStreamOptions
        ? userMediaStreamOptions.onStreamStart
        : undefined,
    onStreamStop:
      "onStreamStop" in userMediaStreamOptions
        ? userMediaStreamOptions.onStreamStop
        : undefined,
    onStreamUpdate:
      "onStreamUpdate" in userMediaStreamOptions
        ? userMediaStreamOptions.onStreamUpdate
        : undefined,
    onStreamInspect:
      "onStreamInspect" in userMediaStreamOptions
        ? userMediaStreamOptions.onStreamInspect
        : undefined,
  };
}

/**
 * Creates and returns a UserMediaStream object with the specified configuration options.
 * Provides methods to start, inspect, and stop the media stream, as well as to update its options.
 *
 * @param userMediaStreamOptions - Optional configuration options for the UserMediaStream.
 * @returns An object providing control methods for managing a user media stream.
 */
export function createUserMediaStream(
  userMediaStreamOptions: UserMediaStreamOptions = {},
): UserMediaStream {
  const {
    initConstraints,
    videoConstraints,
    audioConstraints,
    getCapabilitiesTimeout,
    onStreamStart,
    onStreamStop,
    onStreamUpdate,
    onStreamInspect,
  } = resolveUserMediaStreamOptions(userMediaStreamOptions);

  // initialize a queue
  let queue: Promise<ActionResult> = Promise.resolve({
    type: "stop",
  });

  // queueify start
  const queuefiedStart = async (
    startMediaStreamOptions: StartMediaStreamOptions,
  ) => {
    // update the queue
    queue = queue.then((prevActionResult) => {
      switch (prevActionResult.type) {
        // previous action is a start action
        case "start": {
          // if options are the same, reuse the previous action result
          if (compare(prevActionResult.options, startMediaStreamOptions)) {
            return prevActionResult;
          }
          // otherwise stop and then start
          return stopMediaStream(prevActionResult.stream).then(() =>
            startMediaStream(startMediaStreamOptions),
          );
        }
        // previous action is an inspect action
        case "inspect": {
          // stop and then start
          return stopMediaStream(prevActionResult.stream).then(() =>
            startMediaStream(startMediaStreamOptions),
          );
        }
        // previous action is a constrain action
        case "constrain": {
          // stop and then start
          return stopMediaStream(prevActionResult.stream).then(() =>
            startMediaStream(startMediaStreamOptions),
          );
        }
        // previous action is a stop action
        case "stop": {
          // just start
          return startMediaStream(startMediaStreamOptions);
        }
        // unknown action
        default: {
          throw new TypeError(
            `Unknown action result: ${prevActionResult satisfies never}`,
          );
        }
      }
    });
    // execute the queue and get the result
    const actionResult = (await queue) as StartActionResult;
    // return the stream
    return actionResult.stream;
  };

  // queueify inspect
  const queuefiedInspect = async (
    inspectMediaStreamOptions: InspectMediaStreamOptions,
  ) => {
    // update the queue
    queue = queue.then((prevActionResult) => {
      switch (prevActionResult.type) {
        // previous action is a start action
        case "start": {
          // just inspect
          return inspectMediaStream(
            prevActionResult.stream,
            inspectMediaStreamOptions,
          );
        }
        // previous action is an inspect action
        case "inspect": {
          // if options are the same, reuse the previous action result
          if (compare(prevActionResult.options, inspectMediaStreamOptions)) {
            return prevActionResult;
          }
          // otherwise just inspect
          return inspectMediaStream(
            prevActionResult.stream,
            inspectMediaStreamOptions,
          );
        }
        // previous action is a constrain action
        case "constrain": {
          // just inspect
          return inspectMediaStream(
            prevActionResult.stream,
            inspectMediaStreamOptions,
          );
        }
        // previous action is a stop action
        case "stop": {
          // we cannot inspect a stopped stream
          // so do nothing and reuse the previous action
          return prevActionResult;
        }
        // unknown action
        default: {
          throw new TypeError(
            `Unknown action result: ${prevActionResult satisfies never}`,
          );
        }
      }
    });
    // execute the queue and get the result
    const actionResult = await queue;
    if (actionResult.type === "inspect") {
      // return the stream if it is not stopped
      return {
        videoTracksCapabilities: actionResult.videoTracksCapabilities,
        audioTracksCapabilities: actionResult.audioTracksCapabilities,
      };
    }
  };

  // queueify constrain
  const queuefiedConstrain = async (
    constrainMediaStreamOptions: ConstrainMediaStreamOptions,
  ) => {
    // update the queue
    queue = queue.then((prevActionResult) => {
      switch (prevActionResult.type) {
        // previous action is a start action
        case "start": {
          // just apply constraints
          return constrainMediaStream(
            prevActionResult.stream,
            constrainMediaStreamOptions,
          );
        }
        // previous action is an inspect action
        case "inspect": {
          // just apply constraints
          return constrainMediaStream(
            prevActionResult.stream,
            constrainMediaStreamOptions,
          );
        }
        // previous action is a constrain action
        case "constrain": {
          // if options are the same, reuse the previous action result
          if (compare(prevActionResult.options, constrainMediaStreamOptions)) {
            return prevActionResult;
          }
          // otherwise just apply constraints
          return constrainMediaStream(
            prevActionResult.stream,
            constrainMediaStreamOptions,
          );
        }
        // previous action is a stop action
        case "stop": {
          // we cannot apply constraints to a stopped stream
          // so do nothing and reuse the previous action
          return prevActionResult;
        }
        // unknown action
        default: {
          throw new TypeError(
            `Unknown action result: ${prevActionResult satisfies never}`,
          );
        }
      }
    });
    // execute the queue and get the result
    const actionResult = await queue;
    if (actionResult.type === "constrain") {
      // return the stream if it is not stopped
      return actionResult.stream;
    }
  };

  // queueify stop
  const queuefiedStop = async () => {
    queue = queue.then((prevActionResult) => {
      switch (prevActionResult.type) {
        // previous action is a start action
        case "start": {
          // just stop the stream
          return stopMediaStream(prevActionResult.stream);
        }
        // previous action is an inspect action
        case "inspect": {
          // just stop the stream
          return stopMediaStream(prevActionResult.stream);
        }
        // previous action is a constrain action
        case "constrain": {
          // just stop the stream
          return stopMediaStream(prevActionResult.stream);
        }
        // previous action is a stop action
        case "stop": {
          // reuse the previous action
          return prevActionResult;
        }
        // unknown action
        default: {
          throw new TypeError(
            `Unknown action result: ${prevActionResult satisfies never}`,
          );
        }
      }
    });
    // execute the queue
    await queue;
  };

  // create a state store
  const userMediaStreamStore = createStore<ResolvedUserMediaStreamOptions>()(
    subscribeWithSelector<ResolvedUserMediaStreamOptions>(() => ({
      initConstraints,
      videoConstraints,
      audioConstraints,

      getCapabilitiesTimeout,

      onStreamStart,
      onStreamStop,
      onStreamUpdate,
      onStreamInspect,
    })),
  );

  // invoke constrain when constraints update
  userMediaStreamStore.subscribe(
    (options) => [options.videoConstraints, options.audioConstraints] as const,
    async ([videoConstraints, audioConstraints]) => {
      const { getCapabilitiesTimeout, onStreamUpdate } =
        userMediaStreamStore.getState();
      const stream = await queuefiedConstrain({
        videoConstraints,
        audioConstraints,
        getCapabilitiesTimeout,
      });
      stream && onStreamUpdate?.(stream);
      return stream;
    },
    { equalityFn: shallow },
  );

  // the exposed control function to start a stream
  const start = async () => {
    const {
      initConstraints,
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
      onStreamStart,
    } = userMediaStreamStore.getState();
    const stream = await queuefiedStart({
      initConstraints,
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
    });
    onStreamStart?.(stream);
    return stream;
  };

  // the exposed inspect function to inspect a stream
  const inspect = async () => {
    const { getCapabilitiesTimeout, onStreamInspect } =
      userMediaStreamStore.getState();
    const streamCapablities = await queuefiedInspect({
      getCapabilitiesTimeout,
    });
    onStreamInspect?.(streamCapablities ? { ...streamCapablities } : undefined);
    return streamCapablities;
  };

  // the exposed control function to stop a stream
  const stop = async () => {
    const { onStreamStop } = userMediaStreamStore.getState();
    await queuefiedStop();
    onStreamStop?.();
  };

  // return the exposed control functions
  return {
    start,
    inspect,
    stop,
    setOptions: (userMediaStreamOptions) =>
      userMediaStreamStore.setState(
        resolveUserMediaStreamOptions(userMediaStreamOptions),
      ),
  };
}

interface StartMediaStreamOptions {
  initConstraints: InitConstraints;
  videoConstraints?: VideoConstraints;
  audioConstraints?: AudioConstraints;
  getCapabilitiesTimeout: number;
}

/**
 * Start a media stream with specified constraints.
 *
 * This function does some checks mainly for compatibility.
 *
 * @param startMediaStreamOptions - The constraints (initial, video, and audio) to apply along with
 *   meta configuration options.
 * @returns A promise that resolves to an StartActionResult for later queueing.
 */
async function startMediaStream({
  initConstraints,
  videoConstraints,
  audioConstraints,
  getCapabilitiesTimeout,
}: StartMediaStreamOptions): Promise<StartActionResult> {
  // check if we are in the secure context
  if (window.isSecureContext !== true) {
    throw new DOMException(
      "Cannot use navigator.mediaDevices in insecure contexts. Please use HTTPS or localhost.",
      "NotAllowedError",
    );
  }

  // check if we can use the getUserMedia API
  if (navigator.mediaDevices?.getUserMedia === undefined) {
    throw new DOMException(
      "The method navigator.mediaDevices.getUserMedia is not defined. Does your runtime support this API?",
      "NotSupportedError",
    );
  }

  // shim WebRTC APIs in the client runtime
  await shimGetUserMedia();

  // resolve initial constraints
  const resolvedInitConstraints =
    typeof initConstraints === "function"
      ? // callback constraints
        await initConstraints(navigator.mediaDevices.getSupportedConstraints())
      : initConstraints;

  // apply initial constraints and get the media stream
  const stream = await navigator.mediaDevices.getUserMedia(
    resolvedInitConstraints,
  );

  // apply video and audio constraints
  await constrainMediaStream(stream, {
    videoConstraints,
    audioConstraints,
    getCapabilitiesTimeout,
  });

  return {
    type: "start",
    options: {
      initConstraints,
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
    },
    stream: stream,
  };
}

interface ConstrainMediaStreamOptions {
  videoConstraints?: VideoConstraints;
  audioConstraints?: AudioConstraints;
  getCapabilitiesTimeout: number;
}

/**
 * Apply video and audio constraints to a given media stream.
 *
 * This function processes both video and audio tracks of the media stream, applying the specified
 * constraints to each kind of tracks.
 *
 * @param stream - The MediaStream to which constraints will be applied.
 * @param constrainMediaStreamOptions - The video and audio constraints to apply along with meta
 *   configuration options.
 * @returns A promise that resolves to a ConstrainActionResult for later queueing.
 */
async function constrainMediaStream(
  stream: MediaStream,
  {
    videoConstraints,
    audioConstraints,
    getCapabilitiesTimeout,
  }: ConstrainMediaStreamOptions,
): Promise<ConstrainActionResult> {
  // get video tracks
  const videoTracks = stream.getVideoTracks();

  // get audio tracks
  const audioTracks = stream.getAudioTracks();

  // apply media track constraints
  await Promise.all([
    // apply video constraints
    Promise.all(
      videoTracks.map(async (videoTrack) => {
        const resolvedVideoConstraints =
          typeof videoConstraints === "function"
            ? // callback constraints
              await videoConstraints(
                await getCapabilities(videoTrack, getCapabilitiesTimeout),
              )
            : videoConstraints;
        await videoTrack.applyConstraints(resolvedVideoConstraints);
      }),
    ),
    // apply audio constraints
    Promise.all(
      audioTracks.map(async (audioTrack) => {
        const resolvedAudioConstraints =
          typeof audioConstraints === "function"
            ? // callback constraints
              await audioConstraints(
                await getCapabilities(audioTrack, getCapabilitiesTimeout),
              )
            : audioConstraints;
        await audioTrack.applyConstraints(resolvedAudioConstraints);
      }),
    ),
  ]);

  return {
    type: "constrain",
    options: {
      videoConstraints,
      audioConstraints,
      getCapabilitiesTimeout,
    },
    stream,
  };
}

interface InspectMediaStreamOptions {
  getCapabilitiesTimeout: number;
}

async function inspectMediaStream(
  stream: MediaStream,
  { getCapabilitiesTimeout }: InspectMediaStreamOptions,
): Promise<InspectActionResult> {
  // get video tracks
  const videoTracks = stream.getVideoTracks();

  // get audio tracks
  const audioTracks = stream.getAudioTracks();

  const [videoTracksCapabilities, audioTracksCapabilities] = await Promise.all([
    Promise.all(
      videoTracks.map(async (videoTrack) =>
        getCapabilities(videoTrack, getCapabilitiesTimeout),
      ),
    ),
    Promise.all(
      audioTracks.map(async (audioTrack) =>
        getCapabilities(audioTrack, getCapabilitiesTimeout),
      ),
    ),
  ]);

  return {
    type: "inspect",
    options: {
      getCapabilitiesTimeout,
    },
    stream,
    videoTracksCapabilities,
    audioTracksCapabilities,
  };
}

/**
 * Stop a given media stream.
 *
 * This function stops all tracks of the given media stream. It ensures that the media stream is
 * properly terminated.
 *
 * @param stream - The MediaStream to be stopped.
 * @returns A promise that resolves to a StopActionResult for later queueing.
 */
async function stopMediaStream(stream: MediaStream): Promise<StopActionResult> {
  for (const track of stream.getTracks()) {
    stream.removeTrack(track);
    track.stop();
  }

  return {
    type: "stop",
  };
}

/**
 * Attach a given media stream to a HTMLVideoElement.
 *
 * This function sets the source of the video element to the provided media stream. It supports
 * different ways of attaching the stream based on browser compatibility.
 *
 * @param videoElement - The HTMLVideoElement to which the media stream will be attached.
 * @param stream - The MediaStream to be attached to the video element.
 */
export function attachMediaStream(
  videoElement: HTMLVideoElement,
  stream: MediaStream,
) {
  // attach the stream to the video element
  if (videoElement.srcObject !== undefined) {
    videoElement.srcObject = stream;
  } else if (videoElement.mozSrcObject !== undefined) {
    videoElement.mozSrcObject = stream;
  } else if (window.URL.createObjectURL) {
    videoElement.src = (window.URL.createObjectURL as CreateObjectURLCompat)(
      stream,
    );
  } else if (window.webkitURL) {
    videoElement.src = (
      window.webkitURL.createObjectURL as CreateObjectURLCompat
    )(stream);
  } else {
    videoElement.src = stream.id;
  }
}

/**
 * Asynchronously retrieve the capabilities of a given media stream track.
 *
 * This function attempts to fetch the capabilities of a MediaStreamTrack. If called too early, it
 * may return an empty object as [the capabilities might not be available
 * immediately](https://oberhofer.co/mediastreamtrack-and-its-capabilities/#queryingcapabilities).
 * Because capabilities are allowed to be an empty object, a timeout mechanism is implemented to
 * ensure the function returns even if capabilities are not obtained within the specified time,
 * preventing indefinite waiting.
 *
 * @param track - The MediaStreamTrack whose capabilities are to be fetched.
 * @param timeout - The maximum time (in milliseconds) to wait for fetching capabilities.
 * @returns A promise that resolves to the track's capabilities, which may be an empty object.
 */
export async function getCapabilities(
  track: MediaStreamTrack,
  timeout = GET_CAPABILITIES_TIMEOUT,
): Promise<MediaTrackCapabilities> {
  return new Promise((resolve) => {
    // timeout, return empty capabilities
    let timeoutId: number | undefined = setTimeout(() => {
      resolve({});
      timeoutId = undefined;
      return;
    }, timeout);

    // not supported, return empty capabilities
    if (!track.getCapabilities) {
      clearTimeout(timeoutId);
      resolve({});
      timeoutId = undefined;
      return;
    }

    // poll to check capabilities
    let capabilities: MediaTrackCapabilities = {};
    while (Object.keys(capabilities).length === 0 && timeoutId !== undefined) {
      capabilities = track.getCapabilities();
    }
    clearTimeout(timeoutId);
    resolve(capabilities);
    timeoutId = undefined;
    return;
  });
}
