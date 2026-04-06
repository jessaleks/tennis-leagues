import { createSignal, onMount, onCleanup, Show, For } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { playerProfileStore } from "../stores/player-profile.store";
import { authStore } from "../stores/auth.store";
import { formatRelativeDate, type MatchResult } from "../services/player-profile";
import { RatingChart } from "../components/RatingChart";
import "./PlayerProfile.css";

// ============================================================================
// Component
// ============================================================================

export function PlayerProfile() {
  const [mounted, setMounted] = createSignal(false);

  const navigate = useNavigate();
  const params = useParams<{ groupId: string; playerId: string }>();

  // Get store state
  const profile = playerProfileStore.currentProfile;
  const matches = playerProfileStore.playerMatches;
  const ratingHistory = playerProfileStore.ratingHistory;
  const headToHead = playerProfileStore.headToHead;
  const loading = playerProfileStore.loading;
  const error = playerProfileStore.error;

  // Fetch profile data on mount
  onMount(async () => {
    if (!params.groupId || !params.playerId) {
      navigate("/");
      return;
    }

    setMounted(true);

    try {
      const currentUserId = authStore.currentUser()?.uid;
      await playerProfileStore.fetchProfile(params.groupId, params.playerId, currentUserId);
    } catch {
      // Error is handled by the store
    }
  });

  // Clear profile on unmount
  onCleanup(() => {
    playerProfileStore.clearProfile();
  });

  // Navigation handlers
  function goBack() {
    navigate(`/group/${params.groupId}`);
  }

  function handleRetry() {
    if (params.groupId && params.playerId) {
      const currentUserId = authStore.currentUser()?.uid;
      playerProfileStore.fetchProfile(params.groupId, params.playerId, currentUserId);
    }
  }

  // Check if viewing own profile
  function isViewingSelf(): boolean {
    const currentUserId = authStore.currentUser()?.uid;
    return currentUserId === params.playerId;
  }

  // Render H2H record
  function renderHeadToHead(): string {
    const h2h = headToHead();
    if (!h2h) return "No matches yet";
    if (h2h.totalMatches === 0) return "No matches yet";
    return `${h2h.playerAWins} wins - ${h2h.playerBWins} losses`;
  }

  // Render profile avatar
  function renderAvatar() {
    const p = profile();
    if (!p) return null;

    if (p.photoURL) {
      return (
        <img
          src={p.photoURL}
          alt={`${p.displayName}'s avatar`}
          class="profile-avatar"
        />
      );
    }

    // Default avatar with initials
    const initials = p.displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    return (
      <div class="profile-avatar-default">
        <span class="profile-initials">{initials}</span>
      </div>
    );
  }

  // Render W-L record
  function renderRecord(): string {
    const p = profile();
    if (!p) return "0W - 0L";
    return `${p.wins}W - ${p.losses}L`;
  }

  // Render last match date
  function renderLastMatch(): string {
    const p = profile();
    if (!p || !p.lastMatchAt) return "No matches yet";
    return formatRelativeDate(p.lastMatchAt);
  }

  // Render match result badge
  function renderResultBadge(result: "win" | "loss") {
    return (
      <span class={`match-result-badge ${result}`}>
        {result === "win" ? "W" : "L"}
      </span>
    );
  }

  // Render scores
  function renderScores(scores?: string[]): string {
    if (!scores || scores.length === 0) return "";
    return scores.join(", ");
  }

  // Render loading skeleton
  function renderLoadingSkeleton() {
    return (
      <div class="profile-skeleton">
        {/* Header skeleton */}
        <div class="skeleton-header">
          <div class="skeleton-avatar" />
          <div class="skeleton-name" />
          <div class="skeleton-rating" />
        </div>

        {/* Stats cards skeleton */}
        <div class="skeleton-stats">
          <div class="skeleton-stat-card" />
          <div class="skeleton-stat-card" />
          <div class="skeleton-stat-card" />
          <div class="skeleton-stat-card" />
        </div>

        {/* Section title skeleton */}
        <div class="skeleton-section-title" />

        {/* Match list skeleton */}
        <div class="skeleton-match-list">
          <div class="skeleton-match-item" />
          <div class="skeleton-match-item" />
          <div class="skeleton-match-item" />
        </div>
      </div>
    );
  }

  // Render error state
  function renderError(errMsg: string) {
    return (
      <div class="profile-error">
        <svg
          class="error-icon"
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p class="error-message">{errMsg}</p>
        <div class="error-actions">
          <button type="button" class="retry-button" onClick={handleRetry}>
            Try Again
          </button>
          <button type="button" class="back-button" onClick={goBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render empty matches state
  function renderEmptyMatches() {
    return (
      <div class="matches-empty">
        <svg
          class="empty-icon"
          viewBox="0 0 24 24"
          width="40"
          height="40"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p>No matches yet</p>
        <span>Play a match to see your history</span>
      </div>
    );
  }

  // Render match list
  function renderMatchList(matchList: MatchResult[]) {
    return (
      <div class="match-list">
        <For each={matchList}>
          {(match) => (
            <div class="match-item">
              <div class="match-result">{renderResultBadge(match.result)}</div>
              <div class="match-info">
                <span class="match-opponent">vs {match.opponentName}</span>
                <span class="match-date">{formatRelativeDate(match.date)}</span>
              </div>
              <Show when={match.scores && match.scores.length > 0}>
                <div class="match-scores">{renderScores(match.scores)}</div>
              </Show>
            </div>
          )}
        </For>
      </div>
    );
  }

  // Render profile content
  function renderProfile() {
    const p = profile();
    if (!p) return null;

    return (
      <div class="profile-content">
        {/* Profile Header */}
        <div class="profile-header">
          {renderAvatar()}
          <h1 class="profile-name">{p.displayName}</h1>
          <div class="profile-rating">
            <span class="rating-value">{p.rating}</span>
            <span class="rating-label">Rating</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div class="profile-stats">
          <div class="stat-card">
            <span class="stat-value">{p.wins}</span>
            <span class="stat-label">Wins</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{p.losses}</span>
            <span class="stat-label">Losses</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{renderRecord()}</span>
            <span class="stat-label">Record</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{renderLastMatch()}</span>
            <span class="stat-label">Last Match</span>
          </div>
        </div>

        {/* Head-to-Head Section - Only show when viewing another player */}
        <Show when={!isViewingSelf() && headToHead() !== null}>
          <div class="h2h-section">
            <h2 class="section-title">Head-to-Head</h2>
            <div class="h2h-record">
              <span class="h2h-value">{renderHeadToHead()}</span>
            </div>
          </div>
        </Show>

        {/* Recent Matches Section */}
        <div class="matches-section">
          <h2 class="section-title">Recent Matches</h2>
          <Show
            when={matches().length > 0}
            fallback={renderEmptyMatches()}
          >
            {renderMatchList(matches())}
          </Show>
        </div>

        {/* Rating History Chart Section */}
        <div class="rating-chart-section">
          <Show
            when={ratingHistory().length > 0}
            fallback={
              <Show when={ratingHistory().length === 0 && !loading()}>
                <div class="rating-chart-empty-placeholder" />
              </Show>
            }
          >
            <RatingChart data={ratingHistory()} />
          </Show>
        </div>
      </div>
    );
  }

  // Early return for loading
  if (!mounted()) {
    return (
      <div class="player-profile-container">
        {renderLoadingSkeleton()}
      </div>
    );
  }

  // Main render
  return (
    <div class="player-profile-container">
      {/* Header with back button */}
      <div class="profile-view-header">
        <button
          type="button"
          class="back-button"
          onClick={goBack}
          title="Back to group"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Error state */}
      <Show when={error()}>
        {(err) => renderError(err())}
      </Show>

      {/* Loading skeleton */}
      <Show when={loading() && !profile()}>
        {renderLoadingSkeleton()}
      </Show>

      {/* Profile content */}
      <Show when={!loading() || profile()}>
        {renderProfile()}
      </Show>
    </div>
  );
}

export default PlayerProfile;
