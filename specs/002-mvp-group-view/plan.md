# Implementation Plan: Tennis Leagues MVP — Group View

**Branch**: `002-mvp-group-view` | **Date**: 2026-04-07 | **Spec**: [Design Doc](../docs/plans/2026-03-01-tennis-leagues-design.md)
**Input**: Design document from `docs/plans/2026-03-01-tennis-leagues-design.md`

---

## Summary

Complete the MVP for the Tennis Leagues app by implementing Phase 1 (AuthGuard + AppLayout), Phase 2 (navigation wiring from `window.location.href` → `useNavigate()`), and Phase 3 (Complete Group View with RecentMatches + MatchHistory). Player Profile (US2) is already implemented. This MVP delivers a working Group View where users see the leaderboard and recent matches feed, can navigate to match history, and can navigate between all screens using solid-router.

**Decision**: MVP scoped to Phase 1 + Phase 2 + Phase 3. Post-MVP backlog includes H2H Stats (US3), Notifications (US4), and Polish.

---

## Technical Context

| Field | Value |
|-------|-------|
| **Language/Version** | TypeScript 5.6 |
| **Primary Dependencies** | SolidJS 1.9, @solidjs/router 0.16, Firebase 11 (Auth + Firestore), Zod 3.24, Tauri 2.x |
| **Storage** | Firestore — existing collections (`/users/{userId}`, `/groups/{groupId}`, `/groups/{groupId}/members/{userId}`, `/groups/{groupId}/matches/{matchId}`) — no new collections |
| **Testing** | `npm test && npm run lint` (`tsc --noEmit` validates types) |
| **Target Platform** | Web (primary) → Mobile/Desktop via Tauri |
| **Project Type** | Mobile-first web application |
| **Performance Goals** | <100ms navigation transitions, 60fps scrolling |
| **Constraints** | Web-first, CSS-only responsive design, 44px min touch targets, no `any` types, Zod validation at service boundaries |
| **Scale/Scope** | ~10 screens, 5-6 user stories, single Firebase project |

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | ✅ Pass | Strict TypeScript, no `any`; Zod schemas derive TypeScript types |
| II. Reactive Architecture | ✅ Pass | SolidJS signals/stores; no imperative DOM |
| III. Input Validation | ✅ Pass | Zod validation at service boundaries for all external input |
| IV. Firebase as Managed Backend | ✅ Pass | Auth + Firestore only; `VITE_` env vars; no new collections |
| V. Cross-Platform by Design | ✅ Pass | CSS responsive; Tauri wrapper has no feature-layer code |
| pnpm as package manager | ✅ Pass | Confirmed in package.json |
| Plain CSS (no Tailwind) | ✅ Pass | CSS files per screen/component |

**No violations.** No complexity tracking needed.

---

## Project Structure

### Documentation (this feature)

```text
specs/002-mvp-group-view/
├── plan.md              # This file
├── research.md          # Phase 0: technical decisions (navigation, component patterns)
├── data-model.md        # Not applicable — MVP reuses existing Firestore schema, no new entities
├── quickstart.md        # Phase 1: manual test scenarios for MVP
├── contracts/           # Not applicable — no new external interfaces in MVP
└── tasks.md             # Phase 2 output (from /speckit.tasks)

docs/plans/
├── tasks.md             # MVP task list (T001–T025)
├── mvp-plan.md          # Reference implementation plan
└── 2026-03-01-tennis-leagues-design.md  # Design document
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── AuthGuard.tsx          # NEW: redirects unauthenticated users to /login
│   ├── AppLayout.tsx          # NEW: bottom navigation bar for authenticated screens
│   ├── RecentMatches.tsx      # NEW: displays confirmed matches with player names, scores, date
│   ├── Leaderboard.tsx        # EXISTING: reused in GroupView
│   └── RatingChart.tsx        # EXISTING: used in PlayerProfile
├── screens/
│   ├── GroupView.tsx          # MODIFY: integrate Leaderboard + RecentMatches; use useNavigate()
│   ├── MatchHistory.tsx       # NEW: all confirmed matches for a group
│   ├── Login.tsx              # MODIFY: convert window.location.href → useNavigate()
│   ├── Signup.tsx             # MODIFY: convert window.location.href → useNavigate()
│   ├── GroupsList.tsx         # MODIFY: convert window.location.href → useNavigate()
│   ├── CreateGroup.tsx        # MODIFY: convert window.location.href → useNavigate()
│   ├── JoinGroup.tsx          # MODIFY: convert window.location.href → useNavigate()
│   ├── LogMatch.tsx           # MODIFY: use groupId from params + useNavigate()
│   ├── ConfirmMatch.tsx       # MODIFY: read params from route + useNavigate()
│   ├── GroupSettings.tsx      # MODIFY: use groupId from params + useNavigate()
│   └── PlayerProfile.tsx      # EXISTING: already implemented
├── services/
│   ├── auth.ts                # EXISTING: reused
│   ├── groups.ts              # EXISTING: reused
│   ├── matches.ts             # EXISTING: reused (add getRecentMatches if needed)
│   ├── elo.ts                 # EXISTING: reused
│   ├── leaderboard.ts         # EXISTING: reused
│   └── player-profile.ts      # EXISTING: reused
├── stores/
│   ├── auth.store.ts          # EXISTING: reused
│   ├── groups.store.ts        # EXISTING: reused
│   └── player-profile.store.ts  # EXISTING: reused
├── App.tsx                    # MODIFY: add AuthGuard + AppLayout wrappers
└── index.tsx                  # EXISTING: already has Router + routes

tests/                         # Not in MVP scope
```

