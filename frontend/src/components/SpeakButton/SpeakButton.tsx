import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

interface SpeakButtonProps {
  text: string;
  languageCode?: 'en-IN' | 'hi-IN';
  className?: string;
}

// Module-level cache: avoids re-fetching identical text+lang combos
const audioCache = new Map<string, string>();

export default function SpeakButton({ text, languageCode = 'en-IN', className = '' }: SpeakButtonProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.onended = null;
        audioRef.current = null;
      }
    };
  }, []);

  const handleSpeak = async () => {
    if (playing) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.speechSynthesis?.cancel();
      setPlaying(false);
      return;
    }

    setLoading(true);
    try {
      const cacheKey = `${languageCode}:${text}`;
      let base64 = audioCache.get(cacheKey);
      if (!base64) {
        base64 = await api.tts(text, languageCode);
        audioCache.set(cacheKey, base64);
      }

      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audioRef.current = audio;
      setPlaying(true);
      audio.play();
      audio.onended = () => setPlaying(false);
    } catch {
      // Cloud TTS unavailable — fall back to Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = languageCode === 'hi-IN' ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.9;
        setPlaying(true);
        utterance.onend = () => setPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSpeak}
      disabled={loading}
      aria-label={playing ? 'Stop audio' : `Listen in ${languageCode === 'hi-IN' ? 'Hindi' : 'English'}`}
      title={playing ? 'Stop' : 'Listen'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        playing
          ? 'bg-accent text-white border-accent'
          : 'bg-surface border-surface-overlay text-text-muted hover:text-accent hover:border-accent'
      } ${className}`}
    >
      {loading ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      ) : playing ? (
        <span aria-hidden="true">⏹</span>
      ) : (
        <span aria-hidden="true">🔊</span>
      )}
      {loading ? 'Loading…' : playing ? 'Stop' : 'Listen'}
    </button>
  );
}
