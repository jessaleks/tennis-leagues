# Data Model: Tennis Leagues MVP — Group View

**Feature**: 002-mvp-group-view
**Date**: 2026-04-07

## Not Applicable

This MVP does not introduce new Firestore collections, new entity types, or changes to the existing data schema. All data models are already defined in the approved design document:

📄 **See**: `docs/plans/2026-03-01-tennis-leagues-design.md` §3 — Data Model (Firestore)

The existing schema is:

| Collection | Purpose |
|------------|---------|
| `/users/{userId}` | User accounts |
| `/groups/{groupId}` | Group metadata |
| `/groups/{groupId}/members/{userId}` | Per-group player stats (rating, wins, losses) |
| `/groups/{groupId}/matches/{matchId}` | Match records (player1, player2, winner, status, scores) |

No new subcollections, no new fields, no new relationships.

---

## Component-Level State

| Component | State | Type |
|-----------|-------|------|
| `AuthGuard` | `isAuthenticated` | Signal from `authStore` |
| `AppLayout` | `currentPath` | Signal from `useLocation()` |
| `RecentMatches` | `matches`, `loading`, `error` | Signal array from Firestore query |
| `MatchHistory` | `matches`, `page`, `loading`, `hasMore` | Signal + store |

These are local component signals — no new shared stores or cross-component state.
