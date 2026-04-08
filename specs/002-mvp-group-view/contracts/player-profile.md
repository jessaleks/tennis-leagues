# Contracts: Tennis Leagues MVP — Group View

**Feature**: 002-mvp-group-view
**Date**: 2026-04-07

## Not Applicable

This MVP introduces no new external interfaces. All data access is through **existing service functions** that are reused (not modified):

| Service | Functions Used | Change in MVP |
|---------|---------------|---------------|
| `auth.ts` | `signIn()`, `signUp()`, `signOut()`, `onAuthStateChanged()` | None — reused as-is |
| `groups.ts` | `getGroups()`, `createGroup()`, `joinGroup()` | None — reused as-is |
| `matches.ts` | `submitMatch()`, `confirmMatch()`, `getGroupMatches()` | Add `getRecentMatches()` if not present |
| `leaderboard.ts` | `getLeaderboard()` | None — reused as-is |
| `users.ts` | `getUserDisplayName()` | None — reused as-is |
| `player-profile.ts` | `getPlayerProfile()`, `getRatingHistory()` | None — reused as-is |

### New Service Function (if needed)

If `matches.ts` does not already have a `getRecentMatches()` function, it should be added:

```typescript
// src/services/matches.ts
export async function getRecentMatches(
  groupId: string,
  limit: number = 10
): Promise<Match[]> {
  // Query: /groups/{groupId}/matches
  // Filter: status == "confirmed"
  // Order: confirmedAt descending
  // Limit: 10
}
```

This is an **internal service extension** — not a new external interface — so no contract file is needed.
