import { createSignal, onMount, Show, For, createMemo } from "solid-js";
import { authStore } from "../stores/auth.store";
import { groupsStore, type GroupMember } from "../stores/groups.store";
import { getUserProfile, type UserProfile } from "../services/users";
import "./GroupSettings.css";

interface MemberWithProfile extends GroupMember {
  profile: UserProfile | null;
}

export function GroupSettings() {
  const [mounted, setMounted] = createSignal(false);
  const [memberProfiles, setMemberProfiles] = createSignal<Map<string, UserProfile>>(new Map());
  const [loadingProfiles, setLoadingProfiles] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const [actionLoading, setActionLoading] = createSignal<string | null>(null);
  const [localError, setLocalError] = createSignal<string | null>(null);
  const [localSuccess, setLocalSuccess] = createSignal<string | null>(null);

  // Get group ID from URL
  const groupId = window.location.pathname.split("/group/")[1]?.split("/")[0]?.replace("/settings", "");

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

  // Create members list with profiles
  const membersWithProfiles = createMemo<MemberWithProfile[]>(() => {
    const mems = members();
    const profiles = memberProfiles();
    return mems
      .map((member) => ({
        ...member,
        profile: profiles.get(member.id) || null,
      }))
      .sort((a, b) => {
        // Admin first
        if (a.id === group()?.adminId) return -1;
        if (b.id === group()?.adminId) return 1;
        return b.rating - a.rating;
      });
  });

  async function copyInviteCode() {
    const code = group()?.inviteCode;
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setLocalSuccess("Invite code copied!");
      setTimeout(() => {
        setCopied(false);
        setLocalSuccess(null);
      }, 2000);
    } catch (err) {
      setLocalError("Failed to copy invite code");
    }
  }

  async function handleRemoveMember(userId: string) {
    const g = group();
    const user = currentUser();

    if (!g || !user) return;
    if (g.adminId !== user.uid) {
      setLocalError("Only the admin can remove members");
      return;
    }
    if (userId === g.adminId) {
      setLocalError("Cannot remove the group admin");
      return;
    }

    if (!confirm("Are you sure you want to remove this member from the group?")) {
      return;
    }

    setLocalError(null);
    setActionLoading(userId);

    try {
      await groupsStore.removeMember(g.id, userId, user.uid);
      setLocalSuccess("Member removed successfully");

      // Refresh member profiles
      const updatedMembers = groupsStore.currentGroupMembers();
      const userIds = updatedMembers.map((m) => m.id);
      const { getUserProfiles } = await import("../services/users");
      const profiles = await getUserProfiles(userIds);
      setMemberProfiles(profiles);

      setTimeout(() => setLocalSuccess(null), 2000);
    } catch (err) {
      setLocalError(groupsStore.error() || "Failed to remove member");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleLeaveGroup() {
    const g = group();
    const user = currentUser();

    if (!g || !user) return;
    if (g.adminId === user.uid) {
      setLocalError("Admin cannot leave the group. Transfer admin role or delete the group instead.");
      return;
    }

    if (!confirm("Are you sure you want to leave this group?")) {
      return;
    }

    setLocalError(null);
    setActionLoading("leave");

    try {
      await groupsStore.leaveGroup(g.id, user.uid);
      window.location.href = "/";
    } catch (err) {
      setLocalError(groupsStore.error() || "Failed to leave group");
    } finally {
      setActionLoading(null);
    }
  }

  function handleArchiveGroup() {
    const g = group();
    if (!g) return;

    // Placeholder for archive functionality
    alert("Archive group functionality coming soon!");
  }

  function goBack() {
    window.location.href = `/group/${groupId}`;
  }

  // Loading state
  if (!mounted()) {
    return (
      <div class="group-settings-container">
        <div class="group-settings-loading">Loading...</div>
      </div>
    );
  }

  // Group not found
  if (!group()) {
    return (
      <div class="group-settings-container">
        <div class="group-settings-error">Group not found</div>
      </div>
    );
  }

  return (
    <div class="group-settings-container">
      {/* Header */}
      <div class="group-settings-header">
        <button type="button" class="back-button" onClick={goBack}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      {/* Error/Success messages */}
      <Show when={localError()}>
        <div class="group-settings-error">{localError()}</div>
      </Show>
      <Show when={localSuccess()}>
        <div class="group-settings-success">{localSuccess()}</div>
      </Show>

      {/* Group Settings Title */}
      <h1 class="group-settings-title">Group Settings</h1>

      {/* Invite Code Section */}
      <div class="settings-section">
        <h2 class="section-title">Invite Code</h2>
        <div class="invite-code-container">
          <div class="invite-code-display">
            <span class="invite-code">{group()?.inviteCode}</span>
            <button
              type="button"
              class="copy-button"
              onClick={copyInviteCode}
              disabled={copied()}
            >
              <Show when={copied()} fallback={
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              }>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Show>
              {copied() ? "Copied!" : "Copy"}
            </button>
          </div>
          <p class="invite-code-hint">Share this code with friends to let them join the group</p>
        </div>
      </div>

      {/* Members Section */}
      <div class="settings-section">
        <h2 class="section-title">Members ({members().length})</h2>
        
        <Show when={groupsStore.loading() || loadingProfiles()}>
          <div class="settings-loading">Loading members...</div>
        </Show>

        <Show when={!groupsStore.loading() && !loadingProfiles() && membersWithProfiles().length > 0}>
          <div class="members-list">
            <For each={membersWithProfiles()}>
              {(member) => (
                <div class="member-row">
                  <div class="member-info">
                    <span class="member-name">
                      {member.profile?.displayName || "Unknown Player"}
                      <Show when={member.id === group()?.adminId}>
                        <span class="admin-badge">Admin</span>
                      </Show>
                    </span>
                    <span class="member-stats">
                      Rating: {member.rating} | {member.wins}W - {member.losses}L
                    </span>
                  </div>
                  <Show when={isAdmin() && member.id !== group()?.adminId}>
                    <button
                      type="button"
                      class="remove-button"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={actionLoading() === member.id}
                    >
                      <Show when={actionLoading() === member.id} fallback={
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      }>
                        <svg class="spinner" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="32" />
                        </svg>
                      </Show>
                      Remove
                    </button>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Actions Section */}
      <div class="settings-section">
        <h2 class="section-title">Actions</h2>
        
        <div class="settings-actions">
          <Show when={!isAdmin()}>
            <button
              type="button"
              class="settings-button danger"
              onClick={handleLeaveGroup}
              disabled={actionLoading() === "leave"}
            >
              <Show when={actionLoading() === "leave"} fallback={
                <>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                  </svg>
                  Leave Group
                </>
              }>
                Leaving...
              </Show>
            </button>
          </Show>

          <Show when={isAdmin()}>
            <button
              type="button"
              class="settings-button warning"
              onClick={handleArchiveGroup}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archive Group
            </button>
            <p class="settings-hint">
              Archiving will hide the group from your active groups list. You can restore it later.
            </p>
          </Show>
        </div>
      </div>
    </div>
  );
}

export default GroupSettings;
