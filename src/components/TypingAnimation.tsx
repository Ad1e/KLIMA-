import { useEffect, useRef, useState } from 'react';

const WORDS = ["Horizons", "BatStateU", "Komunidad", "Klima"];
const TYPING_SPEED = 90; // ms per character
const DELETING_SPEED = 60; // ms per character
const PAUSE_BEFORE_DELETE = 1200; // ms
const PAUSE_BEFORE_TYPE = 400; // ms

export default function TypingAnimation() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [maxLength, setMaxLength] = useState(Math.max(...WORDS.map(w => w.length)));
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setMaxLength(Math.max(...WORDS.map(w => w.length)));
  }, []);

  useEffect(() => {
    const currentWord = WORDS[wordIndex];
    let timeout: number | undefined = undefined;

    if (!isDeleting && displayed.length < currentWord.length) {
      timeout = window.setTimeout(() => {
        setDisplayed(currentWord.slice(0, displayed.length + 1));
      }, TYPING_SPEED);
    } else if (!isDeleting && displayed.length === currentWord.length) {
      timeout = window.setTimeout(() => setIsDeleting(true), PAUSE_BEFORE_DELETE);
    } else if (isDeleting && displayed.length > 0) {
      timeout = window.setTimeout(() => {
        setDisplayed(currentWord.slice(0, displayed.length - 1));
      }, DELETING_SPEED);
    } else if (isDeleting && displayed.length === 0) {
      timeout = window.setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % WORDS.length);
      }, PAUSE_BEFORE_TYPE);
    }
    if (timeout !== undefined) timeoutRef.current = timeout;
    return () => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
    };
  }, [displayed, isDeleting, wordIndex]);

  // Prevent layout shift by reserving space for the longest word
  return (
    <span
      className="inline-block font-black text-transparent bg-clip-text bg-gradient-to-r from-[#d2232a] to-[#911d1f] transition-colors duration-300"
      style={{ minWidth: `${maxLength}ch`, textAlign: 'left' }}
      aria-label={WORDS[wordIndex]}
    >
      {displayed}
      <span className="inline-block animate-blink ml-1 w-2 h-2 align-middle rounded-full bg-[#d2232a] opacity-90" />
    </span>
  );
}

// Add blinking cursor animation
// In your global CSS (e.g., App.css):
// @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
// .animate-blink { animation: blink 1s steps(1) infinite; }