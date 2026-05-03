import React, { Suspense, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ChatBubble from './components/ChatBubble/ChatBubble';
import QuizModal from './components/QuizModal/QuizModal';
import Navigation from './components/Navigation/Navigation';
import UserNav from './components/auth/UserNav';

// Lazy-loaded feature pages
const TimelinePage = React.lazy(() => import('./features/timeline/TimelinePage'));
const RegistrationPage = React.lazy(() => import('./features/registration/RegistrationPage'));
const ComparisonPage = React.lazy(() => import('./features/comparison/ComparisonPage'));
const GlossaryPage = React.lazy(() => import('./features/glossary/GlossaryPage'));
const MythCheckPage = React.lazy(() => import('./features/mythcheck/MythCheckPage'));
const InstitutionsPage = React.lazy(() => import('./features/institutions/InstitutionsPage'));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" aria-label="Loading" role="status">
      <div className="text-center">
        <div className="spinner mx-auto mb-4" />
        <p className="text-text-muted text-sm font-medium tracking-wide uppercase">Loading...</p>
      </div>
    </div>
  );
}

const featureCards = [
  { emoji: '📅', label: 'Timeline', desc: 'Understand the 7 Stages of the Indian General Election, from nomination to counting day.', link: 'Explore Schedule →', to: '/timeline' },
  { emoji: '📝', label: 'Register to Vote', desc: 'A simple 5-step guide to voter registration, NVSP portal navigation, and checking your EPIC details.', link: 'Check Eligibility →', to: '/register' },
  { emoji: '🏛️', label: 'Institutions', desc: 'Learn about the Election Commission of India (ECI) and other bodies ensuring fair play.', link: 'ECI Guidelines →', to: '/institutions' },
  { emoji: '📖', label: 'Glossary', desc: "Master 40+ key terms from 'Electoral Roll' to 'Anti-Defection Law' in plain English.", link: 'A-Z Dictionary →', to: '/glossary' },
  { emoji: '🔍', label: 'Myth Check', desc: 'Fact-check common claims and viral misinformation about EVM, VVPAT, and voting rights.', link: 'Verify Claims →', to: '/mythcheck' },
  { emoji: '⚖️', label: 'Parties', desc: 'Explore the landscape of National and State parties, their symbols, and current representation.', link: 'Party Directory →', to: '/parties' },
];

const voterSteps = [
  { num: 1, label: 'Check Name', desc: 'Search the Electoral Roll via NVSP' },
  { num: 2, label: 'Find Booth', desc: 'Locate your designated Polling Station' },
  { num: 3, label: 'ID Proof', desc: 'Carry your EPIC or other valid ID at designated' },
  { num: 4, label: 'Cast Vote', desc: 'Use EVM/VVPAT to vote and get your ballot' },
];

