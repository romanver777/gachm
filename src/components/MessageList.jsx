import { useEffect, useRef } from "react";

export default function MessageList({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>Нет сообщений</p>
        <p style={styles.emptyHint}>Напишите первое сообщение</p>
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            ...styles.messageRow,
            justifyContent:
              msg.direction === "outgoing" ? "flex-end" : "flex-start",
          }}
        >
          <div
            style={{
              ...styles.bubble,
              background: msg.direction === "outgoing" ? "#4f8cff" : "#fff",
              color: msg.direction === "outgoing" ? "#fff" : "#1a1a1a",
              borderRadius:
                msg.direction === "outgoing"
                  ? "12px 12px 2px 12px"
                  : "12px 12px 12px 2px",
            }}
          >
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

const styles = {
  list: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  messageRow: {
    display: "flex",
    width: "100%",
  },
  bubble: {
    maxWidth: "75%",
    padding: "10px 14px",
    fontSize: 14,
    lineHeight: 1.4,
    wordBreak: "break-word",
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
  },
  emptyText: {
    fontSize: 15,
    margin: 0,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 4,
  },
};
