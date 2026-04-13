const express = require('express');
const router = express.Router();
const dbConnect = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const {
  listExpenses,
  getExpenseById,
  createExpenseForUser,
  updateExpense,
  deleteExpense,
  summarizeExpenses,
} = require('../models/Expense');

router.use(requireAuth);

// GET /api/expenses - Get all expenses (optional ?month=YYYY-MM)
router.get('/', async (req, res) => {
  try {
    const db = await dbConnect();
    const expenses = listExpenses(db, { month: req.query.month, userId: req.user.id });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses - Create expense
router.post('/', async (req, res) => {
  try {
    const db = await dbConnect();
    const expense = createExpenseForUser(db, req.user.id, req.body);
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/grouped - Get all grouped by date
router.get('/grouped', async (req, res) => {
  try {
    const db = await dbConnect();
    const expenses = listExpenses(db, { month: req.query.month, userId: req.user.id });
    const grouped = {};

    for (const expense of expenses) {
      const dateKey = expense.date.split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(expense);
    }

    res.json({ success: true, data: grouped });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/summary - Get category totals
router.get('/summary', async (req, res) => {
  try {
    const db = await dbConnect();
    const summaryData = summarizeExpenses(db, { month: req.query.month, userId: req.user.id });
    res.json({ success: true, data: summaryData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/:id - Get single expense
router.get('/:id', async (req, res) => {
  try {
    const db = await dbConnect();
    const expense = getExpenseById(db, req.params.id, req.user.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const db = await dbConnect();
    const expense = updateExpense(db, req.params.id, req.user.id, req.body);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const db = await dbConnect();
    const expense = deleteExpense(db, req.params.id, req.user.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
