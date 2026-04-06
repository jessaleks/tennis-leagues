import { createSignal } from "solid-js";
import {
  submitMatch as firebaseSubmitMatch,
  getGroupMatches as firebaseGetGroupMatches,
  getRecentGroupMatches as firebaseGetRecentGroupMatches,
  getConfirmedGroupMatches as firebaseGetConfirmedGroupMatches,
  getPendingMatches as firebaseGetPendingMatches,
  filterPendingMatchesForUser,
  confirmMatch as firebaseConfirmMatch,
  rejectMatch as firebaseRejectMatch,
  autoConfirmExpired as firebaseAutoConfirmExpired,
  getMatch as firebaseGetMatch,
  validateSubmitMatchInput,
  validateConfirmMatchInput,
  validateRejectMatchInput,
  getMatchErrorMessage,
  type Match,
  type MatchStatus,
} from "../services/matches";

// ============================================================================
// State Signals
// ============================================================================

const [matches, setMatches] = createSignal<Match[]>([]);
const [pendingConfirmations, setPendingConfirmations] = createSignal<Match[]>([]);
const [currentMatch, setCurrentMatch] = createSignal<Match | null>(null);
const [loading, setLoading] = createSignal(false);
const [error, setError] = createSignal<string | null>(null);

// ============================================================================
// Helper Functions
// ============================================================================

function clearError(): void {
  setError(null);
}

function handleError(err: unknown): void {
  const message = getMatchErrorMessage(err);
  setError(message);
  throw err;
}

// ============================================================================
// Match Actions
// ============================================================================

/**
 * Submits a new match
 */
