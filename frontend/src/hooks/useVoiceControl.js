import { useState, useEffect, useRef, useCallback } from 'react';

const CONFIDENCE_THRESHOLD = 0.6;
const SUPPORTED_LANGUAGES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'mr-IN', label: 'Marathi' },
];
// Helper to map spoken words to numbers or commands
const parseCommand = (transcript) => {
  const normalized = transcript.toLowerCase().trim();
  
  // Flashcard Flip/Show
  if (normalized.includes('flip') || normalized.includes('show')) return 'FLIP';

  // Flashcard Ratings (SM-2)
  if (/\b(zero|0)\b/.test(normalized) || normalized.includes('blackout')) return 'RATE_0';
  if (/\b(one|1)\b/.test(normalized) || normalized.includes('wrong')) return 'RATE_1';
  if (/\b(two|2)\b/.test(normalized) || normalized.includes('hard')) return 'RATE_2';
  if (/\b(three|3)\b/.test(normalized) || normalized.includes('medium')) return 'RATE_3';
  if (/\b(four|4)\b/.test(normalized) || normalized.includes('good')) return 'RATE_4';
  if (/\b(five|5)\b/.test(normalized) || normalized.includes('easy')) return 'RATE_5';

  // Quiz Options
  if (normalized.includes('option a')) return 'OPTION_0';
  if (normalized.includes('option b')) return 'OPTION_1';
  if (normalized.includes('option c')) return 'OPTION_2';
  if (normalized.includes('option d')) return 'OPTION_3';

  // Pause / Resume
  if (normalized.includes('pause')) return 'PAUSE';
  if (normalized.includes('resume')) return 'RESUME';

  return null;
};

export const useVoiceControl = ({
  onCommand,
  onTranscript,
  speechRate = 1,
  language = 'en-US',
}) => {  const [isSupported, setIsSupported] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [status, setStatus] = useState('IDLE'); // IDLE, LISTENING, PROCESSING, SPEAKING, ERROR
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const isSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !synthRef.current) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
recognition.lang = language;
    recognition.onstart = () => {
      isListeningRef.current = true;
      if (!isSpeakingRef.current && status !== 'PROCESSING') {
        setStatus('LISTENING');
      }
    };

    recognition.onresult = (event) => {
      if (isSpeakingRef.current || isPaused) return; // Prevent collision
      
      setStatus('PROCESSING');
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      const confidence = lastResult[0].confidence;
      if (confidence > CONFIDENCE_THRESHOLD && onTranscript) {
        onTranscript(transcript.trim(), confidence);
      }
      if (confidence > CONFIDENCE_THRESHOLD) {
        const command = parseCommand(transcript);
        if (command) {
          if (command === 'PAUSE') {
            setIsPaused(true);
            setStatus('IDLE');
          } else if (command === 'RESUME') {
            setIsPaused(false);
            setStatus('LISTENING');
          } else if (!isPaused && onCommand) {
            onCommand(command);
          }
        }
      }
      
      // Revert to LISTENING if we haven't transitioned to SPEAKING or paused
      setTimeout(() => {
        if (!isSpeakingRef.current && isListeningRef.current && !isPaused) {
          setStatus('LISTENING');
        } else if (isPaused) {
          setStatus('IDLE');
        }
      }, 500);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);

      if (
        event.error === 'not-allowed' ||
        event.error === 'service-not-allowed'
      ) {
        setErrorMsg(
          'Microphone permission was denied. Allow microphone access in your browser settings, or continue with manual flashcard controls.'
        );
        setIsEnabled(false);
        setStatus('ERROR');
        return;
      }

      if (event.error === 'audio-capture') {
        setErrorMsg(
          'No microphone was detected. You can continue reviewing manually.'
        );
        setIsEnabled(false);
        setStatus('ERROR');
        return;
      }

      if (event.error === 'no-speech') {
        setErrorMsg(
          'No speech was detected. Try speaking again or use the manual controls.'
        );
        setStatus('LISTENING');
        return;
      }

      setErrorMsg(
        'Voice recognition encountered a problem. You can continue with manual controls.'
      );
      setStatus('ERROR');
    };    recognition.onend = () => {
      isListeningRef.current = false;
      // Automatically restart if enabled and not speaking (continuous mode)
      if (isEnabled && !isSpeakingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started
        }
      } else if (!isEnabled) {
        setStatus('IDLE');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [isEnabled, isPaused, onCommand, onTranscript, language, status]);
  const toggleVoiceMode = useCallback(() => {
    if (!isSupported) return;
    
    setIsEnabled(prev => {
      const next = !prev;
      if (next) {
        setIsPaused(false);
        setErrorMsg('');
        try {
          recognitionRef.current?.start();
        } catch (e) {
          // ignore already started
        }
      } else {
        recognitionRef.current?.abort();
        synthRef.current?.cancel();
        setStatus('IDLE');
      }
      return next;
    });
  }, [isSupported]);

  const speak = useCallback((text) => {
    if (!isSupported || !isEnabled || isPaused) return;

    // Abort recognition temporarily
    isSpeakingRef.current = true;
    setStatus('SPEAKING');
    recognitionRef.current?.abort();
    synthRef.current?.cancel();

    if (!text) {
      isSpeakingRef.current = false;
      setStatus('LISTENING');
      try { recognitionRef.current?.start(); } catch(e){}
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
        utterance.lang = language;
    utterance.onend = () => {
      isSpeakingRef.current = false;
      if (isEnabled && !isPaused) {
        setStatus('LISTENING');
        try {
          recognitionRef.current?.start();
        } catch(e) {}
      } else {
        setStatus('IDLE');
      }
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      if (isEnabled && !isPaused) {
        setStatus('LISTENING');
        try { recognitionRef.current?.start(); } catch(e) {}
      }
    };

    synthRef.current.speak(utterance);
  }, [isEnabled, isPaused, isSupported, speechRate, language]);
  return {
    isSupported,
    isEnabled,
    isPaused,
    status,
    errorMsg,
    toggleVoiceMode,
    speak,
    supportedLanguages: SUPPORTED_LANGUAGES,
    cancelSpeech: () => {        synthRef.current?.cancel();
        isSpeakingRef.current = false;
        if(isEnabled && !isPaused) {
            setStatus('LISTENING');
            try { recognitionRef.current?.start(); } catch(e) {}
        }
    }
  };
};

export default useVoiceControl;
