import { useState, useEffect, useRef, useCallback } from "react";
import ASidebar from "./ASidebar.jsx";
import ChatArea from "./ChatArea";
import { useIsMobile } from "../hooks/useMediaQuery";
import {
  receiveNotification,
  deleteNotification,
  getContactInfo,
} from "../api/greenApi";
import { buildContactDisplay } from "../libs/utils.js";

export default function Messenger({ credentials, onLogout }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMobile = useIsMobile();

  // Ref для доступа к актуальному chats внутри polling без пересоздания цикла
  const chatsRef = useRef(chats);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  const activeChat = chats.find((c) => c.chatId === activeChatId) || null;

  const handleCreateChat = useCallback(
    ({ chatId, phoneNumber, contact, messages }) => {
      setChats((prev) => {
        const existing = prev.find((c) => c.chatId === chatId);
        if (existing) {
          return prev.map((c) =>
            c.chatId === chatId
              ? {
                  ...c,
                  contact: contact || c.contact,
                  messages: c.messages.length === 0 ? messages : c.messages,
                }
              : c,
          );
        }
        return [...prev, { chatId, phoneNumber, contact, messages }];
      });
      setActiveChatId(chatId);
      if (isMobile) setSidebarOpen(false);
    },
    [isMobile],
  );

  const handleSelectChat = useCallback(
    (chatId) => {
      setActiveChatId(chatId);
      if (isMobile) setSidebarOpen(false);
    },
    [isMobile],
  );

  const addMessage = useCallback((chatId, message) => {
    setChats((prev) =>
      prev.map((c) =>
        c.chatId === chatId ? { ...c, messages: [...c.messages, message] } : c,
      ),
    );
  }, []);

  const updateChatContact = useCallback((chatId, contact) => {
    setChats((prev) =>
      prev.map((c) => (c.chatId === chatId ? { ...c, contact } : c)),
    );
  }, []);

  const handleUnknownSender = useCallback(
    (senderChatId, senderData) => {
      const senderPhone =
        senderData?.sender?.replace("@c.us", "") ||
        senderChatId.replace("@c.us", "");

      const fallbackName = senderData?.senderName?.trim() || senderPhone;
      const fallbackContact = {
        name: fallbackName,
        avatar: null,
        letter: (fallbackName[0] || "?").toUpperCase(),
        chatType: "user",
        isBot: false,
        isGroup: false,
      };

      setChats((prev) => {
        if (prev.some((c) => c.chatId === senderChatId)) return prev;
        return [
          ...prev,
          {
            chatId: senderChatId,
            phoneNumber: senderPhone,
            contact: fallbackContact,
            messages: [],
          },
        ];
      });

      getContactInfo({ ...credentials, chatId: senderChatId })
        .then((info) => {
          if (!info) return;
          const display = buildContactDisplay({
            contactInfo: info,
            fallbackPhone: senderPhone,
          });
          setChats((prev) =>
            prev.map((c) =>
              c.chatId === senderChatId ? { ...c, contact: display } : c,
            ),
          );
        })
        .catch(() => {});
    },
    [credentials],
  );

  const extractText = (body) =>
    body?.messageData?.textMessageData?.textMessage ||
    body?.messageData?.textMessage ||
    "";

  // Polling
  // useEffect должен запуститься один раз при монтировании
  // while-цикл который живёт до abort
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const runPolling = async () => {
      // Небольшая задержка, чтобы в StrictMode первый abort успел сработать
      await new Promise((r) => setTimeout(r, 0));

      if (cancelled || controller.signal.aborted) return;

      while (!cancelled && !controller.signal.aborted) {
        try {
          const notification = await receiveNotification({
            ...credentials,
            signal: controller.signal,
          });

          if (cancelled || controller.signal.aborted) return;

          if (!notification) {
            // Пустая очередь - короткая пауза
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }

          const { receiptId, body } = notification;

          if (
            body?.typeWebhook === "incomingMessageReceived" ||
            body?.typeWebhook === "outgoingMessageReceived"
          ) {
            const senderChatId = body.senderData?.chatId;
            const textMessage = extractText(body);

            if (senderChatId && textMessage) {
              const exists = chatsRef.current.some(
                (c) => c.chatId === senderChatId,
              );

              if (!exists) {
                handleUnknownSender(senderChatId, body.senderData);
              }

              const direction = body?.typeWebhook.includes("incoming")
                ? "incoming"
                : "outgoing";

              addMessage(senderChatId, {
                id: body.idMessage || Date.now().toString(),
                text: textMessage,
                direction,
                timestamp: body.timestamp || Math.floor(Date.now() / 1000),
              });
            }
          }

          await deleteNotification({ ...credentials, receiptId });
        } catch (err) {
          if (err.name === "AbortError") return;

          // Пауза перед retry
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    };

    runPolling();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [credentials, handleUnknownSender, addMessage]);

  return (
    <div style={styles.root}>
      {isMobile && sidebarOpen && (
        <div
          style={styles.backdrop}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {(!isMobile || sidebarOpen) && (
        <aside
          style={{
            ...styles.sidebar,
            ...(isMobile ? styles.sidebarMobile : {}),
          }}
        >
          <ASidebar
            chats={chats}
            activeChatId={activeChatId}
            credentials={credentials}
            onSelectChat={handleSelectChat}
            onCreateChat={handleCreateChat}
            onLogout={onLogout}
          />
        </aside>
      )}

      <main style={styles.main}>
        <ChatArea
          chat={activeChat}
          credentials={credentials}
          onOpenSidebar={() => setSidebarOpen(true)}
          onMessageSent={addMessage}
          onContactUpdate={updateChatContact}
          onLogout={onLogout}
          isMobile={isMobile}
        />
      </main>
    </div>
  );
}

const styles = {
  root: {
    position: "fixed",
    inset: 0,
    display: "flex",
    background: "#e9edf2",
    fontFamily: "system-ui, -apple-system, sans-serif",
    overflow: "hidden",
  },
  sidebar: {
    width: 340,
    flexShrink: 0,
    background: "#fff",
    borderRight: "1px solid #e0e0e0",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  sidebarMobile: {
    position: "fixed",
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 20,
    width: 300,
    boxShadow: "2px 0 12px rgba(0,0,0,0.15)",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    zIndex: 10,
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    height: "100%",
  },
};
