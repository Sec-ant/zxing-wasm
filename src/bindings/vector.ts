/**
 * @internal
 */
export interface ZXingVector<T> {
  delete: () => void;
  size: () => number;
  get: (i: number) => T | undefined;
}
