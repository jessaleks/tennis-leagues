import { createSignal, onCleanup } from "solid-js";
import type { User } from "firebase/auth";
import {
  signUp as firebaseSignUp,
  signIn as firebaseSignIn,
  signInWithGoogle,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  validateSignUpInput,
  validateSignInInput,
  getAuthErrorMessage,
} from "../services/auth";

// Auth state signals
const [currentUser, setCurrentUser] = createSignal<User | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<string | null>(null);

// Auth listener reference
let unsubscribeAuth: (() => void) | null = null;

// Initialize auth state listener - call this when app mounts
export function initAuthListener(): void {
  if (unsubscribeAuth) return; // Already initialized

  unsubscribeAuth = onAuthStateChanged((user) => {
    setCurrentUser(user);
    setLoading(false);
  });
}

// Cleanup function
export function cleanupAuthListener(): void {
  if (unsubscribeAuth) {
    unsubscribeAuth();
    unsubscribeAuth = null;
  }
}

// Auth actions
async function signUp(email: string, password: string, displayName: string): Promise<User> {
  setError(null);
  setLoading(true);

  try {
    // Validate input
    const input = validateSignUpInput({ email, password, displayName });

    // Attempt sign up
    const user = await firebaseSignUp(input.email, input.password, input.displayName);
    // Set current user directly (onAuthStateChanged may not fire in tests)
    setCurrentUser(user);
    setLoading(false);
    return user;
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    throw err;
  }
}

async function signIn(email: string, password: string): Promise<User> {
  setError(null);
  setLoading(true);

  try {
    // Validate input
    const input = validateSignInInput({ email, password });

    // Attempt sign in
    const user = await firebaseSignIn(input.email, input.password);
    // Set current user directly (onAuthStateChanged may not fire in tests)
    setCurrentUser(user);
    setLoading(false);
    return user;
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    throw err;
  }
}

async function signInWithGoogleUser(): Promise<User> {
  setError(null);
  setLoading(true);

  try {
    const user = await signInWithGoogle();
    return user;
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    throw err;
  } finally {
    setLoading(false);
  }
}

async function signOutUser(): Promise<void> {
  setError(null);
  setLoading(true);

  try {
    await firebaseSignOut();
    setCurrentUser(null);
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    throw err;
  } finally {
    setLoading(false);
  }
}

function clearError(): void {
  setError(null);
}

// Export auth state and actions
export const authStore = {
  // State (read-only signals)
  currentUser,
  loading,
  error,

  // Derived state
  get isAuthenticated(): boolean {
    return currentUser() !== null;
  },

  // Actions
  signUp,
  signIn,
  signInWithGoogle: signInWithGoogleUser,
  signOut: signOutUser,
  clearError,
};

// Convenience exports for direct usage
export {
  currentUser,
  loading,
  error,
  signUp,
  signIn,
  signInWithGoogle,
  signOutUser as signOut,
  clearError,
};

// Test-only method to manually set auth state (used by E2E tests)
// @ts-ignore - exposed for testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).__setTestAuthUser = (user: User | null) => {
    setCurrentUser(user);
    setLoading(false);
  };
  (window as any).__clearTestAuthUser = () => {
    setCurrentUser(null);
    setLoading(false);
  };
}
