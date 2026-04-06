# Tennis Leagues App - Design Document

**Date:** 2026-03-01
**Status:** Approved

## 1. Overview

Mobile-friendly app where friends form private groups, log match results, and see live Elo-based rankings. Built as a web app that wraps to mobile/desktop via Tauri.

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SolidJS + TypeScript |
| Package Manager | pnpm |
| Backend | Firebase (Auth, Firestore, Hosting, Cloud Messaging) |
| Native Wrapper | Tauri 2.x |
| Platform | Web → Mobile (Tauri) → Desktop (Tauri) |

## 3. Data Model (Firestore)

### Users
```
/users/{userId}
  - displayName: string
  - email: string
  - photoURL: string?
  - createdAt: timestamp
```

### Groups
```
/groups/{groupId}
  - name: string
  - inviteCode: string
  - adminId: string
  - memberIds: string[]
  - createdAt: timestamp
```

### Group Members (subcollection)
```
/groups/{groupId}/members/{userId}
  - rating: number (default 1500)
  - wins: number (default 0)
  - losses: number (default 0)
  - joinedAt: timestamp
  - lastMatchAt: timestamp?
```

### Matches (subcollection)
```
/groups/{groupId}/matches/{matchId}
  - player1Id: string
  - player2Id: string
  - winnerId: string
  - scores: string[] (optional, e.g., ["6-3", "4-6", "7-5"])
  - status: "pending" | "confirmed" | "rejected"
  - submittedBy: string
  - confirmedBy: string?
  - submittedAt: timestamp
  - confirmedAt: timestamp?
```

## 4. Core Features

### 4.1 Authentication
- Email/password sign up and login
- Social login (Google)
- Display name + optional profile photo

### 4.2 Groups
- Create group → generates unique invite code
- Join group via invite code
- Admin can remove members or archive group
- Independent Elo ladder per group
- Member limit: ~20-30

### 4.3 Match Logging
1. Tap "Log match"
2. Select opponent from group members
3. Select winner
4. *Optionally* add set scores
5. Submit → pending state

### 4.4 Match Confirmation
- Opponent receives notification
- Can approve or reject within 40 hours
- Auto-confirms after 40h if no response
- Rejection requires reason (optional)

### 4.5 Elo Ranking
- **Base rating:** 1500
- **K-factor:** 32 (fixed for MVP)
- **Formula:** Standard Elo
- Rating updates immediately on confirmation

### 4.6 Leaderboard
- Sorted by rating descending
- Shows: rank, name, rating, W-L record
- Trend indicator (up/down/stable)
- Inactive players flagged after 30 days

### 4.7 Head-to-Head Stats
- Filter matches by player pair
- Shows H2H record
- Recent match history

### 4.8 Notifications
- Match confirmation request
- Match confirmed (with new rating)
- New member joined group

## 5. Screen Flow

```
Home (groups list)
  → Create/Join Group
  → Group View (leaderboard + recent matches)
    → Log Match
    → Confirm Match
    → Player Profile (rating history, H2H)
    → Group Settings (invite, members)
  → Account Settings
```

## 6. MVP Screens

| Screen | Description |
|--------|-------------|
| Home | List of user's groups |
| Group View | Leaderboard + recent matches + "Log match" button |
| Log Match | Pick opponent, enter winner, optional scores |
| Confirm Match | Approve/reject pending match |
| Player Profile | Rating history, W-L, H2H vs you |
| Group Settings | Invite link, member management (admin) |
| Account Settings | Name, photo, logout |

## 7. Out of Scope (Post-MVP)

- Doubles support
- Challenge/ladder system
- Seasons/resets
- Tournament mode
- Public/open groups
- Chat
- Serve % / advanced stats
- Glicko-2 rating
- Format-weighted K-factor (single set vs best-of-3)

## 8. Deployment

### Web
1. `pnpm build` → web build to `/dist`
2. Deploy to Firebase Hosting

### Mobile (Tauri)
1. Build web app
2. Use Tauri to wrap for iOS/Android
3. Submit to App Store / Play Store

### Desktop (Tauri)
1. Build web app
2. Use Tauri to wrap for Windows/macOS/Linux
3. Distribute .exe / .dmg

## 9. Considerations

### Match Logging Friction
- Winner-only entry is fast and simple
- Scores are optional - can be added later
- This works fine with Elo (scores don't affect rating)

### Platform Strategy
- Web app is primary target
- Tauri wraps for native mobile/desktop
- Same codebase, multiple platforms
