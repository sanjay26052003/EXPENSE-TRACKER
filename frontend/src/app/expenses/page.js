'use client';

import { useEffect, useMemo, useState } from 'react';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseList from '@/components/ExpenseList';
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

export default function ExpensesPage() {
  const [groupedExpenses, setGroupedExpenses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  async function fetchExpenses() {
    setLoading(true);
    try {
      const data = await api.getGroupedExpenses(selectedMonth);
      setGroupedExpenses(data.data || {});
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
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
    setShowCreateForm(false);
  }

  async function handleUpdateExpense(data) {
    if (!editingExpense?._id) {
      return;
    }

    await api.updateExpense(editingExpense._id, data);
    await fetchExpenses();
    setEditingExpense(null);
  }

  async function handleDeleteExpense(id) {
    if (!window.confirm('Delete this expense?')) {
      return;
    }

    await api.deleteExpense(id);
    await fetchExpenses();
  }

  const allExpenses = useMemo(() => Object.values(groupedExpenses).flat(), [groupedExpenses]);
  const monthTotal = allExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const categoryCount = new Set(allExpenses.map((expense) => expense.category)).size;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Expense log</span>
          <h1 className={styles.title}>Every transaction in one place, grouped by day.</h1>
          <p className={styles.subtitle}>
            Filter by month, edit mistakes quickly, and keep the record clean enough for summaries and AI answers to stay trustworthy.
          </p>
        </div>
        <div className={styles.controls}>
          <DateSelector value={selectedMonth} onChange={setSelectedMonth} />
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              setEditingExpense(null);
              setShowCreateForm((value) => !value);
            }}
          >
            {showCreateForm ? 'Hide form' : 'Add expense'}
          </button>
        </div>
      </section>

      <section className={styles.metrics}>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Month total</span>
          <strong className={styles.metricValue}>{formatAmount(monthTotal)}</strong>
        </article>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Entries</span>
          <strong className={styles.metricValue}>{allExpenses.length}</strong>
        </article>
        <article className={styles.metric}>
          <span className={styles.metricLabel}>Categories used</span>
          <strong className={styles.metricValue}>{categoryCount}</strong>
        </article>
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      {(showCreateForm || editingExpense) && (
        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <div>
              <span className={styles.eyebrow}>{editingExpense ? 'Edit entry' : 'New entry'}</span>
              <h2 className={styles.formTitle}>
                {editingExpense ? 'Update this expense' : 'Add another expense'}
              </h2>
            </div>
          </div>

          <ExpenseForm
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            initialData={editingExpense}
            submitLabel={editingExpense ? 'Save changes' : 'Save expense'}
            onCancel={
              editingExpense
                ? () => setEditingExpense(null)
                : () => setShowCreateForm(false)
            }
          />
        </section>
      )}

      {loading ? (
        <p className={styles.state}>Loading expenses...</p>
      ) : allExpenses.length === 0 ? (
        <section className={styles.empty}>
          <h2>No expenses for this month</h2>
          <p>Start with a few entries and this page will group them by day automatically.</p>
        </section>
      ) : (
        <section className={styles.groups}>
          {Object.entries(groupedExpenses)
            .sort(([left], [right]) => right.localeCompare(left))
            .map(([date, expenses]) => {
              const dayTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
              return (
                <article key={date} className={styles.groupCard}>
                  <div className={styles.groupHeader}>
                    <div>
                      <h2 className={styles.groupTitle}>
                        {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </h2>
                      <p className={styles.groupMeta}>{expenses.length} entries</p>
                    </div>
                    <strong className={styles.groupTotal}>{formatAmount(dayTotal)}</strong>
                  </div>

                  <ExpenseList
                    expenses={expenses}
                    onDelete={handleDeleteExpense}
                    onEdit={(expense) => {
                      setShowCreateForm(false);
                      setEditingExpense(expense);
                    }}
                  />
                </article>
              );
            })}
        </section>
      )}
    </div>
  );
}
