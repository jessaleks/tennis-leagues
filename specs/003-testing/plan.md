# Implementation Plan: Tennis Leagues Testing

**Branch**: `003-testing` | **Date**: 2026-04-08 | **Spec**: [Testing Design](../docs/plans/2026-04-08-testing-design.md)

---

## Summary

Add comprehensive testing to the Tennis Leagues app using Vitest for unit/integration tests and Playwright for E2E browser tests. Covers all major user flows: auth, groups, matches, navigation, profiles, and edge cases.

---

## Technical Context

| Field | Value |
|-------|-------|
| **Language/Version** | TypeScript 5.6 |
| **Test Framework** | Vitest + Playwright |
| **SolidJS Testing** | @solidjs/testing |
| **Firebase Mocking** | MSW (Mock Service Worker) |
| **E2E Browser** | Playwright (Chromium) |
| **Testing Scope** | Unit, Integration, E2E |

---

## Constitution Check

*GATE: Must pass before implementation*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | ✅ Pass | All tests written in TypeScript |
| II. Reactive Architecture | ✅ Pass | N/A for tests |
| III. Input Validation | ✅ Pass | Tests validate Zod schemas |
| IV. Firebase as Managed Backend | ✅ Pass | MSW mocks Firebase endpoints |
| V. Cross-Platform by Design | ✅ Pass | Playwright tests web platform |
| pnpm as package manager | ✅ Pass | All deps via pnpm |
| Plain CSS (no Tailwind) | ✅ Pass | N/A for tests |

**No violations.**

---

## Project Structure

```text
tests/
├── unit/
│   ├── elo.test.ts              # Elo calculation tests
│   ├── auth.service.test.ts     # Auth service validation tests
│   ├── matches.service.test.ts # Matches validation tests
│   └── leaderboard.test.ts     # Leaderboard sorting tests
├── integration/
│   ├── auth.test.ts             # Auth flow with MSW
│   ├── groups.test.ts          # Group operations with MSW
│   └── matches.test.ts         # Match operations with MSW
├── e2e/
│   ├── auth.spec.ts            # Playwright: auth flows
│   ├── groups.spec.ts         # Playwright: group flows
│   ├── matches.spec.ts         # Playwright: match flows
│   ├── navigation.spec.ts     # Playwright: navigation
│   ├── profile.spec.ts         # Playwright: profile flows
│   └── edge-cases.spec.ts      # Playwright: edge cases
└── setup/
    └── msw-browser.ts          # MSW browser worker setup
vitest.config.ts
playwright.config.ts
```

---

## Dependencies

### Phase 1 Tasks (Installation)

- Vitest + @solidjs/testing
- @playwright/test + browsers
- msw

### Phase 2-3 Tasks (Unit + Integration)

- No additional dependencies

### Phase 4-9 Tasks (E2E)

- No additional dependencies
- Uses existing app at `http://localhost:3000`

---

## Complexity Tracking

No violations — testing is additive and non-invasive.
