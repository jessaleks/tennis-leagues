# Testing Strategy - Design Document

**Date:** 2026-04-08
**Status:** Approved
**Branch:** `003-testing`

## Overview

Comprehensive testing strategy for the Tennis Leagues app using Vitest (unit/integration) and Playwright (E2E).

## Goals

1. **Catch regressions** — Verify core flows keep working as we add features
2. **Validate MVP completeness** — Confirm Group View MVP is fully functional
3. **Enable confident refactoring** — Test suite protects against breaking changes

## Tech Stack

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Vitest** | Unit + integration tests | `pnpm add -D vitest` |
| **@solidjs/testing** | Solid component testing | `pnpm add -D @solidjs/testing` |
| **Playwright** | E2E browser tests | `pnpm add -D @playwright/test && pnpm exec playwright install` |
| **MSW** | Mock Firebase/Firestore | `pnpm add -D msw` |

## Testing Layers

### Unit Tests (Vitest)

| Scope | Files | Speed |
|-------|-------|-------|
| Elo calculation | `src/services/elo.test.ts` | <100ms |
| Service functions | `src/services/*.test.ts` | <100ms |
| Store logic | `src/stores/*.test.ts` | <100ms |
| Zod schemas | `src/services/*.test.ts` | <100ms |

### Integration Tests (Vitest + MSW)

| Scope | Files | Speed |
|-------|-------|-------|
| Auth flow with mocked Firebase | `tests/integration/auth.test.ts` | <500ms |
| Group operations with mocked Firestore | `tests/integration/groups.test.ts` | <500ms |
| Match operations | `tests/integration/matches.test.ts` | <500ms |

### E2E Tests (Playwright)

| Flow | Test File | Browser |
|------|----------|---------|
| Auth flows (signup, login, logout, Google) | `tests/e2e/auth.spec.ts` | Chromium |
| Group flows (create, join, view) | `tests/e2e/groups.spec.ts` | Chromium |
| Match flows (log, confirm, reject) | `tests/e2e/matches.spec.ts` | Chromium |
| Navigation (bottom nav, back, deep links) | `tests/e2e/navigation.spec.ts` | Chromium |
| Profile flows (view, H2H) | `tests/e2e/profile.spec.ts` | Chromium |
| Edge cases (empty states, errors) | `tests/e2e/edge-cases.spec.ts` | Chromium |

## E2E Test Scenarios

### Auth Flow (4 tests)
1. Sign up with email/password → redirect to groups
2. Login with email/password → redirect to groups
3. Login with Google → redirect to groups
4. Logout → redirect to login

### Group Flow (3 tests)
5. Create group → appears in groups list
6. Join group with invite code → appears in groups list
7. View group → see leaderboard + recent matches

### Match Flow (4 tests)
8. Log match (pick opponent, winner, submit) → pending state
9. Confirm match (as opponent) → confirmed, ratings update
10. Reject match (as opponent) → rejected
11. View all matches → paginated match history

### Navigation Flow (3 tests)
12. Bottom nav tabs → correct screens
13. Back navigation → previous screen
14. Deep link to group → correct view

### Profile Flow (2 tests)
15. View own profile → rating, W-L, history
16. Tap player in leaderboard → their profile

### Edge Cases (4 tests)
17. Empty groups list → empty state UI
18. Empty match history → empty state message
19. Auth redirect → unauthenticated redirected to login
20. Error state → error message displayed

## Project Structure

```text
tests/
├── unit/
│   ├── elo.test.ts           # Elo calculation tests
│   ├── auth.service.test.ts  # Auth service tests
│   └── matches.service.test.ts
├── integration/
│   ├── auth.test.ts          # Auth flow with MSW
│   └── groups.test.ts        # Group operations
└── e2e/
    ├── auth.spec.ts          # Playwright E2E
    ├── groups.spec.ts
    ├── matches.spec.ts
    ├── navigation.spec.ts
    ├── profile.spec.ts
    └── edge-cases.spec.ts
```

## Commands

```bash
pnpm test              # Run unit + integration tests
pnpm test:e2e          # Run Playwright E2E tests
pnpm test:all          # Run all tests
pnpm test:unit          # Run unit tests only
pnpm test:coverage      # Run with coverage report
```

## Build/Test Gate

- All unit + integration tests must pass before PR
- All E2E tests must pass before PR
- `pnpm build` must succeed
- `pnpm exec tsc --noEmit` must pass

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Firebase auth mocking complex | Use MSW with auth endpoint mocking |
| Flaky E2E tests | Use Playwright retry, stable selectors |
| Slow E2E suite | Run unit tests in CI first, E2E after |
| Test data isolation | Each test creates/cleans own data |
