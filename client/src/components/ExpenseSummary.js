import styles from './ExpenseSummary.module.css';

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

export default function ExpenseSummary({ summary, grandTotal }) {
  if (!summary || summary.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No data to display</p>
      </div>
    );
  }

  function formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return (
    <div className={styles.container}>
      <div className={styles.totalCard}>
        <span className={styles.totalLabel}>Total Spending</span>
        <span className={styles.totalAmount}>{formatAmount(grandTotal)}</span>
      </div>

      <div className={styles.breakdown}>
        <h3 className={styles.title}>By Category</h3>
        {summary.map((item) => {
          const percentage = grandTotal > 0 ? (item.total / grandTotal) * 100 : 0;
          const color = CATEGORY_COLORS[item._id] || '#64748b';

          return (
            <div key={item._id} className={styles.row}>
              <div className={styles.rowLeft}>
                <span className={styles.dot} style={{ backgroundColor: color }} />
                <span className={styles.catName}>{item._id}</span>
                <span className={styles.catCount}>({item.count})</span>
              </div>
              <div className={styles.rowRight}>
                <span className={styles.catAmount}>{formatAmount(item.total)}</span>
                <span className={styles.percent}>{percentage.toFixed(1)}%</span>
              </div>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{ width: `${percentage}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
