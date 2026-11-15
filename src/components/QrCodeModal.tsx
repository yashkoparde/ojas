import React from 'react';
import { QrCode, X, Printer, ShieldAlert, Phone, HeartPulse, CheckCircle2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Emergency Medical ID & QR Patient Passport
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* QR Code Visual Box */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="rounded-lg border border-slate-300 bg-white p-3 shadow-xs">
              <svg
                viewBox={`0 0 ${gridSize} ${gridSize}`}
                className="h-44 w-44"
                shapeRendering="crispEdges"
                aria-label={`QR Code for ${patient.fullName}`}
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
            <span className="mt-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
              ID: {patient.qrCodeId}
            </span>
            <span className="mt-1 text-center text-xs text-slate-500">
              Scan at Paramedic / ER Triage for instant allergies, blood type & anticoagulant status
            </span>
          </div>

          {/* Critical Medical Summary */}
          <div className="flex flex-col justify-between md:col-span-7">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {patient.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    DOB: <span className="font-mono">{patient.dateOfBirth}</span> ({patient.age} yrs) ·
                    Weight: <span className="font-mono">{patient.weightKg} kg</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Blood Group</span>
                  <div className="font-mono text-xl font-bold text-red-700 dark:text-red-400">
                    {patient.bloodGroup}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Critical Allergies & Contraindications</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {patient.allergies.join(' · ')}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {patient.medicationRestrictions.join(' · ')}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <HeartPulse className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <span>Active Conditions & Medications</span>
                </div>
                <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
                  {patient.conditions.join(' · ')}
                </p>
                <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-400">
                  Rx: {medications.map((m) => `${m.name} ${m.dosage}`).join(' | ')}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <span>Emergency Contacts & Primary Physician</span>
                </div>
                <div className="mt-1 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  {patient.emergencyContacts.map((ec) => (
                    <div key={ec.id} className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {ec.name} ({ec.relationship})
                      </span>
                      <span className="font-mono">{ec.phone}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {patient.primaryDoctor.name} ({patient.primaryDoctor.hospital})
                    </span>
                    <span className="font-mono">{patient.primaryDoctor.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-800">
              <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {patient.encryptionKeyFingerprint}
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                <Printer className="h-4 w-4" />
                <span>Print Wallet Card</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
