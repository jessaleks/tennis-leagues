import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  id: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Fetches a user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  const data = userSnap.data();
  return {
    id: userSnap.id,
    displayName: data.displayName || "Unknown Player",
    email: data.email || null,
    photoURL: data.photoURL || null,
  };
}

/**
 * Fetches multiple user profiles by IDs
 */
export async function getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
  const profiles = new Map<string, UserProfile>();

  await Promise.all(
    userIds.map(async (userId) => {
      const profile = await getUserProfile(userId);
      if (profile) {
        profiles.set(userId, profile);
      }
    })
  );

  return profiles;
}
