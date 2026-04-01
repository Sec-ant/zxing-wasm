import type { Plugin } from "vite";

// --- Constants ---
const EMSCRIPTEN_JS_FILTER = /zxing_(reader|writer|full)\.js$/;

// --- Logging ---
function logResults(
  filename: string,
  results: {
    declared: boolean;
    checked: boolean;
    scriptNamePatched: boolean;
    findWasmBinaryPatched: boolean;
    entriesTransformed: number;
  },
) {
  const relativeFilename = filename.replace(`${process.cwd()}/`, "");
  const prefix = "\x1b[1mEmscripten JS Patch\x1b[0m";
  const fileInfo = `\x1b[90m(${relativeFilename})\x1b[0m`;

  const logs: { level: "log" | "error"; message: string }[] = [];
  let allPatchesSuccessful = true;

  const addLog = (
    level: "log" | "error",
    icon: string,
    color: string,
    message: string,
  ) => {
    logs.push({
      level,
      message: `${prefix} ${color}${icon} ${fileInfo}\x1b[0m: ${message}`,
    });
  };

  if (!results.declared) {
    addLog("error", "❗️", "\x1b[33m", "Bun environment variable not declared");
    allPatchesSuccessful = false;
  }
  if (!results.checked) {
    addLog("error", "❗️", "\x1b[33m", "Bun environment check not added");
    allPatchesSuccessful = false;
  }
  if (!results.findWasmBinaryPatched) {
    addLog("error", "❗️", "\x1b[33m", "findWasmBinary function not patched");
    allPatchesSuccessful = false;
  }
  if (!results.scriptNamePatched) {
    addLog("error", "❗️", "\x1b[33m", "_scriptName variable not patched");
    allPatchesSuccessful = false;
  }

  if (results.entriesTransformed > 0) {
    addLog(
      "log",
      "🔄",
      "\x1b[36m",
      `Transformed ${results.entriesTransformed} .entries() loop(s) to for-loops`,
    );
  }

  if (allPatchesSuccessful) {
    addLog("log", "✅", "\x1b[32m", "All patches applied successfully");
  } else {
    addLog("error", "❌", "\x1b[31m", "One or more patches failed");
  }

  for (const log of logs) {
    console[log.level](log.message);
  }
}

// --- Brace-matching helper ---

/**
 * Given code and an index pointing at an opening `{`,
 * returns the index of the matching closing `}`.
 * Returns -1 if no match found.
 */
