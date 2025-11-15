import type { RequireExactlyOne } from "type-fest";

export interface RequestData<T extends (...args: never[]) => unknown> {
  // id: ArrayBuffer;
  parameters: Parameters<T>;
}

export type ResponseData<T = unknown, E = unknown> = RequireExactlyOne<
  {
    // id: ArrayBuffer;
    return: T;
    error: E;
  },
  "return" | "error"
>;
