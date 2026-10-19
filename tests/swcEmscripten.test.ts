import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { expect, test } from "vitest";
import { swcEmscripten } from "../scripts/swc-emscripten.js";

const transform = swcEmscripten().transform as (
  code: string,
  id: string,
) => Promise<{ code: string; map?: string } | undefined>;

test("exception stack access works without Array.at and preserves the stack", async () => {
  const source = `
    var exceptionCaught = [{excPtr: 7}, {excPtr: 9}];
    var text = "exceptionCaught.at(-1)";
    var custom = {at() {return 23}};
    globalThis.result = [exceptionCaught.at(-1).excPtr,
      exceptionCaught.length, custom.at(-1), text];
  `;
  const context = vm.createContext({});
  vm.runInContext("Array.prototype.at = undefined", context);
  expect(() => vm.runInContext(source, context)).toThrow();
  const output = await transform(source, "/src/full/zxing_full.js");
  vm.runInContext(output!.code, context);
  expect(context.result).toEqual([9, 2, 23, "exceptionCaught.at(-1)"]);
  expect(vm.runInContext("typeof Array.prototype.at", context)).toBe(
    "undefined",
  );
  expect(JSON.parse(output!.map!).sources).toContain("/src/full/zxing_full.js");
});

test("other modules and unsupported method calls are left unchanged", async () => {
  expect(
    await transform("exceptionCaught.at(-1)", "/src/application.js"),
  ).toBeUndefined();
  const output = await transform(
    "exceptionCaught.at(-2); exceptionCaught.at(...[-1]); other.at(-1)",
    "/src/reader/zxing_reader.js",
  );
  expect(output!.code.match(/\.at\(/g)).toHaveLength(3);
});

test.each(["reader", "writer", "full"])(
  "%s factory has no remaining Array.at dependency after transformation",
  async (entry) => {
    const file = new URL(`../src/${entry}/zxing_${entry}.js`, import.meta.url);
    const source = await readFile(file, "utf8");
    const output = await transform(source, file.pathname);
    expect(output!.code).not.toMatch(/\.at\s*\(/);
    expect(output!.code).not.toContain("import.meta");
    expect(output!.code).toContain("export default");
  },
);
