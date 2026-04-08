import { createSignal, onMount, Show, createMemo } from "solid-js";
import { useNavigate, useParams } from "@solidjs/router";
import { authStore } from "../stores/auth.store";
import { groupsStore } from "../stores/groups.store";
import { Leaderboard } from "../components/Leaderboard";
import { RecentMatches } from "../components/RecentMatches";
import "./GroupView.css";

export function GroupView() {
  const [mounted, setMounted] = createSignal(false);

  const navigate = useNavigate();
  const params = useParams<{ groupId: string }>();

  // Get group ID from URL
  const groupId = params.groupId;

  onMount(async () => {
    if (!groupId) {
      navigate("/");
      return;
    }

    setMounted(true);

    // Fetch group
    await groupsStore.fetchGroup(groupId);
  });

  async function handleRefresh() {
    if (!groupId) return;
    await groupsStore.fetchGroup(groupId);
  }

  function goToSettings() {
    navigate(`/group/${groupId}/settings`);
  }

  function goToLogMatch() {
    navigate(`/group/${groupId}/log-match`);
  }

  function goBack() {
    navigate("/");
  }

  // Handle player click - navigate to player profile
  function handlePlayerClick(userId: string) {
    navigate(`/group/${groupId}/player/${userId}`);
  }

  // Get current user
  const currentUser = authStore.currentUser;
  const group = groupsStore.currentGroup;

  // Check if current user is admin
  const isAdmin = createMemo(() => {
    const g = group();
    const user = currentUser();
    return g && user && g.adminId === user.uid;
  });

  // Loading state
  if (!mounted()) {
    return (
      <div class="group-view-container">
        <div class="group-loading">Loading...</div>
      </div>
    );
  }

  // Group not found
  if (!group()) {
    return (
      <div class="group-view-container">
        <div class="group-error">Group not found</div>
      </div>
    );
  }

  return (
    <div class="group-view-container">
      {/* Header */}
      <div class="group-view-header">
        <button type="button" class="back-button" onClick={goBack}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <button type="button" class="refresh-button" onClick={handleRefresh} disabled={groupsStore.loading()}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      {/* Error display */}
      <Show when={groupsStore.error()}>
        <div class="group-error">{groupsStore.error()}</div>
      </Show>

      {/* Group name */}
      <h1 class="group-view-title">{group()?.name}</h1>

      {/* Action buttons */}
      <div class="group-actions">
        <button type="button" class="group-button primary" onClick={goToLogMatch}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Log Match
        </button>
        <Show when={isAdmin()}>
          <button type="button" class="group-button secondary" onClick={goToSettings}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            Settings
          </button>
        </Show>
      </div>

      {/* Leaderboard Component - with clickable player names */}
      <div class="leaderboard-section">
        <h2 class="section-title">Leaderboard</h2>
        <Leaderboard 
          groupId={groupId} 
          onPlayerClick={handlePlayerClick}
        />
      </div>

      {/* Recent Matches Section */}
      <div class="recent-matches-section">
        <h2 class="section-title">Recent Matches</h2>
        <RecentMatches groupId={groupId} limit={10} />
      </div>
    </div>
  );
}

export default GroupView;
