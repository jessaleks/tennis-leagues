import { describe, it, expect } from 'vitest';

describe('Leaderboard Logic', () => {
  describe('Sorting', () => {
    interface Player {
      id: string;
      rating: number;
      wins: number;
      losses: number;
    }

    const sortByRatingDescending = (players: Player[]): Player[] => {
      return [...players].sort((a, b) => b.rating - a.rating);
    };

    it('should sort players by rating in descending order', () => {
      const players: Player[] = [
        { id: '1', rating: 1500, wins: 5, losses: 2 },
        { id: '2', rating: 1600, wins: 10, losses: 3 },
        { id: '3', rating: 1400, wins: 3, losses: 5 },
      ];

      const sorted = sortByRatingDescending(players);

      expect(sorted[0].id).toBe('2'); // 1600
      expect(sorted[1].id).toBe('1'); // 1500
      expect(sorted[2].id).toBe('3'); // 1400
    });

    it('should handle empty list', () => {
      const sorted = sortByRatingDescending([]);
      expect(sorted).toEqual([]);
    });

    it('should handle single player', () => {
      const players: Player[] = [{ id: '1', rating: 1500, wins: 5, losses: 2 }];
      const sorted = sortByRatingDescending(players);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].id).toBe('1');
    });
  });

  describe('Win-Loss Calculation', () => {
    it('should calculate win percentage correctly', () => {
      const calculateWinPercent = (wins: number, losses: number): number => {
        const total = wins + losses;
        if (total === 0) return 0;
        return Math.round((wins / total) * 100);
      };

      expect(calculateWinPercent(7, 3)).toBe(70);
      expect(calculateWinPercent(3, 7)).toBe(30);
      expect(calculateWinPercent(0, 0)).toBe(0);
      expect(calculateWinPercent(5, 5)).toBe(50);
    });

    it('should calculate total games played', () => {
      const getTotalGames = (wins: number, losses: number): number => wins + losses;

      expect(getTotalGames(10, 5)).toBe(15);
      expect(getTotalGames(0, 0)).toBe(0);
      expect(getTotalGames(1, 0)).toBe(1);
    });
  });

  describe('Trend Indicator Logic', () => {
    type Trend = 'up' | 'down' | 'stable';

    const getTrend = (currentRating: number, previousRating: number): Trend => {
      const diff = currentRating - previousRating;
      if (diff > 10) return 'up';
      if (diff < -10) return 'down';
      return 'stable';
    };

    it('should show "up" when rating increased by more than 10', () => {
      expect(getTrend(1520, 1500)).toBe('up');
      expect(getTrend(1600, 1580)).toBe('up');
    });

    it('should show "down" when rating decreased by more than 10', () => {
      expect(getTrend(1480, 1500)).toBe('down');
      expect(getTrend(1400, 1420)).toBe('down');
    });

    it('should show "stable" when rating changed by 10 or less', () => {
      expect(getTrend(1510, 1500)).toBe('stable');
      expect(getTrend(1490, 1500)).toBe('stable');
      expect(getTrend(1500, 1500)).toBe('stable');
    });
  });

  describe('Leaderboard Entry Generation', () => {
    interface LeaderboardEntry {
      rank: number;
      playerId: string;
      displayName: string;
      rating: number;
      wins: number;
      losses: number;
      winPercent: number;
      trend: 'up' | 'down' | 'stable';
    }

    const generateLeaderboard = (
      players: Array<{ id: string; displayName: string; rating: number; wins: number; losses: number; previousRating: number }>
    ): LeaderboardEntry[] => {
      const sorted = [...players].sort((a, b) => b.rating - a.rating);

      return sorted.map((player, index) => {
        const total = player.wins + player.losses;
        const winPercent = total > 0 ? Math.round((player.wins / total) * 100) : 0;
        const diff = player.rating - player.previousRating;
        const trend: 'up' | 'down' | 'stable' = diff > 10 ? 'up' : diff < -10 ? 'down' : 'stable';

        return {
          rank: index + 1,
          playerId: player.id,
          displayName: player.displayName,
          rating: player.rating,
          wins: player.wins,
          losses: player.losses,
          winPercent,
          trend,
        };
      });
    };

    it('should generate correct leaderboard with ranks', () => {
      const players = [
        { id: '1', displayName: 'Alice', rating: 1500, wins: 5, losses: 2, previousRating: 1490 },
        { id: '2', displayName: 'Bob', rating: 1600, wins: 10, losses: 3, previousRating: 1550 },
        { id: '3', displayName: 'Charlie', rating: 1400, wins: 3, losses: 5, previousRating: 1420 },
      ];

      const leaderboard = generateLeaderboard(players);

      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[0].displayName).toBe('Bob');
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[1].displayName).toBe('Alice');
      expect(leaderboard[2].rank).toBe(3);
      expect(leaderboard[2].displayName).toBe('Charlie');
    });

    it('should calculate win percentages correctly', () => {
      const players = [
        { id: '1', displayName: 'Alice', rating: 1500, wins: 7, losses: 3, previousRating: 1500 },
      ];

      const leaderboard = generateLeaderboard(players);

      expect(leaderboard[0].winPercent).toBe(70);
    });

    it('should calculate trends correctly', () => {
      const players = [
        { id: '1', displayName: 'Rising', rating: 1520, wins: 5, losses: 2, previousRating: 1500 },
        { id: '2', displayName: 'Falling', rating: 1480, wins: 5, losses: 2, previousRating: 1500 },
        { id: '3', displayName: 'Stable', rating: 1505, wins: 5, losses: 2, previousRating: 1500 },
      ];

      const leaderboard = generateLeaderboard(players);

      expect(leaderboard.find(e => e.displayName === 'Rising')?.trend).toBe('up');
      expect(leaderboard.find(e => e.displayName === 'Falling')?.trend).toBe('down');
      expect(leaderboard.find(e => e.displayName === 'Stable')?.trend).toBe('stable');
    });
  });
});