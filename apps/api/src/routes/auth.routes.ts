import { Router, Request, Response } from 'express';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  xp: number;
  streak: number;
  currentSkill: string;
  joinedAt: string;
}

const users = new Map<string, UserRecord>();
const sessions = new Map<string, string>(); // token -> userId

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const newHash = hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, 'hex');
  const newHashBuffer = Buffer.from(newHash, 'hex');
  if (hashBuffer.length !== newHashBuffer.length) {
    return false;
  }
  return timingSafeEqual(hashBuffer, newHashBuffer);
}

// Seed default demo learner: Alex Mercer
const demoSalt = randomBytes(16).toString('hex');
const demoUser: UserRecord = {
  id: 'learner-1',
  name: 'Alex Mercer',
  email: 'alex@upwise.learn',
  passwordHash: hashPassword('password123', demoSalt),
  salt: demoSalt,
  level: 'Beginner',
  xp: 450,
  streak: 3,
  currentSkill: 'Full-Stack Web Development',
  joinedAt: '2026-03-01T00:00:00.000Z',
};
users.set(demoUser.email.toLowerCase(), demoUser);

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
    });
    return;
  }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Valid email is required' },
    });
    return;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password must be at least 6 characters',
      },
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (users.has(normalizedEmail)) {
    res.status(409).json({
      success: false,
      error: {
        code: 'USER_EXISTS',
        message: 'An account with this email already exists',
      },
    });
    return;
  }

  const salt = randomBytes(16).toString('hex');
  const newUser: UserRecord = {
    id: `learner-${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password, salt),
    salt,
    level: 'Beginner',
    xp: 100,
    streak: 1,
    currentSkill: 'Full-Stack Web Development',
    joinedAt: new Date().toISOString(),
  };

  users.set(normalizedEmail, newUser);

  const token = `upwise-token-${randomBytes(24).toString('hex')}`;
  sessions.set(token, newUser.id);

  const { passwordHash: _, salt: __, ...sanitizedUser } = newUser;
  res.status(201).json({
    success: true,
    data: {
      user: sanitizedUser,
      token,
    },
  });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Email and password are required',
      },
    });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = users.get(normalizedEmail);

  if (!user || !verifyPassword(String(password), user.passwordHash, user.salt)) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      },
    });
    return;
  }

  const token = `upwise-token-${randomBytes(24).toString('hex')}`;
  sessions.set(token, user.id);

  const { passwordHash: _, salt: __, ...sanitizedUser } = user;
  res.status(200).json({
    success: true,
    data: {
      user: sanitizedUser,
      token,
    },
  });
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    sessions.delete(token);
  }
  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

// GET /api/auth/me
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let userId: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    userId = sessions.get(token);
  }

  if (!userId) {
    // If no active session header, return default demo learner
    const { passwordHash: _, salt: __, ...sanitizedDemo } = demoUser;
    res.status(200).json({
      success: true,
      data: sanitizedDemo,
    });
    return;
  }

  let foundUser: UserRecord | undefined;
  for (const u of users.values()) {
    if (u.id === userId) {
      foundUser = u;
      break;
    }
  }

  if (!foundUser) {
    res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
    return;
  }

  const { passwordHash: _, salt: __, ...sanitized } = foundUser;
  res.status(200).json({
    success: true,
    data: sanitized,
  });
});

export const authRoutes = router;
