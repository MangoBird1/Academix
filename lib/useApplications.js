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
  addApplication as persistAdd,
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

  /**
   * Create a new application. Adds it locally for instant feedback and, when
   * connected, persists via addDoc (the onSnapshot stream then reconciles it).
   * Returns the locally-generated id.
   */
  const addApplication = useCallback((data) => {
    const localId = `local-${Date.now()}`;
    setApplications((prev) => [{ id: localId, ...data }, ...prev]);

    if (isFirebaseConfigured) {
      persistAdd(data).catch((err) => setError(err));
    }

    return localId;
  }, []);

  return {
    applications,
    setApplications,
    updateApplication,
    addApplication,
    isLive,
    error,
  };
}

export default useApplications;
