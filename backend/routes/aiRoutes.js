const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const dbConnect = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const { Expense, EXPENSE_CATEGORIES } = require('../models/Expense');

router.use(requireAuth);

const PERIOD_LABELS = {
  current_month: 'this month',
  last_month: 'last month',
  last_week: 'the last 7 days',
  last_3_months: 'the last 3 months',
};

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

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
      const endDate = endOfDay(now);
      const startDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      return { startDate, endDate };
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

function getComparisonRange(period) {
  const currentRange = getPeriodRange(period || 'current_month');
  if (!currentRange.startDate || !currentRange.endDate) {
    return { currentRange: {}, previousRange: {} };
  }

  const currentStart = new Date(currentRange.startDate);
  const currentEnd = new Date(currentRange.endDate);

  if (period === 'last_month' || period === 'current_month' || period === 'last_3_months') {
    const spanInMonths = period === 'last_3_months' ? 3 : 1;
    const previousStart = new Date(currentStart);
    previousStart.setMonth(previousStart.getMonth() - spanInMonths);
    const previousEnd = new Date(currentEnd);
    previousEnd.setMonth(previousEnd.getMonth() - spanInMonths);
    return {
      currentRange,
      previousRange: {
        startDate: previousStart,
        endDate: previousEnd,
      },
    };
  }

  const spanMs = currentEnd.getTime() - currentStart.getTime() + 1;
  return {
    currentRange,
    previousRange: {
      startDate: new Date(currentStart.getTime() - spanMs),
      endDate: new Date(currentEnd.getTime() - spanMs),
    },
  };
}

function parseExplicitDate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function categoryFromQuestion(question) {
  const normalized = question.toLowerCase();
  return (
    EXPENSE_CATEGORIES.find((category) => normalized.includes(category.toLowerCase())) || null
  );
}

function extractLimit(question) {
  const match = question.match(/(?:last|recent|latest|top|show)\s+(\d{1,2})/i);
  if (!match) {
    return null;
  }

  const limit = Number(match[1]);
  return Number.isFinite(limit) && limit > 0 ? Math.min(limit, 50) : null;
}

function ruleBasedClassification(question) {
  const normalized = question.trim().toLowerCase();
  const category = categoryFromQuestion(question);
  const limit = extractLimit(question) || 5;

  let period = null;
  if (/\blast 3 months\b|\bpast 3 months\b/.test(normalized)) {
    period = 'last_3_months';
  } else if (/\blast month\b|\bprevious month\b/.test(normalized)) {
    period = 'last_month';
  } else if (/\blast week\b|\bpast week\b|\bthis week\b|\brecent week\b/.test(normalized)) {
    period = 'last_week';
  } else if (/\bthis month\b|\bcurrent month\b/.test(normalized)) {
    period = 'current_month';
  }

  const startDate = parseExplicitDate(
    normalized.match(/\bfrom\s+(\d{4}-\d{2}-\d{2})\b/)?.[1] || null
  );
  const endDate = parseExplicitDate(
    normalized.match(/\bto\s+(\d{4}-\d{2}-\d{2})\b/)?.[1] || null
  );

  let intent = 'total_spending';
  if (/^(hi|hello|hey|good morning|good evening)\b/.test(normalized) || /how are you/.test(normalized)) {
    intent = 'chat';
  } else if (/\bcompare\b|\bcomparison\b|\bmore than\b|\bless than\b|\bchange\b/.test(normalized)) {
    intent = 'comparison';
  } else if (/\btop categories\b|\btop spending\b|\bhighest categories\b/.test(normalized)) {
    intent = 'top_categories';
  } else if (/\brecent\b|\blatest\b|\bshow me\b|\blist\b/.test(normalized)) {
    intent = category || startDate || endDate || period ? 'date_range' : 'recent_expenses';
  } else if (category) {
    intent = 'category_spending';
  } else if (startDate || endDate || period) {
    intent = 'date_range';
  }

  return {
    intent,
    category,
    period,
    limit,
    startDate: startDate ? startDate.toISOString() : null,
    endDate: endDate ? endOfDay(endDate).toISOString() : null,
  };
}

