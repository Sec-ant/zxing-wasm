import {
  type BinaryExpression,
  type CallExpression,
  Compiler,
  type Expression,
  type FunctionDeclaration,
  type Program,
} from "@swc/core";
import type { Plugin } from "vite";

function lowerCall(call: CallExpression): Expression {
  const member = call.callee;
  const index = call.arguments[0]?.expression;
  if (
    member.type !== "MemberExpression" ||
    member.object.type !== "Identifier" ||
    member.object.value !== "exceptionCaught" ||
    member.property.type !== "Identifier" ||
    member.property.value !== "at" ||
    call.arguments.length !== 1 ||
    call.arguments[0]?.spread ||
    index?.type !== "UnaryExpression" ||
    index.operator !== "-" ||
    index.argument.type !== "NumericLiteral" ||
    index.argument.value !== 1
  ) {
    return call;
  }
  return {
    ...member,
    span: call.span,
    property: {
      type: "Computed",
      span: call.span,
      expression: {
        type: "BinaryExpression",
        span: call.span,
        operator: "-",
        left: {
          ...member,
          property: { ...member.property, value: "length" },
        },
        right: index.argument,
      },
    },
  };
}

function visit(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(visit);
  if (!node || typeof node !== "object") return node;
  const fields = node as Record<string, unknown>;
  for (const key of Object.keys(fields)) fields[key] = visit(fields[key]);
  if (
    fields.type === "BinaryExpression" &&
    fields.operator === "||" &&
    (fields.left as { value?: string }).value === "ENVIRONMENT_IS_WEB" &&
    (fields.right as { value?: string }).value === "ENVIRONMENT_IS_WORKER"
  ) {
    const condition = node as BinaryExpression;
    // Use the SDK's fetch loader in Node.js, Bun and Deno as well.
    return {
      ...condition,
      left: condition,
      right: {
        type: "BinaryExpression",
        span: condition.span,
        operator: "===",
        left: {
          type: "UnaryExpression",
          span: condition.span,
          operator: "typeof",
          argument: { ...condition.right, value: "fetch" },
        },
        right: {
          type: "StringLiteral",
          span: condition.span,
          value: "function",
        },
      },
    };
  }
  if (
    fields.type === "FunctionDeclaration" &&
    (node as FunctionDeclaration).identifier.value === "findWasmBinary"
  ) {
    const body = (node as FunctionDeclaration).body!;
    const branch = body.stmts[0];
    if (
      branch?.type === "IfStatement" &&
      branch.consequent.type === "BlockStatement"
    ) {
      // Keep the existing locateFile-based URL contract across output formats.
      body.stmts = branch.consequent.stmts;
    }
  }
  return fields.type === "CallExpression"
    ? lowerCall(node as CallExpression)
    : node;
}

// Adapt generated syntax and URL metadata for the package output formats.
export function swcEmscripten(): Plugin {
  const compiler = new Compiler();
  return {
    name: "swc-emscripten",
    enforce: "pre",
    async transform(code, id) {
      if (!/\/zxing_(reader|writer|full)\.js$/.test(id)) return;
      const ast = await compiler.parse(code, { syntax: "ecmascript" }, id);
      return compiler.transform(visit(ast) as Program, {
        jsc: {
          target: "esnext",
          transform: {
            optimizer: {
              // WASM URLs are resolved by locateFile.
              globals: { vars: { "import.meta.url": "undefined" } },
            },
          },
        },
        sourceMaps: true,
        filename: id,
      });
    },
  };
}
