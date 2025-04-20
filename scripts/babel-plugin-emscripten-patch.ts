import type { PluginItem, PluginPass } from "@babel/core";
import * as t from "@babel/types";

// --- Constants ---
const ENV_WEB = "ENVIRONMENT_IS_WEB";
const ENV_WORKER = "ENVIRONMENT_IS_WORKER";
const ENV_BUN = "ENVIRONMENT_IS_BUN";
const BUN_IDENTIFIER = "Bun";
const UNDEFINED_STRING = "undefined";
const URL_CONSTRUCTOR = "URL";
const IMPORT_META = "import";
const META_PROPERTY = "meta";
const URL_PROPERTY = "url";
const WASM_FILE_REGEX = /^(zxing_(reader|writer|full))\.wasm$/;
const VITE_IGNORE_COMMENT: t.CommentBlock = {
  type: "CommentBlock",
  value: " @vite-ignore ", // Instructs Vite to not inline the WASM asset
};

// --- Helper Functions ---

/**
 * Checks if a Babel AST node represents the specific pattern:
 * `new URL("<some-wasm-file>.wasm", import.meta.url)`
 * used by Emscripten to locate the WASM file.
 * @param node The Babel AST node to check.
 * @returns True if the node matches the pattern, false otherwise.
 */
function isNewWasmUrlExpression(node: t.Node): node is t.NewExpression {
  return (
    t.isNewExpression(node) &&
    t.isIdentifier(node.callee, { name: URL_CONSTRUCTOR }) &&
    node.arguments.length >= 2 &&
    t.isStringLiteral(node.arguments[0]) && // First argument is a string literal (the filename)
    t.isMemberExpression(node.arguments[1]) && // Second argument is import.meta.url
    t.isMetaProperty(node.arguments[1].object) &&
    t.isIdentifier(node.arguments[1].object.meta, { name: IMPORT_META }) &&
    t.isIdentifier(node.arguments[1].object.property, {
      name: META_PROPERTY,
    }) &&
    t.isIdentifier(node.arguments[1].property, { name: URL_PROPERTY })
  );
}

/**
 * Logs the results of the patching process for the current file being processed by Babel.
 * Uses the PluginPass context (`this`) to access file information and state.
 * @param this The Babel PluginPass instance, providing context like filename and state.
 * @param state An object containing boolean flags indicating whether each patch was applied.
 */
function logPatchResults(
  this: PluginPass,
  state: { declared: boolean; checked: boolean; urlPatched: boolean },
) {
  const filename = this.file.opts.filename ?? "unknown file";
  const relativeFilename = filename.replace(`${process.cwd()}/`, "");
  const prefix = "\x1b[1mEmscripten JS Patch\x1b[0m"; // Bold prefix for visibility
  const fileInfo = `\x1b[90m(${relativeFilename})\x1b[0m`; // Grey filename for context

  const logs: { level: "log" | "error"; message: string }[] = [];
  let allPatchesSuccessful = true;

  // Helper to format log messages consistently
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

  // Check if each specific patch was applied and log errors if not
  if (!state.declared) {
    addLog("error", "❗️", "\x1b[33m", "Bun environment variable not declared");
    allPatchesSuccessful = false;
  }
  if (!state.checked) {
    addLog("error", "❗️", "\x1b[33m", "Bun environment check not added");
    allPatchesSuccessful = false;
  }
  if (!state.urlPatched) {
    addLog("error", "❗️", "\x1b[33m", "WASM URL not patched for Vite");
    allPatchesSuccessful = false;
  }

  // Log overall success or failure for the file
  if (allPatchesSuccessful) {
    addLog("log", "✅", "\x1b[32m", "All patches applied successfully");
  } else {
    // Add a summary error if any patch failed
    addLog("error", "❌", "\x1b[31m", "One or more patches failed");
  }

  // Print all collected logs to the console
  for (const log of logs) {
    console[log.level](log.message);
  }
}

// --- Babel Plugin ---

/**
 * A Babel plugin to patch the Emscripten-generated JavaScript file.
 * It performs the following modifications:
 * 1. Declares `ENVIRONMENT_IS_BUN` based on `typeof Bun`.
 * 2. Adds `ENVIRONMENT_IS_BUN` to the environment check logic.
 * 3. Modifies the `new URL(...)` expression for the WASM file to work correctly with Vite
 *    and adds a `?no-inline` query and `@vite-ignore` comment.
 */
