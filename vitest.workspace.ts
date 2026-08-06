import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/runtime-vscode/vitest.config.ts",
  "packages/*/vitest.config.ts"
]);
