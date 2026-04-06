import { createSignal } from "solid-js";
import {
  getLeaderboard as firebaseGetLeaderboard,
  getLeaderboardEntry as firebaseGetLeaderboardEntry,
  getPlayerRank as firebaseGetPlayerRank,
  isInactive as checkIsInactive,
  calculateTrend as firebaseCalculateTrend,
  type LeaderboardEntry,
  type TrendDirection,
} from "../services/leaderboard";

// ============================================================================
// State Signals
// ============================================================================

const [leaderboardData, setLeaderboardData] = createSignal<LeaderboardEntry[]>([]);
const [currentUserRank, setCurrentUserRank] = createSignal<number | null>(null);
const [currentUserEntry, setCurrentUserEntry] = createSignal<LeaderboardEntry | null>(null);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

function clearError(): void {
  setError(null);
}

function handleError(err: unknown): void {
  let message = "An unexpected error occurred. Please try again.";
  
  if (err instanceof Error) {
    const errorMessage = err.message;
    if (errorMessage.includes("Group not found")) {
      message = "Group not found.";
    } else if (errorMessage.includes("permission")) {
      message = "You don't have permission to view this leaderboard.";
    }
  }
  
  setError(message);
  throw err;
}

// ============================================================================
// Leaderboard Actions
// ============================================================================

/**
 * Fetches the leaderboard for a group
 * Gets all members sorted by rating with trend and inactive status
 */
async function fetchLeaderboard(groupId: string): Promise<void> {
  setError(null);
  setLoading(true);
  
  try {
    const leaderboard = await firebaseGetLeaderboard(groupId);
    setLeaderboardData(leaderboard);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Fetches the current user's rank and entry in the leaderboard
 */
async function fetchCurrentUserRank(groupId: string, userId: string): Promise<void> {
  setError(null);
  
  try {
    // Get player's rank position
    const rank = await firebaseGetPlayerRank(groupId, userId);
    setCurrentUserRank(rank);
    
    // Get player's full leaderboard entry
    const entry = await firebaseGetLeaderboardEntry(groupId, userId);
    setCurrentUserEntry(entry);
  } catch (err) {
    handleError(err);
  }
}

/**
 * Fetches both the leaderboard and current user's rank
 * Convenience function for initial load
 */
async function fetchLeaderboardWithUser(
  groupId: string,
  userId: string
): Promise<void> {
  setError(null);
  setLoading(true);
  
  try {
    // Fetch leaderboard and user rank in parallel
    const [leaderboard, rank, entry] = await Promise.all([
      firebaseGetLeaderboard(groupId),
      firebaseGetPlayerRank(groupId, userId),
      firebaseGetLeaderboardEntry(groupId, userId),
    ]);
    
    setLeaderboardData(leaderboard);
    setCurrentUserRank(rank);
    setCurrentUserEntry(entry);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Checks if a player is inactive based on their last match date
 */
function checkInactive(lastMatchAt: Date | null): boolean {
  return checkIsInactive(lastMatchAt);
}

/**
 * Manually calculate trend for a user (useful for refreshing trend data)
 */
async function refreshTrend(groupId: string, userId: string): Promise<TrendDirection> {
  try {
    return await firebaseCalculateTrend(groupId, userId);
  } catch (err) {
    console.warn("Failed to refresh trend:", err);
    return "stable";
  }
}

/**
 * Clears the leaderboard data (on group change or sign out)
 */
function clearLeaderboard(): void {
  setLeaderboardData([]);
  setCurrentUserRank(null);
  setCurrentUserEntry(null);
  setError(null);
}

/**
 * Clears only the error state
 */
function clearLeaderboardError(): void {
  setError(null);
}

// ============================================================================
// Export Store
// ============================================================================

export const leaderboardStore = {
  // State (read-only signals)
  leaderboardData,
  currentUserRank,
  currentUserEntry,
  loading,
  error,
  
  // Actions
  fetchLeaderboard,
  fetchCurrentUserRank,
  fetchLeaderboardWithUser,
  checkInactive,
  refreshTrend,
  clearLeaderboard,
  clearLeaderboardError,
};

// ============================================================================
// Convenience Exports
// ============================================================================

export {
  leaderboardData,
  currentUserRank,
  currentUserEntry,
  loading,
  error,
  fetchLeaderboard,
  fetchCurrentUserRank,
  fetchLeaderboardWithUser,
  checkInactive,
  refreshTrend,
  clearLeaderboard,
  clearLeaderboardError,
};
