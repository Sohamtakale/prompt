import { useState, useEffect } from 'react';

interface LanguageToggleProps {
  onChange?: (lang: 'en' | 'hi') => void;
}

export default function LanguageToggle({ onChange }: LanguageToggleProps) {
  const [lang, setLang] = useState<'en' | 'hi'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('votewise-lang') as 'en' | 'hi') || 'en';
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('votewise-lang', lang);
    onChange?.(lang);
  }, [lang, onChange]);

  const toggle = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  return (
    <button
      role="switch"
      aria-checked={lang === 'hi'}
      aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
      onClick={toggle}
      className="relative flex items-center gap-1 px-3 py-1.5 bg-surface-raised border border-surface-overlay rounded-full text-sm font-medium transition-all hover:border-accent/40 cursor-pointer"
    >
      <span
        className={`transition-colors duration-200 ${
          lang === 'en' ? 'text-accent font-bold' : 'text-text-muted'
        }`}
      >
        EN
      </span>
      <span className="text-text-muted">/</span>
      <span
        className={`transition-colors duration-200 ${
          lang === 'hi' ? 'text-accent font-bold' : 'text-text-muted'
        }`}
      >
        हि
      </span>
    </button>
  );
}
