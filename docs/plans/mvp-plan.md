# Implementation Plan: Tennis Leagues MVP

**Branch**: `mvp-group-view` | **Date**: 2026-04-07 | **Spec**: [Design Doc](./2026-03-01-tennis-leagues-design.md)

**Input**: Task list from `docs/plans/tasks.md`

---

## Summary

Complete the MVP for the Tennis Leagues app: a mobile-first web app where friends form private groups, log match results, and see live Elo-based rankings. The MVP delivers Phase 1 (Setup), Phase 2 (Foundational navigation wiring), and Phase 3 (User Story 1: Complete Group View).

**Decision**: MVP scoped to US1 only (Group View with leaderboard + recent matches). US2 (Player Profile) is already implemented. US3, US4 deferred post-MVP.

---

## Technical Context

| Field | Value |
|-------|-------|
| **Language/Version** | TypeScript 5.6 |
| **Primary Dependencies** | SolidJS 1.9, @solidjs/router 0.16, Firebase 11 (Auth + Firestore), Zod 3.24, Tauri 2.x |
| **Storage** | Firestore (collections: `/users/{userId}`, `/groups/{groupId}`, `/groups/{groupId}/members/{userId}`, `/groups/{groupId}/matches/{matchId}`) |
| **Testing** | `npm test && npm run lint` (tsc --noEmit validates types) |
| **Target Platform** | Web (primary) → Mobile/Desktop via Tauri |
| **Project Type** | Mobile-first web application |
| **Performance Goals** | <100ms navigation transitions, 60fps scrolling |
| **Constraints** | Web-first, CSS-only responsive design, 44px min touch targets, no `any` types, Zod validation at service boundaries |
| **Scale/Scope** | ~10 screens, 5-6 user stories, single Firebase project |

---

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript strict mode | ✅ Pass | No `any` types; Zod schemas derive TypeScript types |
| SolidJS reactive patterns | ✅ Pass | All UI state via signals/stores; no imperative DOM |
| Zod validation at service boundary | ✅ Pass | All Firestore writes validated |
| Firebase as managed backend | ✅ Pass | Auth + Firestore only; `VITE_` env vars |
| Cross-platform by design | ✅ Pass | CSS responsive; Tauri wrapper has no feature-layer code |
| pnpm as package manager | ✅ Pass | Confirmed in package.json |
| Plain CSS (no Tailwind) | ✅ Pass | CSS files per screen/component |

---

## Project Structure

```text
src/
├── components/           # Reusable UI components (Leaderboard, RatingChart, RecentMatches, etc.)
├── screens/              # Page-level components (Login, GroupView, PlayerProfile, etc.)
├── services/             # Firebase/Firestore operations (auth, groups, matches, elo, leaderboard)
├── stores/               # SolidJS reactive state (auth, groups, matches, leaderboard, player-profile)
├── lib/                  # Firebase initialization
├── App.tsx              # Router outlet + auth guard layout
└── index.tsx            # App entry with Router provider

docs/plans/
├── tasks.md             # Full task list (237 tasks, all phases)
├── 2026-03-01-tennis-leagues-design.md  # Design document
└── mvp-plan.md          # This file

specs/001-player-profile/   # Completed feature spec (already merged)
```

**Structure Decision**: Single `src/` directory following SolidJS conventions. Feature specs under `specs/`, plans under `docs/plans/`.

---

## MVP Scope: Phase 1 + Phase 2 + Phase 3

### Phase 1: Setup — T001–T006

**Purpose**: Project initialization and routing foundation

| ID | Task | Status | File |
|----|------|--------|------|
| T001 | Install @solidjs/router | ✅ Done | package.json |
| T002 | Create route configuration | ✅ Done | src/index.tsx |
| T003 | Replace index.tsx with Router | ✅ Done | src/index.tsx |
| T004 | Replace App.tsx with Routes outlet | ✅ Done | src/App.tsx |
| T005 | Create AuthGuard component | ❌ | src/components/AuthGuard.tsx |
| T006 | Create AppLayout with bottom nav | ❌ | src/components/AppLayout.tsx |

