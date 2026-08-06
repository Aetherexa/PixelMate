import { describe, expect, it } from "vitest";
import { AssetLoader, createCompanionAssetManifest, PACKAGE_METADATA } from "./index.js";

describe("asset-loader package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/asset-loader");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });

  it("loads a companion manifest and caches sprites", () => {
    const loader = new AssetLoader();
    const manifest = loader.loadManifest(createCompanionAssetManifest());

    expect(manifest.id).toBe("pixelmate-reference-companion");
    expect(loader.getSprite("idle")?.frames).toEqual(["idle-1", "idle-2", "idle-3"]);
    expect(loader.getAnimation("walk")?.fps).toBe(10);
  });
});
