import { createSignal, onMount, Show, For } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { authStore } from "../stores/auth.store";
import { groupsStore, type Group } from "../stores/groups.store";
import "./GroupsList.css";

export function GroupsList() {
  const [mounted, setMounted] = createSignal(false);
  const navigate = useNavigate();

  onMount(async () => {
    setMounted(true);
    const user = authStore.currentUser();
    if (user) {
      await groupsStore.fetchUserGroups(user.uid);
    }
  });

  async function handleRefresh() {
    const user = authStore.currentUser();
    if (user) {
      await groupsStore.fetchUserGroups(user.uid);
    }
  }

  function openGroup(groupId: string) {
    navigate(`/group/${groupId}`);
  }

  function goToCreateGroup() {
    navigate("/create-group");
  }

  function goToJoinGroup() {
    navigate("/join-group");
  }

  // Don't render until mounted
  if (!mounted()) {
    return (
      <div class="groups-container">
        <div class="groups-loading">Loading...</div>
      </div>
    );
  }

  const user = authStore.currentUser();
  const groups = groupsStore.groups();

  return (
    <div class="groups-container">
      <div class="groups-header">
        <h1 class="groups-title">My Groups</h1>
        <button class="refresh-button" onClick={handleRefresh} disabled={groupsStore.loading()}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
        </button>
      </div>

      <Show when={groupsStore.error()}>
        <div class="groups-error">{groupsStore.error()}</div>
      </Show>

      <Show when={groupsStore.loading()}>
        <div class="groups-loading">Loading groups...</div>
      </Show>

      <Show when={!groupsStore.loading() && groups.length === 0}>
        <div class="groups-empty">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#d1d5db" stroke-width="1.5">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          <h2>No Groups Yet</h2>
          <p>Create a new group or join an existing one to get started.</p>
        </div>
      </Show>

      <Show when={!groupsStore.loading() && groups.length > 0}>
        <div class="groups-list">
          <For each={groups}>
            {(group) => (
              <div class="group-card" onClick={() => openGroup(group.id)}>
                <div class="group-info">
                  <h3 class="group-name">{group.name}</h3>
                  <span class="group-members">
                    {group.memberIds.length} member{group.memberIds.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="group-arrow">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )}
          </For>
        </div>
      </Show>

      <div class="groups-actions">
        <button class="groups-button primary" onClick={goToCreateGroup}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Create Group
        </button>
        <button class="groups-button secondary" onClick={goToJoinGroup}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </svg>
          Join Group
        </button>
      </div>
    </div>
  );
}

export default GroupsList;
