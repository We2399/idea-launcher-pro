import { useState, useEffect } from 'react';

const ONBOARDING_STORAGE_KEY = 'jiejie_onboarding_completed';
const FEATURE_TOUR_STORAGE_KEY = 'jiejie_feature_tour_completed';

export function useOnboarding() {
  const [hasCompletedWelcome, setHasCompletedWelcome] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
  });

  const [hasCompletedFeatureTour, setHasCompletedFeatureTour] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(FEATURE_TOUR_STORAGE_KEY) === 'true';
  });

  const completeWelcome = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasCompletedWelcome(true);
  };

  const completeFeatureTour = () => {
    localStorage.setItem(FEATURE_TOUR_STORAGE_KEY, 'true');
    setHasCompletedFeatureTour(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(FEATURE_TOUR_STORAGE_KEY);
    setHasCompletedWelcome(false);
    setHasCompletedFeatureTour(false);
  };

  return {
    hasCompletedWelcome,
    hasCompletedFeatureTour,
    completeWelcome,
    completeFeatureTour,
    resetOnboarding,
  };
}
