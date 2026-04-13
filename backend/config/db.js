const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'expense-tracker.db');

let db;

function initializeDatabase(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL NOT NULL CHECK (amount >= 0),
      category TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(date DESC, category);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);

  const expenseColumns = database.prepare(`PRAGMA table_info(expenses)`).all();
  const hasUserIdColumn = expenseColumns.some((column) => column.name === 'user_id');

  if (!hasUserIdColumn) {
    database.exec(`ALTER TABLE expenses ADD COLUMN user_id TEXT`);
  }

  database.exec(`CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date DESC)`);
}

async function dbConnect() {
  if (db) {
    return db;
  }

  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
  db = new DatabaseSync(DATABASE_PATH);
  initializeDatabase(db);
  console.log(`SQLite Connected: ${DATABASE_PATH}`);
  return db;
}

module.exports = dbConnect;
