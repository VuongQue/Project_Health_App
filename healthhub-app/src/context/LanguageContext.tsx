import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import '../i18n';

export type Language = 'vi' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  isVietnamese: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'vi',
  setLanguage: async () => {},
  isVietnamese: true,
});

const LANG_KEY = '@app_language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLang] = useState<Language>('vi');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((stored) => {
      const lang = (stored === 'en' ? 'en' : 'vi') as Language;
      setLang(lang);
      i18n.changeLanguage(lang);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLang(lang);
    await AsyncStorage.setItem(LANG_KEY, lang);
    await i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isVietnamese: language === 'vi' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
