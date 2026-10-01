import { API_URL } from "../libs/config";

/**
 * Проверка состояния инстанса
 * GET /waInstance{idInstance}/getStateInstance/{apiTokenInstance}
 */
export async function getStateInstance({ idInstance, apiTokenInstance }) {
  const url = `${API_URL}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`;
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Неверные учётные данные GREEN-API");
    }
    if (response.status === 404) {
      throw new Error("Инстанс не найден. Проверьте idInstance");
    }
    throw new Error(`Ошибка проверки инстанса: ${response.status}`);
  }

  return response.json();
}

/**
 * Проверка наличия аккаунта MAX на номере
 * POST /waInstance{idInstance}/checkAccount/{apiTokenInstance}
 *
 * Тело: { phoneNumber: "79991234567", force?: boolean }
 * Ответ:
 *   { exist: true,  chatId: "10000000", fromCache: true }
 *   { exist: false, chatId: "",        fromCache: false }
 *   { status: false, reason: "instance is starting or not authorized" }
 *   { status: false, reason: "User get contact info limit reached" }
 */
export async function checkAccount({
  idInstance,
  apiTokenInstance,
  phoneNumber,
  force = false,
}) {
  const url = `${API_URL}/waInstance${idInstance}/checkAccount/${apiTokenInstance}`;

  const body = { phoneNumber: String(phoneNumber) };
  if (force) body.force = true;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // 469 — лимит запросов на разные номера
  if (response.status === 469) {
    throw new Error(
      "Превышен лимит проверок номеров. Приостановите проверки на 2 часа.",
    );
  }

  // 400 — валидация (неверный формат, таймаут)
  if (response.status === 400) {
    const errorText = await response.text();
    if (/timeout limit exceeded/i.test(errorText)) {
      throw new Error("Превышен лимит времени ожидания проверки номера");
    }
    if (/valid 11 or 12 digits/i.test(errorText)) {
      throw new Error(
        "Неверный формат номера: нужно 11 или 12 цифр (7 или 375)",
      );
    }
    throw new Error(`Ошибка валидации номера: ${errorText}`);
  }

  if (!response.ok) {
    throw new Error(`Ошибка проверки аккаунта: ${response.status}`);
  }

  const data = await response.json();

  // Ошибки, которые приходят с HTTP 200
  if (data.status === false) {
    if (/not authorized|starting/i.test(data.reason || "")) {
      throw new Error("Инстанс не авторизован или запускается");
    }
    if (/limit reached/i.test(data.reason || "")) {
      throw new Error(
        "Превышен лимит проверок номеров. Повторите через 2 часа.",
      );
    }
    throw new Error(data.reason || "Не удалось проверить аккаунт");
  }

  return data; // { exist, chatId, fromCache }
}

/**
 * Получение истории чата
 * POST /waInstance{idInstance}/getChatHistory/{apiTokenInstance}
 *
 * Тело: { chatId: "10000000", count: 10 }
 * Ответ: массив сообщений
 */
export async function getChatHistory({
  idInstance,
  apiTokenInstance,
  chatId,
  count = 10,
}) {
  const url = `${API_URL}/waInstance${idInstance}/getChatHistory/${apiTokenInstance}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, count }),
  });

  if (!response.ok) {
    // История может быть недоступна — не критично
    console.warn(`getChatHistory failed: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Отправка текстового сообщения
 */
export async function sendMessage({
  idInstance,
  apiTokenInstance,
  chatId,
  message,
}) {
  const url = `${API_URL}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Ошибка отправки: ${response.status}`);
  }

  return response.json();
}

/**
 * Получение уведомления
 */
export async function receiveNotification({
  idInstance,
  apiTokenInstance,
  signal,
}) {
  const url = `${API_URL}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}?receiveTimeout=30`;
  const response = await fetch(url, { signal });
  if (!response.ok) return null;

  const text = await response.text();
  if (!text || text === "null") return null;
  return JSON.parse(text);
}

/**
 * Удаление уведомления
 */
export async function deleteNotification({
  idInstance,
  apiTokenInstance,
  receiptId,
}) {
  const url = `${API_URL}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${receiptId}`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) return null;
  return response.json();
}

/**
 * Получение информации о контакте
 * POST /waInstance{idInstance}/getContactInfo/{apiTokenInstance}
 *
 * Тело: { chatId: "10000000" }
 * Ответ:
 *   {
 *     avatar: "https://...",
 *     name: "Ходабрыш Пробешёлов",       // имя из профиля MAX
 *     contactName: "Ходабрыш",           // имя из контактной книги
 *     chatId: "10000000",
 *     chatType: "user" | "group" | "channel" | "bot",
 *     lastSeen: 1754632014 | null,
 *     phoneNumber: 79876543210 | 0,
 *     phoneNumberTimestamp: 1782133087
 *   }
 */
export async function getContactInfo({ idInstance, apiTokenInstance, chatId }) {
  const url = `${API_URL}/waInstance${idInstance}/getContactInfo/${apiTokenInstance}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId }),
  });

  if (!response.ok) {
    // Не критично: без инфо контакта чат всё равно создаём
    console.warn(`getContactInfo failed: ${response.status}`);
    return null;
  }

  const data = await response.json();

  // Защита от неожиданных ответов (например, group chat)
  if (!data || typeof data !== "object" || !data.chatId) {
    return null;
  }

  return data;
}