async function submitMatch(
  groupId: string,
  player1Id: string,
  player2Id: string,
  winnerId: string,
  scores?: string[],
  submittedBy?: string
): Promise<Match> {
  setError(null);
  setLoading(true);

  try {
    // Validate input
    const input = validateSubmitMatchInput({
      groupId,
      player1Id,
      player2Id,
      winnerId,
      scores,
      submittedBy: submittedBy || player1Id,
    });

    // Submit match via Firebase
    const match = await firebaseSubmitMatch(
      input.groupId,
      input.player1Id,
      input.player2Id,
      input.winnerId,
      input.scores,
      input.submittedBy
    );

    // Update local state - add to beginning (newest first)
    setMatches((prev) => [match, ...prev]);

    return match;
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Gets all matches for a group
 */
async function fetchGroupMatches(groupId: string): Promise<void> {
  setError(null);
  setLoading(true);

  try {
    const groupMatches = await firebaseGetGroupMatches(groupId);
    setMatches(groupMatches);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Gets recent matches for a group
 */
async function fetchRecentGroupMatches(groupId: string, maxCount: number = 10): Promise<void> {
  setError(null);
  setLoading(true);

  try {
    const groupMatches = await firebaseGetRecentGroupMatches(groupId, maxCount);
    setMatches(groupMatches);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Gets confirmed matches for a group
 */
async function fetchConfirmedGroupMatches(groupId: string): Promise<void> {
  setError(null);
  setLoading(true);

  try {
    const groupMatches = await firebaseGetConfirmedGroupMatches(groupId);
    setMatches(groupMatches);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Gets pending matches where the user is the opponent
 */
async function fetchPendingConfirmations(userId: string, groupId: string): Promise<void> {
  setError(null);
  setLoading(true);

  try {
    // First get all matches for the group
    const allMatches = await firebaseGetGroupMatches(groupId);
    
    // Filter to get matches where user is the opponent and status is pending
    const pending = filterPendingMatchesForUser(allMatches, userId);
    setPendingConfirmations(pending);
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}

/**
 * Confirms a pending match
 */
async function confirmMatch(
  matchId: string,
  groupId: string,
  confirmedBy: string
): Promise<Match> {
  setError(null);
  setLoading(true);

  try {
    // Validate input
    const input = validateConfirmMatchInput({
      matchId,
      groupId,
      confirmedBy,
    });

    // Confirm match via Firebase
    const match = await firebaseConfirmMatch(input.matchId, input.groupId, input.confirmedBy);

    // Update local state
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? match : m))
    );

    // Remove from pending confirmations
    setPendingConfirmations((prev) =>
      prev.filter((m) => m.id !== match.id)
    );

    return match;
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Rejects a pending match
 */
async function rejectMatch(
  matchId: string,
  groupId: string,
  rejectedBy: string,
  reason?: string
): Promise<Match> {
  setError(null);
  setLoading(true);

  try {
    // Validate input
    const input = validateRejectMatchInput({
      matchId,
      groupId,
      rejectedBy,
      reason,
    });

    // Reject match via Firebase
    const match = await firebaseRejectMatch(
      input.matchId,
      input.groupId,
      input.rejectedBy,
      input.reason
    );

    // Update local state
    setMatches((prev) =>
      prev.map((m) => (m.id === match.id ? match : m))
    );

    // Remove from pending confirmations
    setPendingConfirmations((prev) =>
      prev.filter((m) => m.id !== match.id)
    );

    return match;
  } catch (err) {
    handleError(err);
    throw err;
  } finally {
    setLoading(false);
  }
}

/**
 * Auto-confirms expired matches (older than 40 hours)
 */
async function autoConfirmExpired(groupId: string): Promise<Match[]> {
  setError(null);
  setLoading(true);

  try {
    const expiredMatches = await firebaseAutoConfirmExpired(groupId);

    // Update local state with confirmed matches
    if (expiredMatches.length > 0) {
      setMatches((prev) =>
        prev.map((m) => {
          const expired = expiredMatches.find((e) => e.id === m.id);
          return expired ? { ...m, status: "confirmed" as MatchStatus } : m;
        })
      );

      // Remove from pending confirmations
      setPendingConfirmations((prev) =>
        prev.filter((m) => !expiredMatches.find((e) => e.id === m.id))
      );
    }

    return expiredMatches;
  } catch (err) {
    handleError(err);
    return [];
  } finally {
    setLoading(false);
  }
}

/**
 * Gets a single match by ID
 */
async function fetchMatch(groupId: string, matchId: string): Promise<Match | null> {
  setError(null);
  setLoading(true);

  try {
    const match = await firebaseGetMatch(groupId, matchId);
    setCurrentMatch(match);
    return match;
  } catch (err) {
    handleError(err);
    return null;
  } finally {
    setLoading(false);
  }
}

/**
 * Clears all matches (on sign out)
 */
function clearMatches(): void {
  setMatches([]);
  setPendingConfirmations([]);
  setCurrentMatch(null);
  setError(null);
}

/**
 * Clears current match selection
 */
function clearCurrentMatch(): void {
  setCurrentMatch(null);
}

// ============================================================================
// Export Store
// ============================================================================

export const matchesStore = {
  // State (read-only signals)
  matches,
  pendingConfirmations,
  currentMatch,
  loading,
  error,

  // Actions
  submitMatch,
  fetchGroupMatches,
  fetchRecentGroupMatches,
  fetchConfirmedGroupMatches,
  fetchPendingConfirmations,
  confirmMatch,
  rejectMatch,
  autoConfirmExpired,
  fetchMatch,
  clearMatches,
  clearCurrentMatch,
  clearError,
};

// ============================================================================
// Convenience Exports
// ============================================================================

export {
  matches,
  pendingConfirmations,
  currentMatch,
  loading,
  error,
  submitMatch,
  fetchGroupMatches,
  fetchRecentGroupMatches,
  fetchConfirmedGroupMatches,
  fetchPendingConfirmations,
  confirmMatch,
  rejectMatch,
  autoConfirmExpired,
  fetchMatch,
  clearMatches,
  clearCurrentMatch,
  clearError,
};
