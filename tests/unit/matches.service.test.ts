import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Inline schemas matching src/services/matches.ts (avoid Firebase import)
const SubmitMatchSchema = z.object({
  groupId: z.string().min(1, 'Group ID is required'),
  player1Id: z.string().min(1, 'Player 1 ID is required'),
  player2Id: z.string().min(1, 'Player 2 ID is required'),
  winnerId: z.string().min(1, 'Winner ID is required'),
  scores: z.array(z.string()).optional(),
  submittedBy: z.string().min(1, 'Submitter ID is required'),
});

const ConfirmMatchSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  groupId: z.string().min(1, 'Group ID is required'),
  confirmedBy: z.string().min(1, 'Confirmer ID is required'),
});

const RejectMatchSchema = z.object({
  matchId: z.string().min(1, 'Match ID is required'),
  groupId: z.string().min(1, 'Group ID is required'),
  rejectedBy: z.string().min(1, 'Rejecter ID is required'),
  reason: z.string().max(500, 'Reason must be less than 500 characters').optional(),
});

describe('Matches Service - Validation Schemas', () => {
  describe('SubmitMatchSchema', () => {
    it('should accept valid match submission', () => {
      const validInput = {
        groupId: 'group123',
        player1Id: 'player1',
        player2Id: 'player2',
        winnerId: 'player1',
        submittedBy: 'player1',
      };
      const result = SubmitMatchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept valid match submission with scores', () => {
      const validInput = {
        groupId: 'group123',
        player1Id: 'player1',
        player2Id: 'player2',
        winnerId: 'player1',
        scores: ['6-3', '4-6', '7-5'],
        submittedBy: 'player1',
      };
      const result = SubmitMatchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    describe('required field validation', () => {
      it('should reject empty groupId', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: '',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: 'player1',
          submittedBy: 'player1',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty player1Id', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: '',
          player2Id: 'player2',
          winnerId: 'player1',
          submittedBy: 'player1',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty player2Id', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: '',
          winnerId: 'player1',
          submittedBy: 'player1',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty winnerId', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: '',
          submittedBy: 'player1',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty submittedBy', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: 'player1',
          submittedBy: '',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('winnerId validation', () => {
      it('should accept winnerId matching player1Id', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: 'player1',
          submittedBy: 'player1',
        });
        expect(result.success).toBe(true);
      });

      it('should accept winnerId matching player2Id', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: 'player2',
          submittedBy: 'player1',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('scores validation', () => {
      it('should accept empty scores array', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: 'player1',
          scores: [],
          submittedBy: 'player1',
        });
        expect(result.success).toBe(true);
      });

      it('should accept string array for scores', () => {
        const result = SubmitMatchSchema.safeParse({
          groupId: 'group123',
          player1Id: 'player1',
          player2Id: 'player2',
          winnerId: 'player1',
          scores: ['6-3', '6-4', '6-2'],
          submittedBy: 'player1',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('ConfirmMatchSchema', () => {
    it('should accept valid confirmation', () => {
      const validInput = {
        matchId: 'match123',
        groupId: 'group123',
        confirmedBy: 'player2',
      };
      const result = ConfirmMatchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty matchId', () => {
      const result = ConfirmMatchSchema.safeParse({
        matchId: '',
        groupId: 'group123',
        confirmedBy: 'player2',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty groupId', () => {
      const result = ConfirmMatchSchema.safeParse({
        matchId: 'match123',
        groupId: '',
        confirmedBy: 'player2',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty confirmedBy', () => {
      const result = ConfirmMatchSchema.safeParse({
        matchId: 'match123',
        groupId: 'group123',
        confirmedBy: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RejectMatchSchema', () => {
    it('should accept valid rejection without reason', () => {
      const validInput = {
        matchId: 'match123',
        groupId: 'group123',
        rejectedBy: 'player2',
      };
      const result = RejectMatchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should accept valid rejection with reason', () => {
      const validInput = {
        matchId: 'match123',
        groupId: 'group123',
        rejectedBy: 'player2',
        reason: 'The score was entered incorrectly',
      };
      const result = RejectMatchSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject empty matchId', () => {
      const result = RejectMatchSchema.safeParse({
        matchId: '',
        groupId: 'group123',
        rejectedBy: 'player2',
      });
      expect(result.success).toBe(false);
    });

    it('should reject reason over 500 characters', () => {
      const result = RejectMatchSchema.safeParse({
        matchId: 'match123',
        groupId: 'group123',
        rejectedBy: 'player2',
        reason: 'A'.repeat(501),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('500 characters');
      }
    });

    it('should accept reason at exactly 500 characters', () => {
      const result = RejectMatchSchema.safeParse({
        matchId: 'match123',
        groupId: 'group123',
        rejectedBy: 'player2',
        reason: 'A'.repeat(500),
      });
      expect(result.success).toBe(true);
    });
  });
});
