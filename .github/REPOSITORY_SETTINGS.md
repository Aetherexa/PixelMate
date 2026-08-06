# GitHub Repository Settings Checklist

This checklist captures GitHub UI settings that must be configured for public release.

## Branch Protection (`main`)

- Require pull request before merge
- Require approvals (minimum 1, recommended 2)
- Require status checks:
  - CI
  - Lint
  - Test
  - Build
  - CodeQL
  - Commitlint
- Require conversation resolution
- Disallow force push
- Disallow deletion

## Discussions

Enable GitHub Discussions and add categories:
- Announcements
- Q&A
- Ideas
- RFC Proposals
- Plugin Ecosystem
- Release Feedback

## Milestones

Create milestones:
- v0.1.0-alpha Public Launch
- v0.2.0 Engine Contracts
- v0.3.0 SDK and Tooling

## Projects

Create project board `PixelMate Public Roadmap` with columns:
- Backlog
- Ready
- In Progress
- Review
- Done

## Repository Metadata

- Description: see `.github/REPOSITORY_PROFILE.md`
- Topics: see `.github/REPOSITORY_PROFILE.md`
- Social preview image: `assets/social-preview.svg`

## Release

- Protect release tags (`v*`) by policy
- Use release workflow for GitHub release publishing
- Attach VSIX artifact where applicable
