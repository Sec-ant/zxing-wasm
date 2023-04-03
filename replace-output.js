#!/usr/bin/env node
import replace from "replace-in-file";
const { npm_package_version } = process.env;
const options = {
  files: [
    "dist/**/zxing_reader.js",
    "dist/**/zxing_writer.js",
    "dist/**/zxing_full.js",
  ],
  from: [
    /(?<=URL\()"\/reader\/zxing_reader\.wasm",\s*self\.location(?=\))/g,
    /(?<=URL\()"\/writer\/zxing_writer\.wasm",\s*self\.location(?=\))/g,
    /(?<=URL\()"\/full\/zxing_full\.wasm",\s*self\.location(?=\))/g,
  ],
  to: [
    `"https://cdn.jsdelivr.net/npm/@sec-ant/zxing-wasm@${npm_package_version}/dist/reader/zxing_reader.wasm"`,
    `"https://cdn.jsdelivr.net/npm/@sec-ant/zxing-wasm@${npm_package_version}/dist/writer/zxing_writer.wasm"`,
    `"https://cdn.jsdelivr.net/npm/@sec-ant/zxing-wasm@${npm_package_version}/dist/full/zxing_full.wasm"`,
  ],
};
replace.sync(options);