**Checkpoint**: App boots with solid-router, auth guard redirects to /login, bottom nav visible when logged in.

---

### Phase 2: Foundational — T007–T015

**Purpose**: Convert all screens from `window.location.href` → `useNavigate()` — **BLOCKS all user stories**

| ID | Task | Status | File |
|----|------|--------|------|
| T007 | Convert Login.tsx | ❌ | src/screens/Login.tsx |
| T008 | Convert Signup.tsx | ❌ | src/screens/Signup.tsx |
| T009 | Convert GroupsList.tsx | ❌ | src/screens/GroupsList.tsx |
| T010 | Convert GroupView.tsx + read groupId from params | ❌ | src/screens/GroupView.tsx |
| T011 | Convert CreateGroup.tsx | ❌ | src/screens/CreateGroup.tsx |
| T012 | Convert JoinGroup.tsx | ❌ | src/screens/JoinGroup.tsx |
| T013 | Convert LogMatch.tsx + read groupId from params | ❌ | src/screens/LogMatch.tsx |
| T014 | Convert ConfirmMatch.tsx + read params | ❌ | src/screens/ConfirmMatch.tsx |
| T015 | Convert GroupSettings.tsx + read groupId from params | ❌ | src/screens/GroupSettings.tsx |

**Checkpoint**: All screens use solid-router — no `window.location.href` remains for in-app navigation.

---

### Phase 3: User Story 1 — Complete Group View — T016–T020

**Purpose**: Group view shows leaderboard + recent matches feed

| ID | Task | Status | File |
|----|------|--------|------|
| T016 | Integrate Leaderboard into GroupView | ❌ | src/screens/GroupView.tsx |
| T017 | Create RecentMatches component | ❌ | src/components/RecentMatches.tsx |
| T018 | Wire RecentMatches into GroupView | ❌ | src/screens/GroupView.tsx |
| T019 | Add "View All Matches" link | ❌ | src/screens/GroupView.tsx |
| T020 | Create MatchHistory screen | ❌ | src/screens/MatchHistory.tsx |

**Checkpoint**: Group view shows live leaderboard + recent matches — fully functional without navigating away.

---

## Complexity Tracking

No violations. MVP is minimal scope — no justification needed.

---

## Dependencies & Execution Order

```
Phase 1 (Setup) ─────────────────┐
                                  ├──► Phase 2 (Foundational) ──┬──► Phase 3 (US1: Group View) ──► MVP DONE
Phase 1 [P] tasks can run in parallel  │
Phase 2 [P] tasks can run in parallel  │
Phase 3 [P] tasks can run in parallel  │
```

**Parallel Opportunities**:
- Phase 1: T002, T005, T006 can run in parallel
- Phase 2: T008, T009, T011, T012, T014, T015 can run in parallel (T007, T010, T013 are sequential-ish but T007 unblocks nothing in parallel set)
- Phase 3: T016, T017, T020 can run in parallel

---

## Post-MVP Backlog

| Phase | User Story | Tasks |
|-------|-----------|-------|
| Phase 4 | US2: Player Profile | T021–T026 — **Already implemented** |
| Phase 5 | US3: Head-to-Head Stats | T027–T030 |
| Phase 6 | US4: Notifications | T031–T036 |
| Phase N | Polish | T037–T041 (ErrorBoundary, Skeletons, AccountSettings) |

---

## Exit Criteria

- [ ] Phase 1 complete: AuthGuard + AppLayout exist and functional
- [ ] Phase 2 complete: Zero `window.location.href` calls in screen files
- [ ] Phase 3 complete: GroupView shows Leaderboard + RecentMatches + "View All Matches" link
- [ ] TypeScript: `pnpm exec tsc --noEmit` passes with zero errors
- [ ] Build: `pnpm build` succeeds
- [ ] Route `/group/:groupId/matches` → MatchHistory screen exists
