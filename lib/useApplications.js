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
    // Stamp every change so the "Last updated" section stays current.
    const stamped = { ...partial, updated_at: Date.now() };
    setApplications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...stamped } : item))
    );

    if (isFirebaseConfigured) {
      persistUpdate(id, stamped).catch((err) => setError(err));
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

  // Task helpers operate on the `tasks` array of a single application and reuse
  // `updateApplication`, so they inherit optimistic updates + persistence.
  const addTask = useCallback(
    (id, text) => {
      const trimmed = (text || '').trim();
      if (!trimmed) return;
      setApplications((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const tasks = [
            ...(item.tasks || []),
            { id: `task-${Date.now()}`, text: trimmed, done: false },
          ];
          const updated_at = Date.now();
          if (isFirebaseConfigured) {
            persistUpdate(id, { tasks, updated_at }).catch((err) => setError(err));
          }
          return { ...item, tasks, updated_at };
        })
      );
    },
    []
  );

  const toggleTask = useCallback((id, taskId) => {
    setApplications((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const tasks = (item.tasks || []).map((t) =>
          t.id === taskId ? { ...t, done: !t.done } : t
        );
        const updated_at = Date.now();
        if (isFirebaseConfigured) {
          persistUpdate(id, { tasks, updated_at }).catch((err) => setError(err));
        }
        return { ...item, tasks, updated_at };
      })
    );
  }, []);

  const removeTask = useCallback((id, taskId) => {
    setApplications((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const tasks = (item.tasks || []).filter((t) => t.id !== taskId);
        const updated_at = Date.now();
        if (isFirebaseConfigured) {
          persistUpdate(id, { tasks, updated_at }).catch((err) => setError(err));
        }
        return { ...item, tasks, updated_at };
      })
    );
  }, []);

  return {
    applications,
    setApplications,
    updateApplication,
    addApplication,
    addTask,
    toggleTask,
    removeTask,
    isLive,
    error,
  };
}

export default useApplications;
