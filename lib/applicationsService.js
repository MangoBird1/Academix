// Firestore data-access layer for the unified `applications` collection.
//
// Every function degrades gracefully: when Firebase is NOT configured the
// caller is expected to fall back to local seed data (see `useApplications`).

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  query,
} from 'firebase/firestore';

import { db, isFirebaseConfigured, APPLICATIONS_COLLECTION } from './firebase';

/**
 * Subscribe to real-time updates of the applications collection.
 *
 * @param {(apps: Array<object>) => void} onData - called with the latest list.
 * @param {(err: Error) => void} [onError]
 * @returns {() => void} an unsubscribe function (no-op when not configured).
 */
export function subscribeToApplications(onData, onError) {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const q = query(collection(db, APPLICATIONS_COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const apps = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(apps);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

/**
 * Persist a partial update to a single application document.
 * Resolves to `false` when Firebase is not configured (local-only mode).
 */
export async function updateApplication(id, partial) {
  if (!isFirebaseConfigured || !db) return false;
  await updateDoc(doc(db, APPLICATIONS_COLLECTION, id), partial);
  return true;
}

/**
 * Add a brand new application document (used by the scraping API route).
 * Returns the new document id, or `null` when not configured.
 */
export async function addApplication(data) {
  if (!isFirebaseConfigured || !db) return null;
  const ref = await addDoc(collection(db, APPLICATIONS_COLLECTION), data);
  return ref.id;
}
