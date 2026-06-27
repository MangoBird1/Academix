'use client';

// Client hook that owns the applications list.
//
// - When Firebase is configured it subscribes via `onSnapshot` so the UI
//   updates in real time (no manual refresh) and writes go through `updateDoc`.
// - When Firebase is NOT configured it keeps everything in local React state
//   seeded from the initial payload, so the demo still works end-to-end.

import { useEffect, useState, useCallback } from 'react';

import { isFirebaseConfigured } from './firebase';
import {
  subscribeToApplications,
  updateApplication as persistUpdate,
} from './applicationsService';

export function useApplications(initialApplications = []) {
  const [applications, setApplications] = useState(initialApplications);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLive(false);
      return undefined;
    }

    const unsubscribe = subscribeToApplications(
      (apps) => {
        setIsLive(true);
        // Keep seed data visible if the remote collection is still empty.
        setApplications((prev) => (apps.length ? apps : prev));
      },
      (err) => setError(err)
    );

    return unsubscribe;
  }, []);

  /**
   * Optimistically patch local state, then persist to Firestore if connected.
   */
  const updateApplication = useCallback((id, partial) => {
    setApplications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...partial } : item))
    );

    if (isFirebaseConfigured) {
      persistUpdate(id, partial).catch((err) => setError(err));
    }
  }, []);

  return { applications, setApplications, updateApplication, isLive, error };
}

export default useApplications;
