import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('preferred_language', selectedLanguage);
  };

  return (
    <div className="flex items-center gap-2 bg-neutral-800 text-amber-100/80 px-3 py-2 rounded-sm border border-amber-700/40 shadow-md">
      <Globe className="w-4 h-4 text-yellow-500" />
      <select
        value={i18n.language || 'en'}
        onChange={handleLanguageChange}
        className="bg-transparent border-none text-xs font-bold font-playfair tracking-wide cursor-pointer focus:outline-none text-amber-100"
        aria-label={t('select_language')}
      >
        <option value="en" className="bg-neutral-800 text-amber-100">English</option>
        <option value="hi" className="bg-neutral-800 text-amber-100">हिन्दी</option>
        <option value="es" className="bg-neutral-800 text-amber-100">Español</option>
        <option value="fr" className="bg-neutral-800 text-amber-100">Français</option>
        <option value="ar" className="bg-neutral-800 text-amber-100">العربية</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
