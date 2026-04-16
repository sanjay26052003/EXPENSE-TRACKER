const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const dbConnect = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { Expense, EXPENSE_CATEGORIES } = require('../models/Expense');

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

async function callModel(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Expense Tracker',
    },
    body: JSON.stringify({
      model: 'liquid/lfm-2.5-1.2b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

router.use(requireAuth);

router.post('/query', async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'OPENROUTER_API_KEY is not configured. Make sure the backend .env file has this key set.'
      });
    }

    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    await dbConnect();

    const classificationPrompt = `
You are an AI assistant for an expense tracker.

Your job:
1. If the message is about expenses → extract data
2. If it's casual chat (hello, how are you, etc.) → mark as "chat"

Categories: ${EXPENSE_CATEGORIES.join(', ')}

Return ONLY JSON:
{
  "intent": "chat" | "total_spending" | "category_spending" | "date_range" | "recent_expenses" | "top_categories" | "comparison",
  "category": string or null,
  "period": "current_month" | "last_month" | "last_week" | "last_3_months" | null,
  "limit": number,
  "startDate": string or null,
  "endDate": string or null
}

User: "${question}"
`;
    const claudeResponse = await callModel(classificationPrompt);

let classification;

try {
  const jsonMatch = claudeResponse.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.log("AI RAW RESPONSE:", claudeResponse);
    throw new Error("No JSON found in AI response");
  }

  classification = JSON.parse(jsonMatch[0]);
} catch (err) {
  console.error("Parsing Error:", err.message);
  throw new Error("Failed to parse AI response");
}
    const periodRange = getPeriodRange(classification.period);

    const query = {
      userId: new mongoose.Types.ObjectId(req.user.id),
    };

    if (classification.category) {
      query.category = classification.category;
    }

    function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

const startDate = classification.startDate || periodRange.startDate;
    const endDate = classification.endDate || periodRange.endDate;
    if (startDate && isValidDate(new Date(startDate))) {
      query.date = query.date || {};
      query.date.$gte = new Date(startDate);
    }
    if (endDate && isValidDate(new Date(endDate))) {
      query.date = query.date || {};
      query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(classification.limit || 10);

    const grandTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const summaryData = Object.entries(
      expenses.reduce((acc, exp) => {
        if (!acc[exp.category]) acc[exp.category] = { total: 0, count: 0 };
        acc[exp.category].total += exp.amount;
        acc[exp.category].count += 1;
        return acc;
      }, {})
    ).map(([category, { total, count }]) => ({ _id: category, total, count }))
      .sort((a, b) => b.total - a.total);

    const topCategories = summaryData.slice(0, 3);
    const periodLabels = {
      current_month: 'this month',
      last_month: 'last month',
      last_week: 'this week',
      last_3_months: 'last 3 months',
    };
    const periodLabel = periodLabels[classification.period] || null;

    const responsePrompt = `You are a friendly expense tracker assistant. The user asked: "${question}"

Based on their expense data:
- Total: INR ${grandTotal.toFixed(2)}
- Number of expenses: ${expenses.length}
- Expenses: ${expenses.map((expense) => `${expense.amount} on ${expense.category}${expense.description ? ': ' + expense.description : ''} (${new Date(expense.date).toLocaleDateString()})`).join('; ')}

Provide a clear, friendly answer. If there are no expenses, say so.`;

    const answerResponse = await callModel(responsePrompt);

    res.json({
      success: true,
      data: {
        answer: answerResponse.trim(),
        query: {
          intent: classification.intent,
          category: classification.category,
          period: classification.period,
        },
        expenseData: expenses,
        grandTotal,
        summaryData,
        topCategories,
        periodLabel,
      },
    });
  } catch (error) {
  console.error("FULL ERROR:", error); // 👈 VERY IMPORTANT
  res.status(500).json({ success: false, error: error.message });
}
});

module.exports = router;
