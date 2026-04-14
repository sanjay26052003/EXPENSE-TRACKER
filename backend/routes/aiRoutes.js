const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const dbConnect = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { Expense, EXPENSE_CATEGORIES } = require('../models/Expense');

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function getPeriodRange(period) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case 'current_month':
      return {
        startDate: new Date(year, month, 1),
        endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
      };
    case 'last_month':
      return {
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0, 23, 59, 59, 999),
      };
    case 'last_week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return { startDate: weekAgo, endDate: now };
    }
    case 'last_3_months':
      return {
        startDate: new Date(year, month - 2, 1),
        endDate: new Date(year, month + 1, 0, 23, 59, 59, 999),
      };
    default:
      return {};
  }
}

router.use(requireAuth);

router.post('/query', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(503).json({ success: false, error: 'ANTHROPIC_API_KEY is not configured' });
    }

    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    await dbConnect();

    const classificationPrompt = `You are an expense query classifier. Given a user's question about their expenses, classify it and extract parameters.

Categories: ${EXPENSE_CATEGORIES.join(', ')}

Return a JSON object with:
- intent: one of ["total_spending", "category_spending", "date_range", "recent_expenses", "top_categories", "comparison"]
- category: the expense category if mentioned (null otherwise)
- period: "current_month", "last_month", "last_week", "last_3_months", or null
- limit: number of results (default 5)
- startDate: ISO date string if specific (null otherwise)
- endDate: ISO date string if specific (null otherwise)

User question: "${question}"

Respond with only valid JSON, no markdown or explanation.`;

    const claudeResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: classificationPrompt }],
    });

    const rawText = claudeResponse.content[0].text.trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse classification');
    }

    const classification = JSON.parse(jsonMatch[0]);
    const periodRange = getPeriodRange(classification.period);

    const query = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    if (classification.category) {
      query.category = classification.category;
    }

    const startDate = classification.startDate || periodRange.startDate;
    const endDate = classification.endDate || periodRange.endDate;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(classification.limit || 10);

    const grandTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const responsePrompt = `You are a friendly expense tracker assistant. The user asked: "${question}"

Based on their expense data:
- Total: INR ${grandTotal.toFixed(2)}
- Number of expenses: ${expenses.length}
- Expenses: ${expenses.map((expense) => `${expense.amount} on ${expense.category}${expense.description ? ': ' + expense.description : ''} (${new Date(expense.date).toLocaleDateString()})`).join('; ')}

Provide a clear, friendly answer. If there are no expenses, say so.`;

    const answerResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: responsePrompt }],
    });

    res.json({
      success: true,
      data: {
        answer: answerResponse.content[0].text.trim(),
        query: {
          intent: classification.intent,
          category: classification.category,
          period: classification.period,
        },
        expenseData: expenses,
        grandTotal,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
