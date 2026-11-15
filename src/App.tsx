import React, { useState } from 'react';
import type { HealthcareDatabase, AuthorizedMember } from './types';
import { INDIAN_LANGUAGES, type LanguageCode } from './i18n';
import { HeartPulse, AlertTriangle, Activity, Stethoscope } from 'lucide-react';

type ActiveTab = 'overview' | 'medications' | 'appointments' | 'profile' | 'ai_alerts';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [highContrast, setHighContrast] = useState(false);
  const [sosSent, setSosSent] = useState(false);

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
            <button
              onClick={() => setSosSent(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              SOS EMERGENCY
            </button>
          </div>
        </div>
      </header>
      {sosSent && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          Emergency Alert Dispatched to Family & Primary Caregiver!
        </div>
      )}
      <nav className="max-w-7xl mx-auto px-4 pt-4 flex gap-2 border-b border-slate-200">
        {(['overview', 'medications', 'appointments', 'profile', 'ai_alerts'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${
              activeTab === tab
                ? 'border-teal-600 text-teal-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </nav>
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Patient Vital Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
              <span className="text-xs text-teal-700 font-medium">Blood Pressure</span>
              <p className="text-xl font-bold text-teal-900 mt-1">126/78 mmHg</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-xs text-blue-700 font-medium">Blood Sugar (F)</span>
              <p className="text-xl font-bold text-blue-900 mt-1">112 mg/dL</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
              <span className="text-xs text-purple-700 font-medium">Heart Rate</span>
              <p className="text-xl font-bold text-purple-900 mt-1">72 bpm</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <span className="text-xs text-amber-700 font-medium">SpO2 Level</span>
              <p className="text-xl font-bold text-amber-900 mt-1">98%</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
