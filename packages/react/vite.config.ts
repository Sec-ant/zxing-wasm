import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import replace from "unplugin-replace/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Mute checkDeps in use-custom-compare.js
    replace({
      values: [
        {
          find: /(?<!function )\bcheckDeps\b/g,
          replacement: "(() => {})",
        },
      ],
      include: "**/use-custom-compare.js*",
    }),
    react(),
    tailwindcss(),
  ],
});
