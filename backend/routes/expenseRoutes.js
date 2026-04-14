const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const dbConnect = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { Expense } = require('../models/Expense');

router.use(requireAuth);

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

  return {
    start: new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999)),
  };
}

function buildDateFilter(month) {
  const range = parseMonth(month);
  if (!range) {
    return {};
  }

  return { date: { $gte: range.start, $lte: range.end } };
}

function requireValidObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid expense id');
  }
}

// GET /api/expenses - Get all expenses (optional ?month=YYYY-MM)
router.get('/', async (req, res) => {
  try {
    await dbConnect();

    const expenses = await Expense.find({
      userId: req.user.id,
      ...buildDateFilter(req.query.month),
    }).sort({ date: -1, createdAt: -1 });

    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses - Create expense
router.post('/', async (req, res) => {
  try {
    await dbConnect();

    const expense = await Expense.create({
      userId: req.user.id,
      amount: req.body.amount,
      category: req.body.category,
      description: req.body.description,
      date: req.body.date,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/grouped - Get all grouped by date
router.get('/grouped', async (req, res) => {
  try {
    await dbConnect();

    const expenses = await Expense.find({
      userId: req.user.id,
      ...buildDateFilter(req.query.month),
    }).sort({ date: -1, createdAt: -1 });

    const grouped = {};
    for (const expense of expenses) {
      const dateKey = expense.date.toISOString().split('T')[0];
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
    await dbConnect();

    const summary = await Expense.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(req.user.id),
          ...buildDateFilter(req.query.month),
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = summary.reduce((sum, item) => sum + item.total, 0);
    res.json({ success: true, data: { summary, grandTotal } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/:id - Get single expense
router.get('/:id', async (req, res) => {
  try {
    await dbConnect();
    requireValidObjectId(req.params.id);

    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    const status = error.message === 'Invalid expense id' ? 400 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    await dbConnect();
    requireValidObjectId(req.params.id);

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      {
        amount: req.body.amount,
        category: req.body.category,
        description: req.body.description,
        date: req.body.date,
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    const status = error.message === 'Invalid expense id' ? 400 : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    await dbConnect();
    requireValidObjectId(req.params.id);

    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    const status = error.message === 'Invalid expense id' ? 400 : 500;
    res.status(status).json({ success: false, error: error.message });
  }
});

module.exports = router;
