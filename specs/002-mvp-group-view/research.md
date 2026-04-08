# Research: Tennis Leagues MVP — Group View

**Feature**: 002-mvp-group-view
**Date**: 2026-04-07
**Status**: Complete (all decisions resolved)

---

## Decisions

### D1: Navigation Pattern — `useNavigate()` from `@solidjs/router`

**Decision**: Replace all `window.location.href` calls with `useNavigate()` hook from solid-router. Read `groupId` from route params via `useParams()`.

**Rationale**: The existing `index.tsx` already has `<Router root={App}>` and route definitions. The `@solidjs/router` v0.16 `useNavigate()` hook provides programmatic navigation without page reloads, preserving SPA state. Route params (`/group/:groupId`) are cleaner than `URLSearchParams` parsing.

**Alternatives considered**:
- `window.location.href`: Causes full page reload, loses SPA state — rejected
- `@solidjs/router` Link component: Only for declarative anchor tags — `useNavigate()` needed for conditional navigation after async operations
- Custom router wrapper: Over-engineered — solid-router's built-in patterns are sufficient

---

### D2: AuthGuard Component Pattern

**Decision**: Create `AuthGuard` as a wrapper component that reads `authStore.isAuthenticated` and redirects to `/login` if false. Wraps authenticated routes in `App.tsx`.

**Rationale**: SolidJS's `<Router>` doesn't have built-in auth guards. A simple `<Show>` component checking the auth signal and calling `useNavigate()` in a `createEffect` or `<Suspense>` boundary is the canonical SolidJS pattern. No external library needed.

**Alternatives considered**:
- Route-level guard via `beforeEach` in router config: solid-router v0.16 doesn't expose global hooks the same way — rejected for complexity
- HOC (Higher Order Component): Not idiomatic for SolidJS — signals are the preferred pattern

---

### D3: AppLayout with Bottom Navigation

**Decision**: Create `AppLayout` component with a fixed bottom tab bar (CSS flexbox, 44px touch targets). Links: Groups (home), Create Group, Settings, Profile.

**Rationale**: Design doc §5 screen flow shows bottom nav. 44px touch targets are mandated by Constitution §V. CSS-only responsive design (no JS layout detection).

**Alternatives considered**:
- Side navigation: Not mobile-first per design doc
- Top tabs: Design doc specifies bottom nav

---

### D4: RecentMatches Component

**Decision**: `RecentMatches` queries `/groups/{groupId}/matches` filtered by `status == "confirmed"`, ordered by `confirmedAt` descending, limited to 10. Player display names resolved via existing `users.ts` service.

**Rationale**: Reuses existing `matches.ts` service. Confirmation date (not submission date) is correct per spec §Player Profile assumption: "Match dates used for the chart are the confirmation dates, not submission dates."

**Query strategy**: Single Firestore query with composite filter (status + groupId) + ordering + limit. Adequate for groups of 20-30 members and ~200 matches per player.

---

### D5: MatchHistory Screen — Pagination vs Infinite Scroll

**Decision**: Implement pagination (20 matches per page) using Firestore `startAfter()` cursor.

**Rationale**: Firestore's `startAfter()` with a document cursor is more reliable than offset-based pagination for frequently updated collections. Offset pagination breaks when documents are deleted/added between pages.

**Alternatives considered**:
- Infinite scroll: Requires cursor management and scroll position restoration — adds complexity not justified for MVP
- Client-side pagination: Loads all matches and paginates in-memory — rejected for large groups

---

### D6: GroupView — Leaderboard Integration

**Decision**: The existing `Leaderboard` component in `src/components/Leaderboard.tsx` is already functional. T016 integrates it into `GroupView` by replacing inline leaderboard markup with the component, passing `groupId` as a prop.

**Status**: Leaderboard component exists and is tested. Integration is a wiring task.

---

## Open Questions (all resolved)

| Question | Resolution |
|----------|------------|
| Do we need a new `matches` service method? | Add `getRecentMatches(groupId, limit)` to `matches.ts` if not already present |
| How to handle player name lookups in RecentMatches? | Reuse existing `users.ts` `getUserDisplayName()` pattern — batch or parallel reads |
| Is MatchHistory a new screen or part of GroupView? | New screen at route `/group/:groupId/matches` |
| Do we need Zod schemas for new components? | AuthGuard/AppLayout props are minimal — no new Zod schemas needed |
| What about the trend indicator in leaderboard? | Existing `Leaderboard` component handles it — verify on integration |
