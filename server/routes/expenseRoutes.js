const express = require('express');
const router = express.Router();
const { Expense } = require('../models/Expense');

// GET /api/expenses - Get all expenses (optional ?month=YYYY-MM)
router.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    let dateFilter = {};

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      dateFilter = { date: { $gte: start, $lte: end } };
    }

    const expenses = await Expense.find(dateFilter).sort({ date: -1 });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/expenses - Create expense
router.post('/', async (req, res) => {
  try {
    const { amount, category, description, date } = req.body;

    if (!amount || !category) {
      return res.status(400).json({ success: false, error: 'Amount and category are required' });
    }

    const expense = await Expense.create({ amount, category, description, date });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/expenses/grouped - Get all grouped by date
router.get('/grouped', async (req, res) => {
  try {
    const { month } = req.query;
    let dateFilter = {};

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      dateFilter = { date: { $gte: start, $lte: end } };
    }

    const expenses = await Expense.find(dateFilter).sort({ date: -1 });

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
    const { month } = req.query;
    let dateFilter = {};

    if (month) {
      const [year, m] = month.split('-').map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59);
      dateFilter = { date: { $gte: start, $lte: end } };
    }

    const summary = await Expense.aggregate([
      { $match: dateFilter },
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
    const expense = await Expense.findById(req.params.id);
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
    const { amount, category, description, date } = req.body;
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { amount, category, description, date },
      { new: true, runValidators: true }
    );
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
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
