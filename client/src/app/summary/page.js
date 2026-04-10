'use client';

import { useState, useEffect } from 'react';
import ExpenseSummary from '@/components/ExpenseSummary';
import DateSelector from '@/components/DateSelector';
import api from '@/lib/api';
import styles from './page.module.css';

export default function SummaryPage() {
  const [summary, setSummary] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  async function fetchSummary() {
    setLoading(true);
    try {
      const data = await api.getSummary(selectedMonth);
      setSummary(data.data?.summary || []);
      setGrandTotal(data.data?.grandTotal || 0);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Summary</h1>
        <DateSelector value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {loading ? (
        <p className={styles.loading}>Loading summary...</p>
      ) : (
        <ExpenseSummary summary={summary} grandTotal={grandTotal} />
      )}
    </div>
  );
}
