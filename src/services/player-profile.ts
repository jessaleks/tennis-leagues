/**
 * Player Profile Service
 * 
 * Provides functions for fetching player profile data, matches, and statistics
 * within a tennis league group context.
 */

import { z } from "zod";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getUserProfile } from "./users";
import {
  calculateExpectedScore,
  calculateNewRating,
  BASE_RATING,
} from "./elo";

// ============================================================================
// Types
// ============================================================================

export interface PlayerProfile {
  userId: string;
  displayName: string;
  photoURL: string | null;
  rating: number;
  wins: number;
  losses: number;
  lastMatchAt: Date | null;
}

export interface MatchResult {
  matchId: string;
  opponentId: string;
  opponentName: string;
  result: "win" | "loss";
  scores?: string[];
  date: Date;
}

/**
 * Represents a single rating history entry at a point in time
 */
export interface RatingHistoryEntry {
  matchId: string;
  rating: number;
  date: Date;
  opponentId: string;
  result: "win" | "loss";
}

/**
 * Represents the head-to-head record between two players
 */
export interface HeadToHeadRecord {
  playerAWins: number;
  playerBWins: number;
  totalMatches: number;
  lastMatchDate: Date | null;
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const groupIdSchema = z.string().min(1, "Group ID is required");
export const userIdSchema = z.string().min(1, "User ID is required");

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Converts Firestore timestamp to Date
 */
function timestampToDate(timestamp: unknown): Date | null {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return null;
}

/**
 * Formats a date as a human-readable relative string
 * e.g., "2 days ago", "3 weeks ago", "just now"
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  } else if (diffWeeks < 4) {
    return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
  }
}

/**
 * Gets error message for player profile operations
 */
export function getPlayerProfileErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message;
    if (message.includes("Group not found")) {
      return "Group not found.";
    }
    if (message.includes("not found")) {
      return "Player not found in this group.";
    }
    if (message.includes("permission")) {
      return "You don't have permission to view this profile.";
    }
  }
  return "An unexpected error occurred. Please try again.";
}

// ============================================================================
// Player Profile Operations
// ============================================================================

/**
 * Fetches a player's profile within a group
 * 
 * Combines data from the group member document and the user document
 * to create a complete player profile.
 * 
 * @param groupId - The Firestore group document ID
 * @param userId - The Firestore user document ID
 * @returns PlayerProfile object with displayName, rating, W-L, etc.
 */
export async function getPlayerProfile(groupId: string, userId: string): Promise<PlayerProfile> {
  // Validate inputs
  groupIdSchema.parse(groupId);
  userIdSchema.parse(userId);

  // Fetch member document from group
  const memberRef = doc(db, `groups/${groupId}/members`, userId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    throw new Error("Player not found in this group");
  }

  const memberData = memberSnap.data();

  // Fetch user document for displayName and photoURL
  const userProfile = await getUserProfile(userId);

  // Build and return PlayerProfile
  return {
    userId,
    displayName: userProfile?.displayName || "Unknown Player",
    photoURL: userProfile?.photoURL || null,
    rating: memberData.rating || 1500,
    wins: memberData.wins || 0,
    losses: memberData.losses || 0,
    lastMatchAt: memberData.lastMatchAt ? timestampToDate(memberData.lastMatchAt) : null,
  };
}

/**
 * Fetches confirmed matches involving a player, with opponent names
 * 
 * Queries all confirmed matches for the group, filters client-side for matches
 * involving the target user, and fetches opponent user profiles for display names.
 * 
 * @param groupId - The Firestore group document ID
 * @param userId - The Firestore user document ID
 * @returns Array of MatchResult sorted by date descending (newest first)
 */
export async function getPlayerMatches(groupId: string, userId: string): Promise<MatchResult[]> {
  // Validate inputs
  groupIdSchema.parse(groupId);
  userIdSchema.parse(userId);

  // Query confirmed matches ordered by confirmedAt descending
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(
    matchesRef,
    where("status", "==", "confirmed"),
    orderBy("confirmedAt", "desc")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  // Filter matches involving the user and build results
  const playerMatchDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.player1Id === userId || data.player2Id === userId;
  });

  if (playerMatchDocs.length === 0) {
    return [];
  }

  // Collect unique opponent IDs
  const opponentIds = new Set<string>();
  const matchResults: MatchResult[] = [];

  for (const matchDoc of playerMatchDocs) {
    const data = matchDoc.data();
    const opponentId = data.player1Id === userId ? data.player2Id : data.player1Id;
    opponentIds.add(opponentId);

    const isWin = data.winnerId === userId;
    const confirmedAt = data.confirmedAt ? timestampToDate(data.confirmedAt) : new Date();

    matchResults.push({
      matchId: matchDoc.id,
      opponentId,
      opponentName: "", // Will be filled after fetching profiles
      result: isWin ? "win" : "loss",
      scores: data.scores || undefined,
      date: confirmedAt || new Date(),
    });
  }

  // Fetch opponent profiles for names
  const opponentProfiles = await Promise.all(
    Array.from(opponentIds).map(async (oppId) => {
      const profile = await getUserProfile(oppId);
      return { id: oppId, name: profile?.displayName || "Unknown Player" };
    })
  );

  const opponentNameMap = new Map(opponentProfiles.map((p) => [p.id, p.name]));

  // Fill in opponent names
  for (const match of matchResults) {
    match.opponentName = opponentNameMap.get(match.opponentId) || "Unknown Player";
  }

  // Sort by date descending (newest first)
  matchResults.sort((a, b) => b.date.getTime() - a.date.getTime());

  return matchResults;
}

