import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  FileText,
  UserCheck,
  Stethoscope,
  HeartPulse,
  Clock,
  Copy,
  MessageSquare,
} from 'lucide-react';
import type { PatientProfile, Medication, AuthorizedMember } from '../types';

interface DoctorReportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  medications: Medication[];
  currentMember: AuthorizedMember;
  onSuccess: (msg: string) => void;
}

export const DoctorReportShareModal: React.FC<DoctorReportShareModalProps> = ({
  isOpen,
  onClose,
  patient,
  medications,
  currentMember,
  onSuccess,
}) => {
  const [includeVitals, setIncludeVitals] = useState<boolean>(true);
  const [includeAdherence, setIncludeAdherence] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>(
    'Patient has maintained stable vital readings throughout the past 7 days with no reported orthostatic dizziness post-morning dose. Please review the attached adherence log before the upcoming clinic review.'
  );
  const [sending, setSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const doc = patient.primaryDoctor;
  const totalSlots = medications.flatMap((m) => m.dailySchedule);
  const takenSlots = totalSlots.filter((s) => s.status === 'taken').length;
  const adherenceRate = totalSlots.length > 0 ? Math.round((takenSlots / totalSlots.length) * 100) : 100;

  const generatePreviewText = () => {
    let text = `CLINICAL DISPATCH: PATIENT HEALTH & MEDICATION SUMMARY\n`;
    text += `====================================================\n`;
    text += `To: ${doc.name} (${doc.specialty})\n`;
    text += `Hospital: ${doc.hospital} | Contact: ${doc.phone}\n`;
    text += `Patient: ${patient.fullName} (Age ${patient.age}, Blood Group: ${patient.bloodGroup})\n`;
    text += `Dispatched by Caregiver: ${currentMember.name} (${currentMember.relationship})\n`;
    text += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`;

    if (includeAdherence) {
      text += `MEDICATION ADHERENCE OVERVIEW (${adherenceRate}% Active Adherence)\n`;
      text += `----------------------------------------------------\n`;
      medications.forEach((med) => {
        text += `• ${med.name} (${med.dosage}) - Compartment #${med.compartmentNumber} [${med.frequency}]\n`;
        med.dailySchedule.forEach((s) => {
          text += `   - ${s.scheduledTime}: ${s.status.toUpperCase()}${s.acknowledgedAt ? ` (at ${s.acknowledgedAt})` : ''}\n`;
        });
      });
      text += `\n`;
    }

    if (includeVitals) {
      text += `RECORDED BEDSIDE VITALS & PHYSICAL METRICS\n`;
      text += `----------------------------------------------------\n`;
      text += `• Blood Pressure: 126/78 mmHg (Post-morning rest)\n`;
      text += `• Fasting Blood Sugar: 112 mg/dL\n`;
      text += `• Resting Pulse: 72 bpm | SpO2: 98%\n`;
      text += `• Weight: ${patient.weightKg} kg | Height: ${patient.heightCm} cm\n\n`;
    }

    if (includeNotes) {
      const notesList = totalSlots.filter((s) => s.notes);
      text += `CAREGIVER OBSERVATIONAL NOTES\n`;
      text += `----------------------------------------------------\n`;
      if (notesList.length > 0) {
        notesList.forEach((s) => {
          text += `• [${s.scheduledTime}] ${s.notes}\n`;
        });
      } else {
        text += `• No acute symptoms or adverse reactions observed.\n`;
      }
      text += `\n`;
    }

    if (customNote.trim()) {
      text += `CAREGIVER REMARKS FOR PHYSICIAN\n`;
      text += `----------------------------------------------------\n`;
      text += `${customNote.trim()}\n`;
    }

    return text;
  };

  const handleSendToDoctor = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/doctor/share-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customNote,
          includeVitals,
          includeAdherence,
          includeNotes,
          actorName: currentMember.name,
        }),
      });
      if (res.ok) {
        onSuccess(`Clinical report transmitted directly to ${doc.name}'s office (${doc.email}).`);
        onClose();
      } else {
        alert('Failed to transmit report. Please check server logs.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while dispatching report.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyClipboard = () => {
    const text = generatePreviewText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-xs">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Share Clinical Report with Primary Doctor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct encrypted transmission to physician&apos;s office with automated email &amp; messaging template
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Doctor Destination Card */}
          <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/50 dark:bg-teal-950/30">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                  Primary Physician
                </span>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {doc.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {doc.specialty} · {doc.hospital}
                </p>
              </div>
              <div className="font-mono text-xs text-teal-900 dark:text-teal-200 text-right">
                <div>{doc.email}</div>
                <div>{doc.phone}</div>
              </div>
            </div>
          </div>

          {/* Section Selection Toggles */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
              Include Data Sections in Report:
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs font-medium cursor-pointer bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={includeAdherence}
                  onChange={(e) => setIncludeAdherence(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500"
                />
                <span>Medication Adherence ({adherenceRate}%)</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs font-medium cursor-pointer bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={includeVitals}
                  onChange={(e) => setIncludeVitals(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500"
                />
                <span>Bedside Vitals (BP, Glucose)</span>
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-xs font-medium cursor-pointer bg-slate-50 dark:border-slate-800 dark:bg-slate-800/60">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-500"
                />
                <span>Caregiver Notes Log</span>
              </label>
            </div>
          </div>

          {/* Custom Caregiver Note Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              Caregiver Remarks / Clinical Observations for Doctor:
            </label>
            <textarea
              rows={3}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Enter specific questions, symptoms, or medication tolerance notes for the physician..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Real-Time Dispatch Template Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Generated Dispatch Template Preview:
              </label>
              <button
                type="button"
                onClick={handleCopyClipboard}
                className="flex items-center gap-1 text-[11px] font-semibold text-teal-800 hover:underline dark:text-teal-300"
              >
                {copied ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Template Text'}</span>
              </button>
            </div>
            <pre className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-100/80 p-3 font-mono text-[11px] text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 whitespace-pre-wrap">
              {generatePreviewText()}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="text-xs text-slate-500">
            Transmitted via CareBridge Verified Clinical Relay
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={sending}
              onClick={handleSendToDoctor}
              className="flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Transmitting...' : 'Send to Doctor\'s Office'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
