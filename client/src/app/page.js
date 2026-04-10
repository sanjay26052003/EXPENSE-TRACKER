'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import api from '@/lib/api';
import styles from './page.module.css';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);

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
    } catch (err) {
      console.error('Failed to fetch data:', err);
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

  const recentExpenses = expenses.slice(0, 5);

  function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.subtitle}>
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <div className={styles.totalCard}>
        <span className={styles.totalLabel}>This Month&apos;s Spending</span>
        <span className={styles.totalAmount}>{formatAmount(monthlyTotal)}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.formSection}>
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>

        <div className={styles.listSection}>
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
