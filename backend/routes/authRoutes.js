const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const dbConnect = require('../config/db');
const { requireAuth, hashToken } = require('../middleware/auth');
const { Session } = require('../models/Session');
const { User } = require('../models/User');

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
    id: user._id.toString(),
    email: user.email,
    name: user.name,
  };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await Session.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  return token;
}

router.post('/register', async (req, res) => {
  try {
    await dbConnect();

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

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email is already registered' });
    }

    const user = await User.create({
      email,
      name,
      passwordHash: hashPassword(password),
    });

    const token = await createSession(user._id);

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
    await dbConnect();

    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = await createSession(user._id);

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
    await dbConnect();
    await Session.deleteOne({ _id: req.sessionId });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
