const crypto = require('crypto');
const dbConnect = require('../config/db');
const { Session } = require('../models/Session');
const { User } = require('../models/User');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    await dbConnect();

    const session = await Session.findOne({ tokenHash: hashToken(token) }).lean();
    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    const user = await User.findById(session.userId).lean();
    if (!user) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
    req.sessionId = session._id.toString();
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { requireAuth, hashToken };
