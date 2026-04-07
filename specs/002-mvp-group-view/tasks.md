# Tasks: Tennis Leagues MVP — Group View

**Input**: Implementation plan from `specs/002-mvp-group-view/plan.md`
**Prerequisites**: plan.md (required), design doc (`docs/plans/2026-03-01-tennis-leagues-design.md`), existing codebase in `src/`

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Path Conventions

- Frontend source: `src/`
- Services: `src/services/`
- Stores: `src/stores/`
- Screens: `src/screens/`
- Components: `src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and routing foundation — AuthGuard + AppLayout

- [ ] T001 [P] Create `src/components/AuthGuard.tsx` that redirects unauthenticated users to `/login` using `useNavigate()` and `authStore.isAuthenticated`
- [ ] T002 [P] Create `src/components/AppLayout.tsx` with a fixed bottom navigation bar using CSS flexbox, 44px touch targets per Constitution §V, with tabs for Groups, Create, Settings, and Profile
- [ ] T003 [P] Add route `/group/:groupId/matches` for the MatchHistory screen in `src/index.tsx`
- [ ] T004 Replace `src/App.tsx` to use `<Routes>` outlet with `AuthGuard` wrapping authenticated routes and `AppLayout` as the layout wrapper for the outlet

**Checkpoint**: App boots with solid-router, AuthGuard redirects unauthenticated users to `/login`, bottom nav visible when logged in

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core navigation wiring — MUST complete before user stories can be tested

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Convert `src/screens/Login.tsx` from `window.location.href` navigation to `useNavigate()` from `@solidjs/router`
- [ ] T006 [P] Convert `src/screens/Signup.tsx` from `window.location.href` navigation to `useNavigate()`
- [ ] T007 [P] Convert `src/screens/GroupsList.tsx` from `window.location.href` navigation to `useNavigate()`
- [ ] T008 Convert `src/screens/GroupView.tsx` from `window.location.href` navigation to `useNavigate()` and read `groupId` from route params using `useParams()`
- [ ] T009 [P] Convert `src/screens/CreateGroup.tsx` from `window.location.href` navigation to `useNavigate()`
- [ ] T010 [P] Convert `src/screens/JoinGroup.tsx` from `window.location.href` navigation to `useNavigate()`
- [ ] T011 Convert `src/screens/LogMatch.tsx` to read `groupId` from route params using `useParams()` and use `useNavigate()` for navigation
- [ ] T012 [P] Convert `src/screens/ConfirmMatch.tsx` to read params from route using `useParams()` and use `useNavigate()`
- [ ] T013 [P] Convert `src/screens/GroupSettings.tsx` to read `groupId` from route params using `useParams()` and use `useNavigate()`

**Checkpoint**: All screens use solid-router for navigation — no `window.location.href` remains for in-app navigation

---

## Phase 3: User Story 1 — Complete Group View (Priority: P1)

**Goal**: Group view shows leaderboard (using existing `Leaderboard` component) and recent matches feed

**Independent Test**: Open a group → see ranked leaderboard with trends and a scrollable list of recent confirmed matches

### Implementation for User Story 1

- [ ] T014 [P] [US1] Integrate `src/components/Leaderboard.tsx` into `src/screens/GroupView.tsx` by replacing the inline leaderboard markup with the component, passing `groupId` as a prop
- [ ] T015 [P] [US1] Create `src/components/RecentMatches.tsx` component that queries Firestore for confirmed matches (status == "confirmed"), ordered by `confirmedAt` descending, limited to 10, displaying player names, winner, date, and scores
- [ ] T016 [US1] Wire `RecentMatches` into `src/screens/GroupView.tsx` by adding the `<RecentMatches groupId={groupId} />` component below the leaderboard
- [ ] T017 [US1] Add "View All Matches" link in `src/screens/GroupView.tsx` navigating to `/group/:groupId/matches` using `useNavigate()`
- [ ] T018 [P] [US1] Create `src/screens/MatchHistory.tsx` showing all confirmed matches for a group with pagination (20 per page using Firestore `startAfter()` cursor), with previous/next page navigation buttons

**Checkpoint**: Group view shows live leaderboard + recent matches — fully functional without navigating away

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T019 [P] Add error boundary component in `src/components/ErrorBoundary.tsx` wrapping the router outlet using SolidJS error boundaries
- [ ] T020 [P] Create `src/components/Skeleton.tsx` loading component using CSS animation and integrate into `GroupView`, `GroupsList`, and `PlayerProfile` screens
- [ ] T021 Audit all screen CSS files in `src/screens/*.css` for mobile responsiveness — verify 44px touch targets and proper spacing at 375px width
- [ ] T022 [P] Add `src/screens/AccountSettings.tsx` with display name edit, photo upload, and logout functionality at route `/settings`
- [ ] T023 Ensure TypeScript strict mode has zero errors by running `pnpm exec tsc --noEmit` and fixing any type errors found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phase 3)**: Depends on Phase 2 completion
- **Polish (Final Phase)**: Depends on Phase 3 completion

### Within Each Phase

- Phase 1: T001, T002, T003 can run in parallel (different new files)
- Phase 2: T006, T007, T009, T010, T012, T013 can all run in parallel (different screen files)
- Phase 3: T014, T015, T018 can run in parallel (different files)

### Post-MVP (Not in Scope)

| User Story | Tasks | Status |
|-----------|-------|--------|
| US2: Player Profile | T021–T026 from original list | ✅ Already implemented |
| US3: Head-to-Head Stats | T027–T030 from original list | Pending |
| US4: Notifications | T031–T036 from original list | Pending |

---

## Parallel Execution Examples

```bash
# Phase 1 — AuthGuard and AppLayout in parallel:
Task: "Create AuthGuard component (T001)"
Task: "Create AppLayout with bottom nav (T002)"
Task: "Add MatchHistory route (T003)"

# Phase 2 — All screen conversions in parallel:
Task: "Convert Signup.tsx (T006)"
Task: "Convert GroupsList.tsx (T007)"
Task: "Convert CreateGroup.tsx (T009)"
Task: "Convert JoinGroup.tsx (T010)"
Task: "Convert ConfirmMatch.tsx (T012)"
Task: "Convert GroupSettings.tsx (T013)"

# Phase 3 — US1 components in parallel:
Task: "Integrate Leaderboard into GroupView (T014)"
Task: "Create RecentMatches component (T015)"
Task: "Create MatchHistory screen (T018)"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: AuthGuard + AppLayout
2. Complete Phase 2: Navigation wiring (all screens)
3. Complete Phase 3: US1 — Group View complete
4. **STOP and VALIDATE**: Group view shows leaderboard + recent matches
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Phase 1 + Phase 2 → routing fully functional
2. Add Phase 3 → Group View complete → MVP!
3. Polish phase → ErrorBoundary, Skeletons, AccountSettings
4. Each phase adds value without breaking previous phases

---

## Notes

- [P] tasks = different files, no dependencies — safe to parallelize
- [Story] label (US1) maps to User Story 1 for traceability
- Each phase should be independently completable and testable
- Commit after each phase or logical group
- Stop at any checkpoint to validate independently
- Existing services (`auth.ts`, `groups.ts`, `matches.ts`, `elo.ts`, `leaderboard.ts`) are reused — not modified unless adding `getRecentMatches()`
- Existing stores (`auth.store.ts`, `groups.store.ts`, `matches.store.ts`, `leaderboard.store.ts`) are reused
