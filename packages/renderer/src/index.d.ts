export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}
export declare const PACKAGE_METADATA: PackageMetadata;
export interface RenderFrameDescriptor {
  readonly label: string;
  readonly transform: string;
  readonly background: string;
  readonly opacity: number;
}
export interface RenderFrameInput {
  readonly frame: string;
  readonly scale: number;
  readonly theme: string;
  readonly rotation?: number;
  readonly mirrored?: boolean;
}
export declare function buildRenderFrame(input: RenderFrameInput): RenderFrameDescriptor;
//# sourceMappingURL=index.d.ts.map
