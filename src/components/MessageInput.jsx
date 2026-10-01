import { useState } from "react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Введите сообщение..."
        disabled={disabled}
        style={styles.input}
        autoFocus
      />
      <button
        type="submit"
        disabled={!canSend}
        style={{
          ...styles.button,
          opacity: canSend ? 1 : 0.4,
          cursor: canSend ? "pointer" : "not-allowed",
        }}
        aria-label="Отправить"
      >
        →
      </button>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    background: "#fff",
    borderTop: "1px solid #e0e0e0",
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 20,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "#4f8cff",
    color: "#fff",
    fontSize: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
};
