import type { PluginItem } from "@babel/core";

export function miniprogramPatch(): PluginItem {
  return {
    visitor: {
      Identifier(path) {
        if (path.node.name !== "WebAssembly") {
          return;
        }
        path.node.name = "WXWebAssembly";
      },
    },
  };
}
