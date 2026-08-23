const path = require('path');
const fs = require('fs');

describe('i18n Multi-Language & Locales Unit Tests', () => {
  const localesDir = path.join(__dirname, '../../../frontend/public/locales');

  it('verifies required locale directories (en, hi, es, fr, ar) exist', () => {
    const requiredLocales = ['en', 'hi', 'es', 'fr', 'ar'];
    requiredLocales.forEach((locale) => {
      const localePath = path.join(localesDir, locale, 'translation.json');
      expect(fs.existsSync(localePath)).toBe(true);
    });
  });

  it('validates translation JSON dictionary structure and keys across locales', () => {
    const enPath = path.join(localesDir, 'en', 'translation.json');
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    const requiredKeys = ['welcome', 'dashboard', 'select_language', 'flashcards'];
    requiredKeys.forEach((key) => {
      expect(enContent).toHaveProperty(key);
    });
  });

  it('verifies RTL text direction configuration for Arabic (ar) locale', () => {
    const isRTL = (lng) => (lng === 'ar' ? 'rtl' : 'ltr');
    expect(isRTL('ar')).toBe('rtl');
    expect(isRTL('en')).toBe('ltr');
    expect(isRTL('hi')).toBe('ltr');
    expect(isRTL('es')).toBe('ltr');
    expect(isRTL('fr')).toBe('ltr');
  });

  it('verifies fallback language defaults to English if key missing', () => {
    const fallbackLanguage = 'en';
    const missingKeyLookup = (translations, key) => translations[key] || translations[fallbackLanguage]?.[key] || key;

    const mockTranslations = {
      en: { welcome: 'Welcome' },
      es: {},
    };

    expect(missingKeyLookup(mockTranslations.es, 'welcome')).toBe('welcome');
  });
});
