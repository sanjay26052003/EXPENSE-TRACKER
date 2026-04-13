'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import styles from './page.module.css';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
};

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await register(form);
      } else {
        await login({ email: form.email, password: form.password });
      }
    } catch (submitError) {
      setError(submitError.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.copy}>
          <span className={styles.kicker}>Local Login</span>
          <h1 className={styles.title}>Keep your expenses behind a real sign-in.</h1>
          <p className={styles.subtitle}>
            Create a local account once, then use it to access your dashboard, summaries, and chat.
          </p>
        </div>

        <div className={styles.card}>
          <div className={styles.modeSwitch}>
            <button
              type="button"
              className={mode === 'login' ? styles.activeMode : styles.modeBtn}
              onClick={() => setMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === 'register' ? styles.activeMode : styles.modeBtn}
              onClick={() => setMode('register')}
            >
              Register
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className={styles.field}>
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField('name', event.target.value)}
                  placeholder="Sanjay"
                  required
                />
              </label>
            ) : null}

            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                placeholder="Minimum 6 characters"
                required
              />
            </label>

            {error ? <p className={styles.error}>{error}</p> : null}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
