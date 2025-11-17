import type { PluginItem, PluginPass } from "@babel/core";
import * as t from "@babel/types";

// --- Constants ---
const ENV_WEB = "ENVIRONMENT_IS_WEB";
const ENV_WORKER = "ENVIRONMENT_IS_WORKER";
const ENV_BUN = "ENVIRONMENT_IS_BUN";
const BUN_IDENTIFIER = "Bun";
const UNDEFINED_STRING = "undefined";
const IMPORT_META = "import";
const META_PROPERTY = "meta";
const URL_PROPERTY = "url";
const SCRIPT_NAME_VAR = "_scriptName"; // Added constant

// --- Polyfill Transformation Helper ---

/**
 * Checks if a ForOfStatement matches the pattern:
 * for (let [i, x] of arr.entries()) { ... }
 */
function isEntriesPattern(node: t.ForOfStatement): {
  match: boolean;
  indexVar?: string;
  valueVar?: string;
  arrayNode?: t.Expression;
} {
  // Check if left is ArrayPattern: [i, x]
  if (
    !t.isVariableDeclaration(node.left) ||
    node.left.declarations.length !== 1
  ) {
    return { match: false };
  }

  const declarator = node.left.declarations[0];
  if (!t.isArrayPattern(declarator.id) || declarator.id.elements.length !== 2) {
    return { match: false };
  }

  const [indexPat, valuePat] = declarator.id.elements;
  if (!t.isIdentifier(indexPat) || !t.isIdentifier(valuePat)) {
    return { match: false };
  }

  // Check if right is arr.entries()
  if (
    !t.isCallExpression(node.right) ||
    !t.isMemberExpression(node.right.callee) ||
    !t.isIdentifier(node.right.callee.property, { name: "entries" }) ||
    node.right.arguments.length !== 0
  ) {
    return { match: false };
  }

  return {
    match: true,
    indexVar: indexPat.name,
    valueVar: valuePat.name,
    arrayNode: node.right.callee.object,
  };
}

// --- Helper Functions ---

/**
 * Logs the results of the patching process for the current file being processed by Babel.
 * Uses the PluginPass context (`this`) to access file information and state.
 * @param this The Babel PluginPass instance, providing context like filename and state.
 * @param state An object containing boolean flags indicating whether each patch was applied.
 */
