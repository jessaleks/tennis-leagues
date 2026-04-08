import { http, HttpResponse } from 'msw';

// Mock user data
let mockUser: Record<string, unknown> | null = null;
let mockUsers: Map<string, { email: string; password: string; displayName: string }> = new Map();

// Helper to generate Firebase-style error responses
function firebaseError(code: string, message: string) {
  return {
    error: {
      code: 400,
      message,
      errors: [
        {
          message,
          domain: 'global',
          reason: 'invalid argument',
        },
      ],
    },
  };
}

// Reset mock state between tests
export function resetMockAuth() {
  mockUser = null;
  mockUsers.clear();
}

export const handlers = [
  // Sign up with email/password
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signUp', async ({ request }) => {
    const body = await request.json() as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!body.email || !body.password) {
      return HttpResponse.json(firebaseError('auth/invalid-email', 'Invalid email'), { status: 400 });
    }

    if (body.password.length < 6) {
      return HttpResponse.json(firebaseError('auth/weak-password', 'Password should be at least 6 characters'), { status: 400 });
    }

    if (mockUsers.has(body.email)) {
      return HttpResponse.json(firebaseError('auth/email-already-in-use', 'Email already in use'), { status: 400 });
    }

    const user = {
      localId: `user_${Date.now()}`,
      email: body.email,
      displayName: body.displayName || body.email.split('@')[0],
      idToken: `id_token_${Date.now()}`,
      refreshToken: `refresh_token_${Date.now()}`,
      expiresIn: '3600',
    };

    mockUsers.set(body.email, {
      email: body.email,
      password: body.password,
      displayName: user.displayName,
    });

    mockUser = user;

    return HttpResponse.json(user);
  }),

  // Sign in with email/password
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', async ({ request }) => {
    const body = await request.json() as {
      email?: string;
      password?: string;
    };

    if (!body.email || !body.password) {
      return HttpResponse.json(firebaseError('auth/invalid-email', 'Invalid email'), { status: 400 });
    }

    const storedUser = mockUsers.get(body.email);
    if (!storedUser || storedUser.password !== body.password) {
      return HttpResponse.json(firebaseError('auth/wrong-password', 'Invalid credentials'), { status: 400 });
    }

    mockUser = {
      localId: `user_${Date.now()}`,
      email: storedUser.email,
      displayName: storedUser.displayName,
      idToken: `id_token_${Date.now()}`,
      refreshToken: `refresh_token_${Date.now()}`,
      expiresIn: '3600',
    };

    return HttpResponse.json(mockUser);
  }),

  // Get account info (by idToken)
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:lookup', async ({ request }) => {
    const body = await request.json() as { idToken?: string };

    if (!body.idToken || !mockUser) {
      return HttpResponse.json({ users: [] });
    }

    return HttpResponse.json({
      users: [
        {
          localId: mockUser.localId,
          email: mockUser.email,
          displayName: mockUser.displayName,
          emailVerified: true,
        },
      ],
    });
  }),

  // Sign out (no-op for local state)
  http.post('https://identitytoolkit.googleapis.com/v1/accounts:signOut', () => {
    mockUser = null;
    return HttpResponse.json({});
  }),

  // Refresh token
  http.post('https://securetoken.googleapis.com/v1/token', () => {
    return HttpResponse.json({
      access_token: `access_token_${Date.now()}`,
      expires_in: '3600',
      token_type: 'Bearer',
      refresh_token: `refresh_token_${Date.now()}`,
    });
  }),
];