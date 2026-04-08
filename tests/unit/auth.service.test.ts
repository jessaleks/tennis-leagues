import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Inline schemas matching src/services/auth.ts (avoid Firebase import)
const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_\s]+$/, 'Display name can only contain letters, numbers, spaces, and underscores'),
});

const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

describe('Auth Service - Validation Schemas', () => {
  describe('SignUpSchema', () => {
    it('should accept valid signup input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'Password123',
        displayName: 'Test User',
      };
      const result = SignUpSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    describe('email validation', () => {
      it('should reject invalid email', () => {
        const invalidEmails = [
          'notanemail',
          'missing@domain',
          '@nodomain.com',
          'spaces in@email.com',
          '',
        ];
        invalidEmails.forEach(email => {
          const result = SignUpSchema.safeParse({
            email,
            password: 'Password123',
            displayName: 'Test User',
          });
          expect(result.success).toBe(false);
        });
      });

      it('should accept valid email formats', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'user+tag@example.com',
        ];
        validEmails.forEach(email => {
          const result = SignUpSchema.safeParse({
            email,
            password: 'Password123',
            displayName: 'Test User',
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('password validation', () => {
      it('should reject password less than 8 characters', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Pass1',
          displayName: 'Test User',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 8 characters');
        }
      });

      it('should reject password without uppercase', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('uppercase');
        }
      });

      it('should reject password without lowercase', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'PASSWORD123',
          displayName: 'Test User',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('lowercase');
        }
      });

      it('should reject password without number', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'PasswordOnly',
          displayName: 'Test User',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('number');
        }
      });

      it('should accept password meeting all requirements', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'SecurePass1',
          displayName: 'Test User',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('displayName validation', () => {
      it('should reject displayName less than 2 characters', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'A',
        });
        expect(result.success).toBe(false);
      });

      it('should reject displayName more than 50 characters', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'A'.repeat(51),
        });
        expect(result.success).toBe(false);
      });

      it('should reject displayName with special characters', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'Test@User!',
        });
        expect(result.success).toBe(false);
      });

      it('should accept displayName with underscores', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'Test_User',
        });
        expect(result.success).toBe(true);
      });

      it('should accept displayName with spaces', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'Test User Name',
        });
        expect(result.success).toBe(true);
      });

      it('should accept displayName with numbers', () => {
        const result = SignUpSchema.safeParse({
          email: 'test@example.com',
          password: 'Password123',
          displayName: 'User123',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('SignInSchema', () => {
    it('should accept valid signin input', () => {
      const validInput = {
        email: 'test@example.com',
        password: 'anypassword',
      };
      const result = SignInSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = SignInSchema.safeParse({
        email: 'notanemail',
        password: 'anypassword',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = SignInSchema.safeParse({
        email: '',
        password: 'anypassword',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const result = SignInSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('required');
      }
    });
  });
});
