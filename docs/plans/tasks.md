# Tasks: Tennis Leagues App

**Input**: Design document from `docs/plans/2026-03-01-tennis-leagues-design.md`
**Prerequisites**: Design doc (required), existing codebase in `src/`

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

## Phase 4: User Story 2 — Player Profile (Priority: P2)

**Goal**: Tap a player to see their rating history, win/loss record, and recent matches

**Independent Test**: Tap any player name → see profile page with rating, W-L record, and match history

### Implementation for User Story 2

- [ ] T021 [P] [US2] Create `src/services/player-profile.ts` with functions: `getPlayerStats()`, `getRatingHistory()`, `getPlayerMatches()`
- [ ] T022 [P] [US2] Create `src/stores/player-profile.store.ts` with signals for current profile, rating history, and player matches
- [ ] T023 [US2] Create `src/screens/PlayerProfile.tsx` displaying player name, photo, rating, W-L record, and match list
- [ ] T024 [P] [US2] Create `src/components/RatingChart.tsx` — a simple SVG line chart showing rating over time
- [ ] T025 [US2] Add route `/group/:groupId/player/:playerId` pointing to PlayerProfile in `src/routes.ts`
- [ ] T026 [US2] Make player names in `src/components/Leaderboard.tsx` and `src/components/RecentMatches.tsx` clickable, linking to player profile route

**Checkpoint**: Player profiles are fully navigable from leaderboard and match lists

---

## Phase 5: User Story 3 — Head-to-Head Stats (Priority: P3)

**Goal**: View head-to-head record between any two players in the group

**Independent Test**: From a player profile or match, view H2H record showing wins each way and recent matches

### Implementation for User Story 3

- [ ] T027 [P] [US3] Add `getHeadToHead()` function to `src/services/matches.ts` filtering matches by two player IDs
- [ ] T028 [US3] Create `src/components/HeadToHead.tsx` showing H2H record (wins per player) and recent matches between the pair
- [ ] T029 [US3] Add H2H section to `src/screens/PlayerProfile.tsx` when viewing another player's profile
- [ ] T030 [P] [US3] Add "Compare" action in `src/screens/PlayerProfile.tsx` that lets user select a second player to view H2H

**Checkpoint**: H2H stats viewable between any two players from profile or match context

---

## Phase 6: User Story 4 — Notifications (Priority: P3)

**Goal**: Users receive notifications for match confirmation requests and confirmed results

**Independent Test**: Submit a match → opponent gets notification. Confirm a match → submitter gets notification with new rating.

### Implementation for User Story 4

- [ ] T031 [P] [US4] Create `src/services/notifications.ts` with Firebase Cloud Messaging setup: `requestPermission()`, `onMessage()`, `getToken()`
- [ ] T032 [P] [US4] Create `src/stores/notifications.store.ts` with signals for notification list and unread count
- [ ] T033 [US4] Create `src/components/NotificationBell.tsx` icon with unread badge for the app layout header
- [ ] T034 [US4] Create `src/screens/Notifications.tsx` listing notification history with read/unread state
- [ ] T035 [US4] Add route `/notifications` in `src/routes.ts` and link NotificationBell in `src/components/AppLayout.tsx`
- [ ] T036 [US4] Trigger notification writes in `src/services/matches.ts` on `submitMatch()` and `confirmMatch()`

**Checkpoint**: Notification bell shows unread count, tapping opens notification list, match events trigger notifications

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T037 [P] Add error boundary component in `src/components/ErrorBoundary.tsx` wrapping the router outlet
- [ ] T038 [P] Create `src/components/Skeleton.tsx` loading component and integrate into GroupView, GroupsList, and PlayerProfile
- [ ] T039 Audit all screen CSS files in `src/screens/*.css` for mobile responsiveness — verify 44px touch targets and proper spacing at 375px width
- [ ] T040 [P] Add `src/screens/AccountSettings.tsx` with display name edit, photo upload, and logout (route: `/settings`)
- [ ] T041 Clean up unused imports and ensure TypeScript strict mode has zero errors with `pnpm exec tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1 (Group View) and US2 (Player Profile) can run in parallel after Phase 2
  - US3 (H2H) depends on US2 (needs Player Profile to show H2H)
  - US4 (Notifications) is independent — can run in parallel with US1/US2
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Complete Group View)**: Can start after Foundational (Phase 2) — no story dependencies
- **US2 (Player Profile)**: Can start after Foundational (Phase 2) — no story dependencies
- **US3 (H2H Stats)**: Depends on US2 (Player Profile must exist to show H2H)
- **US4 (Notifications)**: Can start after Foundational (Phase 2) — no story dependencies

### Within Each User Story

- Services/stores before components
- Components before screens
- Screens before route wiring
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T005, T006)
- All Foundational tasks marked [P] can run in parallel within Phase 2
- Once Foundational completes: US1, US2, and US4 can start in parallel
- Within US1: T016 and T017 can run in parallel
- Within US2: T021 and T022 can run in parallel, then T024 in parallel with T023
- Within US4: T031 and T032 can run in parallel

---

## Parallel Example: After Foundational Phase

```bash
# Launch US1, US2, US4 simultaneously (US3 waits for US2):
Task: "Integrate Leaderboard into GroupView (T016)"
Task: "Create player-profile service (T021)"
Task: "Create notifications service (T031)"
Task: "Create RecentMatches component (T017)"
Task: "Create player-profile store (T022)"
Task: "Create notifications store (T032)"
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
3. Add US2 → Player Profiles → Deploy/Demo
4. Add US3 → H2H Stats → Deploy/Demo
5. Add US4 → Notifications → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Complete Group View)
   - Developer B: US2 (Player Profile)
   - Developer C: US4 (Notifications)
3. After US2 completes: Developer B picks up US3 (H2H Stats)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Existing services (`auth.ts`, `groups.ts`, `matches.ts`, `elo.ts`, `leaderboard.ts`) are reused — not recreated
- Existing stores (`auth.store.ts`, `groups.store.ts`, `matches.store.ts`, `leaderboard.store.ts`) are reused