/**
 * Fetches the rating history for a player by replaying Elo from confirmed matches
 * 
 * Queries all confirmed matches for the group, filters client-side for matches
 * involving the target user, sorts chronologically, and replays Elo calculation
 * to compute rating at each point in time.
 * 
 * @param groupId - The Firestore group document ID
 * @param userId - The Firestore user document ID
 * @returns Array of RatingHistoryEntry sorted by date ascending
 */
export async function getRatingHistory(
  groupId: string,
  userId: string
): Promise<RatingHistoryEntry[]> {
  // Validate inputs
  groupIdSchema.parse(groupId);
  userIdSchema.parse(userId);

  // Query confirmed matches ordered by confirmedAt ascending
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(
    matchesRef,
    where("status", "==", "confirmed"),
    orderBy("confirmedAt", "asc")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  // Filter matches involving the user and collect opponent IDs
  const playerMatchDocs = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.player1Id === userId || data.player2Id === userId;
  });

  if (playerMatchDocs.length === 0) {
    return [];
  }

  // Collect unique opponent IDs
  const opponentIds = new Set<string>();
  const userMatches: Array<{
    matchId: string;
    opponentId: string;
    isWin: boolean;
    confirmedAt: Date;
  }> = [];

  for (const matchDoc of playerMatchDocs) {
    const data = matchDoc.data();
    const opponentId =
      data.player1Id === userId ? data.player2Id : data.player1Id;
    opponentIds.add(opponentId);
    userMatches.push({
      matchId: matchDoc.id,
      opponentId,
      isWin: data.winnerId === userId,
      confirmedAt: timestampToDate(data.confirmedAt) || new Date(),
    });
  }

  // Fetch opponent's ratings from member documents
  const opponentRatings = new Map<string, number>();
  for (const oppId of opponentIds) {
    const memberRef = doc(db, `groups/${groupId}/members`, oppId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      opponentRatings.set(oppId, memberSnap.data().rating || BASE_RATING);
    } else {
      opponentRatings.set(oppId, BASE_RATING);
    }
  }

  // Replay Elo calculation chronologically
  const ratingHistory: RatingHistoryEntry[] = [];
  let currentRating = BASE_RATING;

  // Sort user matches by confirmedAt ascending to ensure chronological order
  userMatches.sort((a, b) => a.confirmedAt.getTime() - b.confirmedAt.getTime());

  for (const match of userMatches) {
    const opponentRating = opponentRatings.get(match.opponentId) || BASE_RATING;
    const expectedScore = calculateExpectedScore(currentRating, opponentRating);
    const actualScore = match.isWin ? 1 : 0;
    currentRating = calculateNewRating(currentRating, expectedScore, actualScore);

    ratingHistory.push({
      matchId: match.matchId,
      rating: currentRating,
      date: match.confirmedAt,
      opponentId: match.opponentId,
      result: match.isWin ? "win" : "loss",
    });
  }

  return ratingHistory;
}

/**
 * Fetches the head-to-head record between two players in a group
 * 
 * Queries all confirmed matches for the group, filters client-side for matches
 * between playerAId and playerBId, and computes win counts for each player.
 * 
 * @param groupId - The Firestore group document ID
 * @param playerAId - The first player's Firestore user document ID
 * @param playerBId - The second player's Firestore user document ID
 * @returns HeadToHeadRecord with win counts and match metadata
 */
export async function getHeadToHead(
  groupId: string,
  playerAId: string,
  playerBId: string
): Promise<HeadToHeadRecord> {
  // Validate inputs
  groupIdSchema.parse(groupId);
  userIdSchema.parse(playerAId);
  userIdSchema.parse(playerBId);

  // If same player, return zeros
  if (playerAId === playerBId) {
    return {
      playerAWins: 0,
      playerBWins: 0,
      totalMatches: 0,
      lastMatchDate: null,
    };
  }

  // Query confirmed matches ordered by confirmedAt descending
  const matchesRef = collection(db, `groups/${groupId}/matches`);
  const q = query(
    matchesRef,
    where("status", "==", "confirmed"),
    orderBy("confirmedAt", "desc")
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return {
      playerAWins: 0,
      playerBWins: 0,
      totalMatches: 0,
      lastMatchDate: null,
    };
  }

  // Filter matches between playerAId and playerBId
  const h2hMatches = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return (
      (data.player1Id === playerAId && data.player2Id === playerBId) ||
      (data.player1Id === playerBId && data.player2Id === playerAId)
    );
  });

  if (h2hMatches.length === 0) {
    return {
      playerAWins: 0,
      playerBWins: 0,
      totalMatches: 0,
      lastMatchDate: null,
    };
  }

  // Count wins for each player
  let playerAWins = 0;
  let playerBWins = 0;
  let lastMatchDate: Date | null = null;

  for (const matchDoc of h2hMatches) {
    const data = matchDoc.data();
    const confirmedAt = timestampToDate(data.confirmedAt);

    // Update last match date (matches are sorted desc, so first is most recent)
    if (!lastMatchDate && confirmedAt) {
      lastMatchDate = confirmedAt;
    }

    // Count wins
    if (data.winnerId === playerAId) {
      playerAWins++;
    } else if (data.winnerId === playerBId) {
      playerBWins++;
    }
  }

  return {
    playerAWins,
    playerBWins,
    totalMatches: h2hMatches.length,
    lastMatchDate,
  };
}
