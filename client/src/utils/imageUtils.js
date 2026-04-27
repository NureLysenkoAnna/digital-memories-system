import imageCompression from 'browser-image-compression';

/**
 * Функція для стиснення одного зображення
 * @param {File} file - Оригінальний файл
 * @param {Object} customOptions - Додаткові налаштування (необов'язково)
 * @returns {Promise<File>} - Повертає стиснутий файл (або оригінал, якщо сталась помилка)
 */
export const compressSingleImage = async (file, customOptions = {}) => {
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
  };

  const options = { ...defaultOptions, ...customOptions };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error("Помилка стиснення утилітою:", error);
    return file; // Повертаємо оригінал (резервний варіант)
  }
};