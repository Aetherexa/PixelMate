Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

pnpm install
pnpm build
pnpm lint
pnpm test
