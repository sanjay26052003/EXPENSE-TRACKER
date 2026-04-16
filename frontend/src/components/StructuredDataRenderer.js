'use client';

import ExpenseSummary from './ExpenseSummary';
import ExpenseList from './ExpenseList';
import styles from './StructuredDataRenderer.module.css';

const INTENT_LABELS = {
  total_spending: 'Total Spending',
  category_spending: 'Spending by Category',
  top_categories: 'Top Categories',
  recent_expenses: 'Recent Expenses',
  comparison: 'Spending Comparison',
  date_range: 'Expenses in Period',
};

function ComparisonCard({ label, total, isChange }) {
  const isPositive = total >= 0;
  const sign = isChange ? (isPositive ? '+' : '') : '';
  return (
    <div className={styles.compCard}>
      <span className={styles.compLabel}>{label}</span>
      <span
        className={`${styles.compTotal} ${
          isChange ? (isPositive ? styles.positive : styles.negative) : ''
        }`}
      >
        {sign}
        {typeof total === 'number' && !isChange
          ? `INR ${total.toLocaleString('en-IN')}`
          : `${Number(total).toFixed(1)}%`}
      </span>
    </div>
  );
}

export default function StructuredDataRenderer({ data }) {
  if (!data || data.intent === 'chat') return null;

  const label = INTENT_LABELS[data.intent] || 'Spending Summary';
  const hasExpenses = data.expenseData && data.expenseData.length > 0;
  const hasSummary = data.summaryData && data.summaryData.length > 0;

  const showSummary =
    (data.intent === 'total_spending' ||
      data.intent === 'top_categories' ||
      data.intent === 'date_range' ||
      data.intent === 'category_spending') &&
    hasSummary;

  const showList =
    (data.intent === 'recent_expenses' || data.intent === 'date_range') &&
    hasExpenses;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.intentBadge}>{label}</span>
        {data.period && <span className={styles.period}>{data.period}</span>}
      </div>

      {showSummary && (
        <div className={styles.section}>
          <ExpenseSummary
            summary={data.summaryData}
            grandTotal={data.grandTotal}
          />
        </div>
      )}

      {showList && (
        <div className={styles.section}>
          <ExpenseList
            expenses={data.expenseData.slice(0, 5)}
            variant="cards"
          />
          {data.expenseData.length > 5 && (
            <p className={styles.moreNote}>
              + {data.expenseData.length - 5} more expenses
            </p>
          )}
        </div>
      )}

      {data.intent === 'comparison' && data.currentTotal !== undefined && (
        <div className={styles.comparisonGrid}>
          <ComparisonCard label="Current" total={data.currentTotal} />
          <ComparisonCard label="Previous" total={data.previousTotal} />
          <ComparisonCard
            label="Change"
            total={data.percentChange}
            isChange
          />
        </div>
      )}
    </div>
  );
}