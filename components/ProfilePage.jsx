'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_PROFILE,
  loadProfile,
  saveProfile,
} from '@/lib/userPreferences';

const CATEGORY_OPTIONS = ['career', 'education', 'other'];

const card =
  'bg-[#faf7f3] border border-[#e9e4dd] rounded-2xl p-6 shadow-sm';
const label =
  'text-[10px] font-bold uppercase tracking-wide text-[#7aa7a3] leading-snug';
const input =
  'w-full px-3 py-2 rounded-xl bg-[#f7fafc] border border-[#e9e4dd] text-[#2f2f2f] text-sm focus:outline-none focus:border-[#7aa7a3]';
const sectionTitle = 'text-[#2f2f2f] font-semibold text-lg leading-relaxed';

export default function ProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [skillDraft, setSkillDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveProfile(profile);
  }, [profile, hydrated]);

  const toggleCategory = (cat) => {
    setProfile((p) => {
      const has = p.preferredCategories.includes(cat);
      return {
        ...p,
        preferredCategories: has
          ? p.preferredCategories.filter((c) => c !== cat)
          : [...p.preferredCategories, cat],
      };
    });
  };

  const addSkill = () => {
    const s = skillDraft.trim();
    if (!s || profile.trackedSkills.includes(s)) return;
    setProfile((p) => ({
      ...p,
      trackedSkills: [...p.trackedSkills, s],
    }));
    setSkillDraft('');
  };

  const removeSkill = (skill) => {
    setProfile((p) => ({
      ...p,
      trackedSkills: p.trackedSkills.filter((s) => s !== skill),
    }));
  };

  if (!hydrated) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className={`${sectionTitle} text-2xl`}>My Profile</h1>
          <p className="text-[#3a3a3a] text-sm mt-1 leading-relaxed">
            Manage your account details and tracking preferences.
          </p>
        </header>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-4`}>Basic info</h2>
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <div className="h-20 w-20 rounded-full bg-[#a3c9c7] border-2 border-[#7aa7a3]/50 flex items-center justify-center text-2xl text-[#3f6f6b] overflow-hidden">
                {profile.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.photoUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>
              <span className={label}>Photo (optional)</span>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <label className={`${label} block mb-1`}>Name</label>
                <input
                  className={input}
                  value={profile.name}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={`${label} block mb-1`}>Email</label>
                <input
                  type="email"
                  className={input}
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, email: e.target.value }))
                  }
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className={`${label} block mb-1`}>Photo URL</label>
                <input
                  className={input}
                  value={profile.photoUrl}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, photoUrl: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-3`}>Preferred categories</h2>
          <p className="text-[#3a3a3a] text-xs mb-3 leading-relaxed">
            Categories you want to prioritize in your tracker.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => {
              const on = profile.preferredCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    on
                      ? 'bg-[#a3c9c7] text-[#2f2f2f] border-[#7aa7a3]/50'
                      : 'bg-[#f7fafc] text-[#3a3a3a] border-[#e9e4dd]'
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              );
            })}
          </div>
        </section>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-3`}>Skills to track</h2>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile.trackedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-[#cddcc7] border border-[#7aa7a3]/40 px-2.5 py-1 text-[11px] font-semibold text-[#2f2f2f]"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-[#5a5a5a] hover:text-[#c75c5c] text-[10px]"
                  aria-label={`Remove ${skill}`}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={`${input} flex-1`}
              value={skillDraft}
              onChange={(e) => setSkillDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Add a skill..."
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 rounded-xl bg-[#a3c9c7] border border-[#7aa7a3]/40 text-[#2f2f2f] text-sm font-semibold hover:bg-[#7aa7a3] transition"
            >
              Add
            </button>
          </div>
        </section>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-4`}>Notification preferences</h2>
          <div className="space-y-3">
            {[
              { key: 'deadlineReminders', label: 'Deadline reminders' },
              { key: 'followUpReminders', label: 'Follow-up reminders' },
              { key: 'weeklyDigest', label: 'Weekly digest email' },
            ].map(({ key, label: lbl }) => (
              <label
                key={key}
                className="flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="text-[#2f2f2f] text-sm">{lbl}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={profile.notifications[key]}
                  onClick={() =>
                    setProfile((p) => ({
                      ...p,
                      notifications: {
                        ...p.notifications,
                        [key]: !p.notifications[key],
                      },
                    }))
                  }
                  className={`relative h-5 w-9 rounded-full transition ${
                    profile.notifications[key] ? 'bg-[#7aa7a3]' : 'bg-[#d7d7d7]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      profile.notifications[key] ? 'left-4' : 'left-0.5'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