export function emscriptenPatch(): PluginItem {
  return {
    // `pre` runs before traversing the AST for a file.
    pre(this: PluginPass) {
      // Initialize state flags on the PluginPass instance.
      // These flags track whether each specific patch has been applied within the current file.
      // Using `this.set()` stores state specific to the processing of this file.
      this.set("declared", false); // Tracks if ENVIRONMENT_IS_BUN was declared
      this.set("checked", false); // Tracks if the environment check was modified
      this.set("urlPatched", false); // Tracks if the WASM URL was patched
    },
    visitor: {
      // Visitor for VariableDeclaration nodes in the AST.
      VariableDeclaration(path) {
        // Check if we already declared the Bun environment variable in this file.
        if (this.get("declared")) return;

        const declaration = path.node.declarations[0];
        // Target the specific Emscripten variable declaration: `var ENVIRONMENT_IS_WEB = ...;`
        if (
          path.node.kind === "var" &&
          t.isIdentifier(declaration?.id, { name: ENV_WEB })
        ) {
          // Create the AST node for: `var ENVIRONMENT_IS_BUN = typeof Bun !== 'undefined';`
          const bunEnvDeclaration = t.variableDeclaration("var", [
            t.variableDeclarator(
              t.identifier(ENV_BUN),
              t.binaryExpression(
                "!==", // Not strictly equal
                t.unaryExpression("typeof", t.identifier(BUN_IDENTIFIER)), // typeof Bun
                t.stringLiteral(UNDEFINED_STRING), // "undefined"
              ),
            ),
          ]);
          // Insert the new declaration immediately after the ENVIRONMENT_IS_WEB declaration.
          path.insertAfter(bunEnvDeclaration);
          // Mark this patch as completed for the current file.
          this.set("declared", true);
        }
      },
      // Visitor for LogicalExpression nodes (like || and &&).
      LogicalExpression(path) {
        // Check if we already patched the environment check in this file.
        if (this.get("checked")) return;

        const { node } = path;
        // Helper to check if an identifier is ENVIRONMENT_IS_WEB or ENVIRONMENT_IS_WORKER.
        const isWebOrWorker = (id: t.Node): id is t.Identifier =>
          t.isIdentifier(id) && (id.name === ENV_WEB || id.name === ENV_WORKER);

        // Target the specific Emscripten check: `ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER` (or vice-versa).
        if (
          node.operator === "||" &&
          isWebOrWorker(node.left) &&
          isWebOrWorker(node.right) &&
          node.left.name !== node.right.name // Ensure it's WEB || WORKER, not WEB || WEB
        ) {
          // Create the new AST node: `(original_expression || ENVIRONMENT_IS_BUN)`
          const newNode = t.logicalExpression(
            "||",
            node, // The original `ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER`
            t.identifier(ENV_BUN), // || ENVIRONMENT_IS_BUN
          );
          // Replace the original logical expression with the modified one.
          path.replaceWith(newNode);
          // Skip traversing the newly created node to prevent infinite loops.
          path.skip();
          // Mark this patch as completed for the current file.
          this.set("checked", true);
        }
      },
      // Visitor for NewExpression nodes (like `new URL(...)`).
      NewExpression(path) {
        // Check if we already patched the WASM URL in this file.
        if (this.get("urlPatched")) return;

        // Check if this node matches the specific `new URL("*.wasm", import.meta.url)` pattern.
        if (isNewWasmUrlExpression(path.node)) {
          const urlArg = path.node.arguments[0] as t.StringLiteral; // The first argument (filename)
          const originalUrl = urlArg.value;

          // Check if the filename matches the expected WASM file pattern.
          const match = originalUrl.match(WASM_FILE_REGEX);
          if (match) {
            const type = match[2]; // 'reader', 'writer', or 'full'
            const baseFilename = match[1]; // e.g., 'zxing_reader.wasm'
            // Construct the new relative URL path expected by the Vite setup.
            // Adds `?no-inline` to hint that the asset should not be inlined.
            const newUrl = `../../${type}/${baseFilename}.wasm`; /* ?no-inline`; */

            // Create a new string literal node for the modified URL.
            const newArgNode = t.stringLiteral(newUrl);
            // Add the `/* @vite-ignore */` comment before the new URL argument.
            // This prevents Vite from trying to statically analyze this `new URL` call.
            newArgNode.leadingComments = [VITE_IGNORE_COMMENT];

            // Replace the original URL argument with the modified one.
            path.node.arguments[0] = newArgNode;
            // Mark this patch as completed for the current file.
            this.set("urlPatched", true);
          }
        }
      },
    },
    // `post` runs after traversing the AST for a file.
    post(this: PluginPass) {
      // Retrieve the final state flags for this file from the PluginPass instance.
      const finalState = {
        declared: this.get("declared"),
        checked: this.get("checked"),
        urlPatched: this.get("urlPatched"),
      };
      // Log the results of the patching process for this file using the collected state.
      logPatchResults.call(this, finalState);
    },
  };
}
