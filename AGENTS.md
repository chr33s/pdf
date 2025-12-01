# Instructions

## Code style, formatting, structure

- Monorepo managed by npm workspaces
- ESM-only (type: "module") typescript
- use dist, src, test folders for code
- use kebab-case for both file and folder naming
- use `npm run check` to verify formatting (oxfmt) and linting (oxlint)
- use `npm run fix` to auto-fix formatting and lint issues

## Development

- use node version as defined in package.json#engines.node (^22.18.0)
- use npm as defined in package.json#packageManager (npm@10.0.0+)
- use typescript@latest for code, targeting ES2022 with ES6 classes using #private syntax
- use tsdown for browser bundles (fontkit, pdf packages only)
- use tsc for package builds (most packages)
- Add or update tests for the code you change, even if nobody asked.

## Commands

- `npm run all` - full pipeline: clean → build → check → test (all packages)
- `npm run workspace <cmd>` - run command across packages in dependency order
- `npm run check` - verify formatting and linting
- `npm run fix` - auto-fix formatting and lint issues

## Testing

- use vitest@latest, use vitest#test instead of vitest#it
- run `npm run workspace test` to test all packages
- CI plan is in .github/workflows/ci.yml

## Commit and PR instructions

- Commit message format: {type}({scope})?!?: {msg}
- PR title format: {type}({scope=[revert,merge]})?!?: {msg}
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Always run `npm run all` before committing to ensure build, lint, and tests pass
