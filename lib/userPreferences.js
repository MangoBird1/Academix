// Local profile + settings persistence (localStorage).

export const LS_PROFILE = 'academix:profile';
export const LS_SETTINGS = 'academix:settings';

export const DEFAULT_PROFILE = {
  name: 'Alex Morgan',
  email: 'alex@example.com',
  photoUrl: '',
  preferredCategories: ['career', 'education'],
  trackedSkills: ['React', 'TypeScript', 'Python', 'Communication'],
  notifications: {
    deadlineReminders: true,
    followUpReminders: true,
    weeklyDigest: false,
  },
};

export const DEFAULT_SETTINGS = {
  theme: 'pastel',
  textSize: 'medium',
  paneBackground: 'default',
  aiExtractedSkills: true,
  autoDeadlineSuggestions: true,
};

export function loadProfile() {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function loadSettings() {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
