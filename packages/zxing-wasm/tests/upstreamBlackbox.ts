export type UpstreamBlackboxMode = "fast" | "slow" | "pure";

export interface UpstreamBlackboxExpectation {
  type: UpstreamBlackboxMode;
  rotation: number;
  minPassCount: number;
  maxMisreads: number;
}

export interface UpstreamBlackboxContract {
  imageCount: number;
  expectations: UpstreamBlackboxExpectation[];
}

/** Parses the authoritative positive-test thresholds from zxing-cpp. */
export function parseUpstreamBlackboxContracts(
  source: string,
): Map<string, UpstreamBlackboxContract> {
  const contracts = new Map<string, UpstreamBlackboxContract>();
  const runTestsPattern =
    /runTests\("(?<directory>[^"]+)",\s*[^,]+,\s*(?<imageCount>\d+),\s*\{\n(?<cases>[\s\S]*?)\n\t\t\}/g;

  for (const match of source.matchAll(runTestsPattern)) {
    const directory = match.groups?.directory;
    const imageCount = Number(match.groups?.imageCount);
    const cases = match.groups?.cases;
    if (!directory || !cases || !Number.isSafeInteger(imageCount)) {
      throw new Error("Unable to parse zxing-cpp blackbox test configuration");
    }

    const expectations: UpstreamBlackboxExpectation[] = [];
    for (const testCase of cases.matchAll(/\{\s*([^}]+?)\s*\}/g)) {
      const values = testCase[1]!.split(",").map((value) => value.trim());
      const rotationOrMode = values.at(-1);
      if (!rotationOrMode) {
        throw new Error(`Invalid test case in ${directory}`);
      }
      if (rotationOrMode === "pure") {
        if (values.length !== 3) {
          throw new Error(`Invalid pure test case in ${directory}`);
        }
        expectations.push({
          type: "pure",
          rotation: 0,
          minPassCount: Number(values[0]),
          maxMisreads: Number(values[1]),
        });
        continue;
      }
      if (values.length !== 3 && values.length !== 5) {
        throw new Error(`Invalid fast/slow test case in ${directory}`);
      }
      const rotation = Number(rotationOrMode);
      expectations.push(
        {
          type: "fast",
          rotation,
          minPassCount: Number(values[0]),
          maxMisreads: values.length === 5 ? Number(values[2]) : 0,
        },
        {
          type: "slow",
          rotation,
          minPassCount: Number(values[1]),
          maxMisreads: values.length === 5 ? Number(values[3]) : 0,
        },
      );
    }
    contracts.set(directory, { imageCount, expectations });
  }
  return contracts;
}
