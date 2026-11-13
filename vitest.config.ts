import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) },
      { find: /^@content\//, replacement: fileURLToPath(new URL("./content/", import.meta.url)) },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/component/**/*.test.tsx"],
    environment: "node",
  },
});
