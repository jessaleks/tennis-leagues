import { createSignal, onMount, Show, For, createMemo } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { authStore } from "../stores/auth.store";
import { groupsStore, type GroupMember } from "../stores/groups.store";
import { matchesStore } from "../stores/matches.store";
import { getUserProfiles, type UserProfile } from "../services/users";
import "./LogMatch.css";

interface MemberWithProfile extends GroupMember {
  profile: UserProfile | null;
}

export function LogMatch() {
  const [mounted, setMounted] = createSignal(false);
  const [memberProfiles, setMemberProfiles] = createSignal<Map<string, UserProfile>>(new Map());
  const [loadingProfiles, setLoadingProfiles] = createSignal(false);

  const navigate = useNavigate();
  const params = useParams<{ groupId: string }>();

  // Form state
  const [selectedOpponentId, setSelectedOpponentId] = createSignal<string>("");
  const [winner, setWinner] = createSignal<"me" | "them" | null>(null);
  const [scores, setScores] = createSignal<string[]>([]);
  const [submitting, setSubmitting] = createSignal(false);
  const [formError, setFormError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal(false);

  // Get group ID from URL
  const groupId = params.groupId;

  onMount(async () => {
    if (!groupId) {
      navigate("/");
      return;
    }

    setMounted(true);

    // Fetch group and members
    await groupsStore.fetchGroup(groupId);
    await groupsStore.fetchGroupMembers(groupId);

    // Fetch member profiles
    const members = groupsStore.currentGroupMembers();
    const userIds = members.map((m) => m.id);

    if (userIds.length > 0) {
      setLoadingProfiles(true);
      try {
        const profiles = await getUserProfiles(userIds);
        setMemberProfiles(profiles);
      } finally {
        setLoadingProfiles(false);
      }
    }
  });

  // Get current user
  const currentUser = authStore.currentUser;
  const members = groupsStore.currentGroupMembers;

  // Filter out current user from opponent list
  const availableOpponents = createMemo<MemberWithProfile[]>(() => {
    const user = currentUser();
    const mems = members();
    const profiles = memberProfiles();

    if (!user) return [];

    return mems
      .filter((member) => member.id !== user.uid)
      .map((member) => ({
        ...member,
        profile: profiles.get(member.id) || null,
      }));
  });

  // Check if form is valid
  const isFormValid = createMemo(() => {
    return selectedOpponentId() !== "" && winner() !== null;
  });

  // Add a new set
  function addSet() {
    setScores((prev) => [...prev, ""]);
  }

  // Remove a set
  function removeSet(index: number) {
    setScores((prev) => prev.filter((_, i) => i !== index));
  }

  // Update a score
  function updateScore(index: number, value: string) {
    setScores((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  // Handle submit
  async function handleSubmit(e: Event) {
    e.preventDefault();

    const user = currentUser();
    const group = groupsStore.currentGroup();

    if (!user || !group || !selectedOpponentId() || !winner()) {
      setFormError("Please fill in all required fields");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      // Determine player IDs - current user is always player1
      const player1Id = user.uid;
      const player2Id = selectedOpponentId()!;
      const winnerId = winner() === "me" ? player1Id : player2Id;

      // Filter out empty scores
      const validScores = scores().filter((s) => s.trim() !== "");

      // Submit match
      await matchesStore.submitMatch(
        group.id,
        player1Id,
        player2Id,
        winnerId,
        validScores.length > 0 ? validScores : undefined,
        player1Id
      );

      setSuccess(true);

      // Navigate back after short delay
      setTimeout(() => {
        navigate(`/group/${group.id}`);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit match";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    window.history.back();
  }

  // Loading state
  if (!mounted()) {
    return (
      <div class="log-match-container">
        <div class="log-match-loading">Loading...</div>
      </div>
    );
  }

  // Group not found
  if (!groupsStore.currentGroup()) {
    return (
      <div class="log-match-container">
        <div class="log-match-error">Group not found</div>
      </div>
    );
  }

  // Success state
  if (success()) {
    return (
      <div class="log-match-container">
        <div class="log-match-success">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#10b981" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>Match submitted successfully!</p>
          <p class="log-match-redirect">Redirecting to group...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="log-match-container">
      {/* Header */}
      <div class="log-match-header">
        <button type="button" class="back-button" onClick={goBack}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 class="log-match-title">Log Match</h1>
      </div>

      {/* Error display */}
      <Show when={formError()}>
        <div class="log-match-error">{formError()}</div>
      </Show>

      {/* Form */}
      <form class="log-match-form" onSubmit={handleSubmit}>
        {/* Opponent Selection */}
        <div class="form-section">
          <label class="form-label">Select Opponent</label>
          <Show when={groupsStore.loading() || loadingProfiles()}>
            <div class="form-loading">Loading members...</div>
          </Show>

          <Show when={!groupsStore.loading() && !loadingProfiles() && availableOpponents().length === 0}>
            <div class="form-empty">No other members in this group</div>
          </Show>

          <Show when={!groupsStore.loading() && !loadingProfiles() && availableOpponents().length > 0}>
            <div class="opponent-list">
              <For each={availableOpponents()}>
                {(opponent) => (
                  <button
                    type="button"
                    class={`opponent-card ${selectedOpponentId() === opponent.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedOpponentId(opponent.id);
                      // Reset winner when opponent changes
                      setWinner(null);
                    }}
                  >
                    <div class="opponent-avatar">
                      {opponent.profile?.displayName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div class="opponent-info">
                      <span class="opponent-name">{opponent.profile?.displayName || "Unknown Player"}</span>
                      <span class="opponent-record">
                        {opponent.wins}W - {opponent.losses}L
                      </span>
                    </div>
                    <span class="opponent-rating">{opponent.rating}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Winner Selection */}
        <div class="form-section">
          <label class="form-label">Who Won?</label>
          <Show when={!selectedOpponentId()}>
            <div class="form-hint">Select an opponent first</div>
          </Show>

          <Show when={selectedOpponentId()}>
            <div class="winner-buttons">
              <button
                type="button"
                class={`winner-button ${winner() === "me" ? "selected win" : ""}`}
                onClick={() => setWinner("me")}
                disabled={!selectedOpponentId()}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 15l-3-3m0 0l3-3m-3 3h8M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
                I Won
              </button>
              <button
                type="button"
                class={`winner-button ${winner() === "them" ? "selected lose" : ""}`}
                onClick={() => setWinner("them")}
                disabled={!selectedOpponentId()}
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
                They Won
              </button>
            </div>
          </Show>
        </div>

        {/* Optional Scores */}
        <div class="form-section">
          <div class="scores-header">
            <label class="form-label">Scores (Optional)</label>
            <button type="button" class="add-set-button" onClick={addSet}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Set
            </button>
          </div>

          <Show when={scores().length === 0}>
            <div class="form-hint">Add set scores if you want to track them</div>
          </Show>

          <Show when={scores().length > 0}>
            <div class="scores-list">
              <For each={scores()}>
                {(score, index) => (
                  <div class="score-row">
                    <span class="set-number">Set {index() + 1}</span>
                    <input
                      type="text"
                      class="score-input"
                      placeholder="e.g., 6-3"
                      value={score}
                      onInput={(e) => updateScore(index(), e.currentTarget.value)}
                    />
                    <button
                      type="button"
                      class="remove-set-button"
                      onClick={() => removeSet(index())}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          class="submit-button"
          disabled={!isFormValid() || submitting()}
        >
          <Show when={submitting()} fallback="Submit Match">
            Submitting...
          </Show>
        </button>
      </form>
    </div>
  );
}

export default LogMatch;
