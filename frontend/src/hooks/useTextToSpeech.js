import { useState, useEffect, useCallback, useRef } from 'react';
import { splitSentences } from '../utils/textUtils';

const DEFAULT_RATES = [1, 1.25, 1.5];

const supportsSpeech = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export function useTextToSpeech(text, { rates = DEFAULT_RATES, initialRate = 1 } = {}) {
  const [supported] = useState(supportsSpeech);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1);

  const textRef = useRef(text);
  const sentencesRef = useRef(splitSentences(text));
  const rateRef = useRef(initialRate);

  useEffect(() => {
    textRef.current = text;
    sentencesRef.current = splitSentences(text);
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

    const content = (textRef.current || '').trim();
    if (!content) return;

    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setActiveSentenceIndex(-1);

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = rateRef.current;
    utterance.onboundary = (event) => {
      const sentences = sentencesRef.current;
      for (let i = 0; i < sentences.length; i += 1) {
        const sentence = sentences[i];
        if (event.charIndex >= sentence.start && event.charIndex <= sentence.end) {
          setActiveSentenceIndex(i);
          return;
        }
      }
      if (sentences.length > 0) setActiveSentenceIndex(sentences.length - 1);
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
