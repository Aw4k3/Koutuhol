import { UserPreferences } from '@/types/koutuhol';

export interface GuestSessionRecord {
  id: string;
  date: string;
  preferences: UserPreferences;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnanswered: number;
  accuracyPct: number | null;
  totalTimeMs: number;
  longestStreak: number;
  answers: Array<{
    questionId: string;
    selectedOption: 'A' | 'B' | 'C' | 'D' | null;
    correctOption: 'A' | 'B' | 'C' | 'D';
    status: 'correct' | 'incorrect' | 'timeout' | 'skipped';
    timeTakenMs: number;
  }>;
}

export interface GuestStoreV1 {
  version: 1;
  isGuest: boolean;
  preferences: UserPreferences;
  seenQuestionIds: string[];
  sessions: GuestSessionRecord[];
}

const STORAGE_KEY = 'koutuhol_guest_v1';

const DEFAULT_STORE: GuestStoreV1 = {
  version: 1,
  isGuest: false,
  preferences: {
    level: null,
    group: 'none',
    subjectSlugs: [],
    customCourses: [],
    isTimed: true,
  },
  seenQuestionIds: [],
  sessions: [],
};

export function getGuestStore(): GuestStoreV1 {
  if (typeof window === 'undefined') return DEFAULT_STORE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STORE;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return DEFAULT_STORE;
    return parsed;
  } catch {
    return DEFAULT_STORE;
  }
}

export function saveGuestStore(updater: (prev: GuestStoreV1) => GuestStoreV1): GuestStoreV1 {
  const current = getGuestStore();
  const next = updater(current);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function clearGuestStore() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}