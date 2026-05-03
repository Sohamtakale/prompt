import { useState, useMemo } from 'react';
import partiesData from '../../data/comparison.json';
import type { PartyInfo } from '../../types';

const parties = partiesData as PartyInfo[];

// Extract unique states from all parties
const allStates = Array.from(
  new Set(parties.flatMap((p) => p.states_strong_in)),
).sort();

export default function ComparisonPage() {
  const [stateFilter, setStateFilter] = useState<string>('');

  const filteredParties = useMemo(() => {
    if (!stateFilter) return parties;
    return parties.filter((p) => p.states_strong_in.includes(stateFilter));
  }, [stateFilter]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="text-center" style={{ marginBottom: '2rem' }}>
        <h1 className="text-4xl font-bold gradient-text mb-4">
          Political Parties
        </h1>
        <p className="text-text-secondary text-lg text-center w-full">
          Factual overview of major national and regional political parties in India. <br className="hidden sm:block" /> All data is publicly available information — no AI-generated content.
        </p>
      </header>

      {/* State filter */}
      <div role="search" className="flex justify-center" style={{ marginTop: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="relative group">
          <label htmlFor="state-filter" className="sr-only">
            Filter by state
          </label>
          <select
            id="state-filter"
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="w-full sm:min-w-[280px] px-6 py-3.5 bg-surface-card border-2 border-surface-overlay hover:border-accent/50 rounded-xl text-text-primary text-base font-medium focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent appearance-none pr-12 cursor-pointer transition-all shadow-lg backdrop-blur-md"
          >
            <option value="">All States</option>
            {allStates.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-accent transition-colors pointer-events-none text-lg">
            ▼
          </span>
        </div>
      </div>

      {/* Party cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredParties.map((party, index) => (
          <article
            key={party.abbreviation}
            role="article"
            className={`glass-card animate-fade-in-up opacity-0 stagger-${Math.min(index + 1, 7)}`}
            style={{ padding: '1.5rem' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-text-primary">{party.name}</h2>
                <span className="text-sm text-accent font-semibold">{party.abbreviation}</span>
              </div>
              <span className="text-xs text-text-muted bg-surface-overlay px-2 py-1 rounded">
                Est. {party.founded}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-text-muted">Symbol:</span>{' '}
                <span className="text-text-secondary">{party.symbol_description}</span>
              </div>

              <div>
                <span className="text-text-muted">Alliance:</span>{' '}
                <span className="text-text-secondary">{party.alliance}</span>
              </div>

              <div>
                <span className="text-text-muted">HQ:</span>{' '}
                <span className="text-text-secondary">{party.headquarters}</span>
              </div>

              <div>
                <span className="text-text-muted block mb-2 font-medium">Key Policy Areas:</span>
                <div className="flex flex-wrap gap-2">
                  {party.key_policy_areas.map((policy) => (
                    <span
                      key={policy}
                      className="px-2.5 py-1 bg-accent/10 text-accent-light text-xs rounded-full border border-accent/20"
                    >
                      {policy}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <span className="text-text-muted block mb-2 font-medium">Strong in:</span>
                <div className="flex flex-wrap gap-2">
                  {party.states_strong_in.map((state) => (
                    <span
                      key={state}
                      className="px-2.5 py-1 bg-saffron/10 text-saffron text-xs rounded-full border border-saffron/20"
                    >
                      {state}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href={party.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-accent hover:text-accent-light text-xs underline underline-offset-2 mt-4 font-medium transition-colors"
              >
                Official Website →
              </a>
            </div>
          </article>
        ))}
      </div>

      {filteredParties.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p>No parties found for the selected state.</p>
          <button
            onClick={() => setStateFilter('')}
            className="mt-3 text-accent hover:text-accent-light underline cursor-pointer"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Political neutrality disclaimer */}
      <footer className="mt-12 p-4 bg-surface-raised rounded-lg text-center">
        <p className="text-xs text-text-muted">
          ⚖️ VoteWise is politically neutral. Party information is sourced from publicly available data.
          No rankings, evaluations, or AI-generated opinions are included. Listed alphabetically.
        </p>
      </footer>
    </div>
  );
}
