import { useEffect, useState } from 'react';

/**
 * Hook to dynamically load and interact with Google reCAPTCHA v3
 */
export const useReCaptcha = () => {
  const [ready, setReady] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

  useEffect(() => {
    if (!siteKey) {
      return;
    }

    if (window.grecaptcha) {
      setReady(true);
      return;
    }

    const scriptId = 'recaptcha-script';
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    const handleScriptLoad = () => {
      window.grecaptcha.ready(() => {
        setReady(true);
      });
    };

    script.addEventListener('load', handleScriptLoad);

    return () => {
      if (script) {
        script.removeEventListener('load', handleScriptLoad);
      }
    };
  }, [siteKey]);

  const executeCaptcha = async (action) => {
    if (!siteKey || !ready || !window.grecaptcha) {
      // Default mock token for local testing/environments without keys configured
      return 'mock_captcha_token';
    }
    try {
      return await window.grecaptcha.execute(siteKey, { action });
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return 'mock_captcha_token';
    }
  };

  return { executeCaptcha, ready };
};
