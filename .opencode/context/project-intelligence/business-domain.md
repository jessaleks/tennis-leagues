<!-- Context: project-intelligence/business | Priority: high | Version: 1.2 | Updated: 2026-03-01 -->

# Business Domain

**Purpose**: Tennis leagues app domain model and core features.
**Last Updated**: 2026-03-01

## Core Concept
Mobile-friendly app where friends form private groups, log match results, and see live Elo-based rankings.

## Domain Model

### User
- id, email, displayName, profilePhoto, createdAt

### Group
- id, name, inviteCode, adminUserId, createdAt
- Members: User[]
- Independent Elo ladder per group

### Match
- id, groupId, player1Id, player2Id
- scores: string[] (e.g., ["6-3", "4-6", "7-5"])
- status: pending | confirmed | rejected
- submittedBy, confirmedBy, createdAt

### Player (in Group context)
- userId, groupId, rating (starts 1500)
- wins, losses, rank
- lastMatchAt (for inactivity detection)

## Features

### MVP Features
1. **Auth**: Email/social login with display name
2. **Groups**: Create/join via invite code, admin management
3. **Match Logging**: Submit scores, two-sided confirmation
4. **Elo Ranking**: K-factor tuned for small groups, rating updates
5. **Leaderboard**: Ranked list with W-L record, trend indicators
6. **H2H Stats**: Player vs player match history
7. **Notifications**: Match requests, confirmations, new members
8. **Validation**: Zod schemas for all inputs

### Inactive Players
- Flag if no match in 30+ days
- Rating preserved, visually de-emphasized

## Deferred (Post-MVP)
- Doubles support
- Challenge/ladder system
- Seasons/resets
- Tournament mode
- Public groups
- Chat
- Glicko-2 rating

## Screen Flow
```
Home (groups list)
  → Group View (leaderboard + recent matches)
    → Log Match (pick opponent, enter scores)
    → Confirm Match (approve/reject)
    → Player Profile (rating history, H2H)
    → Group Settings (invite, members)
  → Account Settings
```

## 📂 Codebase References
- Frontend: src/App.tsx, src/components/
- Backend: Firebase Firestore (src/lib/firebase.ts)
