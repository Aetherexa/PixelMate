import { build } from "esbuild";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outdir = resolve(__dirname, "dist");

if (!existsSync(outdir)) {
  mkdirSync(outdir, { recursive: true });
}

const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

const config = {
  entryPoints: [resolve(__dirname, "src/extension.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  outfile: resolve(outdir, "extension.js"),
  sourcemap: !isProduction,
  minify: isProduction,
  treeShaking: true,
  legalComments: "none",
  external: ["vscode"],
  define: {
    "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development")
  }
};

if (isWatch) {
  const ctx = await build({
    ...config,
    watch: {
      onRebuild(error) {
        if (error) {
          console.error("esbuild rebuild failed");
        } else {
          console.log("esbuild rebuild succeeded");
        }
      }
    }
  });
  console.log("Watching for changes...");
  await ctx.watch();
} else {
  await build(config);
  console.log(isProduction ? "Production build completed" : "Development build completed");
}
