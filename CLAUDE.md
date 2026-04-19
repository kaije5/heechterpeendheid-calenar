# Claude Code Development Workflow

## Overview

This project uses **subagent-driven development** with Claude Code. Each feature follows a structured workflow: planning → implementation → testing → QA → PR → merge.

## Workflow Branches

| Branch Type | Prefix | Purpose |
|-------------|--------|---------|
| Feature | `feature/` | New functionality |
| Fix | `fix/` | Bug fixes |
| Hotfix | `hotfix/` | Critical production fixes |
| Refactor | `refactor/` | Code restructuring |

## Agent Selection Matrix

| Task | Agent | Purpose |
|------|-------|---------|
| Feature planning | `planner` | Requirements, architecture, sprint breakdown |
| Security review | `security-reviewer` | OWASP Top 10, secrets, auth flows |
| Code review | `code-reviewer` | Quality, patterns, best practices |
| TypeScript review | `typescript-reviewer` | Type safety, async, security, idioms |
| Performance | `performance-optimizer` | Bottlenecks, bundle size, runtime |
| Testing | `tdd-guide` | Test-driven development, 80%+ coverage |
| E2E testing | `e2e-runner` | Playwright critical user flows |
| Build errors | `build-error-resolver` | Fix compilation/type errors |
| Code cleanup | `refactor-cleaner` | Dead code, duplicates |

## Feature Development Flow

```
1. Planning Phase (planner agent)
   - Ask questions to clarify requirements
   - Create implementation plan
   - Define architecture and file structure

2. Implementation Phase (code + tdd-guide)
   - Write feature code
   - Write tests FIRST (TDD)
   - Ensure 80%+ coverage

3. QA Phase (code-reviewer + typescript-reviewer + security-reviewer)
   - Code quality review
   - Security audit
   - Type safety verification

4. E2E Testing (e2e-runner if UI changes)
   - Test critical user flows
   - Verify visual regression

5. Git Workflow
   - Create branch: feature/feature-name or fix/bug-name
   - Commit with conventional commits format
   - Push branch and create PR
   - Link to planning document

6. Merge
   - CI/CD must pass
   - Review approvals required
   - Squash merge to main
   - Delete feature branch
```

## Commit Message Format

```
<type>: <description>

<optional body>

Co-Authored-By: Claude Code <noreply@claude.ai>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`, `ci`

## Subagent Commands

In your prompt, specify which agent to use:

```
<agent>: <task>
```

Examples:
- `planner: Add user authentication`
- `tdd-guide: Create event creation feature`
- `security-reviewer: Review auth middleware`
- `code-reviewer: Check recent changes`

## CI/CD Pipeline

```
PR:     lint → test
MAIN:   lint → test → e2e → migrate → deploy
```

## Quick Start

1. Create feature branch: `git checkout -b feature/your-feature`
2. Use `planner` agent to define requirements
3. Implement with tests using `tdd-guide`
4. Review with `code-reviewer` and `security-reviewer`
5. Push branch and create PR
6. Merge after CI passes
