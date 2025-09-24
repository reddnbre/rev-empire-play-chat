import { useState, useEffect } from 'react';

interface CookieConsentHook {
  hasConsent: boolean | null;
  acceptCookies: () => void;
  declineCookies: () => void;
  resetConsent: () => void;
}

export const useCookieConsent = (): CookieConsentHook => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for existing consent in localStorage (not a cookie itself)
    const consent = localStorage.getItem('cookie-consent');
    if (consent !== null) {
      setHasConsent(consent === 'true');
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setHasConsent(true);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'false');
    setHasConsent(false);
  };

  const resetConsent = () => {
    localStorage.removeItem('cookie-consent');
    setHasConsent(null);
  };

  return {
    hasConsent,
    acceptCookies,
    declineCookies,
    resetConsent,
  };
};