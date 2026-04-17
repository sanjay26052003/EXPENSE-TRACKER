'use client';

import { useEffect, useRef, useState } from 'react';
import ChatMessage from '@/components/ChatMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/lib/api';
import styles from './page.module.css';

const SUGGESTIONS = [
  'How much did I spend this month?',
  'Compare this month with last month',
  'What are my top spending categories?',
  'Show me my latest expenses',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content:
        'Ask about totals, category spending, recent expenses, or period comparisons. I will answer from your recorded data.',
      structuredData: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) {
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question, structuredData: null }]);
    setLoading(true);

    try {
      const response = await api.askAI(question);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: response.data.answer,
          structuredData: {
            intent: response.data.query?.intent,
            period: response.data.periodLabel,
            grandTotal: response.data.grandTotal,
            summaryData: response.data.summaryData,
            topCategories: response.data.topCategories,
            expenseData: response.data.expenseData,
            expenseCount: response.data.expenseCount,
            currentTotal: response.data.currentTotal,
            previousTotal: response.data.previousTotal,
            percentChange: response.data.percentChange,
          },
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `I couldn't complete that request. ${err.message || 'Please try again.'}`,
          structuredData: null,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>AI assistant</span>
          <h1 className={styles.title}>Ask in plain English. Get actual expense answers back.</h1>
          <p className={styles.subtitle}>
            The chat can summarize totals, surface top categories, compare periods, and pull recent transactions without manual filtering.
          </p>
        </div>
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() =>
            setMessages([
              {
                role: 'ai',
                content:
                  'Ask about totals, category spending, recent expenses, or period comparisons. I will answer from your recorded data.',
                structuredData: null,
              },
            ])
          }
          disabled={loading}
        >
          Clear chat
        </button>
      </section>

      <section className={styles.suggestions}>
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className={styles.suggestion}
            onClick={() => setInput(suggestion)}
            disabled={loading}
          >
            {suggestion}
          </button>
        ))}
      </section>

      <section className={styles.chatShell}>
        <div className={styles.messages}>
          {messages.map((message, index) => (
            <ChatMessage
              key={`${message.role}-${index}`}
              role={message.role}
              content={message.content}
              structuredData={message.structuredData}
            />
          ))}
          {loading ? (
            <div className={styles.loadingRow}>
              <LoadingSpinner message="Analyzing your data..." />
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputWrap}>
          <textarea
            className={styles.input}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about totals, categories, recent expenses, or comparisons..."
            rows={3}
            disabled={loading}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </section>
    </div>
  );
}
