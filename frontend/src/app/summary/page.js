'use client';

import { useEffect, useState } from 'react';
import ExpenseSummary from '@/components/ExpenseSummary';
import DateSelector from '@/components/DateSelector';
import api from '@/lib/api';
import styles from './page.module.css';

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function SummaryPage() {
  const [summary, setSummary] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  async function fetchSummary() {
    setLoading(true);
    try {
      const data = await api.getSummary(selectedMonth);
      setSummary(data.data?.summary || []);
      setGrandTotal(data.data?.grandTotal || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  const topCategory = summary[0];
  const totalEntries = summary.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Monthly summary</span>
          <h1 className={styles.title}>See where the money is going before it disappears into the month.</h1>
          <p className={styles.subtitle}>
            Category totals stay simple here, then the AI assistant can answer follow-up questions using the same data.
          </p>
        </div>
        <DateSelector value={selectedMonth} onChange={setSelectedMonth} />
      </section>

      <section className={styles.insights}>
        <article className={styles.insightCard}>
          <span className={styles.label}>Total spend</span>
          <strong className={styles.value}>{formatAmount(grandTotal)}</strong>
        </article>
        <article className={styles.insightCard}>
          <span className={styles.label}>Top category</span>
          <strong className={styles.value}>{topCategory?._id || 'No data yet'}</strong>
          <span className={styles.hint}>
            {topCategory ? formatAmount(topCategory.total) : 'Add expenses to unlock insights'}
          </span>
        </article>
        <article className={styles.insightCard}>
          <span className={styles.label}>Recorded entries</span>
          <strong className={styles.value}>{totalEntries}</strong>
          <span className={styles.hint}>Across {summary.length} categories</span>
        </article>
      </section>

      {error ? (
        <p className={styles.error}>{error}</p>
      ) : loading ? (
        <p className={styles.state}>Loading summary...</p>
      ) : (
        <ExpenseSummary summary={summary} grandTotal={grandTotal} />
      )}
    </div>
  );
}
