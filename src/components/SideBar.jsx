import { useState, useEffect } from "react";
import { checkAccount, getContactInfo, getChatHistory } from "../api/greenApi";
import {
  validatePhone,
  mapHistoryToMessages,
  buildContactDisplay,
} from "../libs/utils";
import ContactAvatar from "./ContactAvatar";

export default function Sidebar({
  chats,
  activeChatId,
  credentials,
  onSelectChat,
  onCreateChat,
  onLogout,
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (inputError) setInputError("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneNumber]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setInputError("");

    const validation = validatePhone(phoneNumber);
    if (!validation.valid) {
      setInputError(validation.reason);
      return;
    }
    const normalized = validation.normalized;

    const existing = chats.find((c) => c.phoneNumber === normalized);
    if (existing) {
      onSelectChat(existing.chatId);
      setPhoneNumber("");
      return;
    }

    setLoading(true);

    try {
      const account = await checkAccount({
        ...credentials,
        phoneNumber: normalized,
      });

      if (!account.exist) {
        setInputError("На этом номере нет аккаунта MAX");
        return;
      }

      const chatId = account.chatId;

      const [contactInfo, history] = await Promise.all([
        getContactInfo({ ...credentials, chatId }),
        getChatHistory({ ...credentials, chatId, count: 10 }),
      ]);

      const display = buildContactDisplay({
        contactInfo,
        fallbackPhone: normalized,
      });
      
      const messages = mapHistoryToMessages(history);

      onCreateChat({
        chatId,
        phoneNumber: normalized,
        contact: display, // { name, avatar, letter, chatType, isBot, isGroup }
        messages,
      });

      setPhoneNumber("");
    } catch (err) {
      setInputError(err.message || "Не удалось создать чат");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.title}>MAX Чат</div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          Выйти
        </button>
      </header>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="79991234567"
          style={styles.phoneInput}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !phoneNumber}
          style={{
            ...styles.createBtn,
            opacity: !loading && phoneNumber ? 1 : 0.5,
            cursor: !loading && phoneNumber ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Загрузка..." : "Создать чат"}
        </button>
        {inputError && <div style={styles.error}>{inputError}</div>}
      </form>

      <div style={styles.chatList}>
        {chats.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyText}>Нет чатов</p>
            <p style={styles.emptyHint}>Введите номер телефона, чтобы начать</p>
          </div>
        ) : (
          chats.map((chat) => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isActive = chat.chatId === activeChatId;

            return (
              <button
                key={chat.chatId}
                onClick={() => onSelectChat(chat.chatId)}
                style={{
                  ...styles.chatItem,
                  background: isActive ? "#e8f0fe" : "transparent",
                }}
              >
                <ContactAvatar
                  avatar={chat.contact?.avatar}
                  letter={chat.contact?.letter}
                  size={40}
                />
                <div style={styles.chatInfo}>
                  <div style={styles.chatNameRow}>
                    <span style={styles.chatName}>
                      {chat.contact?.name || chat.phoneNumber}
                    </span>
                    {chat.contact?.isBot && (
                      <span style={styles.botBadge}>бот</span>
                    )}
                  </div>
                  <div style={styles.chatPreview}>
                    {lastMsg
                      ? (lastMsg.direction === "outgoing" ? "Вы: " : "") +
                        lastMsg.text
                      : "Нет сообщений"}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid #e0e0e0",
    flexShrink: 0,
  },
  title: { fontSize: 16, fontWeight: 600, color: "#1a1a1a" },
  logoutBtn: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid #ddd",
    background: "#fff",
    color: "#666",
    fontSize: 12,
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "12px 16px",
    borderBottom: "1px solid #e0e0e0",
    flexShrink: 0,
  },
  phoneInput: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  createBtn: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "none",
    background: "#4f8cff",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    transition: "opacity 0.15s",
  },
  error: { color: "#e53935", fontSize: 12 },
  chatList: { flex: 1, overflowY: "auto", padding: "4px 0" },
  chatItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 16px",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s",
  },
  chatInfo: { flex: 1, minWidth: 0 },
  chatNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  chatName: {
    fontSize: 14,
    fontWeight: 500,
    color: "#1a1a1a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  botBadge: {
    fontSize: 10,
    padding: "1px 6px",
    borderRadius: 8,
    background: "#e3f2fd",
    color: "#1976d2",
    fontWeight: 600,
    flexShrink: 0,
  },
  chatPreview: {
    fontSize: 12,
    color: "#888",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  empty: { padding: "32px 16px", textAlign: "center", color: "#999" },
  emptyText: { margin: 0, fontSize: 14 },
  emptyHint: { marginTop: 6, fontSize: 12 },
};
