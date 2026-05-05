# Contributing to EVENTO

Thank you for your interest in contributing! Please follow these guidelines to keep the codebase clean and consistent.

## Commit Guidelines

### Commit Small and Often

- Make focused, atomic commits that address a single concern
- Avoid large, sweeping commits that mix unrelated changes
- Commit working code; avoid committing broken states

### Conventional Commit Messages

Use the following prefixes for all commit messages:

| Prefix | When to use |
|--------|-------------|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `chore:` | Build process, tooling, or dependency updates |
| `docs:` | Documentation changes only |
| `refactor:` | Code restructuring without changing behavior |
| `ci:` | CI/CD pipeline changes |
| `test:` | Adding or updating tests |
| `style:` | Formatting, missing semicolons, etc. (no logic change) |

### Good Commit Message Examples

```
feat: add wishlist functionality
fix: resolve booking date validation bug
docs: update README with setup instructions
ci: add GitHub Actions pipeline
chore: upgrade dependencies to latest
refactor: extract booking helpers into utils
test: add unit tests for auth middleware
```

## Security Rules

- **Never commit `.env`, `.vercel.env`, or any file containing secrets**
- Never hardcode API keys, tokens, or passwords in source code
- If secrets are accidentally committed, rotate them immediately — see the Security Notice in README.md
- Use `.env.example` as a template without real values

## Before Committing

Always run these checks before pushing:

```bash
npm run lint
npm run build
```

Fix all lint errors before opening a PR.

## Pull Requests

- Open a PR against `main`
- Give the PR a clear title using conventional commit style
- Describe what changed and why
- Keep PRs small and focused — one feature or fix per PR
- The CI pipeline must pass before merging

## Branch Naming

Use descriptive branch names:

```
feat/wishlist-ui
fix/booking-date-validation
docs/setup-instructions
ci/github-actions
```
