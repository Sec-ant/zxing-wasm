// TODO: complete constraints and capabilities

declare interface MediaTrackSupportedConstraints {
  brightness?: boolean;
  browserWindow?: boolean;
  colorTemperature?: boolean;
  contrast?: boolean;
  exposureCompensation?: boolean;
  exposureMode?: boolean;
  exposureTime?: boolean;
  focusDistance?: boolean;
  focusMode?: boolean;
  iso?: boolean;
  latency?: boolean;
  mediaSource?: boolean;
  pan?: boolean;
  pointsOfInterest?: boolean;
  resizeMode?: boolean;
  saturation?: boolean;
  scrollWithPage?: boolean;
  sharpness?: boolean;
  suppressLocalAudioPlayback?: boolean;
  tilt?: boolean;
  torch?: boolean;
  viewPortHeight?: boolean;
  viewPortOffsetX?: boolean;
  viewPortOffsetY?: boolean;
  viewportWidth?: boolean;
  whiteBalanceMode?: boolean;
  zoom?: boolean;
}

interface NumberRangeWithStep {
  min: number;
  max: number;
  step: number;
}

declare interface MediaTrackCapabilities {
  brightness?: NumberRangeWithStep;
  colorTemperature?: NumberRangeWithStep;
  contrast?: NumberRangeWithStep;
  exposureMode?: string[];
  exposureTime?: NumberRangeWithStep;
  resizeMode?: string[];
  saturation?: NumberRangeWithStep;
  sharpness?: NumberRangeWithStep;
  whiteBalanceMode?: string[];
}

declare interface MediaTrackConstraintSet {
  brightness?: ConstrainULong;
  colorTemperature?: ConstrainULong;
  contrast?: ConstrainULong;
  exposureMode?: ConstrainDOMString;
  exposureTime?: ConstrainDouble;
  resizeMode?: ConstrainDOMString;
  saturation?: ConstrainULong;
  sharpness?: ConstrainULong;
  whiteBalanceMode?: ConstrainDOMString;
}
