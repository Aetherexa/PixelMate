import { describe, expect, it } from "vitest";
import { AssetLoader, createCompanionAssetManifest, PACKAGE_METADATA } from "./index.js";

describe("asset-loader package", () => {
  it("exports metadata", () => {
    expect(PACKAGE_METADATA.name).toBe("@aetherexa/asset-loader");
    expect(PACKAGE_METADATA.version).toBe("0.1.0");
  });

  it("is empty before a manifest is loaded", () => {
    const loader = new AssetLoader();

    expect(loader.getManifest()).toBeUndefined();
    expect(loader.getBundle()).toBeUndefined();
    expect(loader.getSprite("missing")).toBeUndefined();
    expect(loader.getAnimation("missing")).toBeUndefined();
  });

  it("loads a companion manifest and caches sprites and animations", () => {
    const loader = new AssetLoader();
    const manifest = loader.loadManifest(createCompanionAssetManifest());

    expect(manifest.id).toBe("pixelmate-reference-companion");
    expect(loader.getManifest()).toBe(manifest);
    expect(loader.getSprite("idle")?.frames).toEqual(["idle-1", "idle-2", "idle-3"]);
    expect(loader.getAnimation("walk")?.fps).toBe(10);

    const bundle = loader.getBundle();
    expect(bundle?.manifest).toBe(manifest);
    expect(bundle?.sprites.get("idle")?.defaultFrame).toBe("idle-1");
    expect(bundle?.animations.get("walk")?.loop).toBe(true);
  });
});
