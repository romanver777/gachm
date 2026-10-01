import { useState } from "react";
import { getStateInstance } from "../api/greenApi";
import { INSTANCE_MESSAGES } from "../libs/config";

export default function AuthScreen({ onAuth }) {
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedId = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();

    if (!trimmedId || !trimmedToken) {
      setError("Заполните оба поля");
      return;
    }

    if (!/^\d+$/.test(trimmedId)) {
      setError("idInstance должен содержать только цифры");
      return;
    }

    setLoading(true);

    try {
      const { stateInstance } = await getStateInstance({
        idInstance: trimmedId,
        apiTokenInstance: trimmedToken,
      });

      if (stateInstance !== "authorized") {
        const message =
          INSTANCE_MESSAGES[stateInstance] ||
          `Инстанс в состоянии "${stateInstance}". Обратитесь в поддержку.`;
        setError(message);
        return;
      }

      onAuth({
        idInstance: trimmedId,
        apiTokenInstance: trimmedToken,
      });
    } catch (err) {
      setError(err.message || "Не удалось подключиться к GREEN-API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>MAX Чат</h1>
        <p style={styles.subtitle}>Введите учётные данные GREEN-API</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            idInstance
            <input
              type="text"
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              placeholder="Например: 3100227506"
              style={styles.input}
              disabled={loading}
              autoComplete="off"
            />
          </label>

          <label style={styles.label}>
            apiTokenInstance
            <input
              type="password"
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              placeholder="Ваш токен доступа"
              style={styles.input}
              disabled={loading}
              autoComplete="off"
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Проверка..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f0f2f5",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 32,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    color: "#666",
    fontSize: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "#333",
  },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  button: {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    background: "#4f8cff",
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    color: "#e53935",
    fontSize: 13,
    padding: "8px 12px",
    background: "#ffebee",
    borderRadius: 6,
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
};
