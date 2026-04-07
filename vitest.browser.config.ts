import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { mergeConfig, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import baseConfig from "./vite.base.js";

/**
 * Vite plugin that replaces compile-time constants via the transform hook.
 *
 * Vitest browser mode may not propagate the root-level `define` config to
 * Worker-served modules (a known limitation of the Vite environment API).
 * This plugin ensures all constants are replaced regardless of context.
 */
function compileTimeConstants(): Plugin {
  const defines = baseConfig.define as Record<string, string>;
  const patterns = Object.entries(defines).map(([key, value]) => ({
    regex: new RegExp(`\\b${key}\\b`, "g"),
    value,
  }));

  return {
    name: "compile-time-constants",
    enforce: "pre",
    transform(code, id) {
      if (id.includes("node_modules") || id.startsWith("\0")) return null;
      if (!/\.[jt]sx?$/.test(id)) return null;

      let result = code;
      for (const { regex, value } of patterns) {
        result = result.replace(regex, value);
      }
      return result !== code ? result : null;
    },
  };
}

export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react(), compileTimeConstants()],
    test: {
      include: ["tests/**/*.browser.test.{ts,tsx}"],
      testTimeout: 30000,
      browser: {
        enabled: true,
        provider: playwright(),
        headless: true,
        screenshotFailures: false,
        instances: [{ browser: "chromium" }],
      },
    },
  }),
);
