import React, { useState } from 'react';
import type { HealthcareDatabase, AuthorizedMember } from './types';
import { INDIAN_LANGUAGES, type LanguageCode } from './i18n';

export default function App() {
  const [loading] = useState(false);
  const [lang, setLang] = useState<LanguageCode>('en');
  const [highContrast, setHighContrast] = useState(false);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${highContrast ? 'high-contrast' : ''}`}>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              CB
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">CareBridge ElderCare</h1>
              <p className="text-xs text-slate-500">Collaborative Healthcare & Smart Pillbox</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              aria-label="Select Language"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white"
            >
              {INDIAN_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200"
            >
              {highContrast ? 'Standard' : 'High Contrast'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Patient Overview</h2>
          <p className="text-sm text-slate-600">Smt. Kamala Deshmukh (Age: 76) &bull; Blood Group: O+</p>
        </div>
      </main>
    </div>
  );
}
