import Link from 'next/link';
import styles from './Navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.brand}>
        <span className={styles.icon}>💰</span>
        <span>Expense Tracker</span>
      </div>
      <div className={styles.links}>
        <Link href="/" className={styles.link}>Dashboard</Link>
        <Link href="/expenses" className={styles.link}>Expenses</Link>
        <Link href="/summary" className={styles.link}>Summary</Link>
        <Link href="/chat" className={styles.link}>AI Chat</Link>
      </div>
    </nav>
  );
}
