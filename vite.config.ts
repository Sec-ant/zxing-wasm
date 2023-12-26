import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import type { PluginItem } from "@babel/core";
import {
  binaryExpression,
  identifier,
  logicalExpression,
  stringLiteral,
  unaryExpression,
  variableDeclaration,
  variableDeclarator,
} from "@babel/types";
import { version } from "./package-lock.json";

function emscriptenBun(): PluginItem {
  return {
    visitor: {
      VariableDeclaration(path) {
        if (
          path.node.kind === "var" &&
          path.node.declarations[0]?.id.type === "Identifier" &&
          path.node.declarations[0]?.id.name === "ENVIRONMENT_IS_WEB"
        ) {
          path.insertAfter([
            variableDeclaration("var", [
              variableDeclarator(
                identifier("ENVIRONMENT_IS_BUN"),
                binaryExpression(
                  "!==",
                  unaryExpression("typeof", identifier("Bun")),
                  stringLiteral("undefined"),
                ),
              ),
            ]),
          ]);
        }
      },
      LogicalExpression(path) {
        if (
          path.node.operator === "||" &&
          path.node.left.type === "Identifier" &&
          (path.node.left.name === "ENVIRONMENT_IS_WEB" ||
            path.node.left.name === "ENVIRONMENT_IS_WORKER") &&
          path.node.right.type === "Identifier" &&
          (path.node.right.name === "ENVIRONMENT_IS_WORKER" ||
            path.node.right.name === "ENVIRONMENT_IS_WEB")
        ) {
          path.replaceWith(
            logicalExpression(
              "||",
              path.node,
              identifier("ENVIRONMENT_IS_BUN"),
            ),
          );
          path.skip();
        }
      },
    },
  };
}

export default defineConfig({
  build: {
    target: ["es2020", "edge88", "firefox68", "chrome75", "safari13"],
    lib: {
      entry: {
        "reader/index": "src/reader/index.ts",
        "writer/index": "src/writer/index.ts",
        "full/index": "src/full/index.ts",
      },
      formats: ["es"],
      fileName: (_, entryName) => `${entryName}.js`,
    },
    outDir: "dist/es",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (
            /core\.ts|exposedReaderBindings\.ts|exposedWriterBindings\.ts/.test(
              id,
            )
          ) {
            return "core";
          }
        },
      },
    },
  },
  plugins: [
    babel({
      babelConfig: {
        plugins: [emscriptenBun()],
      },
      filter: /zxing_(reader|writer|full)\.js$/,
      include: /zxing_(reader|writer|full)\.js$/,
    }),
  ],
  define: {
    NPM_PACKAGE_VERSION: JSON.stringify(version),
  },
});
