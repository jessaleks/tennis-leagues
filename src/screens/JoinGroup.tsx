import { createSignal, Show } from "solid-js";
import { authStore } from "../stores/auth.store";
import { groupsStore } from "../stores/groups.store";
import "./Auth.css";

export function JoinGroup() {
  const [inviteCode, setInviteCode] = createSignal("");
  const [localLoading, setLocalLoading] = createSignal(false);
  const [localError, setLocalError] = createSignal<string | null>(null);

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLocalError(null);
    setLocalLoading(true);

    const user = authStore.currentUser();
    if (!user) {
      setLocalError("You must be signed in to join a group");
      setLocalLoading(false);
      return;
    }

    const code = inviteCode().trim().toUpperCase();
    if (code.length !== 8) {
      setLocalError("Invite code must be 8 characters");
      setLocalLoading(false);
      return;
    }

    try {
      const group = await groupsStore.joinGroup(code, user.uid);
      // Navigate to the group
      window.location.href = `/group/${group.id}`;
    } catch (err) {
      setLocalError(groupsStore.error() || "Failed to join group. Check your invite code.");
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

        <h1 class="auth-title">Join Group</h1>
        <p class="auth-subtitle">Enter your invite code to join a tennis league</p>

        <Show when={localError()}>
          <div class="auth-error">{localError()}</div>
        </Show>

        <form onSubmit={handleSubmit} class="auth-form">
          <div class="form-group">
            <label for="inviteCode">Invite Code</label>
            <input
              id="inviteCode"
              type="text"
              value={inviteCode()}
              onInput={(e) => setInviteCode(e.currentTarget.value.toUpperCase())}
              required
              placeholder="e.g., AB123456"
              disabled={localLoading()}
              maxLength={8}
              style={{ "text-transform": "uppercase", "letter-spacing": "0.1em" }}
            />
          </div>

          <button
            type="submit"
            class="auth-button primary"
            disabled={localLoading() || inviteCode().trim().length !== 8}
          >
            {localLoading() ? "Joining..." : "Join Group"}
          </button>
        </form>

        <p class="auth-link">
          Or <a href="/create-group">create a new group</a>
        </p>
      </div>
    </div>
  );
}

export default JoinGroup;
