const crypto = require('crypto');

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Education',
  'Other',
];

function formatExpense(row) {
  if (!row) {
    return null;
  }

  return {
    _id: row.id,
    amount: row.amount,
    category: row.category,
    description: row.description || '',
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseMonth(month) {
  if (!month) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) {
    throw new Error('Month must be in YYYY-MM format');
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error('Month must be in YYYY-MM format');
  }

  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return { start: start.toISOString(), end: end.toISOString() };
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  return date.toISOString();
}

function validateExpenseInput(input) {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (!input.category || !EXPENSE_CATEGORIES.includes(input.category)) {
    throw new Error('Invalid category');
  }

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length > 200) {
    throw new Error('Description cannot exceed 200 characters');
  }

  return {
    amount,
    category: input.category,
    description,
    date: normalizeDate(input.date),
  };
}

function buildExpenseFilter(month) {
  const monthRange = parseMonth(month);
  if (!monthRange) {
    return { clause: '', params: {} };
  }

  return {
    clause: 'WHERE date BETWEEN $start AND $end',
    params: {
      $start: monthRange.start,
      $end: monthRange.end,
    },
  };
}

function listExpenses(db, options = {}) {
  if (!options.userId) {
    throw new Error('User is required');
  }

  const { clause, params } = buildExpenseFilter(options.month);
  const rows = db
    .prepare(`SELECT * FROM expenses ${clause ? `${clause} AND user_id = $userId` : 'WHERE user_id = $userId'} ORDER BY date DESC`)
    .all({ ...params, $userId: options.userId });

  return rows.map(formatExpense);
}

function getExpenseById(db, id, userId) {
  return formatExpense(
    db.prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?').get(id, userId)
  );
}

function createExpenseForUser(db, userId, input) {
  if (!userId) {
    throw new Error('User is required');
  }

  const expense = validateExpenseInput(input);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO expenses (id, user_id, amount, category, description, date, created_at, updated_at)
    VALUES ($id, $userId, $amount, $category, $description, $date, $createdAt, $updatedAt)
  `).run({
    $id: id,
    $userId: userId,
    $amount: expense.amount,
    $category: expense.category,
    $description: expense.description,
    $date: expense.date,
    $createdAt: now,
    $updatedAt: now,
  });

  return getExpenseById(db, id, userId);
}

function updateExpense(db, id, userId, input) {
  const existing = getExpenseById(db, id, userId);
  if (!existing) {
    return null;
  }

  const expense = validateExpenseInput(input);
  const updatedAt = new Date().toISOString();

  db.prepare(`
    UPDATE expenses
    SET amount = $amount,
        category = $category,
        description = $description,
        date = $date,
        updated_at = $updatedAt
    WHERE id = $id AND user_id = $userId
  `).run({
    $id: id,
    $userId: userId,
    $amount: expense.amount,
    $category: expense.category,
    $description: expense.description,
    $date: expense.date,
    $updatedAt: updatedAt,
  });

  return getExpenseById(db, id, userId);
}

function deleteExpense(db, id, userId) {
  const existing = getExpenseById(db, id, userId);
  if (!existing) {
    return null;
  }

  db.prepare('DELETE FROM expenses WHERE id = ? AND user_id = ?').run(id, userId);
  return existing;
}

function summarizeExpenses(db, options = {}) {
  if (!options.userId) {
    throw new Error('User is required');
  }

  const { clause, params } = buildExpenseFilter(options.month);
  const summary = db.prepare(`
    SELECT category AS _id, SUM(amount) AS total, COUNT(*) AS count
    FROM expenses
    ${clause ? `${clause} AND user_id = $userId` : 'WHERE user_id = $userId'}
    GROUP BY category
    ORDER BY total DESC
  `).all({ ...params, $userId: options.userId });

  const grandTotal = summary.reduce((sum, item) => sum + item.total, 0);
  return { summary, grandTotal };
}

function queryExpenses(db, options = {}) {
  if (!options.userId) {
    throw new Error('User is required');
  }

  const conditions = [];
  const params = { $userId: options.userId };

  conditions.push('user_id = $userId');

  if (options.startDate) {
    conditions.push('date >= $startDate');
    params.$startDate = normalizeDate(options.startDate);
  }

  if (options.endDate) {
    conditions.push('date <= $endDate');
    params.$endDate = normalizeDate(options.endDate);
  }

  if (options.category) {
    conditions.push('category = $category');
    params.$category = options.category;
  }

  const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : 10;

  const rows = db.prepare(`
    SELECT * FROM expenses
    ${clause}
    ORDER BY date DESC
    LIMIT $limit
  `).all({ ...params, $limit: limit });

  return rows.map(formatExpense);
}

module.exports = {
  EXPENSE_CATEGORIES,
  listExpenses,
  getExpenseById,
  createExpenseForUser,
  updateExpense,
  deleteExpense,
  summarizeExpenses,
  queryExpenses,
  parseMonth,
};
