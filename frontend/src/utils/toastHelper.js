/**
 * Resolves localized notification message.
 * When language is 'en', if backendMsg contains Vietnamese text, fallback to fallbackEn.
 */
export function getToastMsg(backendMsg, fallbackEn, fallbackVi, language = 'en') {
  if (language === 'en') {
    if (!backendMsg || /[\u00C0-\u1EF9]/.test(backendMsg)) {
      return fallbackEn;
    }
    return backendMsg;
  }
  return backendMsg || fallbackVi;
}
