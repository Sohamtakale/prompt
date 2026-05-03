import React, { useState, useMemo } from 'react';
import AnimatedList from '../../components/AnimatedList/AnimatedList';
import glossaryData from '../../data/glossary.json';
import { useDebounce } from '../../hooks/useDebounce';
import { api } from '../../services/api';
import type { GlossaryTerm } from '../../types';

const terms = glossaryData as GlossaryTerm[];

// Build a list of all term names for cross-linking
const allTermNames = new Set(terms.map((t) => t.term));

// Group terms alphabetically
function groupByLetter(items: GlossaryTerm[]): Record<string, GlossaryTerm[]> {
  const groups: Record<string, GlossaryTerm[]> = {};
  for (const item of items) {
    const letter = item.term[0].toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(item);
  }
  return groups;
}

export default function GlossaryPage() {
  const [search, setSearch] = useState('');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [geminiExplanation, setGeminiExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const filteredTerms = useMemo(() => {
    if (!debouncedSearch.trim()) return terms;
    const q = debouncedSearch.toLowerCase();
    return terms.filter(
      (t) =>
        t.term.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q),
    );
  }, [debouncedSearch]);

  const grouped = useMemo(() => groupByLetter(filteredTerms), [filteredTerms]);
  const letters = Object.keys(grouped).sort();

  const flatItems = useMemo(() => {
    const items: { type: 'header' | 'term'; value: string | GlossaryTerm }[] = [];
    letters.forEach((letter) => {
      items.push({ type: 'header', value: letter });
      grouped[letter].forEach((term) => {
        items.push({ type: 'term', value: term });
      });
    });
    return items;
  }, [letters, grouped]);

  const handleToggle = (term: string) => {
    if (expandedTerm === term) {
      setExpandedTerm(null);
      setGeminiExplanation(null);
    } else {
      setExpandedTerm(term);
      setGeminiExplanation(null);
    }
  };

  const handleAskGemini = async (termName: string) => {
    setLoading(true);
    setGeminiExplanation(null);
    try {
      const res = await api.qa(
        `Explain the term "${termName}" in the context of Indian elections in simple language`,
        'Glossary',
      );
      setGeminiExplanation(res.answer);
    } catch {
      setGeminiExplanation('Unable to load explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Cross-link: make term names in definition clickable
  const renderDefinition = (definition: string, currentTerm: string) => {
    const parts: React.ReactNode[] = [];
    let remaining = definition;

    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = Array.from(allTermNames)
      .filter((t) => t !== currentTerm)
      .sort((a, b) => b.length - a.length);

    for (const termName of sortedTerms) {
      const idx = remaining.indexOf(termName);
      if (idx !== -1) {
        if (idx > 0) parts.push(remaining.substring(0, idx));
        parts.push(
          <button
            key={`${currentTerm}-${termName}-${idx}`}
            onClick={(e) => {
              e.stopPropagation();
              setExpandedTerm(termName);
              setGeminiExplanation(null);
              // Scroll to the term
              document.getElementById(`term-${termName}`)?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }}
            className="text-accent-light hover:text-white underline underline-offset-4 decoration-accent/50 hover:decoration-accent transition-colors font-semibold cursor-pointer"
          >
            {termName}
          </button>,
        );
        remaining = remaining.substring(idx + termName.length);
      }
    }
    if (remaining) parts.push(remaining);
    return parts.length > 0 ? parts : definition;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mb-4 drop-shadow-xl">
          Election Glossary
        </h1>
        <p className="text-text-secondary text-xl font-light">
          40+ essential terms about Indian elections — search, explore, and learn.
        </p>
      </header>

      {/* Search */}
      <div role="search" className="mb-12 max-w-xl mx-auto animate-fade-in-up stagger-1">
        <label htmlFor="glossary-search" className="sr-only">Search glossary terms</label>
        <div className="relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-accent/50 group-focus-within:text-accent transition-colors text-xl" aria-hidden="true">
            🔍
          </span>
          <input
            id="glossary-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full pl-12 pr-4 py-4 bg-surface-card border border-white/10 rounded-2xl text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all shadow-lg backdrop-blur-md"
          />
        </div>
        <p className="text-xs text-text-muted mt-3 text-center uppercase tracking-widest font-bold">
          {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Alphabetical groups */}
      <div className="animate-fade-in-up stagger-2">
        <AnimatedList
          items={flatItems}
          showGradients={true}
          enableArrowNavigation={false} // Disable Arrow navigation so we don't interfere with accordions
          displayScrollbar={true}
          renderItem={(item) => {
            if (item.type === 'header') {
              const letter = item.value as string;
              return (
                <div className="sticky top-0 bg-surface/80 backdrop-blur-xl py-4 z-10 mb-2 border-b border-white/5">
                   <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent-light inline-block">
                    {letter}
                  </h2>
                </div>
              );
            } else {
              const term = item.value as GlossaryTerm;
              return (
                <div className="pl-2 md:pl-8 border-l border-white/10 ml-4 mb-2">
                  <div
                    id={`term-${term.term}`}
                    className={`glass-card overflow-hidden transition-all duration-300 ${
                      expandedTerm === term.term ? 'ring-1 ring-accent ring-offset-2 ring-offset-surface scale-[1.01]' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggle(term.term)}
                      className="w-full text-left px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                      aria-expanded={expandedTerm === term.term}
                      aria-controls={`def-${term.term}`}
                    >
                      <span className="font-bold text-lg text-text-primary tracking-wide">{term.term}</span>
                      <span
                        className={`text-accent transition-transform duration-300 ${
                          expandedTerm === term.term ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      >
                        ▼
                      </span>
                    </button>

                    {expandedTerm === term.term && (
                      <div
                        id={`def-${term.term}`}
                        className="px-6 pb-6 animate-fade-in"
                      >
                        <p className="text-base text-text-secondary leading-relaxed mb-6 font-light">
                          {renderDefinition(term.definition, term.term)}
                        </p>

                        <button
                          onClick={() => handleAskGemini(term.term)}
                          disabled={loading}
                          className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-busy={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner w-4 h-4 border-2" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <span className="text-lg">✨</span> Ask Gemini to explain more
                            </>
                          )}
                        </button>

                        {geminiExplanation && (
                          <div className="mt-4 p-5 bg-surface-raised/50 border border-accent/20 rounded-xl animate-fade-in shadow-[inset_0_0_20px_rgba(129,140,248,0.05)]" aria-live="polite">
                            <p className="text-sm text-text-primary leading-relaxed">{geminiExplanation}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          }}
        />
      </div>

      {filteredTerms.length === 0 && (
        <div className="text-center py-20 text-text-muted animate-fade-in">
          <span className="text-4xl block mb-4 opacity-50">🔍</span>
          <p className="text-lg font-medium mb-2">No terms match your search.</p>
          <button
            onClick={() => setSearch('')}
            className="mt-2 text-accent-light hover:text-white underline underline-offset-4 decoration-accent cursor-pointer transition-colors"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
