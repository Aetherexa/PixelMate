import { describe, expect, it } from "vitest";
import { PACKAGE_METADATA } from "./index.js";

describe("plugin-host package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/plugin-host");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });
});