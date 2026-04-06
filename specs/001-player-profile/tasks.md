# Tasks: Player Profile with Rating History

**Input**: Design documents from `/specs/001-player-profile/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/player-profile.md, research.md

**Tests**: Not explicitly requested in spec — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Services: `src/services/`
- Stores: `src/stores/`
- Screens: `src/screens/`
- Components: `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Routing foundation — profile page requires solid-router to be wired up

- [X] T001 Install `@solidjs/router` with `pnpm add @solidjs/router`
- [X] T002 [P] Create route configuration in `src/routes.tsx` defining all app routes including `/group/:groupId/player/:playerId`
- [X] T003 Update `src/index.tsx` to wrap the app in `<Router>` provider from `@solidjs/router`
- [X] T004 Update `src/App.tsx` to render `<Routes>` outlet instead of the current static content

**Checkpoint**: App boots with solid-router, existing screens accessible via routes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Navigation wiring — MUST complete before user stories can be tested

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Convert `src/screens/GroupsList.tsx` to use `useNavigate()` from solid-router instead of `window.location.href`
- [X] T006 [P] Convert `src/screens/GroupView.tsx` to read `groupId` from route params and use `useNavigate()` for navigation
- [X] T007 Convert `src/screens/Login.tsx` to use `useNavigate()` for post-login redirect
- [X] T008 [P] Convert `src/screens/Signup.tsx` to use `useNavigate()` for post-signup redirect
- [X] T009 Convert `src/screens/LogMatch.tsx` to read `groupId` from route params via `useParams()`
- [X] T010 [P] Convert `src/screens/ConfirmMatch.tsx` to read params from route and use `useNavigate()`
- [X] T011 [P] Convert `src/screens/GroupSettings.tsx` to read `groupId` from route params
- [X] T012 Convert `src/screens/CreateGroup.tsx` navigation to `useNavigate()`
- [X] T013 [P] Convert `src/screens/JoinGroup.tsx` navigation to `useNavigate()`

**Checkpoint**: All screens use solid-router — no `window.location.href` for in-app navigation

---

## Phase 3: User Story 1 — View Player Profile (Priority: P1) 🎯 MVP

**Goal**: Player profile page accessible from leaderboard showing name, rating, W-L record, and recent matches

**Independent Test**: Tap a player name from the group leaderboard → profile page opens showing name, rating, W-L record, and recent matches

### Implementation for User Story 1

- [x] T014 [P] [US1] Create `src/services/player-profile.ts` with `getPlayerProfile()` function that fetches member doc + user doc and returns a `PlayerProfile` object
- [x] T015 [P] [US1] Add `getPlayerMatches()` function to `src/services/player-profile.ts` that queries confirmed matches and returns `MatchResult[]` with opponent names
- [x] T016 [US1] Add Zod validation schemas for `groupId` and `userId` inputs in `src/services/player-profile.ts` (per constitution Principle III)
- [x] T017 [P] [US1] Create `src/stores/player-profile.store.ts` with signals for `currentProfile`, `playerMatches`, `loading`, `error` and a `fetchProfile()` action
- [x] T018 [US1] Create `src/screens/PlayerProfile.tsx` displaying player name, photo, current rating, W-L record, and match list
- [x] T019 [US1] Create `src/screens/PlayerProfile.css` with responsive styles (320px–1200px), 44px touch targets per constitution Principle V
- [x] T020 [US1] Add route `/group/:groupId/player/:playerId` pointing to `PlayerProfile` component in `src/routes.ts`
- [x] T021 [US1] Make player names in `src/components/Leaderboard.tsx` clickable, navigating to `/group/:groupId/player/:playerId`
- [x] T022 [US1] Add a `formatRelativeDate()` utility function in `src/services/player-profile.ts` for human-readable date display (FR-009)

**Checkpoint**: Profile page fully functional — accessible from leaderboard, shows stats and match list

---

## Phase 4: User Story 2 — Rating History Chart (Priority: P2)

**Goal**: Profile page includes an SVG line chart showing Elo rating progression over confirmed matches

**Independent Test**: Open a player profile with multiple matches → chart displays rating progression with data points for each confirmed match

### Implementation for User Story 2

