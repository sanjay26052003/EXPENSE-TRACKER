import styles from './ChatMessage.module.css';
import StructuredDataRenderer from './StructuredDataRenderer';

export default function ChatMessage({ role, content, structuredData }) {
  const isUser = role === 'user';

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.ai}`}>
      <div className={styles.avatar}>{isUser ? 'You' : 'AI'}</div>
      <div className={styles.bubble}>
        <p>{content}</p>
        {!isUser && structuredData && (
          <StructuredDataRenderer data={structuredData} />
        )}
      </div>
    </div>
  );
}
