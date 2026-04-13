'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import api from '@/lib/api';
import styles from './page.module.css';

function formatAmount(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData() {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [expData, sumData] = await Promise.all([
        api.getExpenses(month),
        api.getSummary(month),
      ]);

      setExpenses(expData.data || []);
      setMonthlyTotal(sumData.data?.grandTotal || 0);
      setError('');
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
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
    if (!confirm('Delete this expense?')) return;
    await api.deleteExpense(id);
    await fetchData();
  }

  const recentExpenses = expenses.slice(0, 6);

  return (
    <div className={styles.container}>
      <div className={styles.dateLine}>
        {new Date().toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.spendingCard}>
        <div className={styles.spendingInfo}>
          <span className={styles.spendingLabel}>This Month&apos;s Spending</span>
          <span className={styles.spendingAmount}>{formatAmount(monthlyTotal)}</span>
        </div>
        <button className={styles.addCircle} onClick={() => document.getElementById('expense-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.formCard}>
          <h2 className={styles.sectionTitle}>Add Expense</h2>
          <div id="expense-form">
            <ExpenseForm onSubmit={handleAddExpense} />
          </div>
        </div>

        <div className={styles.listCard}>
          <h2 className={styles.sectionTitle}>Recent Expenses</h2>
          {loading ? (
            <p className={styles.loading}>Loading...</p>
          ) : (
            <ExpenseList expenses={recentExpenses} onDelete={handleDeleteExpense} />
          )}
        </div>
      </div>
    </div>
  );
}
