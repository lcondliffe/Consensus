# Agent Guidelines

When making changes to this project, follow these rules to align with our CI pipeline standards:

## Code Quality

1. **Run linting** - Execute `npm run lint` before committing
   - Fixes ESLint violations in JavaScript/TypeScript code

2. **Run type checking** - Execute `npm run typecheck` before committing
   - Ensures TypeScript types are correct with no errors

## Security

3. **Check for secrets** - Never commit sensitive data like API keys, tokens, or passwords
   - The CI pipeline runs Gitleaks to detect secrets

4. **Audit dependencies** - Be mindful of package vulnerabilities
   - The CI runs `npm audit --audit-level=high` and Snyk scans

5. **Review container security** - If Dockerfile changes are made, consider security implications
   - Trivy scans for CRITICAL and HIGH severity vulnerabilities in container images

## Pre-commit Checklist

Before committing changes, run:
```bash
npm run lint
npm run typecheck
```

Both commands must pass with no errors.
