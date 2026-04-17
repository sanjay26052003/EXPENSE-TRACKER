'use client';

import ExpenseSummary from './ExpenseSummary';
import ExpenseList from './ExpenseList';
import styles from './StructuredDataRenderer.module.css';

const INTENT_LABELS = {
  total_spending: 'Total spending',
  category_spending: 'Category spend',
  top_categories: 'Top categories',
  recent_expenses: 'Recent expenses',
  comparison: 'Period comparison',
  date_range: 'Date range',
};

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function ComparisonCard({ label, value, tone = 'default' }) {
  return (
    <div className={styles.comparisonCard}>
      <span className={styles.cardLabel}>{label}</span>
      <strong className={`${styles.cardValue} ${tone === 'positive' ? styles.positive : tone === 'negative' ? styles.negative : ''}`}>
        {value}
      </strong>
    </div>
  );
}

export default function StructuredDataRenderer({ data }) {
  if (!data || data.intent === 'chat') {
    return null;
  }

  const label = INTENT_LABELS[data.intent] || 'Expense result';
  const hasExpenses = Array.isArray(data.expenseData) && data.expenseData.length > 0;
  const hasSummary = Array.isArray(data.summaryData) && data.summaryData.length > 0;
  const percentChange = Number.isFinite(data.percentChange) ? data.percentChange : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.intentBadge}>{label}</span>
        {data.period ? <span className={styles.period}>{data.period}</span> : null}
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Total</span>
          <strong className={styles.metricValue}>{formatAmount(data.grandTotal)}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Entries</span>
          <strong className={styles.metricValue}>{data.expenseCount || data.expenseData?.length || 0}</strong>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Top category</span>
          <strong className={styles.metricValue}>{data.topCategories?.[0]?._id || 'None'}</strong>
        </div>
      </div>

      {data.intent === 'comparison' && percentChange !== null ? (
        <div className={styles.comparisonGrid}>
          <ComparisonCard label="Current" value={formatAmount(data.currentTotal)} />
          <ComparisonCard label="Previous" value={formatAmount(data.previousTotal)} />
          <ComparisonCard
            label="Change"
            value={`${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`}
            tone={percentChange > 0 ? 'positive' : percentChange < 0 ? 'negative' : 'default'}
          />
        </div>
      ) : null}

      {hasSummary ? (
        <div className={styles.section}>
          <ExpenseSummary summary={data.summaryData} grandTotal={data.grandTotal} />
        </div>
      ) : null}

      {hasExpenses ? (
        <div className={styles.section}>
          <ExpenseList expenses={data.expenseData.slice(0, 5)} />
          {data.expenseData.length > 5 ? (
            <p className={styles.moreNote}>+ {data.expenseData.length - 5} more expenses in this result</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
