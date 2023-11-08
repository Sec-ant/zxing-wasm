/**
 * @internal
 */
export interface ZXingPoint {
  x: number;
  y: number;
}

/**
 * @internal
 */
export interface ZXingPosition {
  topLeft: ZXingPoint;
  topRight: ZXingPoint;
  bottomLeft: ZXingPoint;
  bottomRight: ZXingPoint;
}

export interface Point extends ZXingPoint {}

export interface Position {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}
