import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.join(import.meta.dirname, "src"),
    },
  },
  test: {
    root: import.meta.dirname,
    include: ["test/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["test/e2e/**"],
    environment: "jsdom",
    setupFiles: ["test/polyfills.ts", "test/setup.ts"],
    // Process CSS modules with readable class names, so tests can check
    // classes like "selected" or "dark" directly.
    css: {
      include: /.+/,
      modules: { classNameStrategy: "non-scoped" },
    },
    passWithNoTests: true,
    testTimeout: 1000 * 29,
  },
});
