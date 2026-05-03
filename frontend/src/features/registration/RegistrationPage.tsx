import { useState } from 'react';
import registrationData from '../../data/registration_steps.json';
import { api } from '../../services/api';
import type { RegistrationStep } from '../../types';

const steps = registrationData as RegistrationStep[];

export default function RegistrationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const step = steps[currentStep];

  const handleExplain = async () => {
    setLoading(true);
    setExplanation(null);
    try {
      const res = await api.qa(
        `Explain in detail: ${step.title} for voter registration in India`,
        'Voter Registration Process',
      );
      setExplanation(res.answer);
    } catch {
      setExplanation('Unable to load explanation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold gradient-text mb-3">
          Voter Registration Guide
        </h1>
        <p className="text-text-secondary text-lg">
          Register to vote in 5 simple steps — your voice matters!
        </p>
      </header>

      {/* Step indicators */}
      <div role="tablist" aria-label="Registration steps" className="flex justify-center gap-2 mb-10">
        {steps.map((s, i) => (
          <button
            key={s.step}
            role="tab"
            aria-selected={i === currentStep}
            aria-current={i === currentStep ? 'step' : undefined}
            onClick={() => {
              setCurrentStep(i);
              setExplanation(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              i === currentStep
                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                : i < currentStep
                  ? 'bg-indian-green/20 text-indian-green'
                  : 'bg-surface-raised text-text-muted hover:bg-surface-overlay'
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              i < currentStep ? 'bg-indian-green text-white' : ''
            }`}>
              {i < currentStep ? '✓' : s.step}
            </span>
            <span className="hidden sm:inline">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step counter */}
      <p className="text-center text-text-muted text-sm mb-6">
        Step {currentStep + 1} of {steps.length}
      </p>

      {/* Current step content */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '3rem' }} key={step.step}>
        <h2 className="text-3xl font-bold text-text-primary mb-3">
          {step.title}
        </h2>
        <p className="text-lg text-text-secondary mb-8">{step.description}</p>

        {/* Requirements */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-accent uppercase tracking-wider mb-4">
            Requirements
          </h3>
          <ul className="space-y-3">
            {step.requirements.map((req, i) => (
              <li key={i} className="flex items-start gap-3 text-base text-text-secondary leading-relaxed">
                <span className="text-accent mt-0.5">•</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Action items */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-saffron uppercase tracking-wider mb-4">
            Action Items
          </h3>
          <ol className="space-y-3">
            {step.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-base text-text-secondary leading-relaxed">
                <span className="text-saffron font-bold mt-0.5 min-w-[1.25rem]">
                  {i + 1}.
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Helpful links */}
        {step.helpful_links.length > 0 && (
          <div className="mb-8">
            <h3 className="text-base font-semibold text-indian-green uppercase tracking-wider mb-4">
              Helpful Links
            </h3>
            <div className="flex flex-wrap gap-3">
              {step.helpful_links.map((link, i) => (
                <a
                  key={i}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-accent hover:text-accent-light underline underline-offset-2"
                >
                  {new URL(link).hostname}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <button
            onClick={handleExplain}
            disabled={loading}
            style={{ padding: '0.75rem 1.5rem' }}
            className="bg-accent hover:bg-accent-light text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex justify-center items-center gap-2"
            aria-busy={loading}
          >
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Loading...</span>
              </>
            ) : (
              '✨ Explain in detail'
            )}
          </button>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                setCurrentStep((prev) => Math.max(0, prev - 1));
                setExplanation(null);
              }}
              disabled={currentStep === 0}
              style={{ padding: '0.75rem 1.5rem' }}
              className="bg-surface-raised text-text-secondary rounded-lg font-medium hover:bg-surface-overlay transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
                setExplanation(null);
              }}
              disabled={currentStep === steps.length - 1}
              style={{ padding: '0.75rem 1.5rem' }}
              className="bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>

        {explanation && (
          <div className="mt-6 p-6 bg-surface-raised/50 border border-white/5 rounded-xl animate-fade-in" aria-live="polite">
            <p className="text-sm text-text-secondary leading-relaxed">{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
