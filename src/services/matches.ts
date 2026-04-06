import { z } from "zod";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { updateRatings, RatingUpdate } from "./elo";
import { getGroupMembers, updateMemberStats } from "./groups";

// ============================================================================
// Types
// ============================================================================

export type MatchStatus = "pending" | "confirmed" | "rejected";

export interface Match {
  id: string;
  groupId: string;
  player1Id: string;
  player2Id: string;
  winnerId: string;
  scores?: string[];
  status: MatchStatus;
  submittedBy: string;
  confirmedBy?: string;
  submittedAt: Date;
  confirmedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const SubmitMatchSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  player1Id: z.string().min(1, "Player 1 ID is required"),
  player2Id: z.string().min(1, "Player 2 ID is required"),
  winnerId: z.string().min(1, "Winner ID is required"),
  scores: z.array(z.string()).optional(),
  submittedBy: z.string().min(1, "Submitter ID is required"),
});

export const ConfirmMatchSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  groupId: z.string().min(1, "Group ID is required"),
  confirmedBy: z.string().min(1, "Confirmer ID is required"),
});

export const RejectMatchSchema = z.object({
  matchId: z.string().min(1, "Match ID is required"),
  groupId: z.string().min(1, "Group ID is required"),
  rejectedBy: z.string().min(1, "Rejecter ID is required"),
  reason: z.string().max(500, "Reason must be less than 500 characters").optional(),
});

export type SubmitMatchInput = z.infer<typeof SubmitMatchSchema>;
export type ConfirmMatchInput = z.infer<typeof ConfirmMatchSchema>;
export type RejectMatchInput = z.infer<typeof RejectMatchSchema>;

// ============================================================================
// Rating Update Helper Functions
// ============================================================================

/**
 * Applies Elo rating updates to both players after a match is confirmed
 * 
 * @param groupId - The group ID
 * @param winnerId - Winner's user ID
 * @param loserId - Loser's user ID
 * @returns The rating update result, or null if players not found
 */
async function applyMatchRatingUpdates(
  groupId: string,
  winnerId: string,
  loserId: string
): Promise<RatingUpdate | null> {
  try {
    // Get current member stats for both players
    const members = await getGroupMembers(groupId);
    const winnerMember = members.find(m => m.id === winnerId);
    const loserMember = members.find(m => m.id === loserId);

    // Handle edge case: player not in group
    if (!winnerMember || !loserMember) {
      console.warn(`Cannot update ratings: player(s) not in group. winner: ${!!winnerMember}, loser: ${!!loserMember}`);
      return null;
    }

    // Calculate new ratings using Elo system
    const ratingUpdate = updateRatings(winnerMember.rating, loserMember.rating);

    // Update winner: new rating and increment wins
    await updateMemberStats(groupId, winnerId, {
      rating: ratingUpdate.winnerNewRating,
      wins: winnerMember.wins + 1,
      lastMatchAt: new Date(),
    });

    // Update loser: new rating and increment losses
    await updateMemberStats(groupId, loserId, {
      rating: ratingUpdate.loserNewRating,
      losses: loserMember.losses + 1,
      lastMatchAt: new Date(),
    });

    return ratingUpdate;
  } catch (error) {
    console.error("Failed to apply rating updates:", error);
    return null;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts Firestore timestamp to Date
 */
function timestampToDate(timestamp: unknown): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
}

/**
 * Maps Firestore document to Match object
 */
function mapDocToMatch(docSnap: { id: string; data: () => Record<string, unknown> }): Match {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    groupId: data.groupId as string,
    player1Id: data.player1Id as string,
    player2Id: data.player2Id as string,
    winnerId: data.winnerId as string,
    scores: data.scores as string[] | undefined,
    status: data.status as MatchStatus,
    submittedBy: data.submittedBy as string,
    confirmedBy: data.confirmedBy as string | undefined,
    submittedAt: timestampToDate(data.submittedAt),
    confirmedAt: data.confirmedAt ? timestampToDate(data.confirmedAt) : undefined,
    rejectedAt: data.rejectedAt ? timestampToDate(data.rejectedAt) : undefined,
    rejectionReason: data.rejectionReason as string | undefined,
  };
}

// ============================================================================
// Match CRUD Operations
// ============================================================================

/**
 * Submits a new match with "pending" status
 * The opponent will need to confirm or reject the match
 */
