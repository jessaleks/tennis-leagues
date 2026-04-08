# Tasks: Tennis Leagues App — Testing

**Input**: Testing design from `docs/plans/2026-04-08-testing-design.md`
**Prerequisites**: Testing design doc (required), existing codebase in `src/`

**Tests**: This SPECIFICALLY is a testing task list — all tasks are test-related

**Organization**: Tasks are grouped by testing layer (unit, integration, E2E) and then by user flow

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to user story from design doc
- Include exact file paths in descriptions

## Path Conventions

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/e2e/`
- Test config: `vitest.config.ts`, `playwright.config.ts`

---

## Phase 1: Test Infrastructure Setup

**Purpose**: Install and configure testing tools

- [ ] T001 [P] Install Vitest and Solid testing dependencies with `pnpm add -D vitest @solidjs/testing`
- [ ] T002 [P] Install Playwright with `pnpm add -D @playwright/test` and `pnpm exec playwright install`
- [ ] T003 [P] Install MSW for Firebase mocking with `pnpm add -D msw`
- [ ] T004 Create Vitest config in `vitest.config.ts` with SolidJS plugin, test environment, and aliases
- [ ] T005 Create Playwright config in `playwright.config.ts` with baseURL, timeouts, and viewport settings
- [ ] T006 Add test scripts to `package.json`: `test`, `test:e2e`, `test:all`, `test:unit`, `test:coverage`
- [ ] T007 Create `tests/` directory structure with `unit/`, `integration/`, `e2e/` folders
- [ ] T008 Create MSW browser worker setup in `tests/setup/msw-browser.ts`

**Checkpoint**: `pnpm test` runs without errors, `pnpm test:e2e` opens browser

---

## Phase 2: Unit Tests

**Purpose**: Test isolated functions and logic

### Elo Calculation Tests

- [ ] T009 [P] Create `tests/unit/elo.test.ts` testing Elo rating calculation with cases:
  - New player vs new player (1500 vs 1500)
  - Expected upset (lower rated beats higher)
  - K-factor of 32 is used
  - Rating bounds (min 100)

### Auth Service Tests

- [ ] T010 [P] Create `tests/unit/auth.service.test.ts` testing:
  - Email validation (valid/invalid formats)
  - Password strength requirements
  - Sign up input validation via Zod schemas
  - Sign in input validation via Zod schemas

### Matches Service Tests

- [ ] T011 [P] Create `tests/unit/matches.service.test.ts` testing:
  - Match submission input validation
  - Match confirmation input validation
  - Match rejection input validation
  - Status transitions (pending → confirmed/rejected)

### Leaderboard Tests

- [ ] T012 [P] Create `tests/unit/leaderboard.test.ts` testing:
  - Sorting by rating descending
  - Win-loss calculation
  - Trend indicator logic (up/down/stable)

**Checkpoint**: All unit tests pass with `pnpm test:unit`

---

## Phase 3: Integration Tests

**Purpose**: Test service interactions with mocked Firebase

- [ ] T013 [P] Create `tests/integration/auth.test.ts` testing auth flow with MSW:
  - Sign up → user created in mock DB
  - Sign in → returns user
  - Auth state persistence
  - Error handling (wrong password, user not found)

- [ ] T014 [P] Create `tests/integration/groups.test.ts` testing group operations with MSW:
  - Create group generates invite code
  - Join group adds member
  - Fetch groups returns user's groups
  - Group validation (name required, invite code format)

- [ ] T015 [P] Create `tests/integration/matches.test.ts` testing match operations with MSW:
  - Submit match creates pending match
  - Confirm match updates status and ratings
  - Reject match updates status
  - Rating calculation after match confirmation

**Checkpoint**: All integration tests pass with `pnpm test`

---

## Phase 4: E2E Tests — Auth Flow

**Purpose**: Test complete user flows in real browser

- [ ] T016 [P] [AUTH] Create `tests/e2e/auth.spec.ts` with Playwright tests:
  - T016a: Sign up with email/password → redirected to `/`
  - T016b: Login with email/password → redirected to `/`
  - T016c: Login with Google → redirected to `/`
  - T016d: Logout → redirected to `/login`

**Checkpoint**: Auth E2E tests pass in Chromium

---

## Phase 5: E2E Tests — Group Flow

- [ ] T017 [P] [GROUPS] Create `tests/e2e/groups.spec.ts` with Playwright tests:
  - T017a: Create group → group appears in groups list
  - T017b: Join group with invite code → group appears in groups list
  - T017c: View group → see leaderboard with player entries
  - T017d: View group → see recent matches section

**Checkpoint**: Group E2E tests pass

---

## Phase 6: E2E Tests — Match Flow

- [ ] T018 [P] [MATCHES] Create `tests/e2e/matches.spec.ts` with Playwright tests:
  - T018a: Log match (select opponent, select winner, submit) → pending state
  - T018b: Confirm match as opponent → status changes to confirmed
  - T018c: Reject match as opponent → status changes to rejected
  - T018d: View all matches → paginated list with 20 per page
  - T018e: Navigate pages in match history

**Checkpoint**: Match E2E tests pass

---

## Phase 7: E2E Tests — Navigation Flow

- [ ] T019 [P] [NAV] Create `tests/e2e/navigation.spec.ts` with Playwright tests:
  - T019a: Bottom nav "Groups" tab → navigates to `/`
  - T019b: Bottom nav "Create" tab → navigates to `/create-group`
  - T019c: Back button → returns to previous screen
  - T019d: Deep link to `/group/:id` → loads correct group
  - T019e: Auth redirect → unauthenticated user redirected to `/login`

**Checkpoint**: Navigation E2E tests pass

---

## Phase 8: E2E Tests — Profile Flow

- [ ] T020 [P] [PROFILE] Create `tests/e2e/profile.spec.ts` with Playwright tests:
  - T020a: View own profile → shows rating, W-L record, rating history
  - T020b: Tap player in leaderboard → navigates to player profile
  - T020c: View another player's profile → shows their stats

**Checkpoint**: Profile E2E tests pass

---

## Phase 9: E2E Tests — Edge Cases

- [ ] T021 [P] [EDGE] Create `tests/e2e/edge-cases.spec.ts` with Playwright tests:
  - T021a: Empty groups list → shows "No Groups Yet" empty state
  - T021b: Empty match history → shows "No matches yet" message
  - T021c: Network error → shows error message
  - T021d: Invalid invite code → shows error message
  - T021e: Duplicate match submission → handled gracefully

**Checkpoint**: Edge case E2E tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Infrastructure)
         │
         ▼
Phase 2 (Unit Tests) ──────────┐
         │                      │
         ▼                      ▼
Phase 3 (Integration Tests)    │
         │                      │
         └──────────┬───────────┘
                    ▼
Phase 4-9 (E2E Tests - can run in parallel)
```

