import { createSignal } from "solid-js";
import {
  getPlayerProfile,
  getPlayerMatches,
  getRatingHistory,
  getHeadToHead,
  getPlayerProfileErrorMessage,
  type PlayerProfile,
  type MatchResult,
  type RatingHistoryEntry,
  type HeadToHeadRecord,
} from "../services/player-profile";

// ============================================================================
// State Signals
// ============================================================================

const [currentProfile, setCurrentProfile] = createSignal<PlayerProfile | null>(null);
const [playerMatches, setPlayerMatches] = createSignal<MatchResult[]>([]);
const [ratingHistory, setRatingHistory] = createSignal<RatingHistoryEntry[]>([]);
const [headToHead, setHeadToHead] = createSignal<HeadToHeadRecord | null>(null);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

function clearError(): void {
  setError(null);
}

function handleError(err: unknown): void {
  const message = getPlayerProfileErrorMessage(err);
  setError(message);
}

// ============================================================================
// Profile Actions
// ============================================================================

/**
 * Fetches player profile and matches for display
 * 
 * Loads both the player stats and their match history in parallel
 * for optimal performance. When viewing another player (not self),
 * also fetches the head-to-head record.
 * 
 * @param groupId - The Firestore group document ID
 * @param userId - The Firestore user document ID
 * @param currentUserId - The current logged-in user's ID (for H2H comparison)
 */
async function fetchProfile(groupId: string, userId: string, currentUserId?: string): Promise<void> {
  setError(null);
  setLoading(true);

  try {
    // Fetch profile, matches, and rating history in parallel
    const [profile, matches, history] = await Promise.all([
      getPlayerProfile(groupId, userId),
      getPlayerMatches(groupId, userId),
      getRatingHistory(groupId, userId),
    ]);

    setCurrentProfile(profile);
    setPlayerMatches(matches);
    setRatingHistory(history);

    // Fetch head-to-head if viewing another player (not self)
    if (currentUserId && currentUserId !== userId) {
      const h2h = await getHeadToHead(groupId, currentUserId, userId);
      setHeadToHead(h2h);
    } else {
      // Viewing self - no H2H needed
      setHeadToHead(null);
    }
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Clears the current profile data
 * 
 * Called when navigating away from the profile page or on sign out.
 */
function clearProfile(): void {
  setCurrentProfile(null);
  setPlayerMatches([]);
  setRatingHistory([]);
  setHeadToHead(null);
  setError(null);
}

// ============================================================================
// Export Store
// ============================================================================

export const playerProfileStore = {
  // State (read-only signals)
  currentProfile,
  playerMatches,
  ratingHistory,
  headToHead,
  loading,
  error,

  // Actions
  fetchProfile,
  clearProfile,
  clearError,
};

// ============================================================================
// Convenience Exports
// ============================================================================

export {
  currentProfile,
  playerMatches,
  ratingHistory,
  headToHead,
  loading,
  error,
  fetchProfile,
  clearProfile,
  clearError,
};