export async function submitMatch(
  groupId: string,
  player1Id: string,
  player2Id: string,
  winnerId: string,
  scores?: string[],
  submittedBy?: string
): Promise<Match> {
  // Validate input
  const submitterId = submittedBy || player1Id;
  const input = SubmitMatchSchema.parse({
    groupId,
    player1Id,
    player2Id,
    winnerId,
    scores,
    submittedBy: submitterId,
  });

  // Ensure winner is one of the players
  if (winnerId !== player1Id && winnerId !== player2Id) {
    throw new Error("Winner must be one of the match players");
  }

  // Ensure player1 and player2 are different
  if (player1Id === player2Id) {
    throw new Error("Players must be different");
  }

  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const matchDoc = await addDoc(matchesRef, {
    groupId: input.groupId,
    player1Id: input.player1Id,
    player2Id: input.player2Id,
    winnerId: input.winnerId,
    scores: input.scores || null,
    status: "pending",
    submittedBy: input.submittedBy,
    submittedAt: serverTimestamp(),
  });

  // Return created match
  const matchSnap = await getDoc(doc(db, `groups/${groupId}/matches`, matchDoc.id));
  const matchData = matchSnap.data();

  return {
    id: matchDoc.id,
    groupId: matchData?.groupId as string,
    player1Id: matchData?.player1Id as string,
    player2Id: matchData?.player2Id as string,
    winnerId: matchData?.winnerId as string,
    scores: matchData?.scores as string[] | undefined,
    status: (matchData?.status as MatchStatus) || "pending",
    submittedBy: matchData?.submittedBy as string,
    submittedAt: timestampToDate(matchData?.submittedAt),
  };
}

/**
 * Gets all matches for a group, ordered by submission date (newest first)
 */
