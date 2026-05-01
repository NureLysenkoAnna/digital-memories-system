const sendSafeError = (res, error, defaultStatusCode = 400) => {
  // Завжди логується справжню (технічну) помилку в консоль сервера
  console.error('[System Error]:', error);

  // чи є повідомлення безпечним кодом зі словника (лише A-Z та _)
  const isSafeCode = /^[A-Z_]+$/.test(error.message);

  if (isSafeCode) {
    return res.status(defaultStatusCode).json({ error: error.message });
  }

  // Якщо це системна помилка (SQL, мережа і т.д.), вона приховується за загальним кодом
  return res.status(500).json({ error: 'SERVER_ERROR' });
};

module.exports = { sendSafeError };