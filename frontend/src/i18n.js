import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Dummy translations for MVP
const resources = {
  en: {
    translation: {
      "Welcome": "Welcome",
      "Dashboard": "Dashboard"
    }
  },
  fr: {
    translation: {
      "Welcome": "Bienvenue",
      "Dashboard": "Tableau de bord"
    }
  },
  es: {
    translation: {
      "Welcome": "Bienvenido",
      "Dashboard": "Tablero"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

export default i18n;
