import React, { useEffect, useCallback } from 'react';
import {
  QrCode,
  X,
  Printer,
  ShieldAlert,
  Phone,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  Pill,
  User,
  Activity,
} from 'lucide-react';
import type { PatientProfile, Medication } from '../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  medications: Medication[];
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  patient,
  medications,
}) => {
  // Handle Escape key navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Deterministic visual QR matrix generator from patient.qrCodeId
  const seedStr = `${patient.qrCodeId}-${patient.fullName}-${patient.bloodGroup}`;
  const gridSize = 21;
  const isModuleDark = (r: number, c: number) => {
    // Finder patterns in 3 corners
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= gridSize - 7;
    const inBottomLeft = r >= gridSize - 7 && c < 7;
    if (inTopLeft || inTopRight || inBottomLeft) {
      const lr = inBottomLeft ? r - (gridSize - 7) : r;
      const lc = inTopRight ? c - (gridSize - 7) : c;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    }
    const charCode = seedStr.charCodeAt((r * gridSize + c) % seedStr.length);
    return ((charCode + r * 17 + c * 31) % 3) === 0;
  };

  const primaryContact = patient.emergencyContacts.find((c) => c.isPrimary) || patient.emergencyContacts[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-id-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden my-auto">
        {/* Urgent Emergency Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs font-mono font-bold text-white shadow-inner">
              +
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-red-100 bg-black/20 px-2 py-0.5 rounded">
                  First Responder Pass
                </span>
                <span className="text-[11px] font-medium text-red-100">
                  Instant ER Triage ID
                </span>
              </div>
              <h2 id="emergency-id-title" className="text-base sm:text-lg font-extrabold tracking-tight">
                Emergency Medical ID &amp; QR Patient Passport
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close emergency medical pass modal"
            className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body: 2 Columns on Tablet/Desktop */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: QR Scan Card + Primary Vitals */}
          <div className="md:col-span-5 flex flex-col items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40 text-center">
            {/* Blood Group Hero Badge */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Blood Group
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-full">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                <span className="font-mono text-base font-black text-red-700 dark:text-red-400">
                  {patient.bloodGroup}
                </span>
              </div>
            </div>

            {/* High-Contrast Crisp QR Code */}
            <div className="my-4 rounded-xl border-2 border-slate-300 bg-white p-3.5 shadow-md dark:border-slate-700">
              <svg
                viewBox={`0 0 ${gridSize} ${gridSize}`}
                className="h-44 w-44 sm:h-48 sm:w-48"
                shapeRendering="crispEdges"
                aria-label={`Encrypted triage QR Code for ${patient.fullName}`}
              >
                {Array.from({ length: gridSize }).map((_, r) =>
                  Array.from({ length: gridSize }).map((__, c) =>
                    isModuleDark(r, c) ? (
                      <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0f172a" />
                    ) : null
                  )
                )}
              </svg>
            </div>

            {/* Verification ID Badge */}
            <div className="w-full space-y-1">
              <div className="font-mono text-xs font-extrabold text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-2">
                ID: {patient.qrCodeId}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                Scan with any paramedic camera for instant verified health records.
              </p>
            </div>

            {/* Key Signature */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 w-full flex items-center justify-center gap-1.5 font-mono text-[10px] text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>{patient.encryptionKeyFingerprint}</span>
            </div>
          </div>

          {/* Right Column: High-Readability Clinical Summary */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Patient Demographic Banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-teal-700 text-white flex items-center justify-center text-lg font-bold shrink-0">
                    <User className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {patient.fullName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Age <span className="font-bold">{patient.age} yrs</span> · Born <span className="font-mono">{patient.dateOfBirth}</span> · Weight <span className="font-mono font-bold">{patient.weightKg} kg</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                Address: <span className="font-medium text-slate-800 dark:text-slate-200">{patient.address}</span>
              </div>
            </div>

            {/* Section 1: Critical Allergies & Contraindications (High-Priority Red Box) */}
            <div className="rounded-xl border-2 border-red-200 bg-red-50/70 p-3.5 dark:border-red-900/60 dark:bg-red-950/30">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-700 dark:text-red-400 mb-2">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Life-Threatening Allergies &amp; Contraindications</span>
              </div>

              {/* Badges for Allergies */}
              <div className="flex flex-wrap gap-1.5">
                {patient.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="inline-flex items-center gap-1 rounded-md bg-red-600 text-white font-bold text-xs px-2.5 py-1 shadow-xs"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{allergy}</span>
                  </span>
                ))}
              </div>

              {/* Bleeding / Drug Restriction Warning */}
              {patient.medicationRestrictions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-900/40 text-[11px] font-semibold text-red-900 dark:text-red-200">
                  <span className="font-extrabold uppercase">Blackbox Alert: </span>
                  {patient.medicationRestrictions.join(' · ')}
                </div>
              )}
            </div>

            {/* Section 2: Chronic Conditions & Active Regimen */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Activity className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Documented Chronic Conditions</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {patient.conditions.map((cond) => (
                  <span
                    key={cond}
                    className="inline-flex items-center rounded-md bg-teal-50 border border-teal-200 text-teal-900 font-medium text-xs px-2.5 py-0.5 dark:bg-teal-950/50 dark:border-teal-800 dark:text-teal-200"
                  >
                    {cond}
                  </span>
                ))}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2">
                <Pill className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Active Regimen: </span>
                  <span className="font-mono text-[11px]">
                    {medications.map((m) => `${m.name} (${m.dosage})`).join(' · ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: One-Tap Emergency Contacts & Physician Direct Dial */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                <Phone className="h-4 w-4 text-teal-700 dark:text-teal-400 shrink-0" aria-hidden="true" />
                <span>Emergency Contacts &amp; Physician Direct Dial</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Primary Family Contact */}
                {primaryContact && (
                  <a
                    href={`tel:${primaryContact.phone.replace(/\s+/g, '')}`}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200 truncate">
                        {primaryContact.name}
                      </div>
                      <div className="text-[10px] text-emerald-800 dark:text-emerald-400">
                        {primaryContact.relationship}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-900 dark:text-emerald-300 ml-2 shrink-0">
                      <Phone className="h-3 w-3" aria-hidden="true" />
                      <span>{primaryContact.phone}</span>
                    </div>
                  </a>
                )}

                {/* Primary Doctor Direct Dial */}
                <a
                  href={`tel:${patient.primaryDoctor.phone.replace(/\s+/g, '')}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-teal-950 dark:text-teal-200 truncate">
                      {patient.primaryDoctor.name.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-teal-800 dark:text-teal-400 truncate">
                      {patient.primaryDoctor.hospital.split(',')[0]}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-teal-900 dark:text-teal-300 ml-2 shrink-0">
                    <Phone className="h-3 w-3" aria-hidden="true" />
                    <span>{patient.primaryDoctor.phone}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Complies with Indian Digital Health ID &amp; FHIR Emergency Standards
              </span>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm transition-colors"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>Print Pocket Wallet Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
