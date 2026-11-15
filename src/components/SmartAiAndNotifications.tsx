import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  Volume2,
  Upload,
  Mail,
  BellRing,
  CheckCircle2,
  Send,
  PlusCircle,
  Lock,
} from 'lucide-react';
import type {
  NotificationSettings,
  EmailNotificationLog,
  Medication,
  AuthorizedMember,
} from '../types';

interface SmartAiAndNotificationsProps {
  notificationSettings: NotificationSettings;
  emailLogs: EmailNotificationLog[];
  currentMember: AuthorizedMember;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  onSendManualNotification: (payload: {
    type: EmailNotificationLog['type'];
    subject: string;
    body: string;
    recipients?: string[];
  }) => Promise<void>;
  onAcknowledgeNotification: (id: string) => Promise<void>;
  onAddSuggestedMedication: (med: Partial<Medication>) => Promise<void>;
  onSpeakText: (text: string) => void;
}

export const SmartAiAndNotifications: React.FC<SmartAiAndNotificationsProps> = ({
  notificationSettings,
  emailLogs,
  currentMember,
  onUpdateSettings,
  onSendManualNotification,
  onAcknowledgeNotification,
  onAddSuggestedMedication,
  onSpeakText,
}) => {
  // AI Medication Schedule Assistant states
  const [assistantQuery, setAssistantQuery] = useState('');
  const [rxImageBase64, setRxImageBase64] = useState<string | undefined>(undefined);
  const [rxImageMime, setRxImageMime] = useState<string | undefined>(undefined);
  const [rxFileName, setRxFileName] = useState<string>('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantReply, setAssistantReply] = useState<{
    spokenReply: string;
    clinicalNotes: string;
    hasSuggestedMedication: boolean;
    suggestedMedication?: {
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
      purpose: string;
      scheduledTimes: string[];
    };
  } | null>(null);
  const [isListening, setIsListening] = useState(false);

  // Weekly AI Summary states
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<{
    headline: string;
    adherenceAssessment: string;
    vitalsAndRoutineHighlights: string;
    attentionItems: string[];
    caretakerNextSteps: string[];
  } | null>(null);

  // Notification Settings local state
  const [recipientsText, setRecipientsText] = useState(
    notificationSettings.recipientEmails.join(', ')
  );
  const [frequency, setFrequency] = useState(notificationSettings.reminderFrequency);
  const [graceMinutes, setGraceMinutes] = useState(
    notificationSettings.missedDoseGracePeriodMinutes
  );
  const [autoEscalate, setAutoEscalate] = useState(
    notificationSettings.autoCaretakerEscalation
  );

  // Role permissions:
  // Caretaker Nurse can add AI-extracted prescriptions directly to the medication list.
  // Family Member (Rohan Deshmukh) can configure notification rules & email recipients.
  const canAddExtractedMedication = currentMember.role === 'caretaker';
  const canConfigureNotificationPolicy = currentMember.role === 'family';

  const handleVoiceDictation = () => {
    const SpeechRec =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setAssistantQuery(
        'Dr. Kulkarni prescribed Shelcal 500mg once daily after afternoon lunch—how should we schedule it alongside Telma 40 and Glycomet-GP?'
      );
      return;
    }
    const recognition = new SpeechRec();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setAssistantQuery(transcript);
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleRxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRxFileName(file.name);
    setRxImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Part = reader.result.split(',')[1];
        setRxImageBase64(base64Part);
      }
    };
    reader.readAsDataURL(file);
  };

  const askScheduleAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuery.trim() && !rxImageBase64) return;
    setAssistantLoading(true);
    try {
      const res = await fetch('/api/ai/schedule-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage:
            assistantQuery.trim() ||
            'Please read this Indian hospital prescription and create a clear daily medication schedule.',
          imageBase64: rxImageBase64,
          imageMimeType: rxImageMime,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAssistantReply(data);
        if (data.spokenReply) {
          onSpeakText(data.spokenReply);
        }
      }
    } finally {
      setAssistantLoading(false);
    }
  };

  const generateWeeklySummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/ai/weekly-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setWeeklySummary(data);
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSaveNotificationConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = recipientsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    await onUpdateSettings({
      recipientEmails: emails,
      reminderFrequency: frequency,
      missedDoseGracePeriodMinutes: Number(graceMinutes),
      autoCaretakerEscalation: autoEscalate,
    });
  };

  return (
    <div className="space-y-8">
      {/* AI Medication Schedule Assistant & Voice/Rx Scanner */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                AI Medication Schedule Assistant & Prescription Scanner
              </h2>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                Ask questions by voice or upload a Sahyadri / Ruby Hall OPD prescription image.
              </p>
            </div>
            <button
              type="button"
              onClick={handleVoiceDictation}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white'
                  : 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>{isListening ? 'Listening...' : 'Speak Question'}</span>
            </button>
          </div>

          <form onSubmit={askScheduleAssistant} className="mt-4 space-y-3">
            <textarea
              rows={3}
              value={assistantQuery}
              onChange={(e) => setAssistantQuery(e.target.value)}
              placeholder="e.g., 'Dr. Kulkarni prescribed Shelcal 500mg once daily after lunch—when should Kamala Aaji take it alongside Telma 40 and Glycomet-GP?'"
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Upload className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span>{rxFileName ? `Rx Attached: ${rxFileName}` : 'Attach OPD Prescription Image'}</span>
                <input type="file" accept="image/*" onChange={handleRxUpload} className="hidden" />
              </label>

              <button
                type="submit"
                disabled={assistantLoading}
                className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {assistantLoading ? 'Analyzing Schedule...' : 'Ask AI Schedule Assistant'}
                </span>
              </button>
            </div>
          </form>

          {assistantReply && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-teal-800 dark:text-teal-300">
                  Assistant Guidance (Voice Ready)
                </span>
                <button
                  type="button"
                  onClick={() => onSpeakText(assistantReply.spokenReply)}
                  className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Read Aloud</span>
                </button>
              </div>
              <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">
                {assistantReply.spokenReply}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {assistantReply.clinicalNotes}
              </p>

              {assistantReply.hasSuggestedMedication && assistantReply.suggestedMedication && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Suggested Schedule:{' '}
                    </span>
                    <span>
                      {assistantReply.suggestedMedication.name} (
                      {assistantReply.suggestedMedication.dosage}) ·{' '}
                      {assistantReply.suggestedMedication.frequency} at{' '}
                      {assistantReply.suggestedMedication.scheduledTimes.join(', ')}
                    </span>
                  </div>
                  {canAddExtractedMedication ? (
                    <button
                      type="button"
                      onClick={() => {
                        const sm = assistantReply.suggestedMedication!;
                        onAddSuggestedMedication({
                          name: sm.name,
                          dosage: sm.dosage,
                          frequency: sm.frequency,
                          duration: sm.duration,
                          instructions: sm.instructions,
                          purpose: sm.purpose,
                          dailySchedule: (sm.scheduledTimes.length ? sm.scheduledTimes : ['09:00']).map(
                            (t, i) => ({
                              id: `slot-${Date.now()}-${i}`,
                              scheduledTime: t,
                              label: 'AI Recommended Slot',
                              status: 'pending',
                            })
                          ),
                        });
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Add to Active Medications (Nurse)</span>
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-slate-500">
                      Nurse Sister Priya Nair can add this to active regimen
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Weekly Health & Adherence Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                AI Weekly Health Summary
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Synthesizes dose adherence, daily vitals, and caretaker escalation logs.
              </p>
            </div>
            <button
              type="button"
              disabled={summaryLoading}
              onClick={generateWeeklySummary}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-teal-600 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>{summaryLoading ? 'Generating...' : 'Generate Weekly Report'}</span>
            </button>
          </div>

          {weeklySummary ? (
            <div className="mt-4 space-y-3 text-xs">
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {weeklySummary.headline}
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Adherence:</strong> {weeklySummary.adherenceAssessment}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <strong>Vitals & Routine:</strong> {weeklySummary.vitalsAndRoutineHighlights}
              </p>
              <div>
                <strong className="text-slate-900 dark:text-slate-100">Attention Items:</strong>
                <ul className="mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                  {weeklySummary.attentionItems.map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() =>
                    onSendManualNotification({
                      type: 'upcoming_dose',
                      subject: `[WEEKLY HEALTH REPORT] ${weeklySummary.headline}`,
                      body: `${weeklySummary.adherenceAssessment}\n\nVitals: ${weeklySummary.vitalsAndRoutineHighlights}\n\nNext Steps: ${weeklySummary.caretakerNextSteps.join('; ')}`,
                    })
                  }
                  className="flex items-center gap-1.5 font-semibold text-teal-700 hover:underline dark:text-teal-400"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Email Weekly Report to Family & Dr. Kulkarni</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500 dark:border-slate-800">
              Click <strong>Generate Weekly Report</strong> to create an AI-synthesized adherence & vitals briefing for Rohan Deshmukh and Dr. Rajesh Kulkarni.
            </div>
          )}
        </div>
      </div>

      {/* Smart Notification Rules & Automated Email Outbox */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSaveNotificationConfig}
          className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-teal-700 dark:text-teal-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Smart Notification & Escalation Rules
              </h3>
            </div>
            {!canConfigureNotificationPolicy && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Lock className="h-3 w-3" />
                Family Proxy Config
              </span>
            )}
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Authorized Email Recipients (comma-separated)
              </label>
              <input
                type="text"
                disabled={!canConfigureNotificationPolicy}
                value={recipientsText}
                onChange={(e) => setRecipientsText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Reminder Frequency
                </label>
                <select
                  disabled={!canConfigureNotificationPolicy}
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as NotificationSettings['reminderFrequency'])
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="once">Once at Scheduled Time</option>
                  <option value="every_15_min">Every 15 Mins Until Taken</option>
                  <option value="every_30_min">Every 30 Mins Until Taken</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Escalation Grace Window (Mins)
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  disabled={!canConfigureNotificationPolicy}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
              <input
                type="checkbox"
                disabled={!canConfigureNotificationPolicy}
                checked={autoEscalate}
                onChange={(e) => setAutoEscalate(e.target.checked)}
                className="rounded border-slate-300 text-teal-700"
              />
              <span>
                Automatically escalate unacknowledged doses to Sister Priya Nair & Rohan Deshmukh
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {canConfigureNotificationPolicy && (
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
                >
                  Save Notification Policy
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  onSendManualNotification({
                    type: 'upcoming_dose',
                    subject:
                      '[TEST DISPATCH] Automated CareBridge India Medication & Escalation Verification',
                    body: `Triggered by ${currentMember.name}: All email reminder & missed-dose escalation channels for Smt. Kamala Deshmukh are active.`,
                  })
                }
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Send Test Email Dispatch
              </button>
            </div>
          </div>
        </form>

        {/* Automated Email Outbox & Escalation Log */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-teal-700 dark:text-teal-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Automated Email Notification & Escalation Log
              </h3>
            </div>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {emailLogs.length} Dispatches Logged
            </span>
          </div>

          <div className="mt-3 max-h-80 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
            {emailLogs.map((log) => (
              <div key={log.id} className="py-3.5 first:pt-1 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-mono tabular-nums">
                    {log.timestamp} · {log.type.replace('_', ' ').toUpperCase()} ·{' '}
                    {log.deliveryStatus.toUpperCase()}
                  </span>
                  {log.acknowledged ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAcknowledgeNotification(log.id)}
                      className="font-semibold text-amber-700 underline hover:text-amber-800 dark:text-amber-400"
                    >
                      Acknowledge Alert
                    </button>
                  )}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {log.subject}
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                  To: {log.recipients.join(', ')}
                </p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{log.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
