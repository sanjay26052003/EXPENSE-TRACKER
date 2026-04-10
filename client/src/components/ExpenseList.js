import styles from './ExpenseList.module.css';

const CATEGORY_COLORS = {
  Food: '#22c55e',
  Transport: '#3b82f6',
  Shopping: '#a855f7',
  Entertainment: '#f59e0b',
  Bills: '#ef4444',
  Health: '#ec4899',
  Education: '#06b6d4',
  Other: '#64748b',
};

export default function ExpenseList({ expenses, onDelete, onEdit }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No expenses found. Add your first expense above!</p>
      </div>
    );
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  }

  return (
    <div className={styles.list}>
      {expenses.map((expense) => (
        <div key={expense._id} className={styles.item}>
          <div
            className={styles.colorBar}
            style={{ backgroundColor: CATEGORY_COLORS[expense.category] || '#64748b' }}
          />
          <div className={styles.info}>
            <div className={styles.top}>
              <span className={styles.category}>{expense.category}</span>
              <span className={styles.amount}>{formatAmount(expense.amount)}</span>
            </div>
            {expense.description && (
              <p className={styles.description}>{expense.description}</p>
            )}
            <div className={styles.meta}>
              <span className={styles.date}>{formatDate(expense.date)}</span>
              <div className={styles.actions}>
                {onEdit && (
                  <button onClick={() => onEdit(expense)} className={styles.editBtn}>
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(expense._id)} className={styles.deleteBtn}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
