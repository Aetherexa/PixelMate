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


## Sonar quality gate

Production release validation includes SonarQube analysis when `SONAR_TOKEN`, `SONAR_PROJECT_KEY`, and `SONAR_ORGANIZATION` are configured in GitHub. The release workflow waits for the Sonar quality gate before continuing to build and package the release.

For SonarQube Cloud, create/import the PixelMate project first, then add the generated token as the `SONAR_TOKEN` repository or organization secret. Keep the project key and organization key as GitHub Actions variables.