**Structure Decision**: Single `src/` directory. New files: AuthGuard, AppLayout, RecentMatches, MatchHistory. Modified files: all screen components (navigation conversion). Reused files: services, stores, existing components.

---

## Phase 0: Research

All technical decisions resolved from existing implementation and design doc:

1. **Navigation**: `@solidjs/router` — `useNavigate()` hook replaces `window.location.href`. Route params replace `URLSearchParams` for `groupId` and `playerId`. ✅ Already configured in `index.tsx`.
2. **AuthGuard**: Redirect component wrapping authenticated routes — reads `authStore.isAuthenticated` signal, uses `useNavigate()` to redirect to `/login`. ✅ Straightforward SolidJS component.
3. **AppLayout**: Bottom tab bar using CSS flexbox, 44px touch targets per Constitution §V. Links: Groups, Create, Settings, Profile. ✅ Standard SolidJS component.
4. **RecentMatches**: Firestore query on `/groups/{groupId}/matches` filtered by `status == "confirmed"`, ordered by `confirmedAt` descending, limited to 10. Player names resolved from `/users/{userId}/displayName`. ✅ Reuses existing `matches.ts` service.
5. **MatchHistory**: Same query as RecentMatches but paginated (20 per page) or infinite scroll. CSS-only responsive. ✅ Component needs new implementation.

**No unknowns. research.md is informational only.**

---

## Phase 1: Design

### Data Model

Not applicable — MVP reuses the existing Firestore schema with no new collections or entity types. The existing schema from `docs/plans/2026-03-01-tennis-leagues-design.md` §3 is sufficient:
- `/users/{userId}` — existing
- `/groups/{groupId}` — existing
- `/groups/{groupId}/members/{userId}` — existing
- `/groups/{groupId}/matches/{matchId}` — existing

### Contracts

Not applicable — MVP introduces no new external interfaces. All interactions are through existing services (`groups.ts`, `matches.ts`, `leaderboard.ts`).

### Quickstart

Five manual test scenarios:

1. **Auth redirect**: Fresh load to `/` → redirected to `/login`
2. **Login → groups**: Login → redirected to `/` (groups list)
3. **Group view leaderboard**: Tap group → see ranked leaderboard with trend indicators
4. **Recent matches feed**: Group view shows 10 most recent confirmed matches with player names and dates
5. **View all matches**: Tap "View All Matches" → `/group/:groupId/matches` shows paginated match history
6. **Screen navigation**: Navigate between all screens using bottom nav tabs — no `window.location.href` reloads

---

## Phase 2: Tasks

Generated by `/speckit.tasks` command (creates `specs/002-mvp-group-view/tasks.md`).

---

## Complexity Tracking

No violations — table empty. MVP follows all constitution principles with no deviations.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup: AuthGuard + AppLayout)
         │
         ▼
Phase 2 (Foundational: navigation wiring) ─────────────────┐
         │                                               │
         ▼                                               ▼
Phase 3 (US1: Group View + RecentMatches)          Post-MVP
```

### Within Each Phase

- Phase 1: T005 (AuthGuard) and T006 (AppLayout) can run in parallel after T004
- Phase 2: T008, T009, T011, T012, T014, T015 can all run in parallel (different files)
- Phase 3: T016 (Leaderboard integration), T017 (RecentMatches), T020 (MatchHistory) can run in parallel

### Post-MVP

| User Story | Status | Notes |
|-----------|--------|-------|
| US2: Player Profile | ✅ Done | Already merged |
| US3: Head-to-Head Stats | Pending | Depends on US2 |
| US4: Notifications | Pending | Independent |
| Polish | Pending | Independent |
