/**
 * Валидация номера: должен быть 11 цифр и начинаться с 7
 */
export function validatePhone(phone) {
  if (isNaN(+phone)) {
    return { valid: false, reason: "Номер должен содержать только цифры" };
  }
  if (phone.length !== 11) {
    return { valid: false, reason: "Номер должен содержать 11 цифр" };
  }
  if (!phone.startsWith("7") && !phone.startsWith("8")) {
    return { valid: false, reason: "Номер должен начинаться с 7" };
  }

  return { valid: true, normalized: "7" + phone.slice(1) };
}

/**
 * Формирование отображаемых данных контакта по приоритету:
 *   1. Имя: contactName → name → phoneNumber
 *   2. Буква для аватара: первая буква имени → последняя цифра телефона
 *   3. Тип: user | bot → бейдж
 */
export function buildContactDisplay({ contactInfo, fallbackPhone }) {
  const name =
    contactInfo?.contactName?.trim() ||
    contactInfo?.name?.trim() ||
    contactInfo?.phoneNumber?.toString() ||
    fallbackPhone ||
    "Без имени";

  const avatar = contactInfo?.avatar || null;

  // Буква для фолбэка аватара
  const letter = (() => {
    if (contactInfo?.contactName?.trim()) {
      return contactInfo.contactName.trim()[0].toUpperCase();
    }
    if (contactInfo?.name?.trim()) {
      return contactInfo.name.trim()[0].toUpperCase();
    }
    // последняя цифра номера
    const digits = (
      contactInfo?.phoneNumber?.toString() ||
      fallbackPhone ||
      ""
    ).replace(/\D/g, "");
    return digits ? digits.slice(-1) : "?";
  })();

  const chatType = contactInfo?.chatType || "user";
  const isBot = chatType === "bot";
  const isGroup = chatType === "group";

  return {
    name,
    avatar,
    letter,
    chatType,
    isBot,
    isGroup,
  };
}

/**
 * Преобразование ответа getChatHistory в формат UI — без изменений
 */
export function mapHistoryToMessages(history) {
  if (!Array.isArray(history)) return [];

  return history
    .map((item) => {
      const text =
        item.textMessage ||
        item.textMessageData?.textMessage ||
        item.caption ||
        "";
      if (!text) return null;

      return {
        id: item.idMessage || `${item.timestamp}-${Math.random()}`,
        text,
        direction: item.type === "outgoing" ? "outgoing" : "incoming",
        timestamp: item.timestamp,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);
}