### Within Each Phase

- All Phase 1 tasks (T001-T008) can run in parallel
- All unit test files (T009-T012) can run in parallel
- All integration test files (T013-T015) can run in parallel
- All E2E test files (T016-T021) can run in parallel

---

## Parallel Execution Examples

```bash
# Phase 1 - Install all tools in parallel:
Task: "Install Vitest (T001)"
Task: "Install Playwright (T002)"
Task: "Install MSW (T003)"

# Phase 2 - Write unit tests in parallel:
Task: "Test Elo calculation (T009)"
Task: "Test auth service (T010)"
Task: "Test matches service (T011)"
Task: "Test leaderboard (T012)"

# Phase 4-9 - Write E2E tests in parallel:
Task: "Write auth E2E tests (T016)"
Task: "Write group E2E tests (T017)"
Task: "Write match E2E tests (T018)"
Task: "Write navigation E2E tests (T019)"
Task: "Write profile E2E tests (T020)"
Task: "Write edge case E2E tests (T021)"
```

---

## Implementation Strategy

### Phase 1: Infrastructure First
1. Install all testing dependencies
2. Configure Vitest and Playwright
3. Verify tests can run (even if empty)

### Phase 2-3: Unit + Integration Tests
1. Write unit tests for core logic (Elo, validation)
2. Write integration tests with MSW mocks
3. All unit/integration tests must pass before E2E

### Phase 4-9: E2E Tests
1. Write E2E tests in parallel across flows
2. Each flow tests its complete user journey
3. All E2E tests must pass before PR

---

## Exit Criteria

- [ ] `pnpm test` passes (unit + integration)
- [ ] `pnpm test:e2e` passes (all E2E tests in Chromium)
- [ ] `pnpm test:all` passes (combined)
- [ ] `pnpm build` succeeds
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] 20+ E2E test cases covering all user flows

---

## Notes

- Use Playwright page objects pattern for E2E tests
- Use MSW for mocking Firebase in integration tests
- Each E2E test file should have a corresponding page object
- Tests should be idempotent (can run multiple times)
- E2E tests use `test.beforeEach` for login/setup
- All tests use descriptive names following `it('should ...', ...) pattern
