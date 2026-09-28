# Release Process

PixelMate uses Conventional Commits and a protected `main` branch.

## Release checklist
1. Ensure lint, typecheck, tests and build pass.
2. Package an installable VSIX.
3. Perform a clean-profile smoke test.
4. Update CHANGELOG and release notes.
5. Merge the release PR.
6. Tag the release using semantic versioning.
7. Publish the VSIX/Marketplace release only after verification.

Never publish from an unreviewed working branch and never hardcode publisher credentials.
