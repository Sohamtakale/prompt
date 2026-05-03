import { useState } from 'react';
import timelineData from '../../data/timeline.json';
import type { TimelineStage } from '../../types';

const stages = timelineData as TimelineStage[];

export default function TimelinePage() {
  const [selectedStage, setSelectedStage] = useState<TimelineStage | null>(null);

  return (
    <div className="max-w-[120rem] mx-auto px-6 lg:px-12 py-12">
      <header className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold gradient-text mb-4 drop-shadow-xl">
          Election Timeline
        </h1>
        <p className="text-text-secondary text-xl max-w-2xl mx-auto font-light">
          Follow the 7 stages of the Indian election process — from announcement to government formation.
        </p>
      </header>

      {/* Desktop: Vertical timeline */}
      <div className="hidden md:block relative">
        {/* Timeline line with glow */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-saffron via-accent to-indian-green opacity-50 rounded-full -translate-x-1/2" />
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-saffron via-accent to-indian-green blur-md opacity-30 -translate-x-1/2" />

        <div role="list" className="relative space-y-24">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              role="listitem"
              className={`flex items-center justify-between relative animate-fade-in-up opacity-0 stagger-${index + 1} ${
                index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              <div className={`w-1/2 flex ${index % 2 === 0 ? 'justify-end pr-8 md:pr-12 lg:pr-16' : 'justify-start pl-8 md:pl-12 lg:pl-16'}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedStage(selectedStage?.id === stage.id ? null : stage)}
                  onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedStage(selectedStage?.id === stage.id ? null : stage); } }}
                  style={{ padding: '1.5rem 2rem' }}
                  className={`glass-card text-left w-full cursor-pointer transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    selectedStage?.id === stage.id ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface scale-[1.02]' : 'hover:scale-[1.02]'
                  }`}
                  aria-label={`${stage.stage} - click to learn more`}
                  aria-expanded={selectedStage?.id === stage.id}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <span className="px-4 py-2 bg-accent/20 text-accent-light rounded-full text-sm font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(129,140,248,0.2)] whitespace-nowrap">
                      Stage {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-text-muted bg-surface-raised px-3 py-1 rounded-full">
                      {stage.typical_duration}
                    </span>
                  </div>
                  <h2 className="text-xl lg:text-2xl font-extrabold text-text-primary mb-4 tracking-wide">
                    {stage.stage}
                  </h2>
                  <p className="text-sm lg:text-base text-text-secondary leading-relaxed lg:leading-[1.8] font-light">
                    {stage.description}
                  </p>

                  {selectedStage?.id === stage.id && (
                    <div className="mt-8 pt-8 border-t border-white/10 animate-fade-in text-left space-y-6">
                      <div className="bg-surface-raised/50 p-6 rounded-2xl border border-white/5">
                        <span className="text-[10px] lg:text-xs font-bold text-accent-light uppercase tracking-widest block mb-2">Key Body</span>
                        <p className="text-sm font-medium text-text-primary leading-relaxed">{stage.key_body}</p>
                      </div>
                      <div className="bg-saffron/10 p-6 rounded-2xl border border-saffron/20">
                        <span className="text-[10px] lg:text-xs font-bold text-saffron uppercase tracking-widest block mb-2">Citizen Action</span>
                        <p className="text-sm font-medium text-saffron-light leading-relaxed">{stage.citizen_action}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline node with pulse effect */}
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-12 h-12 z-10 flex-shrink-0">
                <div className={`absolute w-full h-full rounded-full ${selectedStage?.id === stage.id ? 'bg-accent blur-md opacity-60' : 'bg-surface-overlay opacity-50'}`} />
                <div className={`w-4 h-4 rounded-full border-2 border-surface relative z-10 transition-colors duration-300 ${
                  selectedStage?.id === stage.id ? 'bg-accent' : 'bg-accent-light'
                }`} />
              </div>

              <div className="w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Horizontal scrollable */}
      <div className="md:hidden">
        <div
          role="list"
          className="flex overflow-x-auto gap-6 pb-8 pt-4 snap-x snap-mandatory -mx-4 px-4 no-scrollbar"
        >
          {stages.map((stage, index) => (
              <button
                key={stage.id}
                role="listitem"
                onClick={() => setSelectedStage(selectedStage?.id === stage.id ? null : stage)}
                style={{ padding: '2rem' }}
                className={`glass-card w-[340px] snap-center flex-shrink-0 cursor-pointer text-center transition-all ${
                  selectedStage?.id === stage.id ? 'ring-2 ring-accent scale-105' : 'scale-100'
                }`}
                aria-label={`${stage.stage} - click to learn more`}
                aria-expanded={selectedStage?.id === stage.id}
              >
              <div className="flex flex-col items-center justify-center mb-6 gap-3">
                <span className="w-12 h-12 rounded-full bg-accent/20 text-accent-light shadow-[0_0_15px_rgba(129,140,248,0.2)] flex items-center justify-center text-xl font-black">
                  {index + 1}
                </span>
                <span className="text-xs font-medium text-text-muted px-3 py-1.5 bg-surface-raised rounded-md">{stage.typical_duration}</span>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">{stage.stage}</h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">{stage.description}</p>

              {selectedStage?.id === stage.id && (
                <div className="mt-6 pt-6 border-t border-white/10 animate-fade-in space-y-4">
                  <div className="bg-surface-raised/50 p-4 rounded-lg border border-white/5">
                    <p className="text-xs text-accent-light font-bold mb-1.5 uppercase tracking-wider">Key Body</p>
                    <p className="text-sm text-text-primary font-medium">{stage.key_body}</p>
                  </div>
                  <div className="bg-saffron/10 p-4 rounded-lg border border-saffron/20">
                    <p className="text-xs text-saffron font-bold mb-1.5 uppercase tracking-wider">Your Action</p>
                    <p className="text-sm text-saffron-light font-medium">{stage.citizen_action}</p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
