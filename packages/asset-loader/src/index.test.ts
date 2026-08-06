import { describe, expect, it } from "vitest";
import { PACKAGE_METADATA } from "./index.js";

describe("asset-loader package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/asset-loader");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });
});