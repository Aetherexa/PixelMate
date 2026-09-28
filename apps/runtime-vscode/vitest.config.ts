import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/constants.ts",
        "src/extension.ts",
        "src/runtime/**/*.ts"
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/runtimeCompanionHost.ts"
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    }
  }
});
