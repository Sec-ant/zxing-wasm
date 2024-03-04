import type { PluginItem } from "@babel/core";
import {
  binaryExpression,
  identifier,
  logicalExpression,
  memberExpression,
  optionalMemberExpression,
  stringLiteral,
  unaryExpression,
  variableDeclaration,
  variableDeclarator,
} from "@babel/types";

export function emscriptenPatch(): PluginItem {
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
            variableDeclaration("var", [
              variableDeclarator(
                identifier("ENVIRONMENT_SUPPORTS_WEBASSEMBLY_INSTANTIATE"),
                binaryExpression(
                  "===",
                  unaryExpression(
                    "typeof",
                    optionalMemberExpression(
                      memberExpression(
                        identifier("globalThis"),
                        identifier("WebAssembly"),
                      ),
                      identifier("instantiate"),
                      false,
                      true,
                    ),
                  ),
                  stringLiteral("function"),
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
          const newNode = logicalExpression(
            "||",
            path.node,
            identifier("ENVIRONMENT_IS_BUN"),
          );
          if (path.parent.type !== "IfStatement") {
            path.replaceWith(
              logicalExpression(
                "||",
                newNode,
                identifier("ENVIRONMENT_SUPPORTS_WEBASSEMBLY_INSTANTIATE"),
              ),
            );
          } else {
            path.replaceWith(newNode);
          }
          path.skip();
        }
      },
    },
  };
}
