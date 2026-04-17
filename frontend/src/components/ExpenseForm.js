import { useState } from 'react';
import { EXPENSE_CATEGORIES } from '@/lib/categories';
import styles from './ExpenseForm.module.css';

export default function ExpenseForm({
  onSubmit,
  initialData = null,
  submitLabel = 'Add Expense',
  onCancel = null,
}) {
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [category, setCategory] = useState(initialData?.category || EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(
    initialData?.date
      ? new Date(initialData.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date),
      });

      if (!initialData) {
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>{initialData ? 'Edit Expense' : 'Add Expense'}</h3>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label>Amount</label>
        <div className={styles.amountWrapper}>
          <span className={styles.rupee}>Rs</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={styles.input}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label>Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={styles.select}
        >
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was this expense for?"
          className={styles.input}
          maxLength={200}
        />
        <span className={styles.helper}>{description.length}/200 characters</span>
      </div>

      <div className={styles.field}>
        <label>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={styles.input}
          required
        />
      </div>

      <div className={styles.actions}>
        {onCancel ? (
          <button type="button" className={styles.secondaryBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        ) : null}
        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
