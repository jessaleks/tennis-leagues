<!-- Context: project-intelligence/technical | Priority: critical | Version: 1.1 | Updated: 2026-03-01 -->

# Technical Domain

**Purpose**: Tech stack, architecture, and development patterns for tennis leagues app.
**Last Updated**: 2026-03-01

## Quick Reference
**Update Triggers**: Tech stack changes | New patterns | Architecture decisions
**Audience**: Developers, AI agents

## Primary Stack
| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend | SolidJS | 1.9.x | Reactive UI, small bundle |
| Language | TypeScript | 5.6.x | Type safety |
| Package Manager | pnpm | latest | Fast, efficient |
| Build Tool | Vite | 6.x | Fast dev/build |
| Backend | Firebase | - | Auth, Firestore, Hosting, FCM |
| Validation | Zod | latest | Schema validation |
| Native Wrapper | Tauri | 2.x | Mobile/desktop shell |

## Code Patterns

### Zod Validation Schema
```typescript
import { z } from "zod";

export const MatchResultSchema = z.object({
  groupId: z.string().min(1),
  opponentId: z.string().min(1),
  winnerId: z.string().min(1),
  scores: z.array(z.string()).optional(),
});

export type MatchResult = z.infer<typeof MatchResultSchema>;

export function validateMatchResult(data: unknown): MatchResult {
  return MatchResultSchema.parse(data);
}
```

### Firebase Hook (SolidJS)
```typescript
import { createResource, createSignal } from "solid-js";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

interface Player {
  id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
}

async function fetchGroupMembers(groupId: string): Promise<Player[]> {
  const membersRef = collection(db, `groups/${groupId}/members`);
  const q = query(membersRef);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
}

export function useGroupMembers(groupId: string) {
  const [players] = createResource(groupId, fetchGroupMembers);
  return players;
}
```

### SolidJS Component
```typescript
import { createSignal, For, Show } from "solid-js";

interface Player {
  id: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
}

export function Leaderboard(props: { players: Player[] }) {
  const [sortBy, setSortBy] = createSignal<"rating" | "wins">("rating");

  return (
    <div class="leaderboard">
      <For each={props.players.sort((a, b) => b.rating - a.rating)}>
        {(player, i) => (
          <div class="player-row">
            <span class="rank">{i() + 1}</span>
            <span class="name">{player.name}</span>
            <span class="rating">{player.rating}</span>
          </div>
        )}
      </For>
    </div>
  );
}
```

## Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | match-logger.tsx |
| Components | PascalCase | Leaderboard.tsx |
| Functions | camelCase | submitMatch |
| Database | snake_case | match_results |
| Types/Interfaces | PascalCase | PlayerProfile |

## Code Standards
- Use TypeScript strict mode
- Validate all inputs with Zod schemas
- Prefer signals over stores for simple state
- Use `createResource` for async data
- Component props interface defined separately

## Security Requirements
- Validate all user input (client + server rules)
- Firestore security rules for read/write access
- Sanitize user display names
- No secrets stored in frontend code
- Use Firebase Auth for authentication

## 📂 Codebase References
- **Entry**: src/index.tsx - App bootstrap
- **Components**: src/App.tsx - Main app component
- **Config**: vite.config.ts - Build configuration
- **Firebase**: src/lib/firebase.ts - Firebase initialization
- **Tauri**: src-tauri/ - Native wrapper (mobile/desktop)

## Related Files
- business-domain.md (tennis leagues domain model)