function HomePage() {
  return (
    <div className="w-full animate-fade-in-up">
      {/* Hero Section */}
      <section className="hero-section pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-5 px-5 py-2 rounded-full border border-[#C5CEBC] bg-[#E8F0E4]">
            <span className="text-xs font-bold text-accent uppercase tracking-widest">Civic Initiative</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 tracking-tight text-text-primary leading-tight">
            VoteWise: Your interactive guide to<br />Indian elections
          </h1>
          <p className="text-base md:text-lg text-text-secondary mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Demystifying the democratic process through institutional reliability and contemporary clarity. Navigate the world's largest election with confidence.
          </p>

          <div className="flex items-center justify-center gap-4 mb-16 flex-wrap">
            <NavLink to="/register" className="btn-primary px-7 py-3 rounded-full font-semibold text-sm inline-flex items-center gap-2">
              Start Your Voter Journey
            </NavLink>
            <NavLink to="/timeline" className="btn-outline px-7 py-3 rounded-full font-semibold text-sm inline-flex items-center gap-2">
              Explore Electoral Map
            </NavLink>
          </div>
        </div>

        {/* Parliament image */}
        <div className="max-w-5xl mx-auto">
          <img
            src="/parliament.png"
            alt="Indian Parliament Building — Sansad Bhavan, New Delhi"
            className="w-full h-auto rounded-2xl shadow-lg object-cover max-h-[380px]"
          />
        </div>
      </section>

      {/* Election Essentials */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2" style={{ fontStyle: 'italic' }}>
                Election Essentials
              </h2>
              <p className="text-text-muted text-sm max-w-lg">
                Everything you need to know about participating in the democratic process, organized for clarity and ease of use.
              </p>
            </div>
            <NavLink to="/timeline" className="text-sm font-semibold text-accent hover:underline hidden md:inline-flex items-center gap-1">
              View All Resources →
            </NavLink>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featureCards.map((item, index) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={`glass-card p-6 group flex flex-col gap-4 animate-fade-in-up stagger-${index + 2}`}
              >
                <div className="feature-icon">
                  <span>{item.emoji}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-1">{item.label}</h3>
                  <p className="text-sm text-text-muted leading-relaxed mb-3">{item.desc}</p>
                  <span className="text-sm font-semibold text-accent group-hover:underline">{item.link}</span>
                </div>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy & Safety */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Critical Information</p>
          <div className="privacy-section p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Your Privacy & Safety
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                VoteWise is a non-profit civic initiative. We do not collect individual voting preferences or sensitive personal data. Our goal is purely educational, ensuring every citizen can navigate the polling booth with absolute certainty and zero intimidation.
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent text-[#FDFBF0] flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="text-sm text-text-primary font-medium">100% Data Anonymity for Search Queries</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent text-[#FDFBF0] flex items-center justify-center text-xs font-bold">✓</span>
                  <span className="text-sm text-text-primary font-medium">Non-partisan Content Verification</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0 w-full md:w-[280px]">
              <img
                src="/voter-finger.png"
                alt="Inked voter finger — symbol of Indian democracy"
                className="w-full h-auto rounded-2xl shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* First-Time Voter Stepper */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            First-Time Voter?
          </h2>
          <p className="text-sm text-text-muted mb-12">
            Follow our guided stepper to ensure you are ready for polling day.
          </p>

          <div className="flex items-start justify-between gap-0">
            {voterSteps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center text-center max-w-[140px]">
                  <div className="stepper-circle mb-3">{step.num}</div>
                  <h4 className="text-sm font-bold text-text-primary mb-1">{step.label}</h4>
                  <p className="text-xs text-text-muted leading-snug">{step.desc}</p>
                </div>
                {i < voterSteps.length - 1 && (
                  <div className="stepper-line mt-5" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DA] py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-text-primary">VoteWise</p>
            <p className="text-xs text-text-muted">© 2026 VoteWise India. A civic initiative for informed democracy.</p>
          </div>
          <div className="flex items-center gap-6">
            <NavLink to="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">About Us</NavLink>
            <NavLink to="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">ECI Guidelines</NavLink>
            <NavLink to="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">Privacy Policy</NavLink>
            <NavLink to="/" className="text-xs text-text-muted hover:text-text-primary transition-colors">Contact Support</NavLink>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [quizTopic, setQuizTopic] = useState<string | null>(null);

  const handleQuiz = useCallback((topic: string) => {
    setQuizTopic(topic);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen w-full bg-[#FDFBF0]">
        {/* Skip to content */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Navbar */}
        <nav className="sticky top-0 z-40 bg-[#FDFBF0]/90 backdrop-blur-md border-b border-[#E8E4DA] w-full flex-none">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <NavLink to="/" className="text-xl font-extrabold text-text-primary hover:opacity-80 transition-opacity flex-shrink-0">
              🗳️ VoteWise
            </NavLink>

            <div className="flex items-center gap-4 lg:gap-8">
              <div className="hidden lg:block">
                <Navigation />
              </div>
              <div className="lg:hidden">
                {/* Mobile nav could go here, but for now we keep it simple */}
                <Navigation />
              </div>
              <div className="h-6 w-px bg-[#E8E4DA] flex-shrink-0 hidden md:block" />
              <div className="flex-shrink-0">
                <UserNav />
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main id="main-content" className="relative w-full flex-1 flex flex-col">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/parties" element={<ComparisonPage />} />
              <Route path="/glossary" element={<GlossaryPage />} />
              <Route path="/mythcheck" element={<MythCheckPage />} />
              <Route
                path="/institutions"
                element={<InstitutionsPage onQuiz={handleQuiz} />}
              />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Floating chat */}
      <ChatBubble />

      {/* Quiz modal */}
      <QuizModal
        topic={quizTopic || ''}
        isOpen={!!quizTopic}
        onClose={() => setQuizTopic(null)}
      />
    </BrowserRouter>
  );
}
