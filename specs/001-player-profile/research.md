# Research: Player Profile with Rating History

**Date**: 2026-04-06
**Feature**: Player Profile with Rating History

## Research Tasks

### 1. Rating History Data Source

**Question**: How to derive rating history from existing Firestore data?

**Decision**: Calculate rating history from confirmed matches in `/groups/{groupId}/matches/`, ordered by `confirmedAt` timestamp. Replay the Elo calculation for each confirmed match to reconstruct the rating at each point.

**Rationale**: The existing data model stores match results but not historical ratings. Replaying Elo from confirmed matches is deterministic (K=32, base=1500) and produces accurate history without requiring a new collection.

**Alternatives considered**:
- Store rating snapshots in a subcollection (`/groups/{groupId}/members/{userId}/ratingHistory/`) — rejected because it adds write complexity and data duplication for MVP
- Store rating delta on each match document — rejected because it requires schema migration on existing matches

### 2. SVG Chart Library vs Hand-Rolled

**Question**: Should we use a charting library or build a simple SVG line chart?

**Decision**: Hand-roll a simple SVG line chart component.

**Rationale**: The requirement is a basic line chart with no interactions (no zoom, tooltips, or animations). A charting library adds bundle size and dependency overhead for a simple use case. SVG is natively supported, scales to any screen size, and requires ~50 lines of code.

**Alternatives considered**:
- Chart.js / Recharts — rejected: too heavy for a single line chart, adds 50KB+ to bundle
- CSS-only chart — rejected: harder to scale responsively and draw smooth lines

### 3. Navigation Pattern

**Question**: How should the profile page be accessed?

**Decision**: Use solid-router route `/group/:groupId/player/:playerId` with programmatic navigation from leaderboard and match lists.

**Rationale**: Matches the existing app pattern (group view, log match, etc. all use route params). Deep-linkable and back-button friendly.

**Alternatives considered**:
- Modal overlay — rejected: breaks mobile UX, no deep linking
- Query parameter — rejected: less semantic than path segments

### 4. H2H Calculation Approach

**Question**: How to efficiently calculate head-to-head records?

**Decision**: Filter confirmed matches client-side where both `player1Id` and `player2Id` match the two players. Count wins for each.

**Rationale**: Groups are small (20-30 members, ~200 matches max). Fetching confirmed matches for the group and filtering client-side is fast enough. Avoids complex Firestore composite indexes.

**Alternatives considered**:
- Pre-aggregated H2H collection — rejected: adds write complexity, not needed at this scale
- Cloud Function for aggregation — rejected: over-engineered for MVP

## No NEEDS CLARIFICATION Markers

All technical decisions resolved with reasonable defaults. No open questions remain.
