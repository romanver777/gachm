import { useState, useEffect } from "react";
import AuthScreen from "./components/AuthScreen";
import Messenger from "./components/Messenger";
import { STORAGE_KEY } from "./libs/config";

export default function App() {
  const [credentials, setCredentials] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.idInstance && parsed?.apiTokenInstance) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setCredentials(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setInitializing(false);
    }
  }, []);

  const handleAuth = (creds) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
    setCredentials(creds);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCredentials(null);
  };

  if (initializing) {
    return <div style={styles.loading}>Загрузка...</div>;
  }

  return credentials ? (
    <Messenger credentials={credentials} onLogout={handleLogout} />
  ) : (
    <AuthScreen onAuth={handleAuth} />
  );
}

const styles = {
  loading: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "system-ui, sans-serif",
    color: "#666",
  },
};
