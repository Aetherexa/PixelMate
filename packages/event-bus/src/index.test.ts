import { describe, expect, it } from "vitest";
import { PACKAGE_METADATA } from "./index.js";

describe("event-bus package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/event-bus");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });
});