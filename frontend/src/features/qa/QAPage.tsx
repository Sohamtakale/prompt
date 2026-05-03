import { useState, useRef } from 'react';
import { api } from '../../services/api';
import type { QAResponse } from '../../types';
import SpeakButton from '../../components/SpeakButton/SpeakButton';
import { useLanguage } from '../../context/LanguageContext';

const MAX_CHARS = 500;

interface HistoryItem {
  question: string;
  response: QAResponse;
}

export default function QAPage() {
  const { lang } = useLanguage();
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || trimmed.length < 3) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await api.qa(trimmed);
      setResult(response);
      setHistory((prev) => [{ question: trimmed, response }, ...prev].slice(0, 5));
      // Move focus to result for keyboard users
      setTimeout(() => resultRef.current?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get an answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setQuestion(item.question);
    setResult(item.response);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mb-4 drop-shadow-xl">
          Ask VoteWise
        </h1>
        <p className="text-text-secondary text-xl max-w-2xl mx-auto font-light">
          Get instant, accurate answers about Indian elections, voting rights, and civic procedures — powered by Gemini with live Google Search.
        </p>
      </header>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mb-12 animate-fade-in-up stagger-1">
        <div className="relative">
          <label htmlFor="qa-question" className="block text-sm font-bold tracking-wide uppercase text-accent-light mb-3 ml-1">
            Ask your election question
          </label>
          <textarea
            id="qa-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX_CHARS))}
            placeholder="e.g., How does NOTA work in Indian elections?"
            rows={4}
            maxLength={MAX_CHARS}
            aria-describedby="qa-char-count"
            className="w-full p-5 bg-surface-card border border-white/10 rounded-2xl text-text-primary text-lg placeholder:text-text-muted/50 resize-none focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-lg"
          />
          <span
            id="qa-char-count"
            className={`absolute bottom-4 right-4 text-xs font-medium px-2 py-1 rounded bg-surface/50 ${
              question.length >= MAX_CHARS * 0.9 ? 'text-error' : 'text-text-muted'
            }`}
          >
            {question.length} / {MAX_CHARS}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          className="mt-6 w-full py-4 btn-primary rounded-xl font-extrabold tracking-widest uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3 text-lg"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <span className="spinner w-5 h-5 border-[3px]" aria-hidden="true" />
              Finding Answer…
            </>
          ) : (
            <>
              <span className="text-2xl drop-shadow-md" aria-hidden="true">💬</span> Get Answer
            </>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div
          className="mb-8 p-5 bg-error/10 border border-error/30 rounded-xl text-error font-medium animate-fade-in flex items-start gap-3"
          role="alert"
          aria-live="assertive"
        >
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Result — persistent live region */}
      <div aria-live="polite" aria-atomic="true">
        {result && (
          <div
            ref={resultRef}
            tabIndex={-1}
            className="glass-card p-8 mb-12 animate-fade-in-up stagger-2 ring-1 ring-white/10 outline-none"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-accent-light uppercase tracking-wider">Answer</h2>
              <SpeakButton
                text={result.answer}
                languageCode={lang === 'hi' ? 'hi-IN' : 'en-IN'}
                className="flex-shrink-0"
              />
            </div>

            <p className="text-text-primary text-lg leading-relaxed font-light mb-8">
              {result.answer}
            </p>

            {result.related_terms.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Related Terms</h3>
                <div className="flex flex-wrap gap-2">
                  {result.related_terms.map((term) => (
                    <span
                      key={term}
                      className="px-3 py-1 bg-accent/10 text-accent-light rounded-full text-sm font-medium"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.grounding_sources && result.grounding_sources.length > 0 && (
              <div className="mt-4 flex items-start gap-3 text-sm text-text-muted bg-surface/50 p-4 rounded-lg">
                <span className="text-lg" aria-hidden="true">🌐</span>
                <div>
                  <strong className="text-text-secondary uppercase tracking-wider text-xs block mb-2">
                    Verified via Google Search
                  </strong>
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
        <div className="mt-4 animate-fade-in stagger-3">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <span className="text-accent" aria-hidden="true">🕒</span> Recent Questions
          </h2>
          <ul className="space-y-3 list-none p-0 m-0">
            {history.map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleHistoryClick(item)}
                  className="w-full text-left glass-card p-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all group"
                  aria-label={`Reload question: ${item.question}`}
                >
                  <span className="text-base text-text-secondary font-medium truncate mr-6 group-hover:text-text-primary transition-colors">
                    &ldquo;{item.question}&rdquo;
                  </span>
                  <span className="text-accent text-sm flex-shrink-0" aria-hidden="true">↩</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
