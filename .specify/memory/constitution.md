<!--
SYNC IMPACT REPORT
==================
Version change: none → 1.0.0 (initial ratification)
Modified principles: N/A (new constitution)
Added sections: All sections are new
Removed sections: N/A
Templates requiring updates:
  ✅ .specify/templates/plan-template.md — no changes needed (generic gates)
  ✅ .specify/templates/spec-template.md — no changes needed (generic)
  ✅ .specify/templates/tasks-template.md — no changes needed (generic)
  ✅ .specify/templates/checklist-template.md — no changes needed (generic)
  ✅ .specify/templates/agent-file-template.md — no changes needed (generic)
Follow-up TODOs: None
-->

# Tennis Leagues Constitution

## Core Principles

### I. Type Safety

All code MUST be written in strict TypeScript with `strict: true` enabled.
No `any` types unless absolutely unavoidable — document justification inline.
Zod schemas MUST define runtime types; derive TypeScript types via `z.infer<>`
to guarantee compile-time and runtime type agreement.

_Rationale: The app manages user data, match results, and Elo ratings across
Firebase. Type mismatches cause silent data corruption that is hard to debug._

### II. Reactive Architecture

UI state MUST use SolidJS signals (`createSignal`) and stores (`createStore`).
Components MUST be pure functions of their props and reactive state —
no imperative DOM manipulation.
Side effects MUST be wrapped in `createEffect` or `onMount` with proper
cleanup via `onCleanup`.

_Rationale: SolidJS fine-grained reactivity eliminates unnecessary re-renders.
Consistent patterns reduce cognitive load and prevent stale-state bugs._

### III. Input Validation (NON-NEGOTIABLE)

Every service function that accepts external input MUST validate with a Zod
schema before processing. Validation MUST happen at the service boundary,
not in components or stores.
Schemas MUST produce user-friendly error messages — no raw Zod errors
MUST reach the UI layer.

_Rationale: Firebase has no server-side validation. Client-side Zod schemas
are the only gate against malformed data entering Firestore._

### IV. Firebase as Managed Backend

Authentication MUST use Firebase Auth (email/password + Google provider).
Data persistence MUST use Firestore with the documented collection schema:
`/users/{userId}`, `/groups/{groupId}`, `/groups/{groupId}/members/{userId}`,
`/groups/{groupId}/matches/{matchId}`.
Environment configuration MUST use `VITE_` prefixed variables loaded from
`.env` — never commit credentials.

_Rationale: Firebase provides auth, database, and hosting with zero ops.
The collection schema is designed for the group-scoped Elo ranking model._

### V. Cross-Platform by Design

All features MUST work as a web app first. Tauri wrapping for mobile/desktop
MUST NOT require platform-specific code in the feature layer.
Responsive design MUST use CSS — no JavaScript-based layout detection.
Touch targets MUST be at least 44px for mobile usability.

_Rationale: The app targets web → iOS → Android → desktop via Tauri from a
single codebase. Platform-specific logic belongs in Tauri config, not in
SolidJS components._

## Technology Constraints

- **Frontend**: SolidJS + TypeScript, bundled with Vite
- **Backend**: Firebase (Auth, Firestore) — no custom server
- **Package Manager**: pnpm (not npm or yarn)
- **Validation**: Zod for all input schemas
- **Native Wrapper**: Tauri 2.x for mobile and desktop builds
- **Styling**: Plain CSS (no CSS-in-JS, no Tailwind unless approved)
- **State Management**: SolidJS signals and stores only — no external
  state libraries (Redux, Zustand, etc.)

## Development Workflow

- **Code Review**: All changes MUST be reviewed before merge.
- **Validation Gates**: TypeScript type check (`tsc --noEmit`) MUST pass
  before any commit. Vite build MUST succeed before any PR merge.
- **Testing**: Service-layer functions SHOULD have unit tests. UI testing
  is encouraged but not mandatory for MVP.
- **Commits**: Atomic commits with descriptive messages. One logical change
  per commit.
- **Feature Development**: Follow the spec → plan → tasks → implement
  workflow defined in `.specify/templates/`.

## Governance

This constitution supersedes all other development practices. Amendments
MUST be documented with rationale, approved by project maintainers, and
reflected in the version number per semantic versioning rules:

- **MAJOR**: Backward-incompatible principle removals or redefinitions.
- **MINOR**: New principle or section added, or materially expanded guidance.
- **PATCH**: Clarifications, wording fixes, non-semantic refinements.

All PRs and code reviews MUST verify compliance with these principles.
Complexity or deviations from constraints MUST be justified in the plan's
Complexity Tracking section. Use `docs/plans/` for feature-level design
documents that reference this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-04-06 | **Last Amended**: 2026-04-06
