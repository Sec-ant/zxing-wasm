/**
 * @internal
 */
export interface ZXingVector<T> {
  size: () => number;
  get: (i: number) => T | undefined;
}