function logPatchResults(
  this: PluginPass,
  state: {
    declared: boolean;
    checked: boolean;
    findWasmBinaryPatched: boolean; // Renamed from wasmUrlPatched
    scriptNamePatched: boolean;
    entriesTransformed: number; // New: count of .entries() transformations
  },
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
  if (!state.findWasmBinaryPatched) {
    addLog("error", "❗️", "\x1b[33m", "findWasmBinary function not patched");
    allPatchesSuccessful = false;
  }
  if (!state.scriptNamePatched) {
    addLog("error", "❗️", "\x1b[33m", "_scriptName variable not patched");
    allPatchesSuccessful = false;
  }

  // Log .entries() transformations (info only, not a failure)
  if (state.entriesTransformed > 0) {
    addLog(
      "log",
      "🔄",
      "\x1b[36m",
      `Transformed ${state.entriesTransformed} .entries() loop(s) to for-loops`,
    );
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
 *    and adds a `@vite-ignore` comment.
 * 4. Removes the initializer from `var _scriptName = import.meta.url;`.
 * 5. Patches the `findWasmBinary` function to replace its body with a call to `locateFile`.
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
      this.set("findWasmBinaryPatched", false); // Tracks if the findWasmBinary function was patched
      this.set("scriptNamePatched", false); // Tracks if _scriptName was patched
      this.set("entriesTransformed", 0); // Tracks count of .entries() transformations
    },
    visitor: {
      // Visitor for VariableDeclaration nodes in the AST.
      VariableDeclaration(path) {
        // Check if we already declared the Bun environment variable in this file.
        // Use separate checks for different variable declarations.

        // --- Patch 1: Declare ENVIRONMENT_IS_BUN ---
        if (!this.get("declared")) {
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
        }

        // --- Patch 4: Modify _scriptName declaration ---
        if (!this.get("scriptNamePatched")) {
          const declaration = path.node.declarations[0];
          // Target `var _scriptName = import.meta.url;`
          if (
            path.node.kind === "var" &&
            path.node.declarations.length === 1 && // Ensure only one declarator
            t.isIdentifier(declaration.id, { name: SCRIPT_NAME_VAR }) &&
            t.isMemberExpression(declaration.init) && // Check if init is MemberExpression
            t.isMetaProperty(declaration.init.object) && // Check if object is MetaProperty (import.meta)
            t.isIdentifier(declaration.init.object.meta, {
              name: IMPORT_META,
            }) &&
            t.isIdentifier(declaration.init.object.property, {
              name: META_PROPERTY,
            }) &&
            t.isIdentifier(declaration.init.property, { name: URL_PROPERTY }) // Check if property is 'url'
          ) {
            // Remove the initializer (import.meta.url)
            declaration.init = null;
            // Mark this patch as completed for the current file.
            this.set("scriptNamePatched", true);
          }
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
      // Visitor for FunctionDeclaration nodes to patch findWasmBinary
      FunctionDeclaration(path) {
        if (this.get("findWasmBinaryPatched")) return;

        if (path.node.id && path.node.id.name === "findWasmBinary") {
          const functionBodyPath = path.get("body");
          if (!functionBodyPath.isBlockStatement()) return;

          const bodyStatements = (functionBodyPath.node as t.BlockStatement)
            .body;

          // Find the 'if (Module["locateFile"])' statement
          const ifStatementNode = bodyStatements.find(
            (stmt) =>
              t.isIfStatement(stmt) &&
              t.isMemberExpression(stmt.test) &&
              t.isIdentifier(stmt.test.object, { name: "Module" }) &&
              t.isStringLiteral(stmt.test.property) &&
              stmt.test.property.value === "locateFile" &&
              stmt.test.computed === true,
          ) as t.IfStatement | undefined;

          if (ifStatementNode?.consequent) {
            let newBodyStatements: t.Statement[];

            if (t.isBlockStatement(ifStatementNode.consequent)) {
              newBodyStatements = ifStatementNode.consequent.body;
            } else {
              // If the consequent is not a block, wrap it in an array
              newBodyStatements = [ifStatementNode.consequent];
            }

            // Replace the entire function body with the statements from the if-block
            functionBodyPath.replaceWith(t.blockStatement(newBodyStatements));
            this.set("findWasmBinaryPatched", true);
            path.skip(); // Important after replacement
          }
        }
      },

      // --- Patch 6: Transform for-of + .entries() to traditional for-loop ---
      ForOfStatement(path) {
        const pattern = isEntriesPattern(path.node);
        if (
          !pattern.match ||
          !pattern.indexVar ||
          !pattern.valueVar ||
          !pattern.arrayNode
        ) {
          return;
        }

        const { indexVar, valueVar, arrayNode } = pattern;
        const body = path.node.body;

        // Generate: for (let i = 0; i < arr.length; ++i) { const x = arr[i]; ... }
        const forLoop = t.forStatement(
          // Init: let i = 0
          t.variableDeclaration("let", [
            t.variableDeclarator(t.identifier(indexVar), t.numericLiteral(0)),
          ]),
          // Test: i < arr.length
          t.binaryExpression(
            "<",
            t.identifier(indexVar),
            t.memberExpression(arrayNode, t.identifier("length")),
          ),
          // Update: ++i
          t.updateExpression("++", t.identifier(indexVar), true),
          // Body: { const x = arr[i]; ...originalBody }
          t.blockStatement([
            t.variableDeclaration("const", [
              t.variableDeclarator(
                t.identifier(valueVar),
                t.memberExpression(arrayNode, t.identifier(indexVar), true),
              ),
            ]),
            ...(t.isBlockStatement(body) ? body.body : [body]),
          ]),
        );

        path.replaceWith(forLoop);

        // Increment counter
        const count = this.get("entriesTransformed") || 0;
        this.set("entriesTransformed", count + 1);
      },
    },
    // `post` runs after traversing the AST for a file.
    post(this: PluginPass) {
      // Retrieve the final state flags for this file from the PluginPass instance.
      const finalState = {
        declared: this.get("declared"),
        checked: this.get("checked"),
        findWasmBinaryPatched: this.get("findWasmBinaryPatched"),
        scriptNamePatched: this.get("scriptNamePatched"),
        entriesTransformed: this.get("entriesTransformed"),
      };
      // Log the results of the patching process for this file using the collected state.
      logPatchResults.call(this, finalState);
    },
  };
}
