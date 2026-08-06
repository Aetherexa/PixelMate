export interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

export const PACKAGE_METADATA: PackageMetadata = {
  name: "@aetherexa/renderer",
  version: "0.1.0"
};

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

const themePalettes = {
  default: { primary: "#00b4d8", secondary: "#1b4965" },
  ocean: { primary: "#4fd1c5", secondary: "#12324a" },
  sunrise: { primary: "#ff9e6d", secondary: "#3a2c2c" }
} as const satisfies Record<string, { primary: string; secondary: string }>;

export function buildRenderFrame(input: RenderFrameInput): RenderFrameDescriptor {
  const palette = themePalettes[input.theme as keyof typeof themePalettes] ?? themePalettes.default;
  const rotation = input.rotation ?? 0;
  const mirrored = input.mirrored ?? false;
  const transformParts = [
    `scale(${input.scale.toFixed(2)})`,
    rotation !== 0 ? `rotate(${rotation.toFixed(1)}deg)` : undefined,
    mirrored ? "scaleX(-1)" : undefined
  ].filter((part): part is string => part !== undefined);

  return {
    label: input.frame,
    transform: transformParts.join(" "),
    background: `linear-gradient(145deg, ${palette.secondary}, ${palette.primary})`,
    opacity: 1
  };
}
