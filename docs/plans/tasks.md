# Tasks: Tennis Leagues MVP

**Input**: Implementation plan from `docs/plans/mvp-plan.md`
**Prerequisites**: Design doc (`docs/plans/2026-03-01-tennis-leagues-design.md`), MVP plan (required), existing codebase in `src/`

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend source: `src/`
- Services: `src/services/`
- Stores: `src/stores/`
- Screens: `src/screens/`
- Components: `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and routing foundation

- [ ] T001 Install solid-router dependency with `pnpm add @solidjs/router`
- [ ] T002 [P] Create route configuration in `src/routes.ts` mapping paths to screen components
- [ ] T003 Replace `src/index.tsx` to render app wrapped in `<Router>` provider
- [ ] T004 Replace `src/App.tsx` with `<Routes>` outlet and auth guard layout
- [ ] T005 [P] Create `src/components/AuthGuard.tsx` that redirects unauthenticated users to `/login`
- [ ] T006 [P] Create `src/components/AppLayout.tsx` with bottom navigation bar for authenticated screens

**Checkpoint**: App boots with solid-router, auth guard redirects to login, bottom nav visible when logged in

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core navigation wiring — MUST complete before user stories can be tested

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Convert `src/screens/Login.tsx` from `window.location.href` to `useNavigate()` from solid-router
- [ ] T008 [P] Convert `src/screens/Signup.tsx` from `window.location.href` to `useNavigate()`
- [ ] T009 [P] Convert `src/screens/GroupsList.tsx` from `window.location.href` to `useNavigate()`
- [ ] T010 Convert `src/screens/GroupView.tsx` from `window.location.href` to `useNavigate()` and read `groupId` from route params
- [ ] T011 [P] Convert `src/screens/CreateGroup.tsx` navigation to `useNavigate()`
- [ ] T012 [P] Convert `src/screens/JoinGroup.tsx` navigation to `useNavigate()`
- [ ] T013 Convert `src/screens/LogMatch.tsx` to read `groupId` from route params and use `useNavigate()`
- [ ] T014 [P] Convert `src/screens/ConfirmMatch.tsx` to read params from route and use `useNavigate()`
- [ ] T015 [P] Convert `src/screens/GroupSettings.tsx` to read `groupId` from route params and use `useNavigate()`

**Checkpoint**: All screens use solid-router for navigation — no `window.location.href` remains for in-app navigation

---

## Phase 3: User Story 1 — Complete Group View (Priority: P1)

**Goal**: Group view shows leaderboard (using existing `Leaderboard` component) and recent matches feed

**Independent Test**: Open a group → see ranked leaderboard with trends and a scrollable list of recent confirmed matches

### Implementation for User Story 1

- [ ] T016 [P] [US1] Integrate `src/components/Leaderboard.tsx` into `src/screens/GroupView.tsx` replacing the inline leaderboard markup
- [ ] T017 [P] [US1] Create `src/components/RecentMatches.tsx` component that fetches and displays confirmed matches with player names, scores, and date
- [ ] T018 [US1] Wire `RecentMatches` into `src/screens/GroupView.tsx` replacing the placeholder section
- [ ] T019 [US1] Add "View All Matches" link in `src/screens/GroupView.tsx` navigating to `/group/:groupId/matches`
- [ ] T020 [P] [US1] Create `src/screens/MatchHistory.tsx` showing all confirmed matches for a group with pagination or infinite scroll

**Checkpoint**: Group view shows live leaderboard + recent matches — fully functional without navigating away

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T021 [P] Add error boundary component in `src/components/ErrorBoundary.tsx` wrapping the router outlet
- [ ] T022 [P] Create `src/components/Skeleton.tsx` loading component and integrate into GroupView, GroupsList, and PlayerProfile
- [ ] T023 Audit all screen CSS files in `src/screens/*.css` for mobile responsiveness — verify 44px touch targets and proper spacing at 375px width
- [ ] T024 [P] Add `src/screens/AccountSettings.tsx` with display name edit, photo upload, and logout (route: `/settings`)
- [ ] T025 Clean up unused imports and ensure TypeScript strict mode has zero errors with `pnpm exec tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3)**: Depends on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Within Each User Story

- Services/stores before components
- Components before screens
- Screens before route wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T005, T006)
- All Foundational tasks marked [P] can run in parallel within Phase 2 (T008, T009, T011, T012, T014, T015)
- Within US1: T016, T017, and T020 can run in parallel

---

## Parallel Example: After Foundational Phase

```bash
# Launch AuthGuard and AppLayout in parallel:
Task: "Create AuthGuard component (T005)"
Task: "Create AppLayout with bottom nav (T006)"

# Launch all navigation conversions in parallel:
Task: "Convert Signup.tsx (T008)"
Task: "Convert GroupsList.tsx (T009)"
Task: "Convert CreateGroup.tsx (T011)"
Task: "Convert JoinGroup.tsx (T012)"
Task: "Convert ConfirmMatch.tsx (T014)"
Task: "Convert GroupSettings.tsx (T015)"

# Launch US1 components in parallel:
Task: "Integrate Leaderboard into GroupView (T016)"
Task: "Create RecentMatches component (T017)"
Task: "Create MatchHistory screen (T020)"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (routing)
2. Complete Phase 2: Foundational (navigation wiring)
3. Complete Phase 3: US1 — Complete Group View
4. **STOP and VALIDATE**: Group view shows leaderboard + recent matches
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → routing works
2. Add US1 → Group View complete → Deploy/Demo (MVP!)
3. Polish phase → ErrorBoundary, Skeletons, AccountSettings
4. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing services (`auth.ts`, `groups.ts`, `matches.ts`, `elo.ts`, `leaderboard.ts`) are reused — not recreated
- Existing stores (`auth.store.ts`, `groups.store.ts`, `matches.store.ts`, `leaderboard.store.ts`) are reused
