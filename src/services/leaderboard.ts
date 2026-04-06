import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getUserProfile, type UserProfile } from "./users";

// ============================================================================
// Types
// ============================================================================

export type TrendDirection = "up" | "down" | "stable";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  trend: TrendDirection;
  isInactive: boolean;
  lastMatchAt: Date | null;
}

// Historical rating entry for trend calculation
interface RatingHistoryEntry {
  rating: number;
  recordedAt: Date;
}

// ============================================================================
// Constants
// ============================================================================

const INACTIVE_DAYS_THRESHOLD = 30;
const TREND_CHANGE_THRESHOLD = 0; // Any change triggers up/down

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
 * Determines if a player is inactive based on last match date
 * A player is inactive if they haven't played a match in 30+ days
 */
export function isInactive(lastMatchAt: Date | null): boolean {
  if (!lastMatchAt) {
    return true; // No matches ever = inactive
  }

  const now = new Date();
  const daysSinceLastMatch = Math.floor(
    (now.getTime() - lastMatchAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceLastMatch >= INACTIVE_DAYS_THRESHOLD;
}

/**
 * Calculates the trend direction based on rating history
 * Compares current rating to rating from 30 days ago
 */
export async function calculateTrend(
  groupId: string,
  userId: string
): Promise<TrendDirection> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get current rating
  const memberRef = doc(db, `groups/${groupId}/members`, userId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    return "stable";
  }

  const memberData = memberSnap.data();
  const currentRating = memberData.rating || 1500;

  // Try to get historical rating from rating history collection
  const historyRef = collection(db, `groups/${groupId}/members/${userId}/ratingHistory`);
  const historyQuery = query(
    historyRef,
    where("recordedAt", "<=", thirtyDaysAgo),
    orderBy("recordedAt", "desc"),
    // Firestore limitation: can't order by field not in where clause with inequality
    // So we'll fetch recent and filter client-side
  );

  try {
    const historySnapshot = await getDocs(historyQuery);
    
    // If no history, check if player has any recent matches
    if (historySnapshot.empty) {
      // If player has lastMatchAt within 30 days, compare to initial rating
      if (memberData.lastMatchAt) {
        const lastMatch = timestampToDate(memberData.lastMatchAt);
        if (lastMatch && lastMatch >= thirtyDaysAgo) {
          // Player is active recently but no history - assume stable
          return "stable";
        }
      }
      // No historical data available - assume stable
      return "stable";
    }

    // Get the most recent historical rating
    const historyDoc = historySnapshot.docs[0];
    const historyData = historyDoc.data();
    const historicalRating = historyData.rating || 1500;

    // Compare ratings
    const ratingDiff = currentRating - historicalRating;

    if (ratingDiff > TREND_CHANGE_THRESHOLD) {
      return "up";
    } else if (ratingDiff < -TREND_CHANGE_THRESHOLD) {
      return "down";
    }
    return "stable";
  } catch (error) {
    // If query fails (e.g., missing index), fall back to stable
    console.warn("Failed to calculate trend:", error);
    return "stable";
  }
}

/**
 * Gets the rank position of a user in the leaderboard
 */
export async function getPlayerRank(
  groupId: string,
  userId: string
): Promise<number> {
  const members = await getGroupMembersWithStats(groupId);
  
  // Sort by rating descending
  const sorted = [...members].sort((a, b) => b.rating - a.rating);
  
  // Find the user
  const rankIndex = sorted.findIndex((entry) => entry.userId === userId);
  
  return rankIndex >= 0 ? rankIndex + 1 : 0;
}

/**
 * Fetches members with their stats, sorted by rating
 * This is the main function to get leaderboard data
 */
export async function getLeaderboard(groupId: string): Promise<LeaderboardEntry[]> {
  // Get all members with their stats
  const membersWithStats = await getGroupMembersWithStats(groupId);

  // Sort by rating descending
  const sortedMembers = [...membersWithStats].sort((a, b) => b.rating - a.rating);

  // Build leaderboard entries with rank
  const leaderboard: LeaderboardEntry[] = await Promise.all(
    sortedMembers.map(async (member, index) => {
      // Calculate trend for each member
      const trend = await calculateTrend(groupId, member.userId);

      return {
        rank: index + 1,
        userId: member.userId,
        displayName: member.displayName,
        rating: member.rating,
        wins: member.wins,
        losses: member.losses,
        trend,
        isInactive: isInactive(member.lastMatchAt),
        lastMatchAt: member.lastMatchAt,
      };
    })
  );

  return leaderboard;
}

// ============================================================================
// Internal Helper Functions
// ============================================================================

interface MemberWithStats {
  userId: string;
  displayName: string;
  rating: number;
  wins: number;
  losses: number;
  lastMatchAt: Date | null;
}

/**
 * Fetches all members with their stats and display names
 */
async function getGroupMembersWithStats(groupId: string): Promise<MemberWithStats[]> {
  // Get all member documents
  const membersRef = collection(db, `groups/${groupId}/members`);
  const snapshot = await getDocs(membersRef);

  if (snapshot.empty) {
    return [];
  }

  // Get all member IDs
  const memberIds = snapshot.docs.map((doc) => doc.id);

  // Fetch all user profiles in parallel
  const userProfiles = await getUserProfiles(memberIds);

  // Map member data with user profiles
  const membersWithStats: MemberWithStats[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    const profile = userProfiles.get(doc.id);

    return {
      userId: doc.id,
      displayName: profile?.displayName || "Unknown Player",
      rating: data.rating || 1500,
      wins: data.wins || 0,
      losses: data.losses || 0,
      lastMatchAt: data.lastMatchAt ? timestampToDate(data.lastMatchAt) : null,
    };
  });

  return membersWithStats;
}

/**
 * Gets a single leaderboard entry for a specific user
 */
export async function getLeaderboardEntry(
  groupId: string,
  userId: string
): Promise<LeaderboardEntry | null> {
  const leaderboard = await getLeaderboard(groupId);
  return leaderboard.find((entry) => entry.userId === userId) || null;
}
