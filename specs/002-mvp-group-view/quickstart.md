# Quickstart: Tennis Leagues MVP — Group View

**Feature**: 002-mvp-group-view
**Date**: 2026-04-07

Manual test scenarios for validating the MVP. These are **not automated tests** — they are acceptance criteria verified by a human tester.

---

## Scenario 1: Auth Redirect

**Given** the user is not authenticated (no session token)
**When** they open the app at `/`
**Then** they are immediately redirected to `/login`

---

## Scenario 2: Login and Group List

**Given** the user is on the login page `/login`
**When** they enter valid credentials and tap "Login"
**Then** they are redirected to `/` and see the Groups List screen
**And** the bottom navigation bar is visible with tabs: Groups, Create, Settings, Profile

---

## Scenario 3: Group View — Leaderboard

**Given** the user is authenticated and on the Groups List at `/`
**When** they tap on a group card
**Then** they navigate to `/group/:groupId`
**And** they see a leaderboard showing ranked players with: rank, name, rating, W-L record, trend indicator (up/down/stable)
**And** the leaderboard is sorted by rating descending

---

## Scenario 4: Group View — Recent Matches Feed

**Given** the user is viewing a group's leaderboard at `/group/:groupId`
**When** the page loads
**Then** below the leaderboard they see a "Recent Matches" section
**And** it shows the 10 most recent confirmed matches
**Each match entry shows**:
- Both player names
- Winner indication
- Date (in relative format, e.g., "2 days ago")
- Set scores if provided

---

## Scenario 5: View All Matches

**Given** the user is viewing a group's leaderboard at `/group/:groupId`
**When** they tap "View All Matches" link
**Then** they navigate to `/group/:groupId/matches`
**And** they see a paginated list of all confirmed matches for the group (20 per page)
**And** they can navigate to the next page

---

## Scenario 6: Screen Navigation via Bottom Nav

**Given** the user is authenticated and on the Groups List at `/`
**When** they tap each tab in the bottom navigation bar
**Then** they navigate to the corresponding screen without page reload:
- Groups → `/` (Groups List)
- Create → `/create-group` (Create Group)
- Settings → `/group/:groupId/settings` or account settings
- Profile → `/group/:groupId/player/:currentUserId` (their own profile)

---

## Scenario 7: No `window.location.href` in Console

**Given** the user is using the app
**When** they open browser DevTools and monitor network/console
**Then** there are no `window.location.href` calls for in-app navigation
**And** all navigation uses the solid-router history API

---

## Exit Criteria

| Scenario | Pass/Fail | Notes |
|----------|-----------|-------|
| S1: Auth redirect | ? | |
| S2: Login → Groups | ? | |
| S3: Leaderboard | ? | |
| S4: Recent Matches | ? | |
| S5: View All Matches | ? | |
| S6: Bottom nav | ? | |
| S7: No window.location.href | ? | |
