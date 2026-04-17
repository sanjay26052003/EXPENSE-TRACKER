'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import api from '@/lib/api';
import styles from './page.module.css';

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData() {
    setLoading(true);
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const [expData, sumData] = await Promise.all([api.getExpenses(month), api.getSummary(month)]);

      setExpenses(expData.data || []);
      setSummary(sumData.data?.summary || []);
      setMonthlyTotal(sumData.data?.grandTotal || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAddExpense(data) {
    await api.createExpense(data);
    await fetchData();
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm('Delete this expense?')) {
      return;
    }

    await api.deleteExpense(id);
    await fetchData();
  }

  const recentExpenses = expenses.slice(0, 5);
  const topCategory = summary[0]?._id || 'No category yet';
  const topCategoryAmount = summary[0]?.total || 0;
  const averageSpend = expenses.length > 0 ? monthlyTotal / expenses.length : 0;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Expense tracker</span>
          <h1 className={styles.title}>Track the month clearly, then ask the data what changed.</h1>
          <p className={styles.subtitle}>
            Keep entries fast, summaries readable, and use the AI assistant when you need an answer instead of another filter.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={() =>
                document.getElementById('quick-expense-form')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                })
              }
            >
              Add an expense
            </button>
            <Link href="/chat" className={styles.secondaryAction}>
              Open AI assistant
            </Link>
          </div>
        </div>

        <div className={styles.heroCard}>
          <div className={styles.heroLabel}>This month</div>
          <div className={styles.heroAmount}>{loading ? '...' : formatAmount(monthlyTotal)}</div>
          <div className={styles.heroMeta}>
            <span>{expenses.length} entries</span>
            <span>{summary.length} active categories</span>
          </div>
        </div>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Top category</span>
          <strong className={styles.metricValue}>{topCategory}</strong>
          <span className={styles.metricHint}>{formatAmount(topCategoryAmount)}</span>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Average spend</span>
          <strong className={styles.metricValue}>{formatAmount(averageSpend)}</strong>
          <span className={styles.metricHint}>Per expense this month</span>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Quick question</span>
          <strong className={styles.metricValue}>“What changed?”</strong>
          <span className={styles.metricHint}>Use chat for trend and category answers</span>
        </article>
      </section>

      <section className={styles.grid}>
        <div className={styles.formCard} id="quick-expense-form">
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>Quick add</span>
              <h2 className={styles.cardTitle}>Log an expense without leaving the dashboard</h2>
            </div>
          </div>
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>

        <div className={styles.listCard}>
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.cardEyebrow}>Recent activity</span>
              <h2 className={styles.cardTitle}>Latest expenses</h2>
            </div>
            <Link href="/expenses" className={styles.inlineLink}>
              View all
            </Link>
          </div>

          {loading ? (
            <p className={styles.state}>Loading dashboard...</p>
          ) : (
            <ExpenseList expenses={recentExpenses} onDelete={handleDeleteExpense} />
          )}
        </div>
      </section>
    </div>
  );
}
