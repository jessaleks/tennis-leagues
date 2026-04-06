# Quickstart: Player Profile with Rating History

**Date**: 2026-04-06
**Feature**: Player Profile with Rating History

## Prerequisites

- App running locally (`pnpm dev` or `pnpm tauri:dev`)
- Authenticated user account
- At least one group with 2+ members
- At least 3 confirmed matches in the group (for meaningful chart data)

## Test Scenarios

### Scenario 1: View Player Profile from Leaderboard

1. Log in to the app
2. Navigate to a group you belong to
3. On the group view leaderboard, tap a player's name
4. **Verify**: Profile page opens showing player name, rating, W-L record
5. **Verify**: Recent confirmed matches are listed with opponent, result, and date
6. Tap the back button
7. **Verify**: Returns to the group view

### Scenario 2: View Rating History Chart

1. Open a player profile for a player with 3+ confirmed matches
2. **Verify**: A line chart is visible showing rating progression
3. **Verify**: Chart has data points for each confirmed match
4. **Verify**: Chart scales to screen width without horizontal scroll on mobile (375px)
5. Open a player profile for a player with 0 confirmed matches
6. **Verify**: "No rating history yet" placeholder is shown instead of chart

### Scenario 3: View Head-to-Head Summary

1. Open another player's profile (not your own)
2. **Verify**: H2H section shows win/loss count between you and that player
3. If no matches exist between you, **Verify**: "No matches yet" is displayed
4. Open your own profile
5. **Verify**: H2H section is NOT displayed

### Scenario 4: Match List Accuracy

1. Open a player's profile
2. Note the match list (opponents, results, dates)
3. Navigate to the group's match history
4. **Verify**: All confirmed matches involving that player appear in both views
5. **Verify**: Pending or rejected matches do NOT appear in the profile

### Scenario 5: Responsive Layout

1. Open a player profile on desktop (1200px wide)
2. **Verify**: Layout is readable, chart fills available space
3. Resize browser to 320px wide (mobile minimum)
4. **Verify**: All content remains accessible, touch targets are at least 44px
5. **Verify**: Chart scales down without horizontal overflow

## Validation Checklist

- [ ] Profile loads in under 2 seconds on standard connection
- [ ] Rating chart renders for 1 to 200+ data points
- [ ] H2H only shows for other players, not self
- [ ] Back navigation works correctly
- [ ] No TypeScript errors (`pnpm exec tsc --noEmit`)
- [ ] Vite build succeeds (`pnpm build`)
