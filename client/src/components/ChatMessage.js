import styles from './ChatMessage.module.css';

export default function ChatMessage({ role, content }) {
  const isUser = role === 'user';

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.ai}`}>
      <div className={styles.avatar}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className={styles.bubble}>
        <p>{content}</p>
      </div>
    </div>
  );
}
