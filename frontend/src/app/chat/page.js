'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/components/ChatMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/lib/api';
import styles from './page.module.css';

const SUGGESTIONS = [
  'How much did I spend on food this month?',
  'Show me my expenses last week',
  'What are my top spending categories?',
  'What was my total spending last month?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content:
        "Hi! I'm your AI expense assistant. Ask me anything about your spending — like 'How much did I spend on food this month?' or 'Show me last week's expenses.'",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const data = await api.askAI(question);
      setMessages((prev) => [...prev, { role: 'ai', content: data.data.answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `Sorry, I couldn't process that. ${err.message}. Make sure the backend server and ANTHROPIC_API_KEY are configured.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>AI Expense Assistant</h1>
        <p className={styles.subtitle}>Ask questions about your expenses in plain English</p>
      </div>

      <div className={styles.suggestions}>
        <span className={styles.suggestLabel}>Try asking:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className={styles.suggestBtn}
            onClick={() => setInput(s)}
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      <div className={styles.chatBox}>
        <div className={styles.messages}>
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {loading && (
            <div className={styles.loadingWrapper}>
              <LoadingSpinner message="Thinking..." />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className={styles.inputArea}>
          <textarea
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your expenses..."
            rows={2}
            disabled={loading}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
