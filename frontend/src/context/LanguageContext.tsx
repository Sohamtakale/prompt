import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../services/api';

type Lang = 'en' | 'hi';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  translate: (text: string) => Promise<string>;
  isTranslating: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('votewise-lang') as Lang) || 'en'
  );
  const [isTranslating, setIsTranslating] = useState(false);

  const setLang = useCallback((newLang: Lang) => {
    localStorage.setItem('votewise-lang', newLang);
    setLangState(newLang);
  }, []);

  // Translates a string using the backend API; returns original on failure
  const translate = useCallback(async (text: string): Promise<string> => {
    if (lang === 'en' || !text.trim()) return text;
    setIsTranslating(true);
    try {
      const res = await api.translate(text, 'hi');
      return res.translated_text;
    } catch {
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, translate, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
