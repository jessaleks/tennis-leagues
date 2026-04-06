import { createSignal, Show, onMount } from "solid-js";
import { authStore } from "../stores/auth.store";
import "./Auth.css";

export function Signup() {
  const [displayName, setDisplayName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [localLoading, setLocalLoading] = createSignal(false);
  const [localError, setLocalError] = createSignal<string | null>(null);
  const [mounted, setMounted] = createSignal(false);

  onMount(() => {
    setMounted(true);
    // Redirect if already logged in
    if (authStore.currentUser()) {
      window.location.href = "/";
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setLocalError(null);

    // Validate passwords match
    if (password() !== confirmPassword()) {
      setLocalError("Passwords do not match");
      return;
    }

    setLocalLoading(true);

    try {
      await authStore.signUp(email(), password(), displayName());
      window.location.href = "/";
    } catch (err) {
      setLocalError(authStore.error() || "Sign up failed");
    } finally {
      setLocalLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLocalError(null);
    setLocalLoading(true);

    try {
      await authStore.signInWithGoogle();
      window.location.href = "/";
    } catch (err) {
      setLocalError(authStore.error() || "Google sign in failed");
    } finally {
      setLocalLoading(false);
    }
  }

  // Don't render anything until mounted (to check auth state)
  if (!mounted()) {
    return null;
  }

  return (
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Join the tennis leagues</p>

        <Show when={localError()}>
          <div class="auth-error">{localError()}</div>
        </Show>

        <form onSubmit={handleSubmit} class="auth-form">
          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName()}
              onInput={(e) => setDisplayName(e.currentTarget.value)}
              required
              placeholder="Your display name"
              disabled={localLoading()}
              minLength={2}
              maxLength={50}
            />
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              required
              placeholder="you@example.com"
              disabled={localLoading()}
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              required
              placeholder="Min 8 characters"
              disabled={localLoading()}
              minLength={8}
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword()}
              onInput={(e) => setConfirmPassword(e.currentTarget.value)}
              required
              placeholder="Re-enter your password"
              disabled={localLoading()}
              minLength={8}
            />
          </div>

          <button
            type="submit"
            class="auth-button primary"
            disabled={localLoading()}
          >
            {localLoading() ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div class="auth-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          class="auth-button google"
          onClick={handleGoogleSignIn}
          disabled={localLoading()}
        >
          <svg viewBox="0 0 24 24" class="google-icon">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p class="auth-link">
          Already have an account?{" "}
          <a href="/login">Sign in</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
