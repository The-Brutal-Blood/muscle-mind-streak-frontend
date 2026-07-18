import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { BrokenPersonalRecord } from '../types/workout.types';

/**
 * Holds PRs broken by the just-finished workout so the Home screen can show
 * the one-shot achievement banner. Deliberately in-memory only: the banner
 * must not reappear after dismissal nor survive an app restart.
 */
interface PersonalRecordCelebrationContextValue {
  /** PRs awaiting celebration, or null when there's nothing to show. */
  pending: BrokenPersonalRecord[] | null;
  /** Queues freshly-broken PRs (called from the finish-workout flow). */
  celebrate: (records: BrokenPersonalRecord[]) => void;
  /** Clears the queue (banner dismissed). */
  dismiss: () => void;
}

const PersonalRecordCelebrationContext = createContext<
  PersonalRecordCelebrationContextValue | undefined
>(undefined);

export function PersonalRecordCelebrationProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<BrokenPersonalRecord[] | null>(null);

  const celebrate = useCallback((records: BrokenPersonalRecord[]) => {
    setPending(records.length > 0 ? records : null);
  }, []);

  const dismiss = useCallback(() => setPending(null), []);

  const value = useMemo(() => ({ pending, celebrate, dismiss }), [pending, celebrate, dismiss]);

  return (
    <PersonalRecordCelebrationContext.Provider value={value}>
      {children}
    </PersonalRecordCelebrationContext.Provider>
  );
}

export function usePersonalRecordCelebration(): PersonalRecordCelebrationContextValue {
  const context = useContext(PersonalRecordCelebrationContext);
  if (!context) {
    throw new Error(
      'usePersonalRecordCelebration must be used within a PersonalRecordCelebrationProvider',
    );
  }
  return context;
}
