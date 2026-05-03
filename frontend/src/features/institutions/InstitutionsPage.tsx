import { useState } from 'react';
import institutionsData from '../../data/institutions.json';
import type { Institution } from '../../types';

interface InstitutionsPageProps {
  onQuiz?: (topic: string) => void;
}

const institutions = institutionsData as Institution[];

export default function InstitutionsPage({ onQuiz }: InstitutionsPageProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <header className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mb-4 drop-shadow-xl">
          Electoral Institutions
        </h1>
        <p className="text-text-secondary text-xl max-w-2xl mx-auto font-light">
          The 6 key institutions that govern and oversee India&apos;s democratic process.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {institutions.map((inst, index) => (
          <article
            key={inst.id}
            role="article"
            className={`glass-card flex flex-col animate-fade-in-up opacity-0 stagger-${Math.min(index + 1, 7)} transition-all duration-300 ${
              expanded === inst.id ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface scale-[1.02]' : ''
            }`}
            style={{ padding: '2rem' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-1 tracking-tight">{inst.name}</h2>
                {inst.abbreviation && (
                  <span className="inline-block px-3 py-1 bg-accent/20 text-accent-light rounded-md text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(129,140,248,0.2)]">
                    {inst.abbreviation}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-surface-raised/50 p-4 rounded-xl border border-white/5 mb-6">
              <p className="text-sm font-medium text-text-secondary leading-relaxed">{inst.constitutional_basis}</p>
            </div>

            <button
              onClick={() => setExpanded(expanded === inst.id ? null : inst.id)}
              className="text-left w-full text-sm mb-6 cursor-pointer group flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
              aria-expanded={expanded === inst.id}
            >
              <span className="text-accent-light font-bold uppercase tracking-widest text-xs group-hover:text-white transition-colors">
                {expanded === inst.id ? 'Hide Key Powers' : 'Show Key Powers'}
              </span>
              <span className={`text-accent transition-transform duration-300 ${expanded === inst.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {expanded === inst.id && (
              <div className="animate-fade-in mb-6">
                <ul className="space-y-3">
                  {inst.key_powers.map((power, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-text-secondary font-medium">
                      <span className="text-accent-light text-lg leading-none mt-0.5 shadow-[0_0_10px_rgba(129,140,248,0.5)]">✦</span>
                      {power}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-white/10 bg-surface-raised/30 -mx-8 -mb-8 p-8 rounded-b-xl">
                  <p className="text-sm text-text-muted mb-2">
                    <strong className="text-text-primary">Current Head:</strong> {inst.current_head}
                  </p>
                  <a
                    href={inst.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-accent hover:text-white transition-colors flex items-center gap-1 group w-fit"
                  >
                    Official Website <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            )}

            <div className={`mt-auto pt-6 ${expanded === inst.id ? 'hidden' : 'block'}`}>
              <button
                onClick={() => onQuiz?.(inst.name)}
                className="w-full py-3 bg-gradient-to-r from-accent/20 to-accent/10 hover:from-accent/30 hover:to-accent/20 border border-accent/30 text-accent-light rounded-xl text-sm font-bold tracking-wide uppercase transition-all duration-300 hover:shadow-[0_0_20px_rgba(129,140,248,0.2)] hover:scale-[1.02] cursor-pointer flex items-center justify-center gap-2"
                aria-label={`Quiz me on the ${inst.name}`}
              >
                <span className="text-lg">🧠</span> Quiz Me
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
