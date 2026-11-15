import React, { useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2, Phone, Shield } from 'lucide-react';
import type { PatientProfile, AuthorizedMember } from '../types';

interface WhatsAppDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  currentMember: AuthorizedMember;
  members: AuthorizedMember[];
  onSuccess: (msg: string) => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  isOpen,
  onClose,
  patient,
  currentMember,
  members,
  onSuccess,
}) => {
  const [targetPhone, setTargetPhone] = useState<string>('+91 98201 99882 (Son: Rohan Deshmukh)');
  const [templateType, setTemplateType] = useState<'routine_vitals' | 'dose_reminder' | 'sos' | 'refill_order'>('routine_vitals');
  const [messageText, setMessageText] = useState<string>(
    `[CAREBRIDGE UPDATE] Smt. Kamala Deshmukh: Morning clinical checkup completed by Sister Priya Sharma, RN. Blood Pressure: 126/78 mmHg, Glucose: 112 mg/dL. Morning medicines confirmed taken.`
  );
  const [sending, setSending] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTemplateChange = (type: 'routine_vitals' | 'dose_reminder' | 'sos' | 'refill_order') => {
    setTemplateType(type);
    if (type === 'routine_vitals') {
      setMessageText(
        `[CAREBRIDGE UPDATE] ${patient.fullName}: Morning clinical checkup completed by ${currentMember.name}. Blood Pressure: 126/78 mmHg (Normal), Pulse: 72 bpm, SpO2: 98%. All morning doses confirmed taken.`
      );
    } else if (type === 'dose_reminder') {
      setMessageText(
        `[CAREBRIDGE DOSE ALERT] ${patient.fullName}: Upcoming afternoon dose for Eliquis 2.5mg (Compartment #3) scheduled at 14:00. Please ensure water is kept beside the pillbox.`
      );
    } else if (type === 'sos') {
      setMessageText(
        `[CAREBRIDGE URGENT SOS] ${patient.fullName}: Emergency assistance request triggered at ${new Date().toLocaleTimeString('en-IN')}. Caregiver on site. Please call patient or primary doctor immediately.`
      );
    } else if (type === 'refill_order') {
      setMessageText(
        `[PHARMACY REFILL REQUEST] CareBridge ElderCare Order for ${patient.fullName}: Low stock alert on Atorva 20mg (4 tablets left). Delivery to Flat 402, Prabhat Road, Pune 411004. Prescribed by Dr. Rajesh Kulkarni.`
      );
    }
  };

  const handleDispatch = async () => {
    setSending(true);
    try {
      const res = await fetch('/api/notifications/whatsapp-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientPhone: targetPhone,
          messageType: templateType,
          customText: messageText,
          actorName: currentMember.name,
        }),
      });
      if (res.ok) {
        onSuccess(`WhatsApp dispatch delivered to ${targetPhone}.`);
        onClose();
      } else {
        alert('Failed to transmit message.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while dispatching alert.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Instant WhatsApp &amp; SMS Dispatch Hub
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulated direct WhatsApp Business API transmission to Care Circle members
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

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Target Recipient Selector */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              Select Recipient Contact:
            </label>
            <select
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="+91 98201 99882 (Family Rohan Deshmukh)">
                Rohan Deshmukh (Son / Primary Family) · +91 98201 99882
              </option>
              <option value="+91 98230 45120 (Caregiver Priya Sharma)">
                Sister Priya Sharma, RN (Caretaker) · +91 98230 45120
              </option>
              <option value="+91 98220 11990 (Emergency Contact Dr. Amit)">
                Dr. Rajesh Kulkarni (Primary Physician Desk) · +91 20 6721 3000
              </option>
              <option value="+91 99881 22334 (Pune Apollo Chemist)">
                Wellness Forever Chemist (Prabhat Rd) · +91 99881 22334
              </option>
            </select>
          </div>

          {/* Quick Template Category Chips */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              Message Template Preset:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('routine_vitals')}
                className={`rounded-lg border p-2 text-left text-xs font-semibold transition-all ${
                  templateType === 'routine_vitals'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Vitals &amp; Routine Report
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('dose_reminder')}
                className={`rounded-lg border p-2 text-left text-xs font-semibold transition-all ${
                  templateType === 'dose_reminder'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Dose Intake Reminder
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('refill_order')}
                className={`rounded-lg border p-2 text-left text-xs font-semibold transition-all ${
                  templateType === 'refill_order'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Chemist Pharmacy Refill
              </button>
              <button
                type="button"
                onClick={() => handleTemplateChange('sos')}
                className={`rounded-lg border p-2 text-left text-xs font-semibold transition-all ${
                  templateType === 'sos'
                    ? 'border-red-600 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-200'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Emergency Escalation SOS
              </button>
            </div>
          </div>

          {/* Formatted Message Preview */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
              WhatsApp Message Text:
            </label>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/50">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>End-to-end encrypted dispatch</span>
          </span>

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
              onClick={handleDispatch}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{sending ? 'Sending...' : 'Transmit WhatsApp'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
