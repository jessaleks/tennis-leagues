import { describe, it, expect } from 'vitest';
import {
  calculateExpectedScore,
  calculateNewRating,
  updateRatings,
  getInitialRating,
  formatRatingChange,
  BASE_RATING,
  K_FACTOR,
} from '../../src/services/elo';

describe('Elo Service', () => {
  describe('BASE_RATING', () => {
    it('should be 1500', () => {
      expect(BASE_RATING).toBe(1500);
    });
  });

  describe('K_FACTOR', () => {
    it('should be 32 for MVP', () => {
      expect(K_FACTOR).toBe(32);
    });
  });

  describe('calculateExpectedScore', () => {
    it('should return 0.5 when both players have same rating', () => {
      const result = calculateExpectedScore(1500, 1500);
      expect(result).toBe(0.5);
    });

    it('should return ~0.76 when player is 200 points higher', () => {
      const result = calculateExpectedScore(1700, 1500);
      // E = 1 / (1 + 10^((1500-1700)/400)) = 1 / (1 + 10^(-0.5)) ≈ 0.76
      expect(result).toBeCloseTo(0.76, 2);
    });

    it('should return ~0.24 when player is 200 points lower', () => {
      const result = calculateExpectedScore(1300, 1500);
      // E = 1 / (1 + 10^((1500-1300)/400)) = 1 / (1 + 10^(0.5)) ≈ 0.24
      expect(result).toBeCloseTo(0.24, 2);
    });

    it('should return ~0.91 when player is 400 points higher', () => {
      const result = calculateExpectedScore(1900, 1500);
      // E = 1 / (1 + 10^((1500-1900)/400)) = 1 / (1 + 10^(-1)) ≈ 0.91
      expect(result).toBeCloseTo(0.91, 1);
    });

    it('should return ~0.91 when player is 400 points lower (upset)', () => {
      const result = calculateExpectedScore(1100, 1500);
      expect(result).toBeCloseTo(0.09, 1);
    });
  });

  describe('calculateNewRating', () => {
    it('should use K_FACTOR of 32', () => {
      // Win against equal opponent
      const expected = calculateExpectedScore(1500, 1500); // 0.5
      const newRating = calculateNewRating(1500, expected, 1);
      // R_new = 1500 + 32 * (1 - 0.5) = 1500 + 16 = 1516
      expect(newRating).toBe(1516);
    });

    it('should give ~16 points for beating equal opponent', () => {
      const expected = calculateExpectedScore(1500, 1500);
      const newRating = calculateNewRating(1500, expected, 1);
      expect(newRating - 1500).toBe(16);
    });

    it('should lose ~16 points for losing to equal opponent', () => {
      const expected = calculateExpectedScore(1500, 1500);
      const newRating = calculateNewRating(1500, expected, 0);
      expect(1500 - newRating).toBe(16);
    });

    it('should give fewer points for expected win (upset scenario)', () => {
      // Lower rated player wins (upset)
      const expected = calculateExpectedScore(1300, 1500); // ~0.24
      const newRating = calculateNewRating(1300, expected, 1);
      // Big win: 1300 + 32 * (1 - 0.24) ≈ 1300 + 24 = 1324
      expect(newRating - 1300).toBeGreaterThan(20);
    });

    it('should give more points for unexpected win (upset for opponent)', () => {
      // Higher rated player expected to win
      const expected = calculateExpectedScore(1500, 1300);
      const newRating = calculateNewRating(1500, expected, 1);
      // Small win: 1500 + 32 * (1 - 0.76) ≈ 1500 + 8 = 1508
      expect(newRating - 1500).toBeLessThan(10);
    });

    it('should round to nearest integer', () => {
      const expected = calculateExpectedScore(1500, 1500);
      const newRating = calculateNewRating(1500, expected, 1);
      expect(Number.isInteger(newRating)).toBe(true);
    });
  });

  describe('updateRatings', () => {
    it('should update both players correctly when winner wins', () => {
      const result = updateRatings(1500, 1500);
      
      // Winner gains ~16, loser loses ~16
      expect(result.winnerNewRating).toBe(1516);
      expect(result.loserNewRating).toBe(1484);
      expect(result.winnerRatingChange).toBe(16);
      expect(result.loserRatingChange).toBe(-16);
    });

    it('should result in rating convergence', () => {
      // After many matches, ratings should converge toward true skill
      let winnerRating = 1500;
      let loserRating = 1500;
      
      // Simulate 10 matches where same player wins
      for (let i = 0; i < 10; i++) {
        const result = updateRatings(winnerRating, loserRating);
        winnerRating = result.winnerNewRating;
        loserRating = result.loserNewRating;
      }
      
      // Winner should be significantly higher
      expect(winnerRating).toBeGreaterThan(1600);
      expect(loserRating).toBeLessThan(1400);
    });

    it('should handle upset correctly', () => {
      // Lower rated player wins
      const result = updateRatings(1300, 1500);
      
      // Lower rated gets big boost (about +24 points)
      expect(result.winnerRatingChange).toBeGreaterThan(20);
      // Higher rated loses about 24 points
      expect(result.loserRatingChange).toBeLessThan(0);
    });

    it('should preserve total rating points (approximately)', () => {
      const winnerRating = 1500;
      const loserRating = 1500;
      const result = updateRatings(winnerRating, loserRating);
      
      const totalBefore = winnerRating + loserRating;
      const totalAfter = result.winnerNewRating + result.loserNewRating;
      
      // Total should be preserved (except for rounding)
      expect(totalBefore).toBe(totalAfter);
    });

    it('should handle high rating wins', () => {
      // Winner already very high rated
      const result = updateRatings(2400, 1500);
      
      // Winner gains few points (expected win against lower rated)
      expect(result.winnerRatingChange).toBeLessThan(5);
      expect(result.winnerNewRating).toBeGreaterThanOrEqual(2400);
    });

    it('should handle upset where lower rated wins', () => {
      // Lower rated player wins - this is the upset case
      const result = updateRatings(1300, 1500);
      
      // Lower rated gets big boost
      expect(result.winnerRatingChange).toBeGreaterThan(15);
      // Higher rated loses
      expect(result.loserRatingChange).toBeLessThan(0);
    });
  });

  describe('getInitialRating', () => {
    it('should return BASE_RATING', () => {
      expect(getInitialRating()).toBe(BASE_RATING);
      expect(getInitialRating()).toBe(1500);
    });
  });

  describe('formatRatingChange', () => {
    it('should prefix positive changes with +', () => {
      expect(formatRatingChange(16)).toBe('+16');
    });

    it('should not modify negative changes', () => {
      expect(formatRatingChange(-16)).toBe('-16');
    });

    it('should handle zero', () => {
      expect(formatRatingChange(0)).toBe('+0');
    });

    it('should handle large numbers', () => {
      expect(formatRatingChange(100)).toBe('+100');
      expect(formatRatingChange(-100)).toBe('-100');
    });
  });
});