export async function getGroupMatches(groupId: string): Promise<Match[]> {
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(matchesRef, orderBy("submittedAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(mapDocToMatch);
}

/**
 * Gets recent matches for a group (limited)
 */
export async function getRecentGroupMatches(groupId: string, maxCount: number = 10): Promise<Match[]> {
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(matchesRef, orderBy("submittedAt", "desc"), limit(maxCount));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(mapDocToMatch);
}

/**
 * Gets confirmed matches for a group
 */
export async function getConfirmedGroupMatches(groupId: string): Promise<Match[]> {
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(
    matchesRef,
    where("status", "==", "confirmed"),
    orderBy("submittedAt", "desc")
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map(mapDocToMatch);
}

/**
 * Gets pending matches where the user is the opponent (player2)
 * These are matches that need the user to confirm or reject
 */
export async function getPendingMatches(userId: string, groupId?: string): Promise<Match[]> {
  // This is a limitation - in a real app, you'd want a more efficient query
  // For now, we'll fetch all matches and filter client-side
  // A better approach would be to use a dedicated collection or Cloud Function

  if (groupId) {
    const matchesRef = collection(db, `groups/${groupId}/matches`);
    const q = query(
      matchesRef,
      where("status", "==", "pending"),
      where("player2Id", "==", userId),
      orderBy("submittedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(mapDocToMatch);
  }

  // Without groupId, we'd need to query all groups the user belongs to
  // For now, return empty array - the store should handle group-specific queries
  return [];
}

/**
 * Gets all pending matches for a user across multiple groups
 * This is a helper that should be called with matches from each group
 */
export function filterPendingMatchesForUser(matches: Match[], userId: string): Match[] {
  return matches.filter(
    (match) => match.status === "pending" && match.player2Id === userId
  );
}

/**
 * Confirms a pending match
 * Only the opponent (player2) can confirm the match
 */
export async function confirmMatch(
  matchId: string,
  groupId: string,
  confirmedBy: string
): Promise<Match> {
  const input = ConfirmMatchSchema.parse({
    matchId,
    groupId,
    confirmedBy,
  });

  // Get the match
  const matchRef = doc(db, `groups/${groupId}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error("Match not found");
  }

  const matchData = matchSnap.data();

  // Verify the match is still pending
  if (matchData.status !== "pending") {
    throw new Error("Match is not pending");
  }

  // Verify the confirmer is the opponent (player2)
  if (matchData.player2Id !== confirmedBy) {
    throw new Error("Only the opponent can confirm the match");
  }

  // Determine winner and loser
  const winnerId = matchData.winnerId;
  const loserId = winnerId === matchData.player1Id ? matchData.player2Id : matchData.player1Id;

  // Update the match to confirmed
  await updateDoc(matchRef, {
    status: "confirmed",
    confirmedBy: confirmedBy,
    confirmedAt: serverTimestamp(),
  });

  // Apply Elo rating updates for both players
  // This handles edge cases: if player is not in group, ratings won't update
  await applyMatchRatingUpdates(groupId, winnerId, loserId);

  // Return updated match
  const updatedSnap = await getDoc(matchRef);
  return mapDocToMatch({ id: updatedSnap.id, data: () => updatedSnap.data() as Record<string, unknown> });
}

/**
 * Rejects a pending match
 * Only the opponent (player2) can reject the match
 */
export async function rejectMatch(
  matchId: string,
  groupId: string,
  rejectedBy: string,
  reason?: string
): Promise<Match> {
  const input = RejectMatchSchema.parse({
    matchId,
    groupId,
    rejectedBy,
    reason,
  });

  // Get the match
  const matchRef = doc(db, `groups/${groupId}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error("Match not found");
  }

  const matchData = matchSnap.data();

  // Verify the match is still pending
  if (matchData.status !== "pending") {
    throw new Error("Match is not pending");
  }

  // Verify the rejecter is the opponent (player2)
  if (matchData.player2Id !== rejectedBy) {
    throw new Error("Only the opponent can reject the match");
  }

  // Update the match to rejected
  await updateDoc(matchRef, {
    status: "rejected",
    rejectedAt: serverTimestamp(),
    rejectionReason: reason || null,
  });

  // Return updated match
  const updatedSnap = await getDoc(matchRef);
  return mapDocToMatch({ id: updatedSnap.id, data: () => updatedSnap.data() as Record<string, unknown> });
}

/**
 * Auto-confirms expired matches
 * Matches older than 40 hours without response are automatically confirmed
 * This should be called periodically (e.g., on app load or via scheduled function)
 * 
 * Note: Rating updates are applied the same way as manual confirmation
 */
export async function autoConfirmExpired(groupId: string): Promise<Match[]> {
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(
    matchesRef,
    where("status", "==", "pending"),
    orderBy("submittedAt", "asc")
  );
  const snapshot = await getDocs(q);

  const now = new Date();
  const fortyHoursAgo = new Date(now.getTime() - 40 * 60 * 60 * 1000);
  const expiredMatches: Match[] = [];

  for (const matchDoc of snapshot.docs) {
    const matchData = matchDoc.data();
    const submittedAt = timestampToDate(matchData.submittedAt);

    // Check if match is older than 40 hours
    if (submittedAt < fortyHoursAgo) {
      // Determine winner and loser
      const winnerId = matchData.winnerId;
      const loserId = winnerId === matchData.player1Id ? matchData.player2Id : matchData.player1Id;

      // Auto-confirm the match
      await updateDoc(matchDoc.ref, {
        status: "confirmed",
        confirmedBy: "system",
        confirmedAt: serverTimestamp(),
        autoConfirmed: true,
      });

      // Apply Elo rating updates (same as manual confirmation)
      // This handles edge cases: if player is not in group, ratings won't update
      await applyMatchRatingUpdates(groupId, winnerId, loserId);

      expiredMatches.push(mapDocToMatch({ id: matchDoc.id, data: () => matchData }));
    }
  }

  return expiredMatches;
}

/**
 * Gets a single match by ID
 */
export async function getMatch(groupId: string, matchId: string): Promise<Match> {
  const matchRef = doc(db, `groups/${groupId}/matches`, matchId);
  const matchSnap = await getDoc(matchRef);

  if (!matchSnap.exists()) {
    throw new Error("Match not found");
  }

  return mapDocToMatch({ id: matchSnap.id, data: () => matchSnap.data() as Record<string, unknown> });
}

// ============================================================================
// Validation Helper Functions
// ============================================================================

export function validateSubmitMatchInput(data: unknown): SubmitMatchInput {
  return SubmitMatchSchema.parse(data);
}

export function validateConfirmMatchInput(data: unknown): ConfirmMatchInput {
  return ConfirmMatchSchema.parse(data);
}

export function validateRejectMatchInput(data: unknown): RejectMatchInput {
  return RejectMatchSchema.parse(data);
}

/**
 * Get error message for match operations
 */
export function getMatchErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Match not found")) {
      return "Match not found.";
    }
    if (message.includes("Match is not pending")) {
      return "This match has already been processed.";
    }
    if (message.includes("Only the opponent can confirm")) {
      return "Only the opponent can confirm this match.";
    }
    if (message.includes("Only the opponent can reject")) {
      return "Only the opponent can reject this match.";
    }
    if (message.includes("Winner must be one of the match players")) {
      return "Winner must be one of the match players.";
    }
    if (message.includes("Players must be different")) {
      return "Both players must be different.";
    }
    if (message.includes("Group not found")) {
      return "Group not found.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}
