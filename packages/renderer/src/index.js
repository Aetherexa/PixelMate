export const PACKAGE_METADATA = {
  name: "@aetherexa/renderer",
  version: "0.1.0"
};
const themePalettes = {
  default: { primary: "#00b4d8", secondary: "#1b4965" },
  ocean: { primary: "#4fd1c5", secondary: "#12324a" },
  sunrise: { primary: "#ff9e6d", secondary: "#3a2c2c" }
};
export function buildRenderFrame(input) {
  const palette = themePalettes[input.theme] ?? themePalettes.default;
  const rotation = input.rotation ?? 0;
  const mirrored = input.mirrored ?? false;
  const transformParts = [
    `scale(${input.scale.toFixed(2)})`,
    rotation !== 0 ? `rotate(${rotation.toFixed(1)}deg)` : undefined,
    mirrored ? "scaleX(-1)" : undefined
  ].filter((part) => part !== undefined);
  return {
    label: input.frame,
    transform: transformParts.join(" "),
    background: `linear-gradient(145deg, ${palette.secondary}, ${palette.primary})`,
    opacity: 1
  };
}
//# sourceMappingURL=index.js.map
