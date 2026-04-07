# Service Contract: Player Profile

**Date**: 2026-04-06
**Feature**: Player Profile with Rating History

## Service Interface

This contract defines the service-layer functions for the player profile feature. These are internal TypeScript functions, not external APIs.

### player-profile.ts

#### `getPlayerProfile(groupId: string, userId: string): Promise<PlayerProfile>`

Fetches a player's stats within a group.

- **Inputs**: Group ID, User ID (both non-empty strings)
- **Returns**: PlayerProfile object with displayName, rating, wins, losses, lastMatchAt
- **Errors**: Throws if group or member not found
- **Firestore reads**: 2 (member doc + user doc)

#### `getRatingHistory(groupId: string, userId: string): Promise<RatingHistoryEntry[]>`

Calculates rating progression from confirmed matches.

- **Inputs**: Group ID, User ID
- **Returns**: Array of RatingHistoryEntry sorted by date ascending
- **Derivation**: Fetches confirmed matches, replays Elo calculation (K=32, base=1500)
- **Errors**: Returns empty array if no confirmed matches
- **Firestore reads**: 1 query (confirmed matches for group)

#### `getPlayerMatches(groupId: string, userId: string): Promise<MatchResult[]>`

Gets confirmed matches involving a player.

- **Inputs**: Group ID, User ID
- **Returns**: Array of MatchResult sorted by date descending (newest first)
- **Errors**: Returns empty array if no confirmed matches
- **Firestore reads**: 1 query (confirmed matches) + N user doc reads for opponent names

#### `getHeadToHead(groupId: string, playerAId: string, playerBId: string): Promise<HeadToHeadRecord>`

Calculates H2H record between two players.

- **Inputs**: Group ID, Player A ID, Player B ID (must be different)
- **Returns**: HeadToHeadRecord with win counts and last match date
- **Errors**: Returns zeroed record if no matches between players
- **Firestore reads**: 1 query (confirmed matches for group, filtered client-side)

## Store Interface

### player-profile.store.ts

| Signal | Type | Description |
|--------|------|-------------|
| currentProfile | `PlayerProfile \| null` | Currently viewed player's stats |
| ratingHistory | `RatingHistoryEntry[]` | Rating data points for chart |
| playerMatches | `MatchResult[]` | Recent matches for the player |
| headToHead | `HeadToHeadRecord \| null` | H2H vs current user (null if viewing self) |
| loading | `boolean` | Loading state |
| error | `string \| null` | Error message |

| Action | Description |
|--------|-------------|
| fetchProfile(groupId, userId) | Loads profile, rating history, matches, and H2H in parallel |
| clearProfile() | Resets all signals to initial state |

## Route Contract

```
/group/:groupId/player/:playerId
```

- **groupId**: Firestore document ID of the group
- **playerId**: Firestore document ID of the user being viewed
- **Navigation**: From leaderboard tap, match list tap, or direct URL
- **Back**: Returns to `/group/:groupId`
