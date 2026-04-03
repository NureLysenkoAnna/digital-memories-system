export const getUserFriendlyError = (errMessage) => {
  if (!errMessage) return 'Виникла невідома помилка. Спробуйте оновити сторінку.';
  
  const lowerErr = String(errMessage).toLowerCase();

  if (lowerErr.includes('failed to fetch') || lowerErr.includes('network error')) {
    return 'Не вдалося з\'єднатися з сервером. Будь ласка, перевірте інтернет-з\'єднання або спробуйте пізніше.';
  }
  if (lowerErr.includes('unauthorized') || lowerErr.includes('token')) {
    return 'Час вашої сесії минув або доступ заборонено. Будь ласка, увійдіть в акаунт знову.';
  }
  if (lowerErr.includes('not found')) {
    return 'Запитувану інформацію не знайдено. Можливо, вона була видалена.';
  }
  
  // Якщо помилка не підпадає під жодну з категорій, повертаємо її як є
  return errMessage;
};