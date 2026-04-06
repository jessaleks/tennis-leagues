import { createSignal, createEffect, onCleanup } from "solid-js";
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
  type SignUpInput,
  type SignInInput,
} from "../services/auth";

// Auth state signals
const [currentUser, setCurrentUser] = createSignal<User | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<string | null>(null);

// Initialize auth state listener
function initAuthListener(): void {
  const unsubscribe = onAuthStateChanged((user) => {
    setCurrentUser(user);
    setLoading(false);
  });

  onCleanup(unsubscribe);
}

// Start auth listener on module load
initAuthListener();

// Auth actions
async function signUp(email: string, password: string, displayName: string): Promise<User> {
  setError(null);
  setLoading(true);

  try {
    // Validate input
    const input = validateSignUpInput({ email, password, displayName });

    // Attempt sign up
    const user = await firebaseSignUp(input.email, input.password, input.displayName);
    return user;
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    throw err;
  } finally {
    setLoading(false);
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
    return user;
  } catch (err) {
    const message = getAuthErrorMessage(err);
    setError(message);
    throw err;
  } finally {
    setLoading(false);
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
  signOut,
  clearError,
};
