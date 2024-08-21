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
import babel from "vite-plugin-babel";

function emscriptenBunBabel(): PluginItem {
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

export function emscriptenBun() {
  return babel({
    babelConfig: {
      plugins: [emscriptenBunBabel()],
    },
    filter: /zxing_(reader|writer|full)\.js$/,
    include: /zxing_(reader|writer|full)\.js$/,
  });
}
