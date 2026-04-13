'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  if (pathname === '/login') {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logo}>ET</div>
          <span className={styles.brandText}>Expense Tracker</span>
        </div>

        <div className={styles.links}>
          <Link href="/" className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link href="/expenses" className={`${styles.link} ${pathname === '/expenses' ? styles.active : ''}`}>
            Expenses
          </Link>
          <Link href="/summary" className={`${styles.link} ${pathname === '/summary' ? styles.active : ''}`}>
            Summary
          </Link>
          <Link href="/chat" className={`${styles.link} ${pathname === '/chat' ? styles.active : ''}`}>
            AI Chat
          </Link>
        </div>

        {isAuthenticated ? (
          <div className={styles.account}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userEmail}>{user?.email}</span>
            </div>
            <div className={styles.avatar}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <button type="button" className={styles.logoutBtn} onClick={logout}>
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
