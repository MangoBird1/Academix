'use client';

import { useEffect, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from '@/lib/userPreferences';

const card =
  'bg-[#faf7f3] border border-[#e9e4dd] rounded-2xl p-6 shadow-sm';
const label =
  'text-[10px] font-bold uppercase tracking-wide text-[#7aa7a3] leading-snug';
const sectionTitle = 'text-[#2f2f2f] font-semibold text-lg leading-relaxed';

const THEME_OPTIONS = [
  { id: 'dark', label: 'Dark' },
  { id: 'pastel', label: 'Pastel' },
  { id: 'aurora', label: 'Aurora gradient' },
];

const TEXT_SIZE_OPTIONS = [
  { id: 'small', label: 'Small' },
  { id: 'medium', label: 'Medium' },
  { id: 'large', label: 'Large' },
];

const PANE_BG_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'mint', label: 'Mint wash' },
  { id: 'lavender', label: 'Lavender wash' },
];

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition ${
        checked ? 'bg-[#7aa7a3]' : 'bg-[#d7d7d7]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
          checked ? 'left-4' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  const patch = (partial) => setSettings((s) => ({ ...s, ...partial }));

  if (!hydrated) return null;

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className={`${sectionTitle} text-2xl`}>Settings</h1>
          <p className="text-[#3a3a3a] text-sm mt-1 leading-relaxed">
            Customize appearance and application behaviour.
          </p>
        </header>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-4`}>Appearance</h2>
          <div className="space-y-5">
            <div>
              <p className={`${label} mb-2`}>Theme</p>
              <div className="flex flex-wrap gap-2">
                {THEME_OPTIONS.map(({ id, label: lbl }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ theme: id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      settings.theme === id
                        ? 'bg-[#a3c9c7] text-[#2f2f2f] border-[#7aa7a3]/50'
                        : 'bg-[#f7fafc] text-[#3a3a3a] border-[#e9e4dd]'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={`${label} mb-2`}>Text size</p>
              <div className="flex flex-wrap gap-2">
                {TEXT_SIZE_OPTIONS.map(({ id, label: lbl }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ textSize: id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      settings.textSize === id
                        ? 'bg-[#a3c9c7] text-[#2f2f2f] border-[#7aa7a3]/50'
                        : 'bg-[#f7fafc] text-[#3a3a3a] border-[#e9e4dd]'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={`${label} mb-2`}>Pane background</p>
              <div className="flex flex-wrap gap-2">
                {PANE_BG_OPTIONS.map(({ id, label: lbl }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => patch({ paneBackground: id })}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                      settings.paneBackground === id
                        ? 'bg-[#a3c9c7] text-[#2f2f2f] border-[#7aa7a3]/50'
                        : 'bg-[#f7fafc] text-[#3a3a3a] border-[#e9e4dd]'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-4`}>Features</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-[#2f2f2f] text-sm font-medium">
                  AI-extracted skills
                </p>
                <p className="text-[#3a3a3a] text-xs">
                  Show skills parsed from job descriptions.
                </p>
              </div>
              <Toggle
                checked={settings.aiExtractedSkills}
                onChange={(v) => patch({ aiExtractedSkills: v })}
              />
            </label>
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-[#2f2f2f] text-sm font-medium">
                  Auto-deadline suggestions
                </p>
                <p className="text-[#3a3a3a] text-xs">
                  Suggest personal completion dates from official deadlines.
                </p>
              </div>
              <Toggle
                checked={settings.autoDeadlineSuggestions}
                onChange={(v) => patch({ autoDeadlineSuggestions: v })}
              />
            </label>
          </div>
        </section>

        <section className={card}>
          <h2 className={`${sectionTitle} mb-3`}>Data</h2>
          <p className="text-[#3a3a3a] text-xs mb-4 leading-relaxed">
            Export or import your application data (placeholders — not yet
            functional).
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl bg-[#a3c9c7] border border-[#7aa7a3]/40 text-[#2f2f2f] text-sm font-semibold opacity-60 cursor-not-allowed"
            >
              Export JSON
            </button>
            <button
              type="button"
              disabled
              className="px-4 py-2 rounded-xl bg-[#f7fafc] border border-[#e9e4dd] text-[#3a3a3a] text-sm font-semibold opacity-60 cursor-not-allowed"
            >
              Import JSON
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
