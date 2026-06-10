import i18n from '../i18n';

export const getUserFriendlyError = (errMessage) => {
  if (!errMessage) return i18n.t('client_errors.unknown');
  
  const strErr = String(errMessage);
  const lowerErr = strErr.toLowerCase();

  if (lowerErr.includes('failed to fetch') || lowerErr.includes('network error')) {
    return i18n.t('client_errors.network');
  }
  if (lowerErr.includes('unauthorized') || (lowerErr.includes('token') && !lowerErr.includes('reset_token'))) {
    return i18n.t('server_errors.AUTH_TOKEN_INVALID');
  }
  if (lowerErr.includes('not found')) {
    return i18n.t('client_errors.not_found');
  }
  
  // Якщо помилка не підпадає під жодну з категорій, повертаємо її як є
  return i18n.t(`server_errors.${strErr}`, { defaultValue: strErr });
};