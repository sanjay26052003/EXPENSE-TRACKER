import styles from './ExpenseList.module.css';

const CATEGORY_COLORS = {
  Food: '#7bcadf',
  Transport: '#8bb7ff',
  Shopping: '#dca9f6',
  Entertainment: '#ffbc8f',
  Bills: '#f49bc5',
  Health: '#6fd9d4',
  Education: '#9ed9b3',
  Other: '#d7d0c5',
};

const CATEGORY_ICONS = {
  Food: 'FD',
  Transport: 'TR',
  Shopping: 'SH',
  Entertainment: 'EN',
  Bills: 'BL',
  Health: 'HL',
  Education: 'ED',
  Other: 'OT',
};

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

export default function ExpenseList({ expenses, onDelete, onEdit, variant = 'cards' }) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No expenses yet</p>
        <span>Add your first expense above</span>
      </div>
    );
  }

  if (variant === 'dashboard-table') {
    return (
      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Icon</span>
          <span>Category/Title</span>
          <span>Description</span>
          <span>Date</span>
          <span>Amount</span>
        </div>

        {expenses.map((expense) => {
          const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other;

          return (
            <div key={expense._id} className={styles.tableRow}>
              <div className={styles.iconCell}>
                <div className={styles.iconTile} style={{ backgroundColor: `${color}33`, color }}>
                  {CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Other}
                </div>
              </div>
              <div className={styles.primaryCell}>
                <span className={styles.categoryName}>{expense.category}</span>
                <span className={styles.inlineTitle}>
                  {expense.description ? ` - ${expense.description}` : ''}
                </span>
              </div>
              <div className={styles.descriptionCell}>
                {expense.description || 'Placeholder Description'}
              </div>
              <div className={styles.dateCell}>{formatDate(expense.date)}</div>
              <div className={styles.amountCell}>{formatAmount(expense.amount)}</div>
              {onDelete ? (
                <button className={styles.rowDelete} onClick={() => onDelete(expense._id)}>
                  Delete
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {expenses.map((expense) => {
        const color = CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.Other;

        return (
          <div key={expense._id} className={styles.item}>
            <div className={styles.icon} style={{ backgroundColor: `${color}26`, color }}>
              {CATEGORY_ICONS[expense.category] || CATEGORY_ICONS.Other}
            </div>
            <div className={styles.info}>
              <div className={styles.top}>
                <div>
                  <span className={styles.category}>{expense.category}</span>
                  {expense.description ? (
                    <span className={styles.description}> - {expense.description}</span>
                  ) : null}
                </div>
                <span className={styles.amount}>{formatAmount(expense.amount)}</span>
              </div>
              <div className={styles.meta}>
                <span className={styles.date}>{formatDate(expense.date)}</span>
                <div className={styles.actions}>
                  {onEdit ? (
                    <button onClick={() => onEdit(expense)} className={styles.editBtn}>
                      Edit
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button onClick={() => onDelete(expense._id)} className={styles.deleteBtn}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
