import { useState, useEffect } from 'react';

/**
 * Хук, що затримує показ індикатора завантаження, щоб уникнути "блимання" при швидкому інтернеті/підвантаженні.
 * @param {boolean} isLoading - Поточний стан завантаження
 * @param {number} delay - Затримка в мілісекундах (за замовчуванням 300)
 */
export const useDelayedLoader = (isLoading, delay = 300) => {
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      // Якщо завантаження почалося, заводимо таймер
      timer = setTimeout(() => setShowLoader(true), delay);
    } else {
      // Якщо завантаження завершилось (дуже швидко або після лоадера), миттєво ховаємо
      setShowLoader(false);
    }

    // Очищаємо таймер, якщо компонент демонтувався або isLoading змінився занадто швидко
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  return showLoader;
};