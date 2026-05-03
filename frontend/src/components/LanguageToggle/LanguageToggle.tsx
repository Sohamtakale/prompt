import { useLanguage } from '../../context/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang, isTranslating } = useLanguage();

  const toggle = () => setLang(lang === 'en' ? 'hi' : 'en');

  return (
    <button
      role="switch"
      aria-checked={lang === 'hi'}
      aria-label={lang === 'en' ? 'Switch to Hindi' : 'Switch to English'}
      onClick={toggle}
      disabled={isTranslating}
      className="relative flex items-center gap-1 px-3 py-1.5 bg-surface-raised border border-surface-overlay rounded-full text-sm font-medium transition-all hover:border-accent/40 cursor-pointer disabled:opacity-60"
    >
      {isTranslating ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      ) : null}
      <span className={`transition-colors duration-200 ${lang === 'en' ? 'text-accent font-bold' : 'text-text-muted'}`}>
        EN
      </span>
      <span className="text-text-muted">/</span>
      <span className={`transition-colors duration-200 ${lang === 'hi' ? 'text-accent font-bold' : 'text-text-muted'}`}>
        हि
      </span>
    </button>
  );
}