async function callModel(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_BASE_URL || 'http://localhost:3000',
      'X-Title': 'Expense Tracker',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 700,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function classifyQuestion(question) {
  const fallback = ruleBasedClassification(question);
  if (!process.env.OPENROUTER_API_KEY) {
    return fallback;
  }

  const prompt = `
You classify questions for an expense tracker.

Categories: ${EXPENSE_CATEGORIES.join(', ')}

Return JSON only:
{
  "intent": "chat" | "total_spending" | "category_spending" | "date_range" | "recent_expenses" | "top_categories" | "comparison",
  "category": string or null,
  "period": "current_month" | "last_month" | "last_week" | "last_3_months" | null,
  "limit": number,
  "startDate": string or null,
  "endDate": string or null
}

Question: "${question}"
`;

  try {
    const raw = await callModel(prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return fallback;
    }

    const parsed = JSON.parse(match[0]);
    return {
      intent: parsed.intent || fallback.intent,
      category: parsed.category || fallback.category,
      period: parsed.period || fallback.period,
      limit: Number.isFinite(parsed.limit) ? parsed.limit : fallback.limit,
      startDate: parseExplicitDate(parsed.startDate)?.toISOString() || fallback.startDate,
      endDate: parseExplicitDate(parsed.endDate)?.toISOString() || fallback.endDate,
    };
  } catch (error) {
    return fallback;
  }
}

function buildMatch(userId, filters) {
  const match = {
    userId: new mongoose.Types.ObjectId(userId),
  };

  if (filters.category) {
    match.category = filters.category;
  }

  const startDate = parseExplicitDate(filters.startDate);
  const endDate = parseExplicitDate(filters.endDate);
  const periodRange = getPeriodRange(filters.period);
  const rangeStart = startDate || periodRange.startDate || null;
  const rangeEnd = endDate || periodRange.endDate || null;

  if (rangeStart || rangeEnd) {
    match.date = {};
    if (rangeStart) {
      match.date.$gte = rangeStart;
    }
    if (rangeEnd) {
      match.date.$lte = rangeEnd;
    }
  }

  return match;
}

async function getSummary(userId, filters) {
  const match = buildMatch(userId, filters);

  const [summary, totals] = await Promise.all([
    Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          grandTotal: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  return {
    summaryData: summary,
    grandTotal: totals[0]?.grandTotal || 0,
    expenseCount: totals[0]?.expenseCount || 0,
  };
}

async function getExpenseList(userId, filters, limit) {
  return Expense.find(buildMatch(userId, filters))
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .lean();
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function describeRange(classification) {
  if (classification.period && PERIOD_LABELS[classification.period]) {
    return PERIOD_LABELS[classification.period];
  }

  if (classification.startDate || classification.endDate) {
    const parts = [];
    if (classification.startDate) {
      parts.push(`from ${new Date(classification.startDate).toLocaleDateString('en-IN')}`);
    }
    if (classification.endDate) {
      parts.push(`to ${new Date(classification.endDate).toLocaleDateString('en-IN')}`);
    }
    return parts.join(' ');
  }

  return 'the selected period';
}

function buildDeterministicAnswer(question, classification, metrics, comparisonData) {
  if (classification.intent === 'chat') {
    return 'I can summarize your spending, list recent expenses, compare periods, and break down categories. Try asking about this month, last month, food spending, or your top categories.';
  }

  if (metrics.expenseCount === 0) {
    return `I couldn't find any expenses for ${describeRange(classification)}. Add a few transactions first, then ask again.`;
  }

  if (classification.intent === 'comparison' && comparisonData) {
    const direction =
      comparisonData.percentChange === 0
        ? 'stayed flat'
        : comparisonData.percentChange > 0
          ? 'increased'
          : 'decreased';
    return `Your spending ${direction} by ${Math.abs(comparisonData.percentChange).toFixed(1)}%: ${formatCurrency(comparisonData.currentTotal)} in ${comparisonData.currentLabel} versus ${formatCurrency(comparisonData.previousTotal)} in ${comparisonData.previousLabel}.`;
  }

  if (classification.intent === 'top_categories') {
    const top = metrics.summaryData.slice(0, 3);
    const summary = top
      .map((item) => `${item._id} ${formatCurrency(item.total)}`)
      .join(', ');
    return `Your top spending categories for ${describeRange(classification)} are ${summary}. Total spending was ${formatCurrency(metrics.grandTotal)} across ${metrics.expenseCount} expenses.`;
  }

  if (classification.intent === 'recent_expenses' || classification.intent === 'date_range') {
    const recent = metrics.expenseData
      .slice(0, 3)
      .map((expense) => `${formatCurrency(expense.amount)} on ${expense.category}`)
      .join(', ');
    return `I found ${metrics.expenseCount} expenses for ${describeRange(classification)} totaling ${formatCurrency(metrics.grandTotal)}. Recent entries include ${recent}.`;
  }

  if (classification.intent === 'category_spending' && classification.category) {
    return `You spent ${formatCurrency(metrics.grandTotal)} on ${classification.category} in ${describeRange(classification)} across ${metrics.expenseCount} expenses.`;
  }

  return `Your total spending for ${describeRange(classification)} is ${formatCurrency(metrics.grandTotal)} across ${metrics.expenseCount} expenses.`;
}

async function buildAnswer(question, classification, metrics, comparisonData) {
  const fallback = buildDeterministicAnswer(question, classification, metrics, comparisonData);
  if (!process.env.OPENROUTER_API_KEY) {
    return fallback;
  }

  const prompt = `
You are a concise, helpful expense tracker assistant.
Answer the user naturally and accurately. Do not invent numbers.

Question: "${question}"
Intent: ${classification.intent}
Category: ${classification.category || 'none'}
Period label: ${describeRange(classification)}
Grand total: ${metrics.grandTotal}
Expense count: ${metrics.expenseCount}
Top categories: ${metrics.summaryData
    .slice(0, 5)
    .map((item) => `${item._id}=${item.total}`)
    .join(', ') || 'none'}
Recent expenses: ${metrics.expenseData
    .slice(0, 5)
    .map((expense) => `${expense.amount} ${expense.category} ${expense.description || ''}`.trim())
    .join('; ') || 'none'}
Comparison: ${
    comparisonData
      ? `${comparisonData.currentTotal} current, ${comparisonData.previousTotal} previous, ${comparisonData.percentChange}% change`
      : 'none'
  }

If there is no data, say so clearly.
`;

  try {
    const answer = await callModel(prompt);
    return answer.trim() || fallback;
  } catch (error) {
    return fallback;
  }
}

router.post('/query', async (req, res) => {
  try {
    const question = String(req.body.question || '').trim();
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    await dbConnect();

    const classification = await classifyQuestion(question);
    const limit = Math.min(Math.max(Number(classification.limit) || 5, 1), 50);

    if (classification.intent === 'chat') {
      const answer = await buildAnswer(question, classification, {
        grandTotal: 0,
        expenseCount: 0,
        summaryData: [],
        expenseData: [],
      });

      return res.json({
        success: true,
        data: {
          answer,
          query: classification,
          expenseData: [],
          grandTotal: 0,
          summaryData: [],
          topCategories: [],
          expenseCount: 0,
          periodLabel: null,
        },
      });
    }

    const [metrics, expenseData] = await Promise.all([
      getSummary(req.user.id, classification),
      getExpenseList(req.user.id, classification, limit),
    ]);

    const topCategories = metrics.summaryData.slice(0, 3);
    let comparisonData = null;

    if (classification.intent === 'comparison') {
      const { currentRange, previousRange } = getComparisonRange(classification.period);
      const [currentMetrics, previousMetrics] = await Promise.all([
        getSummary(req.user.id, {
          ...classification,
          startDate: currentRange.startDate?.toISOString() || null,
          endDate: currentRange.endDate?.toISOString() || null,
        }),
        getSummary(req.user.id, {
          ...classification,
          startDate: previousRange.startDate?.toISOString() || null,
          endDate: previousRange.endDate?.toISOString() || null,
        }),
      ]);

      const currentTotal = currentMetrics.grandTotal;
      const previousTotal = previousMetrics.grandTotal;
      const percentChange =
        previousTotal === 0
          ? currentTotal === 0
            ? 0
            : 100
          : ((currentTotal - previousTotal) / previousTotal) * 100;

      comparisonData = {
        currentTotal,
        previousTotal,
        percentChange,
        currentLabel: PERIOD_LABELS[classification.period] || 'current period',
        previousLabel:
          classification.period === 'last_month'
            ? 'the month before'
            : classification.period === 'last_week'
              ? 'the previous 7 days'
              : classification.period === 'last_3_months'
                ? 'the 3 months before that'
                : 'the previous month',
      };
    }

    const answer = await buildAnswer(
      question,
      classification,
      {
        ...metrics,
        expenseData,
      },
      comparisonData
    );

    return res.json({
      success: true,
      data: {
        answer,
        query: classification,
        expenseData,
        grandTotal: metrics.grandTotal,
        summaryData: metrics.summaryData,
        topCategories,
        expenseCount: metrics.expenseCount,
        periodLabel: classification.period ? PERIOD_LABELS[classification.period] || null : null,
        ...(comparisonData || {}),
      },
    });
  } catch (error) {
    console.error('AI route failed:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
