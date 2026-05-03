import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import type { MythCheckResponse, Verdict } from '../../types';
import SpeakButton from '../../components/SpeakButton/SpeakButton';
import { useLanguage } from '../../context/LanguageContext';

const MAX_CHARS = 500;

const verdictConfig: Record<Verdict, { badge: string; icon: string; label: string }> = {
  TRUE: { badge: 'badge-true', icon: '✓', label: 'True' },
  FALSE: { badge: 'badge-false', icon: '✗', label: 'False' },
  'PARTIALLY TRUE': { badge: 'badge-partial', icon: '~', label: 'Partially True' },
  UNVERIFIABLE: { badge: 'badge-unknown', icon: '?', label: 'Unverifiable' },
};

interface HistoryItem {
  claim: string;
  response: MythCheckResponse;
}

export default function MythCheckPage() {
  const { lang, translate } = useLanguage();
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MythCheckResponse | null>(null);
  const resultHeadingRef = useRef<HTMLSpanElement>(null);
  const [translatedExplanation, setTranslatedExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Re-translate explanation whenever language or result changes
  useEffect(() => {
    if (!result) return;
    if (lang === 'en') {
      setTranslatedExplanation(null);
      return;
    }
    translate(result.explanation).then(setTranslatedExplanation);
  }, [lang, result, translate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || claim.length < 5) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await api.mythCheck(claim);
      setResult(response);
      setHistory((prev) => [{ claim, response }, ...prev].slice(0, 5));
      setTimeout(() => resultHeadingRef.current?.focus(), 50);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to check claim. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setClaim(item.claim);
    setResult(item.response);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mb-4 drop-shadow-xl">
          Myth Check
        </h1>
        <p className="text-text-secondary text-xl max-w-2xl mx-auto font-light">
          Verify claims about Indian elections against ECI rules, the Constitution, and electoral law.
        </p>
      </header>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-12 animate-fade-in-up stagger-1">
        <div className="relative group">
          <label htmlFor="myth-claim" className="block text-sm font-bold tracking-wide uppercase text-accent-light mb-3 ml-1">
            Enter a claim to fact-check
          </label>
          <div className="relative">
             <textarea
              id="myth-claim"
              value={claim}
              onChange={(e) => setClaim(e.target.value.slice(0, MAX_CHARS))}
              placeholder="e.g., EVMs can be hacked remotely..."
              rows={5}
              maxLength={MAX_CHARS}
              className="w-full p-5 bg-surface-card border border-white/10 rounded-2xl text-text-primary text-lg placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-lg backdrop-blur-md"
              aria-describedby="char-count"
            />
            <div className="absolute right-0 bottom-0 pointer-events-none w-full h-1/2 bg-gradient-to-t from-surface-card to-transparent rounded-b-2xl opacity-50" />
          </div>
          <span
            id="char-count"
            className={`absolute bottom-4 right-4 text-xs font-medium px-2 py-1 rounded bg-surface/50 backdrop-blur-sm ${
              claim.length >= MAX_CHARS * 0.9 ? 'text-error' : 'text-text-muted'
            }`}
          >
            {claim.length} / {MAX_CHARS}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || claim.trim().length < 5}
          className="mt-6 w-full py-4 btn-primary rounded-xl font-extrabold tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3 text-lg"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="spinner w-5 h-5 border-[3px]" aria-hidden="true" />
              Analyzing Claim...
            </>
          ) : (
            <>
              <span className="text-2xl drop-shadow-md">🔍</span> Verify Claim
            </>
          )}
        </button>
      </form>

      {/* Error — role="alert" triggers immediate announcement */}
      {error && (
        <div className="mb-8 p-5 bg-error/10 border border-error/30 rounded-xl text-error font-medium animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.1)] flex items-start gap-3" role="alert" aria-live="assertive">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Persistent live region — always in DOM so screen readers track it */}
      <div aria-live="polite" aria-atomic="true">
      {/* Result */}
      {result && (
        <div className="glass-card p-8 mb-12 animate-fade-in-up stagger-2 ring-1 ring-white/10">
          {/* Verdict badge */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
            <span
              ref={resultHeadingRef}
              tabIndex={-1}
              className={`badge text-lg px-5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded ${verdictConfig[result.verdict].badge}`}
            >
              <span aria-hidden="true" className="font-black drop-shadow-sm">{verdictConfig[result.verdict].icon}</span>
              {verdictConfig[result.verdict].label}
            </span>
          </div>

          {/* Explanation */}
          <div className="prose prose-invert max-w-none">
            <div className="flex items-start justify-between gap-4 mb-8">
              <p className="text-text-primary text-lg leading-relaxed font-light flex-1" lang={lang === 'hi' ? 'hi' : 'en'}>
                {translatedExplanation ?? result.explanation}
              </p>
              <SpeakButton
                text={translatedExplanation ?? result.explanation}
                languageCode={lang === 'hi' ? 'hi-IN' : 'en-IN'}
                className="flex-shrink-0 mt-1"
              />
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-6 bg-surface-raised/50 p-5 rounded-xl border border-white/5">
            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-text-secondary font-medium tracking-wide uppercase">AI Confidence Level</span>
              <span className="text-accent-light font-black text-lg">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
            <progress
              value={result.confidence}
              max={1}
              aria-valuenow={result.confidence}
              aria-valuemin={0}
              aria-valuemax={1}
              aria-label="Confidence level"
            />
          </div>

          {/* Source hint */}
          <div className="mt-6 flex items-start gap-3 text-sm text-text-muted bg-surface/50 p-4 rounded-lg">
            <span className="text-lg">📚</span>
            <p>
              <strong className="text-text-secondary uppercase tracking-wider text-xs block mb-1">Source context</strong>
              <span className="italic">{result.source_hint}</span>
            </p>
          </div>

          {/* Grounding sources from Google Search */}
          {result.grounding_sources && result.grounding_sources.length > 0 && (
            <div className="mt-4 flex items-start gap-3 text-sm text-text-muted bg-surface/50 p-4 rounded-lg">
              <span className="text-lg">🌐</span>
              <div>
                <strong className="text-text-secondary uppercase tracking-wider text-xs block mb-2">Verified via Google Search</strong>
                <ul className="space-y-1">
                  {result.grounding_sources.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline break-all text-xs"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-12 animate-fade-in stagger-3">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-accent">🕒</span> Recent Checks
          </h2>
          <ul className="space-y-3 list-none p-0 m-0">
            {history.map((item, index) => (
              <li key={index}>
                <button
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left glass-card p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
                >
                  <span className="text-base text-text-secondary font-medium truncate mr-6 group-hover:text-text-primary transition-colors">
                    &quot;{item.claim}&quot;
                  </span>
                  <span className={`badge ${verdictConfig[item.response.verdict].badge} flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <span aria-hidden="true" className="font-bold">{verdictConfig[item.response.verdict].icon}</span>
                    {verdictConfig[item.response.verdict].label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
