import { createSignal, onMount, Show, For, createMemo } from "solid-js";
import { authStore } from "../stores/auth.store";
import {
  leaderboardStore,
  type LeaderboardEntry,
} from "../stores/leaderboard.store";
import "./Leaderboard.css";

// ============================================================================
// Types
// ============================================================================

export interface LeaderboardProps {
  groupId: string;
  /** Optional callback when a player row is clicked */
  onPlayerClick?: (userId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export function Leaderboard(props: LeaderboardProps) {
  const [mounted, setMounted] = createSignal(false);

  // Get current user
  const currentUser = authStore.currentUser;

  onMount(async () => {
    if (!props.groupId) return;

    setMounted(true);

    // Fetch leaderboard with current user's rank
    const userId = currentUser()?.uid;
    if (userId) {
      await leaderboardStore.fetchLeaderboardWithUser(props.groupId, userId);
    } else {
      await leaderboardStore.fetchLeaderboard(props.groupId);
    }
  });

  // Computed values from store
  const leaderboard = leaderboardStore.leaderboardData;
  const currentUserEntry = leaderboardStore.currentUserEntry;
  const loading = leaderboardStore.loading;
  const error = leaderboardStore.error;

  // Get current user ID for highlighting
  const currentUserId = createMemo(() => currentUser()?.uid ?? null);

  // Helper to render trend indicator
  function renderTrendIndicator(trend: "up" | "down" | "stable") {
    switch (trend) {
      case "up":
        return <span class="trend-indicator trend-up" title="Trending up">↑</span>;
      case "down":
        return <span class="trend-indicator trend-down" title="Trending down">↓</span>;
      case "stable":
        return <span class="trend-indicator trend-stable" title="Stable">→</span>;
    }
  }

  // Helper to format W-L record
  function formatRecord(wins: number, losses: number): string {
    return `${wins}W - ${losses}L`;
  }

  // Refresh handler
  async function handleRefresh() {
    const userId = currentUser()?.uid;
    if (userId) {
      await leaderboardStore.fetchLeaderboardWithUser(props.groupId, userId);
    } else {
      await leaderboardStore.fetchLeaderboard(props.groupId);
    }
  }

  // Handle row click
  function handleRowClick(userId: string) {
    if (props.onPlayerClick) {
      props.onPlayerClick(userId);
    }
  }

  // Render loading state
  function renderLoading() {
    return (
      <div class="leaderboard-loading">
        <div class="loading-spinner" />
        <span>Loading leaderboard...</span>
      </div>
    );
  }

  // Render empty state
  function renderEmpty() {
    return (
      <div class="leaderboard-empty">
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
        <p>No players in this group yet</p>
        <span>Invite players to see the leaderboard</span>
      </div>
    );
  }

  // Render error state
  function renderError(errMsg: string) {
    return (
      <div class="leaderboard-error">
        <p>{errMsg}</p>
        <button type="button" class="retry-button" onClick={handleRefresh}>
          Try Again
        </button>
      </div>
    );
  }

  // Render leaderboard rows
  function renderLeaderboard(entries: LeaderboardEntry[]) {
    return (
      <div class="leaderboard-table">
        {/* Header */}
        <div class="leaderboard-header">
          <span class="header-rank">#</span>
          <span class="header-player">Player</span>
          <span class="header-record">Record</span>
          <span class="header-rating">Rating</span>
          <span class="header-trend">Trend</span>
        </div>

        {/* Rows */}
        <For each={entries}>
          {(entry) => {
            const isCurrentUser = currentUserId() === entry.userId;
            return (
              <div
                class={`leaderboard-row ${entry.isInactive ? "inactive" : ""} ${isCurrentUser ? "current-user" : ""}`}
                onClick={() => handleRowClick(entry.userId)}
                role={props.onPlayerClick ? "button" : undefined}
                tabIndex={props.onPlayerClick ? 0 : undefined}
              >
                {/* Rank */}
                <span class="cell-rank">
                  <span class={`rank-badge rank-${entry.rank}`}>
                    {entry.rank}
                  </span>
                </span>

                {/* Player Name */}
                <span class="cell-player">
                  <span class="player-name">
                    {entry.displayName}
                    <Show when={entry.isInactive}>
                      <span class="inactive-badge">Inactive</span>
                    </Show>
                  </span>
                </span>

                {/* W-L Record */}
                <span class="cell-record">
                  {formatRecord(entry.wins, entry.losses)}
                </span>

                {/* Rating */}
                <span class="cell-rating">{entry.rating}</span>

                {/* Trend */}
                <span class="cell-trend">
                  {renderTrendIndicator(entry.trend)}
                </span>
              </div>
            );
          }}
        </For>
      </div>
    );
  }

  // Mounting/loading check
  if (!mounted()) {
    return (
      <div class="leaderboard-component">
        {renderLoading()}
      </div>
    );
  }

  return (
    <div class="leaderboard-component">
      {/* Header with refresh */}
      <div class="leaderboard-header-row">
        <h3 class="leaderboard-title">Leaderboard</h3>
        <button
          type="button"
          class="refresh-button"
          onClick={handleRefresh}
          disabled={loading()}
          title="Refresh leaderboard"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class={loading() ? "spinning" : ""}
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Error state */}
      <Show when={error()}>
        {(err) => renderError(err())}
      </Show>

      {/* Loading state */}
      <Show when={loading()}>
        {renderLoading()}
      </Show>

      {/* Empty state */}
      <Show when={!loading() && !error() && leaderboard().length === 0}>
        {renderEmpty()}
      </Show>

      {/* Leaderboard content */}
      <Show when={!loading() && !error() && leaderboard().length > 0}>
        {renderLeaderboard(leaderboard())}
      </Show>
    </div>
  );
}

export default Leaderboard;
