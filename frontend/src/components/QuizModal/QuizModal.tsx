import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import type { QuizQuestion } from '../../types';

interface QuizModalProps {
  topic: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export default function QuizModal({ topic, isOpen, onClose, triggerRef }: QuizModalProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  // Load quiz questions
  useEffect(() => {
    if (!isOpen) return;

    const loadQuiz = async () => {
      setLoading(true);
      setError(null);
      setQuestions([]);
      setCurrentIndex(0);
      setSelectedOption(null);
      setAnswered(false);
      setScore(0);
      setFinished(false);

      try {
        const result = await api.quiz(topic, 4);
        setQuestions(result);
      } catch {
        setError('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [isOpen, topic]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"]), input, select, textarea',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus the first focusable element
      setTimeout(() => firstFocusRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Return focus on close
  useEffect(() => {
    if (!isOpen && triggerRef?.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];

  const handleSelect = (optionIndex: number) => {
    if (answered) return;
    setSelectedOption(optionIndex);
  };

  const handleConfirm = () => {
    if (selectedOption === null) return;
    setAnswered(true);
    if (selectedOption === currentQuestion.correct_index) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setAnswered(false);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Quiz on ${topic}`}
        className="relative w-full max-w-2xl mx-4 bg-surface-raised border border-surface-overlay rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden"
      >
        {/* Header */}
        <div 
          className="border-b border-surface-overlay flex items-center justify-between"
          style={{ padding: '1.5rem 2.5rem' }}
        >
          <h2 className="text-xl font-bold text-text-primary">
            🧠 Quiz: {topic}
          </h2>
          <button
            ref={firstFocusRef}
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1"
            aria-label="Close quiz"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '2.5rem' }}>
          {/* Loading */}
          {loading && (
            <div className="text-center py-12" aria-busy="true" aria-label="Loading quiz">
              <div className="spinner mx-auto mb-4" />
              <p className="text-text-muted">Generating quiz questions...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-center py-12">
              <p className="text-error mb-4">{error}</p>
              <button
                onClick={onClose}
                className="bg-accent text-white rounded-lg cursor-pointer"
                style={{ padding: '0.75rem 1.5rem' }}
              >
                Close
              </button>
            </div>
          )}

          {/* Finished */}
          {finished && (
            <div className="text-center py-8 animate-fade-in">
              <div className="text-6xl mb-4">
                {score === questions.length ? '🎉' : score >= questions.length / 2 ? '👍' : '📚'}
              </div>
              <h3 className="text-3xl font-bold text-text-primary mb-3">
                {score} / {questions.length}
              </h3>
              <p className="text-text-secondary text-lg mb-8">
                {score === questions.length
                  ? 'Perfect score! You\'re an election expert!'
                  : score >= questions.length / 2
                    ? 'Good job! Keep learning!'
                    : 'Keep exploring — every question is a learning opportunity!'}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRestart}
                  className="bg-accent text-white rounded-full font-medium cursor-pointer hover:bg-accent-light transition-colors"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="bg-surface-overlay text-text-secondary rounded-full font-medium cursor-pointer hover:bg-surface transition-colors"
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Question */}
          {!loading && !error && !finished && currentQuestion && (
            <>
              {/* Progress */}
              <div className="flex items-center justify-between text-base text-text-muted mb-4 font-medium">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>Score: {score}</span>
              </div>
              <div className="w-full bg-surface-overlay rounded-full h-2 mb-8">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + (answered ? 1 : 0)) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question text */}
              <p className="text-text-primary text-xl font-bold mb-6 leading-relaxed">
                {currentQuestion.question}
              </p>

              {/* Options */}
              <div role="radiogroup" aria-label="Answer options" className="space-y-4">
                {currentQuestion.options.map((option, i) => {
                  let optionClass = 'border-surface-overlay hover:border-accent/50';
                  if (answered) {
                    if (i === currentQuestion.correct_index) {
                      optionClass = 'border-success bg-success/10';
                    } else if (i === selectedOption && i !== currentQuestion.correct_index) {
                      optionClass = 'border-error bg-error/10';
                    }
                  } else if (i === selectedOption) {
                    optionClass = 'border-accent bg-accent/10';
                  }

                  return (
                    <button
                      key={i}
                      role="radio"
                      aria-checked={selectedOption === i}
                      onClick={() => handleSelect(i)}
                      disabled={answered}
                      className={`w-full text-left border rounded-xl text-base transition-all cursor-pointer disabled:cursor-default ${optionClass}`}
                      style={{ padding: '1.25rem 1.5rem' }}
                    >
                      <span className="font-bold text-accent mr-3 text-lg">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className="text-text-secondary">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (after answering) */}
              {answered && (
                <div 
                  className="mt-6 bg-surface rounded-xl animate-fade-in border border-surface-overlay"
                  style={{ padding: '1.5rem' }}
                >
                  <p className="text-base text-text-secondary leading-relaxed">
                    <strong className="text-accent font-semibold">Explanation:</strong>{' '}
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex justify-end">
                {!answered ? (
                  <button
                    onClick={handleConfirm}
                    disabled={selectedOption === null}
                    className="bg-accent text-white rounded-full font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:bg-accent-light"
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Confirm Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-accent text-white rounded-full font-medium cursor-pointer hover:bg-accent-light transition-colors"
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    {currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
