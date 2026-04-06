import { createSignal, Show } from "solid-js";
import { authStore } from "../stores/auth.store";
import { groupsStore } from "../stores/groups.store";
import "./Auth.css";

export function CreateGroup() {
  const [name, setName] = createSignal("");
  const [localLoading, setLocalLoading] = createSignal(false);
  const [localError, setLocalError] = createSignal<string | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLocalError(null);
    setLocalLoading(true);

    const user = authStore.currentUser();
    if (!user) {
      setLocalError("You must be signed in to create a group");
      setLocalLoading(false);
      return;
    }

    try {
      const group = await groupsStore.createGroup(name(), user.uid);
      // Navigate to the new group
      window.location.href = `/group/${group.id}`;
    } catch (err) {
      setLocalError(groupsStore.error() || "Failed to create group");
    } finally {
      setLocalLoading(false);
    }
  }

  function handleBack() {
    window.history.back();
  }

  return (
    <div class="auth-container">
      <div class="auth-card">
        <button type="button" class="back-button" onClick={handleBack}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 class="auth-title">Create Group</h1>
        <p class="auth-subtitle">Start a new tennis league group</p>

        <Show when={localError()}>
          <div class="auth-error">{localError()}</div>
        </Show>

        <form onSubmit={handleSubmit} class="auth-form">
          <div class="form-group">
            <label for="groupName">Group Name</label>
            <input
              id="groupName"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              required
              placeholder="e.g., Monday Night Tennis"
              disabled={localLoading()}
              maxLength={100}
            />
          </div>

          <button
            type="submit"
            class="auth-button primary"
            disabled={localLoading() || !name().trim()}
          >
            {localLoading() ? "Creating..." : "Create Group"}
          </button>
        </form>

        <p class="auth-link">
          Or <a href="/join-group">join an existing group</a>
        </p>
      </div>
    </div>
  );
}

export default CreateGroup;
