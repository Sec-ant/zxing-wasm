import { style } from "@vanilla-extract/css";

export const wrapperClass = style({
  display: "grid",
  alignItems: "center",
  justifyContent: "center",
});

const canvasClass = style({
  gridArea: "1 / 1",
  maxWidth: "100%",
  maxHeight: "100%",
});

export const frameClass = canvasClass;

export const overlayClass = style([
  canvasClass,
  {
    pointerEvents: "none",
  },
]);
