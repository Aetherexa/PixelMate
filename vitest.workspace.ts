import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/runtime-vscode/vitest.config.ts",
  "companions/*/vitest.config.ts",
  "packages/*/vitest.config.ts"
]);
