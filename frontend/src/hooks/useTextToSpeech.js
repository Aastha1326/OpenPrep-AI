import { useState, useEffect, useCallback, useRef } from 'react';
import { splitSentences, findSentenceAt } from '../utils/textUtils';

const DEFAULT_RATES = [1, 1.25, 1.5];

const supportsSpeech = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * The exact string handed to the speech engine. `charIndex` on a boundary
 * event is an offset into *this*, so sentence offsets have to be derived from
 * the same value — deriving them from the raw prop shifted every comparison by
 * however much leading whitespace `trim()` removed.
 */
const toSpokenContent = (value) => (value || '').trim();

export function useTextToSpeech(text, { rates = DEFAULT_RATES, initialRate = 1 } = {}) {
  const [supported] = useState(supportsSpeech);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);

  const textRef = useRef(text);
  const sentencesRef = useRef(splitSentences(toSpokenContent(text)));
  const rateRef = useRef(initialRate);

  useEffect(() => {
    textRef.current = text;
    sentencesRef.current = splitSentences(toSpokenContent(text));
  }, [text]);

  // Stop reading whenever the source text changes
  useEffect(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setActiveSentenceIndex(-1);
  }, [text, supported]);

  // Cancel any in-flight speech when the component unmounts
  useEffect(() => {
    if (!supported) return;
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [supported]);

  const speak = useCallback(() => {
    if (!supported) return;

    const content = toSpokenContent(textRef.current);
    if (!content) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setActiveSentenceIndex(-1);

    // Re-derive from `content` rather than trusting the ref: `speak` can be
    // called in the same tick as a text change, before the effect has run.
    const sentences = splitSentences(content);
    sentencesRef.current = sentences;

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = rateRef.current;
    utterance.onboundary = (event) => {
      const index = findSentenceAt(sentencesRef.current, event.charIndex);
      if (index >= 0) setActiveSentenceIndex(index);
    };
    const finish = () => {
      setIsSpeaking(false);
      setActiveSentenceIndex(-1);
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    setIsSpeaking(true);
    setActiveSentenceIndex(0);
    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setActiveSentenceIndex(-1);
  }, [supported]);

  const toggle = useCallback(() => {
    if (isSpeaking) stop();
    else speak();
  }, [isSpeaking, speak, stop]);

  const cycleRate = useCallback(() => {
    const currentIndex = rates.indexOf(rateRef.current);
    const next = rates[(currentIndex + 1) % rates.length];
    rateRef.current = next;
    setRate(next);
    if (isSpeaking) speak();
  }, [rates, isSpeaking, speak]);

  return {
    supported,
    isSpeaking,
    rate,
    activeSentenceIndex,
    speak,
    stop,
    toggle,
    cycleRate,
  };
}
