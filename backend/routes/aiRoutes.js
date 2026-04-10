const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const dbConnect = require('../config/db');
const { Expense } = require('../models/Expense');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/query - Natural language expense query
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    await dbConnect();

    // Classify intent using Claude
    const classificationPrompt = `You are an expense query classifier. Given a user's question about their expenses, classify it and extract parameters.

Categories: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Other

Return a JSON object with:
- intent: one of ["total_spending", "category_spending", "date_range", "recent_expenses", "top_categories", "comparison"]
- category: the expense category if mentioned (null otherwise)
- period: "current_month", "last_month", "last_week", "last_3_months", or null
- limit: number of results (default 5)
- startDate: ISO date string if specific (null otherwise)
- endDate: ISO date string if specific (null otherwise)

Examples:
- "How much did I spend on food this month?" → {"intent":"category_spending","category":"Food","period":"current_month"}
- "Show me last week's expenses" → {"intent":"recent_expenses","period":"last_week","limit":10}
- "What's my total spending this month?" → {"intent":"total_spending","period":"current_month"}

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

    // Build MongoDB query
    const now = new Date();
    let dateFilter = {};

    if (classification.period) {
      const year = now.getFullYear();
      const month = now.getMonth();
      switch (classification.period) {
        case 'current_month':
          dateFilter = { date: { $gte: new Date(year, month, 1), $lte: new Date(year, month + 1, 0, 23, 59, 59) } };
          break;
        case 'last_month':
          dateFilter = { date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) } };
          break;
        case 'last_week':
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { date: { $gte: weekAgo } };
          break;
        case 'last_3_months':
          dateFilter = { date: { $gte: new Date(year, month - 2, 1), $lte: new Date(year, month + 1, 0, 23, 59, 59) } };
          break;
      }
    }

    let query = Expense.find(dateFilter);
    if (classification.category) {
      query = query.where('category', classification.category);
    }

    const expenses = await query.sort({ date: -1 }).limit(classification.limit || 10);
    const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Generate natural language response
    const responsePrompt = `You are a friendly expense tracker assistant. The user asked: "${question}"

Based on their expense data:
- Total: ₹${grandTotal.toFixed(2)}
- Number of expenses: ${expenses.length}
- Expenses: ${expenses.map(e => `₹${e.amount} on ${e.category}${e.description ? ': ' + e.description : ''} (${e.date.toLocaleDateString()})`).join('; ')}

Provide a clear, friendly answer. If there are no expenses, say so.`;

    const answerResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: responsePrompt }],
    });

    const answer = answerResponse.content[0].text.trim();

    res.json({
      success: true,
      data: {
        answer,
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
