/**
 * Helper to retrieve localized name for Category or Template based on user profile language selection
 * @param {Object} item - Category or Template object
 * @param {string} currentLang - Active language code (e.g. 'en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn', 'pa', 'ml')
 * @returns {string} - Localized string or default name
 */
export function getLocalizedName(item, currentLang) {
  if (!item) return '';
  const lang = (currentLang || 'en').toLowerCase().split('-')[0];

  // Check nameTranslations or titleTranslations
  const translations = item.nameTranslations || item.titleTranslations;
  if (translations) {
    let val = null;
    if (typeof translations.get === 'function') {
      val = translations.get(lang);
    } else if (typeof translations === 'object') {
      val = translations[lang];
    }
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }

  return item.name || item.title || '';
}
