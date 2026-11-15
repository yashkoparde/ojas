import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneCall,
  Ambulance,
  Volume2,
  VolumeX,
  Square,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Lock,
  Activity,
  ShieldCheck,
  X,
  Stethoscope,
  HeartPulse,
  ClipboardCheck,
  Send,
  PackagePlus,
  FileText,
  Edit3,
  Mic,
  MicOff,
  MessageSquare,
} from 'lucide-react';
import type {
  HealthcareDatabase,
  AuthorizedMember,
  Medication,
  MedicationDoseSlot,
  DoseStatus,
} from '../types';
import {
  type LanguageCode,
  buildLocalizedDoseSpeech,
  getMedicationThumbnailUrl,
} from '../i18n';
import { VitalsTrendChart } from './VitalsTrendChart';
import { SmartPillboxDashboard } from './SmartPillboxDashboard';

export interface OverviewTabProps {
  db: HealthcareDatabase;
  lang: LanguageCode;
  currentMember: AuthorizedMember;
  otherCareCircleMembers: AuthorizedMember[];
  audioPlaying: boolean;
  stopVoiceText: string;
  currentLangMeta: {
    code: string;
    englishName: string;
    nativeName: string;
    speechLang: string;
  };
  t: any;
  stopSpeaking: () => void;
  handleReadScheduleAloud: () => void;
  setQrModalOpen: (open: boolean) => void;
  takenDosesToday: number;
  totalDosesToday: number;
  missedDosesToday: Array<{ med: Medication; slot: MedicationDoseSlot }>;
  pendingDosesToday: Array<{ med: Medication; slot: MedicationDoseSlot }>;
  allTimelineSlots: Array<{ med: Medication; slot: MedicationDoseSlot }>;
  handleDirectCallMember: (member: AuthorizedMember) => void;
  handleDirectCallDoctor: () => void;
  handleDirectDispatchAmbulance: () => void;
  setDoctorShareModalOpen: (open: boolean) => void;
  setWhatsappModalOpen: (open: boolean) => void;
  handleDoseAction: (medId: string, slotId: string, status: DoseStatus) => Promise<void>;
  lowStockMedications: Medication[];
  handleCaregiverBatchRestock: () => Promise<void>;
  handleCaregiverLogVital: (e: React.FormEvent) => Promise<void>;
  handleSendCaregiverHandover: (presetText?: string) => Promise<void>;
  vitalType: string;
  setVitalType: (v: string) => void;
  vitalValue: string;
  setVitalValue: (v: string) => void;
  vitalNote: string;
  setVitalNote: (v: string) => void;
  notifyFamilyOnVital: boolean;
  setNotifyFamilyOnVital: (v: boolean) => void;
  savingVital: boolean;
  handoverNote: string;
  setHandoverNote: (v: string) => void;
  sendingHandover: boolean;
  canConfirmPhysicalDose: boolean;
  recentlyConfirmedSlotId: string | null;
  voiceListening: boolean;
  handleElderlyVoiceIntake: () => void;
  speakText: (text: string, overrideLang?: LanguageCode) => Promise<void>;
  editingNoteSlotId: string | null;
  setEditingNoteSlotId: (id: string | null) => void;
  tempNoteText: string;
  setTempNoteText: (text: string) => void;
  handleUpdateDoseNotes: (medId: string, slotId: string, notes: string) => Promise<void>;
  setStage: (stage: 'intro' | 'profile_select' | 'main') => void;
  onSyncHardware: (action: string, compartmentNumber?: number) => Promise<void>;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  db,
  lang,
  currentMember,
  otherCareCircleMembers,
  audioPlaying,
  stopVoiceText,
  currentLangMeta,
  t,
  stopSpeaking,
  handleReadScheduleAloud,
  setQrModalOpen,
  takenDosesToday,
  totalDosesToday,
  missedDosesToday,
  pendingDosesToday,
  allTimelineSlots,
  handleDirectCallMember,
  handleDirectCallDoctor,
  handleDirectDispatchAmbulance,
  setDoctorShareModalOpen,
  setWhatsappModalOpen,
  handleDoseAction,
  lowStockMedications,
  handleCaregiverBatchRestock,
  handleCaregiverLogVital,
  handleSendCaregiverHandover,
  vitalType,
  setVitalType,
  vitalValue,
  setVitalValue,
  vitalNote,
  setVitalNote,
  notifyFamilyOnVital,
  setNotifyFamilyOnVital,
  savingVital,
  handoverNote,
  setHandoverNote,
  sendingHandover,
  canConfirmPhysicalDose,
  recentlyConfirmedSlotId,
  voiceListening,
  handleElderlyVoiceIntake,
  speakText,
  editingNoteSlotId,
  setEditingNoteSlotId,
  tempNoteText,
  setTempNoteText,
  handleUpdateDoseNotes,
  setStage,
  onSyncHardware,
}) => {
  return (
    <div className="space-y-6">
      {/* Greeting + One-Tap Direct Calling Hub */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={db.patient.avatarUrl || '/patient.jpg'}
                alt={`Photo of ${db.patient.fullName}`}
                className="h-16 w-16 rounded-2xl border border-slate-200 object-cover shadow-xs"
                onError={(e) => {
                  e.currentTarget.src = '/patient.jpg';
                }}
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t.greeting}
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Blood Group <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{db.patient.bloodGroup}</span> ·{' '}
                  {db.patient.primaryDoctor.name.split(',')[0]}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={audioPlaying ? stopSpeaking : handleReadScheduleAloud}
                aria-label={audioPlaying ? stopVoiceText : `${t.speakSchedule} in ${currentLangMeta.nativeName}`}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-xs ${
                  audioPlaying
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-teal-700 hover:bg-teal-800'
                }`}
              >
                {audioPlaying ? (
                  <>
                    <Square className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>{stopVoiceText}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {t.speakSchedule} ({currentLangMeta.nativeName})
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                aria-label="Open First-Responder Emergency Health Pass QR Code"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 shadow-xs"
              >
                <QrCode className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <span>{t.qrCardBtn}</span>
              </button>
            </div>
          </div>

          {/* Adherence Progress Counters */}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
              <div className="text-xs font-semibold text-slate-500">
                {t.dosesCompletedLabel}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold text-teal-800 dark:text-teal-300 tabular-nums">
                {takenDosesToday} / {totalDosesToday}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
              <div className="text-xs font-semibold text-slate-500">
                {t.missedAlertLabel}
              </div>
              <div
                className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                  missedDosesToday.length > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400'
                }`}
              >
                {missedDosesToday.length}
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated One-Tap Direct Calling & Emergency Card */}
        <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              One-Tap Care Circle &amp; Emergency Connect
            </span>
            <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              Direct Dial
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {otherCareCircleMembers.map((member) => {
              const roleTitle =
                member.role === 'caretaker'
                  ? 'Call Caregiver'
                  : member.role === 'family'
                  ? 'Call Family'
                  : 'Call Patient';
              return (
                <a
                  key={member.id}
                  href={`tel:${member.phone.replace(/\s+/g, '')}`}
                  onClick={() => handleDirectCallMember(member)}
                  aria-label={`Call ${member.name} (${roleTitle})`}
                  className="flex items-center gap-3 rounded-xl border border-emerald-600/70 bg-emerald-50/70 p-3 text-left transition-colors hover:bg-emerald-100/80 dark:border-emerald-500/50 dark:bg-emerald-950/40"
                >
                  <img
                    src={member.avatarUrl}
                    alt={`Photo of ${member.name}`}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover border border-emerald-300 dark:border-emerald-700"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (member.role === 'elderly') target.src = '/patient.jpg';
                      else if (member.role === 'caretaker') target.src = '/caregiver.jpg';
                      else if (member.role === 'family') target.src = '/familymember.jpg';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                      <PhoneCall className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                      <span className="truncate">{roleTitle}</span>
                    </div>
                    <div className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                      {member.name.split(',')[0]}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {member.phone}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <a
              href={`tel:${db.patient.primaryDoctor.phone.replace(/\s+/g, '')}`}
              onClick={handleDirectCallDoctor}
              aria-label={`Call Doctor ${db.patient.primaryDoctor.name} at Sahyadri Super Speciality Hospital`}
              className="flex items-center gap-3 rounded-xl border border-teal-600 bg-teal-50/70 p-3 text-left transition-colors hover:bg-teal-100/80 dark:border-teal-500/60 dark:bg-teal-950/40 shadow-xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
                <PhoneCall className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.callDoctorBtn}
                </div>
                <div className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                  {db.patient.primaryDoctor.name.split(',')[0]}
                </div>
              </div>
            </a>

            <button
              type="button"
              onClick={handleDirectDispatchAmbulance}
              aria-label="Dispatch Emergency 108 Ambulance immediately"
              className="flex items-center gap-3 rounded-xl bg-red-600 p-3 text-left text-white transition-colors hover:bg-red-700 shadow-xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-800 text-white">
                <Ambulance className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold">{t.dispatchAmbulanceBtn}</div>
                <div className="truncate text-[11px] text-red-100">
                  108 Pune Dispatch
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* DEDICATED CAREGIVER CLINICAL COMMAND & SHIFT HUB */}
      {currentMember.role === 'caretaker' && (
        <section
          aria-labelledby="caregiver-hub-title"
          className="rounded-2xl border-2 border-teal-600/80 bg-white p-6 shadow-sm dark:border-teal-500/60 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
                <Stethoscope className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="caregiver-hub-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                    Caregiver Clinical Command &amp; Shift Hub
                  </h2>
                  <span className="rounded-md bg-teal-100 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-900 dark:bg-teal-950 dark:text-teal-300">
                    RN PIN Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Record bedside vitals, broadcast shift handover notes to Family, and manage pillbox inventory
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDoctorShareModalOpen(true)}
                aria-label="Share structured clinical adherence report directly with Dr. Rajesh Kulkarni"
                className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-xs"
              >
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
                <span>Share Clinical Report with Doctor</span>
              </button>

              <button
                type="button"
                onClick={() => setWhatsappModalOpen(true)}
                aria-label="Dispatch WhatsApp alerts to Care Circle members"
                className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-200 shadow-xs"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span>Dispatch WhatsApp Alert</span>
              </button>

              {pendingDosesToday.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    const nextPending = pendingDosesToday[0];
                    await handleDoseAction(
                      nextPending.med.id,
                      nextPending.slot.id,
                      'taken'
                    );
                  }}
                  aria-label={`Confirm next due dose: ${pendingDosesToday[0].med.name} at ${pendingDosesToday[0].slot.scheduledTime}`}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Confirm Next Due ({pendingDosesToday[0].slot.scheduledTime})
                  </span>
                </button>
              )}

              {lowStockMedications.length > 0 && (
                <button
                  type="button"
                  onClick={handleCaregiverBatchRestock}
                  aria-label={`Batch restock ${lowStockMedications.length} low-stock medications`}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200 shadow-xs"
                >
                  <PackagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Restock {lowStockMedications.length} Low-Stock Med(s)
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quick Bedside Vitals Logger */}
            <form
              onSubmit={handleCaregiverLogVital}
              aria-label="Log patient bedside vitals form"
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <HeartPulse className="h-4 w-4 text-rose-600" aria-hidden="true" />
                  <span>Log Patient Bedside Vitals</span>
                </span>
                <div className="flex gap-1" role="group" aria-label="Vital signs presets">
                  {[
                    { label: 'BP', type: 'Blood Pressure (BP)', val: '124/78 mmHg' },
                    { label: 'Sugar', type: 'Blood Glucose', val: '118 mg/dL' },
                    { label: 'SpO2', type: 'Oxygen Saturation (SpO2)', val: '98% on Room Air' },
                    { label: 'Temp/Pulse', type: 'Pulse & Temp', val: '74 bpm · 98.4°F' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      aria-label={`Select ${preset.type} preset: ${preset.val}`}
                      onClick={() => {
                        setVitalType(preset.type);
                        setVitalValue(preset.val);
                      }}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 hover:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label htmlFor="bedside-vital-type" className="block text-[11px] font-semibold text-slate-500">
                    Vital Sign Type
                  </label>
                  <input
                    id="bedside-vital-type"
                    type="text"
                    value={vitalType}
                    onChange={(e) => setVitalType(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="bedside-vital-value" className="block text-[11px] font-semibold text-slate-500">
                    Recorded Value
                  </label>
                  <input
                    id="bedside-vital-value"
                    type="text"
                    value={vitalValue}
                    onChange={(e) => setVitalValue(e.target.value)}
                    placeholder="e.g., 126/80 mmHg"
                    required
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-2.5">
                <label htmlFor="bedside-vital-note" className="sr-only">Clinical observation note</label>
                <input
                  id="bedside-vital-note"
                  type="text"
                  value={vitalNote}
                  onChange={(e) => setVitalNote(e.target.value)}
                  placeholder="Clinical observation note (e.g., Seated rest, post-morning medication)..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <label htmlFor="notify-family-vital-checkbox" className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    id="notify-family-vital-checkbox"
                    type="checkbox"
                    checked={notifyFamilyOnVital}
                    onChange={(e) => setNotifyFamilyOnVital(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-teal-700"
                  />
                  <span>Email reading to Family (Rohan)</span>
                </label>

                <button
                  type="submit"
                  disabled={savingVital}
                  aria-label="Record bedside vital reading"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50 shadow-xs"
                >
                  {savingVital ? 'Logging...' : 'Record Vital'}
                </button>
              </div>
            </form>

            {/* Right: Caregiver Shift Handover & Observation Broadcast */}
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <div>
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Send className="h-4 w-4 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                  <span>Caregiver Shift Handover &amp; Family Broadcast</span>
                </span>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  One-tap clinical status updates sent directly to Family &amp; logged in patient history:
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Shift handover templates">
                  {[
                    'Morning vitals stable; breakfast & morning medicines taken on time.',
                    'Afternoon blood sugar & BP normal; Kamala Aaji rested comfortably.',
                    'Evening physiotherapy walk completed; no dizziness or ankle swelling.',
                  ].map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Broadcast template: ${template}`}
                      onClick={() => handleSendCaregiverHandover(template)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 hover:border-teal-600 hover:text-teal-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      + &ldquo;{template}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <label htmlFor="shift-handover-custom-note" className="sr-only">Custom shift handover note</label>
                <input
                  id="shift-handover-custom-note"
                  type="text"
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Write custom shift handover note for family..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  disabled={sendingHandover || !handoverNote.trim()}
                  onClick={() => handleSendCaregiverHandover()}
                  aria-label="Broadcast custom shift note"
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap shadow-xs"
                >
                  {sendingHandover ? 'Sending...' : 'Broadcast Note'}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Missed Dose Alert (1-Tap Confirmation) */}
      {missedDosesToday.length > 0 && (
        <section
          role="alert"
          aria-live="assertive"
          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-300 bg-red-50 p-5 dark:border-red-900/70 dark:bg-red-950/40"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-red-900 dark:text-red-200">
                {missedDosesToday
                  .map(({ med, slot }) => `${slot.scheduledTime} — ${med.name} (${med.dosage})`)
                  .join(' · ')}
              </h2>
              <p className="text-xs text-red-800 dark:text-red-300">
                {t.doseMissed}
              </p>
            </div>
          </div>

          {canConfirmPhysicalDose && (
            <div className="flex items-center gap-2">
              {missedDosesToday.map(({ med, slot }) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleDoseAction(med.id, slot.id, 'taken')}
                  aria-label={`Confirm intake of missed dose: ${med.name} (${slot.scheduledTime})`}
                  className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>{t.oneTapConfirm}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Main 2-Column View: Today's Medicines + Daily Health Checklist */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section
          aria-labelledby="timeline-heading"
          className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
            <h2 id="timeline-heading" className="text-xl font-bold text-slate-900 dark:text-white">
              {t.todaysMedicationTimeline}
            </h2>
            <div className="flex items-center gap-2">
              {canConfirmPhysicalDose && pendingDosesToday.length > 0 && (
                <button
                  type="button"
                  onClick={handleElderlyVoiceIntake}
                  aria-label="One-tap voice intake confirmation for pending medication"
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-xs ${
                    voiceListening
                      ? 'bg-red-600 text-white animate-pulse'
                      : 'bg-teal-700 text-white hover:bg-teal-800 active:scale-95'
                  }`}
                  title="1-Tap Voice Confirmation for Pending Intake"
                >
                  {voiceListening ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
                  <span>{voiceListening ? 'Listening...' : 'Voice Confirm'}</span>
                </button>
              )}

              {audioPlaying && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  aria-label={stopVoiceText}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700"
                >
                  <Square className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>{stopVoiceText}</span>
                </button>
              )}
              <span className="font-mono text-xs text-slate-500">
                {currentMember.role === 'elderly'
                  ? 'Patient One-Tap Intake'
                  : currentMember.role === 'caretaker'
                  ? 'Caregiver Clinical View'
                  : 'Family Read-Only View'}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {allTimelineSlots.map(({ med, slot }) => {
              const isTaken = slot.status === 'taken';
              const isMissed = slot.status === 'missed';
              const medVisualPhoto = getMedicationThumbnailUrl(med);

              return (
                <div
                  key={slot.id}
                  className={`relative overflow-hidden flex flex-col justify-between gap-3 rounded-xl border p-4 transition-all duration-300 ${
                    isMissed
                      ? 'border-red-300 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                      : isTaken
                      ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/15'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                  }`}
                >
                  {/* Subtle Green Checkmark Animation Overlay on Dose Confirmation */}
                  <AnimatePresence>
                    {recentlyConfirmedSlotId === slot.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-emerald-600/95 text-white backdrop-blur-xs shadow-lg"
                      >
                        <motion.div
                          initial={{ scale: 0.2, rotate: -25 }}
                          animate={{ scale: [0.2, 1.2, 1], rotate: 0 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          className="flex items-center justify-center rounded-full bg-white p-3 text-emerald-600 shadow-xl ring-4 ring-emerald-300/50"
                        >
                          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" aria-hidden="true" />
                        </motion.div>
                        <motion.span
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.25 }}
                          className="mt-2 text-sm font-extrabold tracking-wide uppercase drop-shadow-sm text-white"
                        >
                          Dose Confirmed Taken!
                        </motion.span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-14 w-16 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-100 font-mono dark:border-slate-700 dark:bg-slate-800">
                        <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                          {slot.scheduledTime}
                        </span>
                        <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                          Box #{med.compartmentNumber}
                        </span>
                      </div>

                      <img
                        src={medVisualPhoto}
                        alt={`${med.name} visual identification blister`}
                        className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 object-cover shadow-2xs dark:border-slate-700"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80';
                        }}
                      />

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                          {med.name}
                        </h3>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {med.dosage} · {slot.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          speakText(
                            buildLocalizedDoseSpeech(
                              lang,
                              med.name,
                              med.dosage,
                              slot.scheduledTime,
                              med.compartmentNumber,
                              isTaken
                            )
                          )
                        }
                        aria-label={`Listen to ${med.name} dosage instructions in ${currentLangMeta.nativeName}`}
                        className="rounded-lg border border-slate-200 p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        title={`Listen in ${currentLangMeta.nativeName}`}
                      >
                        <Volume2 className="h-5 w-5" aria-hidden="true" />
                      </button>

                      {audioPlaying && (
                        <button
                          type="button"
                          onClick={stopSpeaking}
                          aria-label={stopVoiceText}
                          className="rounded-lg bg-red-600 p-3 text-white hover:bg-red-700"
                          title={stopVoiceText}
                        >
                          <VolumeX className="h-5 w-5" aria-hidden="true" />
                        </button>
                      )}

                      {canConfirmPhysicalDose ? (
                        !isTaken ? (
                          <button
                            type="button"
                            onClick={() => handleDoseAction(med.id, slot.id, 'taken')}
                            aria-label={`Confirm taken: ${med.name} at ${slot.scheduledTime}`}
                            className="flex min-h-[48px] items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0 transition-transform active:scale-95 shadow-sm"
                          >
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                            <span>{t.oneTapConfirm}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDoseAction(med.id, slot.id, 'pending')}
                            aria-label={`Mark as pending: ${med.name} at ${slot.scheduledTime}`}
                            className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 whitespace-nowrap shrink-0 hover:bg-emerald-100"
                          >
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            <span>{t.doseTaken}</span>
                          </button>
                        )
                      ) : (
                        <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            {isTaken ? t.doseTaken : isMissed ? t.doseMissed : t.dosePending}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Observational Caregiver Notes Section */}
                  <div className="w-full mt-1 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <FileText className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Caregiver Note:
                        </span>
                        {slot.notes ? (
                          <span className="font-medium text-slate-900 dark:text-slate-100 italic">
                            &ldquo;{slot.notes}&rdquo;
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            No observational notes recorded
                          </span>
                        )}
                      </div>

                      {canConfirmPhysicalDose && (
                        <button
                          type="button"
                          onClick={() => {
                            if (editingNoteSlotId === slot.id) {
                              setEditingNoteSlotId(null);
                            } else {
                              setEditingNoteSlotId(slot.id);
                              setTempNoteText(slot.notes || '');
                            }
                          }}
                          aria-label={slot.notes ? `Edit note for ${med.name}` : `Add note for ${med.name}`}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/50"
                        >
                          <Edit3 className="h-3 w-3" aria-hidden="true" />
                          <span>{slot.notes ? 'Edit Note' : '+ Add Note'}</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Inline Caregiver Note Editor */}
                    {editingNoteSlotId === slot.id && (
                      <div className="mt-2.5 rounded-lg border border-teal-200 bg-teal-50/70 p-3 dark:border-teal-800 dark:bg-slate-800/90 space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor={`edit-note-input-${slot.id}`} className="text-[11px] font-bold text-teal-900 dark:text-teal-200">
                            Add observational note for {med.name} ({slot.scheduledTime}):
                          </label>
                          <button
                            type="button"
                            onClick={() => setEditingNoteSlotId(null)}
                            aria-label="Close note editor"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                        <input
                          id={`edit-note-input-${slot.id}`}
                          type="text"
                          value={tempNoteText}
                          onChange={(e) => setTempNoteText(e.target.value)}
                          placeholder="e.g. Taken with warm water post-meal, vitals normal, patient resting comfortably..."
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Preset observation tags">
                            <span className="text-[10px] text-slate-500 font-medium">Quick tags:</span>
                            {['With water', 'BP normal', 'Post-meal', 'No adverse reaction', 'Patient drowsy'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                aria-label={`Append tag ${tag}`}
                                onClick={() => {
                                  setTempNoteText(tempNoteText ? `${tempNoteText}, ${tag}` : tag);
                                }}
                                className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                              >
                                +{tag}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingNoteSlotId(null)}
                              className="rounded px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateDoseNotes(med.id, slot.id, tempNoteText)}
                              aria-label="Save caregiver note"
                              className="flex items-center gap-1 rounded bg-teal-700 px-3 py-1 text-xs font-bold text-white hover:bg-teal-800 shadow-xs"
                            >
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                              <span>Save Note</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Daily Routine + Role Access Summary */}
        <div className="space-y-6 lg:col-span-5">
          <section
            aria-labelledby="routine-heading"
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <h2 id="routine-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                  {t.dailyRoutineTitle}
                </h2>
              </div>
              <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                {db.dailyRoutine.filter((r) => r.completed).length}/{db.dailyRoutine.length}
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {db.dailyRoutine.map((item) => (
                <label
                  key={item.id}
                  htmlFor={`routine-check-${item.id}`}
                  className="flex cursor-pointer items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <input
                      id={`routine-check-${item.id}`}
                      type="checkbox"
                      disabled={!canConfirmPhysicalDose}
                      checked={item.completed}
                      onChange={async () => {
                        await fetch(`/api/routine/${item.id}/toggle`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            actorName: currentMember.name,
                            actorRole: currentMember.role,
                          }),
                        });
                      }}
                      aria-label={`Toggle completion for ${item.title}`}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 text-teal-700 disabled:opacity-50"
                    />
                    <div>
                      <div
                        className={`text-sm font-bold ${
                          item.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="font-mono text-xs text-slate-500 tabular-nums">
                        {item.time}
                        {item.valueRecorded ? ` · ${item.valueRecorded}` : ''}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* Role-Based Governance Card */}
          <section
            aria-labelledby="governance-heading"
            className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <h3 id="governance-heading" className="text-base font-bold text-slate-900 dark:text-white">
                  OJAS Role Permissions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStage('profile_select')}
                aria-label="Switch current active profile persona"
                className="text-xs font-bold text-teal-700 underline dark:text-teal-400"
              >
                {t.switchRoleBtn}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {currentMember.role === 'elderly'
                ? 'Patient Mode: Clinical prescription editing is locked for your safety. You can confirm daily medicine doses, call Caregiver or Family in 1 tap, and authorize or revoke Family/Caregiver access in Profile & Access.'
                : currentMember.role === 'caretaker'
                ? 'Caregiver Mode (PIN Verified): Authorized by patient to log clinical vitals, broadcast shift notes, manage medications, upload pill strip photos, and record consultation notes.'
                : 'Family Mode: Read-only monitoring unless explicitly granted write permissions by Smt. Kamala Deshmukh. One-tap calling to Caregiver & Patient is always active.'}
            </p>
          </section>
        </div>
      </div>

      {/* Interactive 7-Day Vitals Trend Analysis */}
      <VitalsTrendChart />

      {/* Smart Pillbox Status Dashboard with Circular Indicator Light Style UI */}
      <SmartPillboxDashboard
        hardware={db.hardware}
        medications={db.medications}
        actorName={currentMember.name}
        actorRole={currentMember.role}
        onSpeakText={speakText}
        onSyncAction={onSyncHardware}
      />
    </div>
  );
};
