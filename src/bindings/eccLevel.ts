export const writeInputEccLevels = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8] as const;

export type WriteInputEccLevel = (typeof writeInputEccLevels)[number];

export const readOutputEccLevels = ["L", "M", "Q", "H"] as const;

export type ReadOutputEccLevel = (typeof readOutputEccLevels)[number];
