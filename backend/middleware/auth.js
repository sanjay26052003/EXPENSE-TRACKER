const crypto = require('crypto');
const dbConnect = require('../config/db');

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

    const db = await dbConnect();
    const tokenHash = hashToken(token);
    const session = db.prepare(`
      SELECT sessions.id, sessions.user_id, sessions.expires_at, users.email, users.name
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `).get(tokenHash);

    if (!session) {
      return res.status(401).json({ success: false, error: 'Invalid session' });
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(session.id);
      return res.status(401).json({ success: false, error: 'Session expired' });
    }

    req.user = {
      id: session.user_id,
      email: session.email,
      name: session.name,
    };

    req.sessionId = session.id;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { requireAuth, hashToken };
