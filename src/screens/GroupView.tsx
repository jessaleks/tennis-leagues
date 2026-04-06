import { createSignal, onMount, Show, For, createMemo } from "solid-js";
import { authStore } from "../stores/auth.store";
import { groupsStore, type GroupMember } from "../stores/groups.store";
import { getUserProfile, type UserProfile } from "../services/users";
import "./GroupView.css";

interface MemberWithProfile extends GroupMember {
  profile: UserProfile | null;
}

export function GroupView() {
  const [mounted, setMounted] = createSignal(false);
  const [memberProfiles, setMemberProfiles] = createSignal<Map<string, UserProfile>>(new Map());
  const [loadingProfiles, setLoadingProfiles] = createSignal(false);

  // Get group ID from URL
  const groupId = window.location.pathname.split("/group/")[1]?.split("/")[0];

  onMount(async () => {
    if (!groupId) {
      window.location.href = "/";
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
        const { getUserProfiles } = await import("../services/users");
        const profiles = await getUserProfiles(userIds);
        setMemberProfiles(profiles);
      } finally {
        setLoadingProfiles(false);
      }
    }
  });

  async function handleRefresh() {
    if (!groupId) return;
    await groupsStore.fetchGroup(groupId);
    await groupsStore.fetchGroupMembers(groupId);
  }

  function goToSettings() {
    window.location.href = `/group/${groupId}/settings`;
  }

  function goToLogMatch() {
    window.location.href = `/group/${groupId}/log-match`;
  }

  function goBack() {
    window.location.href = "/";
  }

  // Get current user
  const currentUser = authStore.currentUser;
  const group = groupsStore.currentGroup;
  const members = groupsStore.currentGroupMembers;

  // Check if current user is admin
  const isAdmin = createMemo(() => {
    const g = group();
    const user = currentUser();
    return g && user && g.adminId === user.uid;
  });

  // Create sorted members list with profiles
  const sortedMembers = createMemo<MemberWithProfile[]>(() => {
    const mems = members();
    const profiles = memberProfiles();
    return mems
      .map((member) => ({
        ...member,
        profile: profiles.get(member.id) || null,
      }))
      .sort((a, b) => b.rating - a.rating);
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

      {/* Leaderboard / Members List */}
      <div class="leaderboard-section">
        <h2 class="section-title">Leaderboard</h2>
        
        <Show when={groupsStore.loading() || loadingProfiles()}>
          <div class="leaderboard-loading">Loading members...</div>
        </Show>

        <Show when={!groupsStore.loading() && !loadingProfiles() && sortedMembers().length === 0}>
          <div class="leaderboard-empty">
            <p>No members in this group yet.</p>
          </div>
        </Show>

        <Show when={!groupsStore.loading() && !loadingProfiles() && sortedMembers().length > 0}>
          <div class="leaderboard">
            <For each={sortedMembers()}>
              {(member, index) => (
                <div class="leaderboard-row">
                  <span class="leaderboard-rank">{index() + 1}</span>
                  <div class="leaderboard-info">
                    <span class="leaderboard-name">
                      {member.profile?.displayName || "Unknown Player"}
                      <Show when={member.id === group()?.adminId}>
                        <span class="admin-badge">Admin</span>
                      </Show>
                    </span>
                    <span class="leaderboard-record">
                      {member.wins}W - {member.losses}L
                    </span>
                  </div>
                  <span class="leaderboard-rating">{member.rating}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Recent Matches Section (Placeholder) */}
      <div class="recent-matches-section">
        <h2 class="section-title">Recent Matches</h2>
        <div class="recent-matches-placeholder">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p>Match history will appear here</p>
        </div>
      </div>
    </div>
  );
}

export default GroupView;