function findMatchingBrace(code: string, openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < code.length; i++) {
    if (code[i] === "{") depth++;
    else if (code[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// --- For-of .entries() replacement ---

/**
 * Replaces `for(let/var [indexVar, valueVar] of arrayExpr.entries()){ body }`
 * with `{const _arrN = arrayExpr; for(let indexVar = 0; indexVar < _arrN.length; ++indexVar){ const valueVar = _arrN[indexVar]; body }}`
 */
function replaceEntriesLoops(code: string): {
  code: string;
  count: number;
} {
  const pattern = /for\((let|var)\[(\w+),(\w+)\]of (\w+)\.entries\(\)\)\{/g;
  let result = code;
  let count = 0;
  let tempVarCounter = 0;

  // Process from the end of the string to avoid index shifting
  const matches: {
    fullMatch: string;
    index: number;
    indexVar: string;
    valueVar: string;
    arrayExpr: string;
  }[] = [];

  let m: RegExpExecArray | null;
  while ((m = pattern.exec(code)) !== null) {
    matches.push({
      fullMatch: m[0],
      index: m.index,
      indexVar: m[2],
      valueVar: m[3],
      arrayExpr: m[4],
    });
  }

  // Process matches in reverse order to preserve indices
  for (let mi = matches.length - 1; mi >= 0; mi--) {
    const match = matches[mi];
    const openBraceIndex = match.index + match.fullMatch.length - 1;
    const closeBraceIndex = findMatchingBrace(result, openBraceIndex);

    if (closeBraceIndex === -1) continue;

    const body = result.substring(openBraceIndex + 1, closeBraceIndex);
    const tempVar = `_arr${tempVarCounter > 0 ? tempVarCounter : ""}`;
    tempVarCounter++;

    const replacement =
      `{const ${tempVar}=${match.arrayExpr};` +
      `for(let ${match.indexVar}=0;${match.indexVar}<${tempVar}.length;++${match.indexVar}){` +
      `const ${match.valueVar}=${tempVar}[${match.indexVar}];` +
      `${body}}}`;

    result =
      result.substring(0, match.index) +
      replacement +
      result.substring(closeBraceIndex + 1);
    count++;
  }

  return { code: result, count };
}

// --- Vite Plugin ---

/**
 * A Vite plugin to patch Emscripten-generated JavaScript files.
 * Replaces the Babel-based approach with simple string replacements.
 *
 * Patches applied:
 * 1. Declares `ENVIRONMENT_IS_BUN` based on `typeof Bun`.
 * 2. Adds `ENVIRONMENT_IS_BUN` to the environment check logic.
 * 3. Removes the initializer from `var _scriptName = import.meta.url;`.
 * 4. Patches `findWasmBinary` to only use `locateFile` (removes `new URL` fallback).
 * 5. Transforms `for-of` + `.entries()` loops to traditional `for` loops.
 */
export function emscriptenPatch(): Plugin {
  return {
    name: "vite-plugin-emscripten-patch",
    transform(code, id) {
      if (!EMSCRIPTEN_JS_FILTER.test(id)) return;

      let patched = code;
      const results = {
        declared: false,
        checked: false,
        scriptNamePatched: false,
        findWasmBinaryPatched: false,
        entriesTransformed: 0,
      };

      // --- Patch 1: Declare ENVIRONMENT_IS_BUN after ENVIRONMENT_IS_WEB ---
      const envWebDecl = "var ENVIRONMENT_IS_WEB=";
      const envWebIdx = patched.indexOf(envWebDecl);
      if (envWebIdx !== -1) {
        // Find the end of the ENVIRONMENT_IS_WEB declaration (next semicolon)
        const semiIdx = patched.indexOf(";", envWebIdx);
        if (semiIdx !== -1) {
          const insertPoint = semiIdx + 1;
          patched =
            patched.substring(0, insertPoint) +
            'var ENVIRONMENT_IS_BUN=typeof Bun!=="undefined";' +
            patched.substring(insertPoint);
          results.declared = true;
        }
      }

      // --- Patch 2: Add ENVIRONMENT_IS_BUN to environment check ---
      // Targets: `ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER` (first occurrence only)
      const envCheck = "ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER";
      const envCheckIdx = patched.indexOf(envCheck);
      if (envCheckIdx !== -1) {
        patched =
          patched.substring(0, envCheckIdx) +
          "ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER||ENVIRONMENT_IS_BUN" +
          patched.substring(envCheckIdx + envCheck.length);
        results.checked = true;
      }

      // --- Patch 3: Remove _scriptName = import.meta.url initializer ---
      const scriptNameInit = "var _scriptName=import.meta.url;";
      if (patched.includes(scriptNameInit)) {
        patched = patched.replace(scriptNameInit, "var _scriptName;");
        results.scriptNamePatched = true;
      }

      // --- Patch 4: Patch findWasmBinary to only use locateFile ---
      // Pattern: function findWasmBinary(){if(Module["locateFile"]){return locateFile("XXX.wasm")}return new URL("XXX.wasm",import.meta.url).href}
      // Replace: function findWasmBinary(){return locateFile("XXX.wasm")}
      const findWasmPattern =
        /function findWasmBinary\(\)\{if\(Module\["locateFile"\]\)\{return (locateFile\("[^"]+\.wasm"\))\}return new URL\("[^"]+\.wasm",import\.meta\.url\)\.href\}/;
      const findWasmMatch = patched.match(findWasmPattern);
      if (findWasmMatch) {
        patched = patched.replace(
          findWasmMatch[0],
          `function findWasmBinary(){return ${findWasmMatch[1]}}`,
        );
        results.findWasmBinaryPatched = true;
      }

      // --- Patch 5: Transform for-of + .entries() to traditional for loops ---
      const entriesResult = replaceEntriesLoops(patched);
      patched = entriesResult.code;
      results.entriesTransformed = entriesResult.count;

      logResults(id, results);

      if (patched === code) return;
      return { code: patched, map: null };
    },
  };
}
