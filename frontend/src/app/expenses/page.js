'use client';

import { useState, useEffect } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
import DateSelector from '@/components/DateSelector';
import api from '@/lib/api';
import styles from './page.module.css';

export default function ExpensesPage() {
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showForm, setShowForm] = useState(false);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const data = await api.getGroupedExpenses(selectedMonth);
      setGroupedExpenses(data.data || {});
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  async function handleAddExpense(data) {
    await api.createExpense(data);
    await fetchExpenses();
    setShowForm(false);
  }

  async function handleDeleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    await api.deleteExpense(id);
    await fetchExpenses();
  }

  const allExpenses = Object.values(groupedExpenses).flat();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>All Expenses</h1>
          <p className={styles.count}>{allExpenses.length} expenses this month</p>
        </div>
        <div className={styles.controls}>
          <DateSelector value={selectedMonth} onChange={setSelectedMonth} />
          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.formWrapper}>
          <ExpenseForm onSubmit={handleAddExpense} />
        </div>
      )}

      {loading ? (
        <p className={styles.loading}>Loading expenses...</p>
      ) : allExpenses.length === 0 ? (
        <div className={styles.empty}>
          <p>No expenses for this month. Add your first expense!</p>
        </div>
      ) : (
        <div className={styles.dateGroups}>
          {Object.entries(groupedExpenses)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([date, expenses]) => (
              <div key={date} className={styles.dateGroup}>
                <div className={styles.dateHeader}>
                  <span className={styles.dateLabel}>
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className={styles.dateCount}>{expenses.length} items</span>
                </div>
                <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
