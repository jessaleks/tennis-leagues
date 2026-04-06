# Feature Specification: Player Profile with Rating History

**Feature Branch**: `001-player-profile`
**Created**: 2026-04-06
**Status**: Draft
**Input**: User description: "Add player profile page with rating history chart"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Player Profile (Priority: P1)

A group member taps on a player's name in the leaderboard or match list to open that player's profile page. The profile shows the player's display name, current Elo rating, win-loss record, and a list of their recent matches within the group.

**Why this priority**: This is the core entry point — without the profile page itself, no other profile features can exist. It delivers immediate value by letting players inspect any member's stats.

**Independent Test**: Tap a player name from the group leaderboard → profile page opens showing name, rating, W-L record, and recent matches.

**Acceptance Scenarios**:

1. **Given** a user is viewing the group leaderboard, **When** they tap on a player's name, **Then** the player profile page opens showing that player's display name, current rating, and win-loss record
2. **Given** a user is viewing a player's profile, **When** the page loads, **Then** a list of the player's most recent confirmed matches in that group is displayed with opponent name, result (win/loss), and date
3. **Given** a user is viewing their own profile, **When** the page loads, **Then** the same information is displayed as for any other player

---

### User Story 2 - Rating History Chart (Priority: P2)

The player profile page includes a visual chart showing how the player's Elo rating has changed over time within the group. Each data point represents a confirmed match, showing the rating after that match.

**Why this priority**: The rating history chart is the signature feature requested — it transforms raw numbers into a visual narrative of a player's progression, making the profile page compelling rather than just informational.

**Independent Test**: Open a player profile who has played multiple matches → a chart displays rating progression with data points for each confirmed match.

**Acceptance Scenarios**:

1. **Given** a player has at least 2 confirmed matches, **When** their profile loads, **Then** a line chart displays their rating progression from first match to present
2. **Given** a player has only 1 confirmed match, **When** their profile loads, **Then** a single data point is shown on the chart at their current rating
3. **Given** a player has no confirmed matches, **When** their profile loads, **Then** a placeholder message indicates "No rating history yet" instead of an empty chart
4. **Given** the chart is displayed, **When** the user views it on a narrow screen (mobile), **Then** the chart scales to fit the viewport without horizontal scrolling

---

### User Story 3 - Head-to-Head Summary (Priority: P3)

When viewing another player's profile, the page shows a head-to-head summary between the viewed player and the current user, displaying how many times each has won against the other.

**Why this priority**: H2H context turns a generic profile into a personal rivalry view — it answers "how do I stack up against this person?" which is the natural follow-up question when viewing a peer's profile.

**Independent Test**: Open another player's profile → H2H section shows wins for each player against the other.

**Acceptance Scenarios**:

1. **Given** the current user is viewing another player's profile, **When** both players have played matches against each other, **Then** the H2H section shows "X wins - Y losses" from the current user's perspective
2. **Given** the current user is viewing another player's profile, **When** they have no matches against each other, **Then** the H2H section shows "No matches yet"
3. **Given** the current user is viewing their own profile, **When** the page loads, **Then** the H2H section is not displayed

---

### Edge Cases

- A player removed from the group still appears in match history with their display name at the time of viewing
- A player inactive for months shows a gap in the chart — the line connects the last match to the next without interpolation
- Profile loading on slow connections shows a skeleton placeholder until data arrives
- Display name changes are reflected immediately — the profile always shows the current name, not the name at the time of each match

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a player profile page accessible by tapping a player name from the group leaderboard or match lists
- **FR-002**: System MUST show the player's current Elo rating, display name, and win-loss record on the profile page
- **FR-003**: System MUST display a list of the player's confirmed matches within the group, showing opponent name, result, and date
- **FR-004**: System MUST display a rating history chart plotting the player's Elo rating after each confirmed match
- **FR-005**: System MUST handle players with no match history by showing a "no matches yet" placeholder instead of an empty chart
- **FR-006**: System MUST show a head-to-head summary when the current user views another player's profile
- **FR-007**: System MUST NOT show the head-to-head section when a user views their own profile
- **FR-008**: System MUST load profile data within the context of a specific group (ratings and stats are per-group)
- **FR-009**: System MUST display match dates in a human-readable relative format (e.g., "2 days ago", "Mar 15")
- **FR-010**: System MUST allow navigation back to the previous screen from the profile page

### Key Entities *(include if feature involves data)*

- **Player Profile**: Represents a user's stats within a group — includes display name, photo, current rating, wins, losses, and last match date
- **Rating History Entry**: A data point recording a player's rating at a specific point in time after a confirmed match — includes rating value and date
- **Match Result**: A confirmed match involving the player — includes opponent name, result (win/loss), optional scores, and date
- **Head-to-Head Record**: Aggregate of matches between two specific players within a group — includes win count for each side

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can open any player's profile from the leaderboard in under 2 seconds from tap to visible content
- **SC-002**: The rating history chart renders correctly for players with 1 to 200+ confirmed matches
- **SC-003**: 90% of users can find a specific opponent's H2H record within 10 seconds of opening their profile
- **SC-004**: Profile page loads and displays correctly on screens from 320px to 1200px wide
- **SC-005**: All match results in the profile match the confirmed match records in the group (zero data discrepancies)

## Assumptions

- The existing Elo rating system and match confirmation flow are fully functional and will be reused without modification
- Rating history is derived from confirmed matches — rejected or pending matches do not affect the chart
- Player profiles are viewable by any member of the same group (no privacy restrictions within a group)
- The app already has authentication and group membership established before profile access
- Match dates used for the chart are the confirmation dates, not submission dates
- Display names may change over time; the profile always shows the current display name, not historical names
- The chart uses a simple line chart — no advanced interactions (zoom, tooltips) for the initial version
