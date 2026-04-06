import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  User,
  onAuthStateChanged as firebaseOnAuthStateChanged,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

// Validation schemas for auth inputs
export const SignUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9_\s]+$/,
      "Display name can only contain letters, numbers, underscores, and spaces"
    ),
});

export const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;

// Auth error mapping
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const code = error.message;
    if (code.includes("auth/email-already-in-use")) {
      return "This email is already registered";
    }
    if (code.includes("auth/invalid-email")) {
      return "Invalid email address";
    }
    if (code.includes("auth/weak-password")) {
      return "Password is too weak";
    }
    if (code.includes("auth/user-not-found")) {
      return "No account found with this email";
    }
    if (code.includes("auth/wrong-password")) {
      return "Incorrect password";
    }
    if (code.includes("auth/invalid-credential")) {
      return "Invalid email or password";
    }
    if (code.includes("auth/popup-closed-by-user")) {
      return "Sign in was cancelled";
    }
    if (code.includes("auth/account-exists-with-different-credential")) {
      return "An account already exists with a different sign in method";
    }
  }
  return "An unexpected error occurred. Please try again.";
}

// User type for app usage (includes Firestore data)
export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
}

// Create user document in Firestore
async function createUserDocument(user: User): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const existingDoc = await getDoc(userRef);

  if (!existingDoc.exists()) {
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Player",
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
    });
  }
}

// Sign up with email/password
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);

  // Update profile with display name
  await updateProfile(result.user, { displayName });

  // Create user document in Firestore
  await createUserDocument(result.user);

  return result.user;
}

// Sign in with email/password
export async function signIn(
  email: string,
  password: string
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// Sign in with Google
export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  const result = await signInWithPopup(auth, provider);

  // Create or update user document in Firestore
  await createUserDocument(result.user);

  return result.user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Get current user (synchronous)
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Subscribe to auth state changes
export function onAuthStateChanged(
  callback: (user: User | null) => void
): () => void {
  return firebaseOnAuthStateChanged(auth, callback);
}

// Validate sign up input
export function validateSignUpInput(data: unknown): SignUpInput {
  return SignUpSchema.parse(data);
}

// Validate sign in input
export function validateSignInInput(data: unknown): SignInInput {
  return SignInSchema.parse(data);
}
