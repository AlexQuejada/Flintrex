import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'en', label: 'EN', flag: '🇺🇸' },
];

const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const toggleLanguage = () => {
    const currentIdx = languages.findIndex(l => l.code === i18n.language);
    const nextIdx = (currentIdx + 1) % languages.length;
    i18n.changeLanguage(languages[nextIdx].code);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200"
      title={currentLang.code === 'es' ? t('languageSelector.switchToEn') : t('languageSelector.switchToEs')}
    >
      <span className="text-base">{currentLang.flag}</span>
      <span>{currentLang.label}</span>
    </button>
  );
};

export default LanguageSelector;
