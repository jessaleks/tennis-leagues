import { createSignal, onMount, Show, For, createMemo } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { authStore } from "../stores/auth.store";
import { groupsStore } from "../stores/groups.store";
import { matchesStore, type Match } from "../stores/matches.store";
import { getUserProfiles, type UserProfile } from "../services/users";
import "./ConfirmMatch.css";

interface MatchWithProfile extends Match {
  opponentProfile: UserProfile | null;
  submitterProfile: UserProfile | null;
}

export function ConfirmMatch() {
  const [mounted, setMounted] = createSignal(false);
  const [matchProfiles, setMatchProfiles] = createSignal<Map<string, UserProfile>>(new Map());
  
  // UI state
  const [loading, setLoading] = createSignal(false);
  const [actionLoading, setActionLoading] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  
  // Reject modal state
  const [rejectingMatchId, setRejectingMatchId] = createSignal<string | null>(null);
  const [rejectReason, setRejectReason] = createSignal("");
  
  const navigate = useNavigate();
  const params = useParams<{ groupId: string }>();

  // Get group ID from URL
  const groupId = params.groupId;

  onMount(async () => {
    if (!groupId) {
      navigate("/");
      return;
    }

    const user = authStore.currentUser();
    if (!user) {
      navigate("/");
      return;
    }

    setMounted(true);
    setLoading(true);

    try {
      // Fetch group
      await groupsStore.fetchGroup(groupId);
      
      // Fetch pending matches for current user
      await matchesStore.fetchPendingConfirmations(user.uid, groupId);
      
      // Fetch profiles for match opponents
      const matches = matchesStore.pendingConfirmations();
      if (matches.length > 0) {
        await fetchMatchProfiles(matches);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load matches";
      setError(message);
    } finally {
      setLoading(false);
    }
  });

  // Get pending matches
  const pendingMatches = matchesStore.pendingConfirmations;

  // Enrich matches with user profiles
  const enrichedMatches = createMemo<MatchWithProfile[]>(() => {
    const matches = pendingMatches();
    const profiles = matchProfiles();
    
    return matches.map((match) => ({
      ...match,
      opponentProfile: profiles.get(match.player1Id) || null,
      submitterProfile: profiles.get(match.submittedBy) || null,
    }));
  });

  // Fetch profiles for all match players
  async function fetchMatchProfiles(matches: Match[]) {
    const userIds = new Set<string>();
    matches.forEach((match) => {
      userIds.add(match.player1Id);
      userIds.add(match.submittedBy);
    });

    if (userIds.size > 0) {
      try {
        const multiProfiles = await getUserProfiles(Array.from(userIds));
        setMatchProfiles(multiProfiles);
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
      }
    }
  }

  // Handle approve match
  async function handleApprove(match: Match) {
    const user = authStore.currentUser();
    const group = groupsStore.currentGroup();

    if (!user || !group) {
      setError("Authentication required");
      return;
    }

    setActionLoading(match.id);
    setError(null);

    try {
      await matchesStore.confirmMatch(match.id, group.id, user.uid);
      setSuccess(`Match confirmed!`);
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to confirm match";
      setError(message);
    } finally {
      setActionLoading(null);
    }
  }

  // Handle reject match
  async function handleReject(matchId: string) {
    const user = authStore.currentUser();
    const group = groupsStore.currentGroup();

    if (!user || !group) {
      setError("Authentication required");
      return;
    }

    setActionLoading(matchId);
    setError(null);

    try {
      await matchesStore.rejectMatch(matchId, group.id, user.uid, rejectReason() || undefined);
      setSuccess("Match rejected");
      setRejectingMatchId(null);
      setRejectReason("");
      
      // Navigate back after short delay
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reject match";
      setError(message);
    } finally {
      setActionLoading(null);
    }
  }

  // Format date
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function goBack() {
    navigate(-1);
  }

  // Loading state
  if (!mounted()) {
    return (
      <div class="confirm-match-container">
        <div class="confirm-match-loading">Loading...</div>
      </div>
    );
  }

  // Group not found
  if (!groupsStore.currentGroup()) {
    return (
      <div class="confirm-match-container">
        <div class="confirm-match-error">Group not found</div>
      </div>
    );
  }

  // Success state
  if (success()) {
    return (
      <div class="confirm-match-container">
        <div class="confirm-match-success">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#10b981" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>{success()}</p>
          <p class="confirm-match-redirect">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="confirm-match-container">
      {/* Header */}
      <div class="confirm-match-header">
        <button type="button" class="back-button" onClick={goBack}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 class="confirm-match-title">Confirm Match</h1>
      </div>

      {/* Error display */}
      <Show when={error()}>
        <div class="confirm-match-error">{error()}</div>
      </Show>

      {/* Loading state */}
      <Show when={loading()}>
        <div class="confirm-match-loading">Loading pending matches...</div>
      </Show>

      {/* Empty state */}
      <Show when={!loading() && enrichedMatches().length === 0}>
        <div class="confirm-match-empty">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#9ca3af" stroke-width="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No pending match requests</p>
          <p class="confirm-match-empty-hint">You're all caught up!</p>
        </div>
      </Show>

      {/* Pending matches list */}
      <Show when={!loading() && enrichedMatches().length > 0}>
        <div class="matches-list">
          <For each={enrichedMatches()}>
            {(match) => (
              <div class="match-card">
                {/* Match header */}
                <div class="match-header">
                  <div class="match-opponent">
                    <div class="opponent-avatar">
                      {match.opponentProfile?.displayName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div class="opponent-info">
                      <span class="opponent-name">
                        {match.opponentProfile?.displayName || "Unknown Player"}
                      </span>
                      <span class="match-date">
                        Submitted {formatDate(match.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div class="match-result">
                    <span class={`winner-badge ${match.winnerId === match.player1Id ? "them" : "me"}`}>
                      {match.winnerId === match.player1Id 
                        ? match.opponentProfile?.displayName?.split(" ")[0] || "Player" 
                        : "You"} won
                    </span>
                  </div>
                </div>

                {/* Scores (if provided) */}
                <Show when={match.scores && match.scores.length > 0}>
                  <div class="match-scores">
                    <span class="scores-label">Scores:</span>
                    <div class="scores-list">
                      <For each={match.scores}>
                        {(score, index) => (
                          <span class="score-item">Set {index() + 1}: {score}</span>
                        )}
                      </For>
                    </div>
                  </div>
                </Show>

                {/* Reject reason input */}
                <Show when={rejectingMatchId() === match.id}>
                  <div class="reject-reason-section">
                    <label class="reason-label">Reason for rejection (optional):</label>
                    <textarea
                      class="reason-input"
                      placeholder="e.g., Incorrect score, wrong date, etc."
                      value={rejectReason()}
                      onInput={(e) => setRejectReason(e.currentTarget.value)}
                      rows={3}
                      maxLength={500}
                    />
                    <div class="reason-actions">
                      <button
                        type="button"
                        class="cancel-reject-button"
                        onClick={() => {
                          setRejectingMatchId(null);
                          setRejectReason("");
                        }}
                        disabled={actionLoading() !== null}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="confirm-reject-button"
                        onClick={() => handleReject(match.id)}
                        disabled={actionLoading() !== null}
                      >
                        <Show when={actionLoading() === match.id} fallback="Confirm Rejection">
                          Rejecting...
                        </Show>
                      </button>
                    </div>
                  </div>
                </Show>

                {/* Action buttons */}
                <Show when={rejectingMatchId() !== match.id}>
                  <div class="match-actions">
                    <button
                      type="button"
                      class="reject-button"
                      onClick={() => setRejectingMatchId(match.id)}
                      disabled={actionLoading() !== null}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                      Reject
                    </button>
                    <button
                      type="button"
                      class="approve-button"
                      onClick={() => handleApprove(match)}
                      disabled={actionLoading() !== null}
                    >
                      <Show when={actionLoading() === match.id} fallback={
                        <>
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </>
                      }>
                        Approving...
                      </Show>
                    </button>
                  </div>
                </Show>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

export default ConfirmMatch;
