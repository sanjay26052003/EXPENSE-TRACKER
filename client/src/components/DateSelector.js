import styles from './DateSelector.module.css';

export default function DateSelector({ value, onChange }) {
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const [year, month] = (value || '').split('-');

  function handleMonthChange(e) {
    const m = e.target.value;
    const y = year || currentYear.toString();
    onChange(`${y}-${m}`);
  }

  function handleYearChange(e) {
    const y = e.target.value;
    const m = month || '01';
    onChange(`${y}-${m}`);
  }

  return (
    <div className={styles.selector}>
      <select value={year || currentYear} onChange={handleYearChange} className={styles.select}>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select value={month || '01'} onChange={handleMonthChange} className={styles.select}>
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
