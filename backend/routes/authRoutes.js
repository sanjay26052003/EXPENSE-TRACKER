const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const dbConnect = require('../config/db');
const { requireAuth, hashToken } = require('../middleware/auth');

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, passwordHash) {
  const [salt, expectedHash] = passwordHash.split(':');
  if (!salt || !expectedHash) {
    return false;
  }

  const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

function createSession(db, userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS).toISOString();

  db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    userId,
    hashToken(rawToken),
    now.toISOString(),
    expiresAt
  );

  return rawToken;
}

router.post('/register', async (req, res) => {
  try {
    const db = await dbConnect();
    const email = String(req.body.email || '').trim().toLowerCase();
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');

    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email is already registered' });
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      name,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.email, user.name, user.passwordHash, user.createdAt);

    const token = createSession(db, user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const db = await dbConnect();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = createSession(db, user.id);

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    const db = await dbConnect();
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.sessionId);
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
