/**
 * Elo Rating System Service
 * 
 * Implements the standard Elo rating formula for match ranking.
 * Used for rating players within tennis league groups.
 * 
 * Formula:
 * - Expected Score: E = 1 / (1 + 10^((opponentRating - yourRating) / 400))
 * - New Rating: R_new = R_old + K * (ActualScore - ExpectedScore)
 * 
 * Where:
 * - K = 32 (fixed K-factor for MVP)
 * - Base Rating = 1500
 * - ActualScore: 1 for win, 0 for loss
 */

// ============================================================================
// Constants
// ============================================================================

/** Default rating for new players */
export const BASE_RATING = 1500;

/** K-factor determines how much ratings change per match */
export const K_FACTOR = 32;

// ============================================================================
// Types
// ============================================================================

/** Result of rating update after a match */
export interface RatingUpdate {
  winnerNewRating: number;
  loserNewRating: number;
  winnerRatingChange: number;
  loserRatingChange: number;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Calculates the expected score for player A against player B
 * 
 * @param ratingA - Player A's current rating
 * @param ratingB - Player B's current rating
 * @returns Expected score for player A (between 0 and 1)
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates the new rating for a player after a match
 * 
 * @param currentRating - Player's current rating
 * @param expectedScore - Expected score based on ratings (from calculateExpectedScore)
 * @param actualScore - Actual result: 1 for win, 0 for loss
 * @returns New rating after the match
 */
export function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number
): number {
  return Math.round(currentRating + K_FACTOR * (actualScore - expectedScore));
}

/**
 * Updates both players' ratings after a match
 * 
 * @param winnerRating - Winner's current rating
 * @param loserRating - Loser's current rating
 * @returns Object containing both new ratings and rating changes
 */
export function updateRatings(winnerRating: number, loserRating: number): RatingUpdate {
  // Calculate expected scores
  const winnerExpectedScore = calculateExpectedScore(winnerRating, loserRating);
  const loserExpectedScore = calculateExpectedScore(loserRating, winnerRating);
  
  // Calculate new ratings (winner's actualScore = 1, loser's actualScore = 0)
  const winnerNewRating = calculateNewRating(winnerRating, winnerExpectedScore, 1);
  const loserNewRating = calculateNewRating(loserRating, loserExpectedScore, 0);
  
  // Calculate rating changes
  const winnerRatingChange = winnerNewRating - winnerRating;
  const loserRatingChange = loserNewRating - loserRating;
  
  return {
    winnerNewRating,
    loserNewRating,
    winnerRatingChange,
    loserRatingChange,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets the initial rating for a new player
 * 
 * @returns The base rating for new players
 */
export function getInitialRating(): number {
  return BASE_RATING;
}

/**
 * Formats a rating change for display
 * 
 * @param change - The rating change (positive or negative)
 * @returns Formatted string like "+16" or "-12"
 */
export function formatRatingChange(change: number): string {
  return change >= 0 ? `+${change}` : `${change}`;
}
