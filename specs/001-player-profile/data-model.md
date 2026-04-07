# Data Model: Player Profile with Rating History

**Date**: 2026-04-06
**Feature**: Player Profile with Rating History

## Entities

### PlayerProfile (derived — not stored, computed on read)

Represents a user's stats within a specific group.

| Field | Type | Source |
|-------|------|--------|
| userId | string | `/groups/{groupId}/members/{userId}` document ID |
| displayName | string | `/users/{userId}.displayName` |
| photoURL | string? | `/users/{userId}.photoURL` |
| rating | number | `/groups/{groupId}/members/{userId}.rating` |
| wins | number | `/groups/{groupId}/members/{userId}.wins` |
| losses | number | `/groups/{groupId}/members/{userId}.losses` |
| lastMatchAt | Date? | `/groups/{groupId}/members/{userId}.lastMatchAt` |

**Validation**: userId and groupId must be non-empty strings. Rating defaults to 1500 if member document missing.

### RatingHistoryEntry (derived — computed from confirmed matches)

A single data point on the rating history chart.

| Field | Type | Source |
|-------|------|--------|
| matchId | string | `/groups/{groupId}/matches/{matchId}` document ID |
| rating | number | Calculated by replaying Elo from base rating through all confirmed matches up to and including this one |
| date | Date | `confirmedAt` timestamp from the match document |
| opponentId | string | The other player in the match |
| result | "win" \| "loss" | Whether the viewed player won or lost |

**Derivation logic**: Fetch all confirmed matches for the group, sort by `confirmedAt` ascending, replay Elo calculation (K=32, base=1500) for matches involving the player, emit a RatingHistoryEntry after each match.

**Validation**: Only confirmed matches (`status === "confirmed"`) are included. Pending and rejected matches are excluded.

### MatchResult (derived — filtered from group matches)

A confirmed match displayed in the player's match list.

| Field | Type | Source |
|-------|------|--------|
| matchId | string | Match document ID |
| opponentId | string | The other player in the match |
| opponentName | string | `/users/{opponentId}.displayName` (fetched separately) |
| result | "win" \| "loss" | Whether the viewed player is `winnerId` |
| scores | string[]? | Optional set scores from the match |
| date | Date | `confirmedAt` timestamp |

**Validation**: Only confirmed matches are shown. Opponent name falls back to "Unknown Player" if user document is missing (e.g., user left the group).

### HeadToHeadRecord (derived — aggregated from matches)

Aggregate record between two specific players within a group.

| Field | Type | Source |
|-------|------|--------|
| playerAWins | number | Count of confirmed matches where playerA is `winnerId` and playerB is the opponent |
| playerBWins | number | Count of confirmed matches where playerB is `winnerId` and playerA is the opponent |
| totalMatches | number | playerAWins + playerBWins |
| lastMatchDate | Date? | Most recent `confirmedAt` among their matches |

**Derivation logic**: Fetch confirmed matches for the group, filter where `{player1Id, player2Id}` matches `{playerA, playerB}` in either order, count wins per side.

**Validation**: Both player IDs must be different. Returns zeros if no matches exist between the two players.

## Relationships

```
User (1) ──→ (many) GroupMember [via /groups/{groupId}/members/]
GroupMember (1) ──→ (many) Match [via /groups/{groupId}/matches/ where player1Id or player2Id]
Match (confirmed) ──→ RatingHistoryEntry [derived by Elo replay]
Match (confirmed, pair) ──→ HeadToHeadRecord [derived by aggregation]
```

## State Transitions

No new state machines. All entities are read-only derivations from existing confirmed match data.

## Firestore Queries Required

1. **Player stats**: `getDoc(/groups/{groupId}/members/{userId})` — single doc read
2. **User profile**: `getDoc(/users/{userId})` — single doc read
3. **Player matches**: `getDocs(/groups/{groupId}/matches where status=="confirmed" orderBy confirmedAt desc)` — filtered client-side for matches involving userId
4. **Rating history**: Same query as #3, sorted ascending, with Elo replay
5. **H2H**: Same query as #3, filtered for matches between two specific player IDs