- [x] T023 [P] [US2] Add `getRatingHistory()` function to `src/services/player-profile.ts` that fetches confirmed matches sorted ascending and replays Elo calculation to produce `RatingHistoryEntry[]`
- [x] T024 [US2] Add `ratingHistory` signal and update `fetchProfile()` in `src/stores/player-profile.store.ts` to load rating history in parallel with profile
- [x] T025 [US2] Create `src/components/RatingChart.tsx` — an SVG line chart component that accepts `RatingHistoryEntry[]` and renders a responsive line with data points
- [x] T026 [US2] Add `src/components/RatingChart.css` with styles for the chart container, scaling to viewport width
- [x] T027 [US2] Integrate `RatingChart` into `src/screens/PlayerProfile.tsx` with empty-state handling ("No rating history yet" for 0 matches, single point for 1 match)

**Checkpoint**: Rating chart renders for 0–200+ data points, scales to mobile viewport ✅

---

## Phase 5: User Story 3 — Head-to-Head Summary (Priority: P3)

**Goal**: When viewing another player's profile, show H2H win/loss record between the two players

**Independent Test**: Open another player's profile → H2H section shows wins for each player against the other

### Implementation for User Story 3

- [x] T028 [P] [US3] Add `getHeadToHead()` function to `src/services/player-profile.ts` that filters confirmed matches between two player IDs and returns a `HeadToHeadRecord`
- [x] T029 [US3] Add `headToHead` signal and update `fetchProfile()` in `src/stores/player-profile.store.ts` to load H2H data when viewing another player (not self)
- [x] T030 [US3] Add H2H section to `src/screens/PlayerProfile.tsx` — conditionally rendered only when viewing another player (FR-007), showing "X wins - Y losses" or "No matches yet"

**Checkpoint**: H2H visible on other player profiles, hidden on own profile ✅

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T031 [P] Add loading skeleton in `src/screens/PlayerProfile.tsx` shown while data is fetching
- [x] T032 [P] Add error state handling in `src/screens/PlayerProfile.tsx` with retry capability
- [x] T033 Verify all touch targets in `src/screens/PlayerProfile.css` are at least 44px per constitution Principle V
- [x] T034 Run `pnpm exec tsc --noEmit` to verify zero TypeScript errors
- [x] T035 Run `pnpm build` to verify Vite build succeeds

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - US1 (View Profile) can start after Foundational — no story dependencies
  - US2 (Rating Chart) can start after Foundational — no story dependencies (chart integrates into US1's screen but US1 must exist first)
  - US3 (H2H) depends on US1 (needs PlayerProfile screen to exist)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (View Profile)**: Can start after Foundational (Phase 2) — no story dependencies
- **US2 (Rating Chart)**: Depends on US1 (integrates into PlayerProfile screen)
- **US3 (H2H)**: Depends on US1 (integrates into PlayerProfile screen)

### Within Each User Story

- Services before stores
- Stores before screens/components
- Components before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002)
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Within US1: T014, T015, T017 can run in parallel (different files)
- Within US2: T023, T025 can run in parallel (service vs component)
- Within US3: T028 can run in parallel with US2 work (different file)
- US1 and US2 service/store tasks can overlap since they touch different functions in the same files

---

## Parallel Example: User Story 1

```bash
# Launch service + store creation together:
Task: "Create getPlayerProfile() in src/services/player-profile.ts (T014)"
Task: "Create getPlayerMatches() in src/services/player-profile.ts (T015)"
Task: "Create player-profile store in src/stores/player-profile.store.ts (T017)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (routing)
2. Complete Phase 2: Foundational (navigation wiring)
3. Complete Phase 3: US1 — View Player Profile
4. **STOP and VALIDATE**: Profile page shows name, rating, W-L, match list
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → routing works
2. Add US1 → Profile page → Deploy/Demo (MVP!)
3. Add US2 → Rating chart → Deploy/Demo
4. Add US3 → H2H summary → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (View Profile — service, store, screen)
   - Developer B: US2 (Rating Chart — service function, chart component)
3. After US1 + US2 complete:
   - Either developer: US3 (H2H — service function, screen integration)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing services (`elo.ts`, `matches.ts`, `users.ts`) are reused — not recreated
- Constitution Principle III (Input Validation): Zod schemas required at service boundary (T016)
- Constitution Principle V (Cross-Platform): CSS-only responsive, 44px touch targets (T019, T033)
