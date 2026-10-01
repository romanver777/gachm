import { useState } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ContactAvatar from "./ContactAvatar";
import { sendMessage } from "../api/greenApi";

export default function ChatArea({
  chat,
  credentials,
  onOpenSidebar,
  onMessageSent,
  onLogout,
  isMobile,
}) {
  const [sending, setSending] = useState(false);

  const handleSend = async (text) => {
    if (!chat || !text.trim()) return;
    setSending(true);

    try {
      const { idMessage } = await sendMessage({
        ...credentials,
        chatId: chat.chatId,
        message: text.trim(),
      });
      onMessageSent(chat.chatId, {
        id: idMessage || Date.now().toString(),
        text: text.trim(),
        direction: "outgoing",
        timestamp: Math.floor(Date.now() / 1000),
      });
    } catch (err) {
      if (/401|403|Неверные учётные данные/i.test(err.message)) {
        onLogout();
        return;
      }
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!chat) {
    return (
      <div style={styles.emptyState}>
        {isMobile && (
          <button
            onClick={onOpenSidebar}
            style={styles.burgerEmpty}
            aria-label="Меню"
          >
            ☰
          </button>
        )}
        <div style={styles.emptyInner}>
          <h2 style={styles.emptyTitle}>Выберите чат</h2>
          <p style={styles.emptySubtitle}>
            или создайте новый в боковой панели
          </p>
        </div>
      </div>
    );
  }

  const contact = chat.contact || {};
  const displayName = contact.name || chat.phoneNumber;
  const chatTypeLabel = contact.chatType;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        {isMobile && (
          <button
            onClick={onOpenSidebar}
            style={styles.burger}
            aria-label="Меню"
          >
            ☰
          </button>
        )}

        <ContactAvatar
          avatar={contact.avatar}
          letter={contact.letter}
          size={40}
        />

        <div style={styles.headerInfo}>
          <div style={styles.headerTitleRow}>
            <span style={styles.headerTitle}>{displayName}</span>
            {contact.isBot && <span style={styles.botBadge}>бот</span>}
          </div>
          <div style={styles.headerStatus}>{chatTypeLabel}</div>
        </div>
      </header>

      <MessageList messages={chat.messages} />
      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#e9edf2",
    minWidth: 0,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "4px 16px 5px",
    boxSizing: "border-box",
    height: 56,
    background: "#fff",
    borderBottom: "1px solid #e0e0e0",
    flexShrink: 0,
  },
  burger: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "none",
    background: "transparent",
    fontSize: 20,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerInfo: { flex: 1, justifyContent: "start", minWidth: 0 },
  headerTitleRow: { display: "flex", alignItems: "center", gap: 8 },
  headerTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#1a1a1a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  headerStatus: { display: "flex", fontSize: 12, color: "#4caf50" },
  botBadge: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 8,
    background: "#e3f2fd",
    color: "#1976d2",
    fontWeight: 600,
  },
  emptyState: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    background: "#e9edf2",
  },
  burgerEmpty: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 8,
    border: "none",
    background: "#fff",
    fontSize: 20,
    cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  emptyInner: { textAlign: "center", color: "#999" },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: "#555" },
  emptySubtitle: { marginTop: 6, fontSize: 14 },
};
