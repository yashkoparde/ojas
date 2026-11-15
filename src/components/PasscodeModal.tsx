import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, X, AlertCircle } from 'lucide-react';
import type { AuthorizedMember, UserRole } from '../types';

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: AuthorizedMember[];
  currentMember: AuthorizedMember;
  onAuthenticated: (member: AuthorizedMember) => void;
}

const ROLE_SCOPE_DETAILS: Record<
  UserRole,
  { title: string; allowed: string; restricted: string }
> = {
  elderly: {
    title: 'Elderly Patient Portal (Smt. Kamala Deshmukh)',
    allowed:
      'One-tap self dose confirmation, Voice Assistant, Daily Swasthya checklist, and EXCLUSIVE authority to Invite/Revoke members & manage Consent.',
    restricted:
      'Clinical prescription editing and notification policy configuration are hidden for safety and simplicity.',
  },
  caretaker: {
    title: 'Clinical Nurse Portal (Sister Priya Nair, RN)',
    allowed:
      'Administer & verify doses, add/edit medications, log +30 tablet refills, upload SRL lab reports, edit doctor OPD notes, and operate ESP32 Pillbox.',
    restricted:
      'Cannot invite/revoke users or modify Patient Consent Matrix; cannot delete patient records.',
  },
  family: {
    title: 'Remote Family Proxy Portal (Rohan Deshmukh)',
    allowed:
      'Remote real-time adherence monitoring, book Sahyadri/Ruby Hall OPD appointments, generate AI Weekly Summaries, and configure Email Escalation rules.',
    restricted:
      'View-Only on physical dose intake & pillbox buttons (cannot mark physical pills taken remotely); cannot add/edit prescriptions or alter Patient Consent.',
  },
};

export const PasscodeModal: React.FC<PasscodeModalProps> = ({
  isOpen,
  onClose,
  members,
  currentMember,
  onAuthenticated,
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentMember.id);
  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetMember = members.find((m) => m.id === selectedId) || currentMember;
  const scopeInfo = ROLE_SCOPE_DETAILS[targetMember.role];

  const handleDigit = (digit: string) => {
    setError(null);
    if (passcode.length < 4) {
      setPasscode((prev) => prev + digit);
    }
  };

  const handleVerify = async (codeOverride?: string) => {
    const codeToVerify = codeOverride ?? passcode;
    if (codeToVerify.length < 4) {
      setError('Please enter a 4-digit security passcode.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: targetMember.id, passcode: codeToVerify }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed.');
      } else {
        onAuthenticated(data.member);
        setPasscode('');
        onClose();
      }
    } catch {
      if (targetMember.status === 'revoked' || !targetMember.consentGrantedByPatient) {
        setError('Access revoked by Smt. Kamala Deshmukh.');
      } else if (targetMember.passcode === codeToVerify) {
        onAuthenticated(targetMember);
        setPasscode('');
        onClose();
      } else {
        setError('Invalid 4-digit passcode.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Role Session Gate · Passcode Authentication
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            1. Choose Exclusive Role Session (Ends Current Role Session)
          </label>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {members.map((m) => {
              const isSelected = m.id === selectedId;
              const isRevoked = m.status === 'revoked' || !m.consentGrantedByPatient;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(m.id);
                    setPasscode('');
                    setError(null);
                  }}
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/70 dark:border-teal-400 dark:bg-teal-950/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-xs font-semibold capitalize text-teal-800 dark:text-teal-300">
                      {m.role}
                    </span>
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      PIN: {m.passcode}
                    </span>
                  </div>
                  <span className="mt-1 truncate w-full text-sm font-bold text-slate-900 dark:text-slate-100">
                    {m.name}
                  </span>
                  <span className="mt-0.5 truncate w-full text-xs text-slate-500">
                    {isRevoked ? 'Access Revoked' : m.relationship}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Distinct Role Capability Scope Notice */}
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
            <ShieldCheck className="h-4 w-4 text-teal-700 dark:text-teal-400" />
            <span>{scopeInfo.title}</span>
          </div>
          <p className="mt-1.5 text-slate-700 dark:text-slate-300">
            <strong className="text-emerald-700 dark:text-emerald-400">Authorized Scope:</strong>{' '}
            {scopeInfo.allowed}
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            <strong className="text-red-700 dark:text-red-400">Restricted by Role:</strong>{' '}
            {scopeInfo.restricted}
          </p>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              2. Enter 4-Digit Security Passcode for {targetMember.name}
            </label>
            <button
              type="button"
              onClick={() => {
                setPasscode(targetMember.passcode);
                handleVerify(targetMember.passcode);
              }}
              className="text-xs font-semibold text-teal-700 underline hover:text-teal-800 dark:text-teal-400"
            >
              Demo Auto-Unlock ({targetMember.passcode})
            </button>
          </div>

          <div className="mt-2 flex items-center justify-center gap-3">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 font-mono text-xl font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {passcode[idx] ? '•' : ''}
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Clear', '0', 'Del'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === 'Clear') setPasscode('');
                  else if (key === 'Del') setPasscode((p) => p.slice(0, -1));
                  else handleDigit(key);
                }}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 font-mono text-sm font-semibold text-slate-900 hover:bg-slate-100 active:bg-slate-200 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading || passcode.length < 4}
            onClick={() => handleVerify()}
            className="flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            <span>{loading ? 'Verifying...' : `Unlock ${targetMember.role.toUpperCase()} Portal`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
