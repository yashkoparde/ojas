import React, { useState } from 'react';
import {
  ShieldCheck,
  Upload,
  UserPlus,
  Lock,
  Phone,
  Stethoscope,
  AlertTriangle,
  History,
  QrCode,
  Edit3,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  PatientProfile,
  AuthorizedMember,
  ActivityLogEntry,
  MedicalReport,
  UserRole,
} from '../types';

interface ProfileAndAccessManagerProps {
  patient: PatientProfile;
  members: AuthorizedMember[];
  currentMember: AuthorizedMember;
  activityLogs: ActivityLogEntry[];
  onUpdatePatient: (updates: Partial<PatientProfile>) => Promise<void>;
  onUploadReport: (report: Omit<MedicalReport, 'id' | 'uploadedAt'>) => Promise<void>;
  onInviteMember: (member: Partial<AuthorizedMember>) => Promise<void>;
  onUpdateMember: (id: string, updates: Partial<AuthorizedMember>) => Promise<void>;
  onOpenQrPassport: () => void;
  onShareWithDoctor?: () => void;
}

export const ProfileAndAccessManager: React.FC<ProfileAndAccessManagerProps> = ({
  patient,
  members,
  currentMember,
  activityLogs,
  onUpdatePatient,
  onUploadReport,
  onInviteMember,
  onUpdateMember,
  onOpenQrPassport,
  onShareWithDoctor,
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [conditionsInput, setConditionsInput] = useState(patient.conditions.join(', '));
  const [allergiesInput, setAllergiesInput] = useState(patient.allergies.join(', '));
  const [restrictionsInput, setRestrictionsInput] = useState(
    patient.medicationRestrictions.join('; ')
  );
  const [historyInput, setHistoryInput] = useState(patient.medicalHistoryNotes);
  const [doctorNameInput, setDoctorNameInput] = useState(patient.primaryDoctor.name);
  const [hospitalInput, setHospitalInput] = useState(patient.primaryDoctor.hospital);
  const [doctorPhoneInput, setDoctorPhoneInput] = useState(patient.primaryDoctor.phone);

  // Report upload state
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<MedicalReport['category']>('Prescription');
  const [reportDoctor, setReportDoctor] = useState(patient.primaryDoctor.name);
  const [reportNotes, setReportNotes] = useState('');
  const [reportDataUrl, setReportDataUrl] = useState<string | undefined>(undefined);

  // Invite member state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('family');
  const [inviteRelation, setInviteRelation] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [invitePasscode, setInvitePasscode] = useState('4321');
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

  // STRICT ROLE SEGREGATION:
  // 1. ONLY the Elderly Patient (Smt. Kamala Deshmukh) can manage access consent, invite/revoke users, or edit RBAC permissions, and she cannot modify clinical diagnostic parameters.
  // 2. Caregivers and Family Members have read-only access to clinical profile parameters unless authorized by the Elderly Patient (consentGrantedByPatient + canEdit / canAdd).
  const isPatientOwner = currentMember.role === 'elderly';
  const isAuthorizedByPatient =
    currentMember.role !== 'elderly' &&
    currentMember.status === 'active' &&
    currentMember.consentGrantedByPatient;
  const canEditClinicalProfile = isAuthorizedByPatient && currentMember.permissions.canEdit;
  const canUploadReports = isAuthorizedByPatient && currentMember.permissions.canAdd;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdatePatient({
      conditions: conditionsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      allergies: allergiesInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      medicationRestrictions: restrictionsInput
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
      medicalHistoryNotes: historyInput,
      primaryDoctor: {
        ...patient.primaryDoctor,
        name: doctorNameInput,
        hospital: hospitalInput,
        phone: doctorPhoneInput,
      },
    });
    setEditingProfile(false);
  };

  const handleReportUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    await onUploadReport({
      title: reportTitle,
      category: reportCategory,
      doctorName: reportDoctor,
      uploadedBy: currentMember.name,
      notes: reportNotes || 'Uploaded to encrypted OJAS India vault.',
      fileDataUrl: reportDataUrl,
    });
    setReportTitle('');
    setReportNotes('');
    setReportDataUrl(undefined);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    await onInviteMember({
      name: inviteName,
      role: inviteRole,
      relationship:
        inviteRelation || (inviteRole === 'caretaker' ? 'Home Care Nurse' : 'Family Member'),
      email: inviteEmail,
      phone: invitePhone || '+91 98230 11220',
      passcode: invitePasscode || '4321',
    });
    setInviteName('');
    setInviteRelation('');
    setInviteEmail('');
    setInvitePhone('');
    setShowInviteForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Patient Medical Profile Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="flex items-center gap-4">
            {!imgErrorMap[patient.id] ? (
              <img
                src={patient.avatarUrl}
                alt={patient.fullName}
                referrerPolicy="no-referrer"
                onError={() => setImgErrorMap((p) => ({ ...p, [patient.id]: true }))}
                className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-teal-700 text-lg font-bold text-white">
                KD
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>PATIENT ID: {patient.qrCodeId}</span>
                <span aria-hidden="true">·</span>
                <span>ENC: {patient.encryptionKeyFingerprint}</span>
              </div>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                {patient.fullName} · {patient.age} yrs (Blood Group {patient.bloodGroup})
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                DOB: <span className="font-mono">{patient.dateOfBirth}</span> · Weight:{' '}
                <span className="font-mono">{patient.weightKg} kg</span> · Height:{' '}
                <span className="font-mono">{patient.heightCm} cm</span> · {patient.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenQrPassport}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              <QrCode className="h-4 w-4 text-teal-700 dark:text-teal-400" />
              <span>QR Medical ID Card</span>
            </button>

            {canEditClinicalProfile ? (
              <button
                type="button"
                onClick={() => setEditingProfile(!editingProfile)}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
              >
                <Edit3 className="h-4 w-4" />
                <span>{editingProfile ? 'Cancel Editing' : 'Edit Clinical Profile'}</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>Clinical Fields Read-Only for {currentMember.role.toUpperCase()}</span>
              </span>
            )}
          </div>
        </div>

        {editingProfile && canEditClinicalProfile ? (
          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Existing Health Conditions (comma-separated)
                </label>
                <input
                  type="text"
                  value={conditionsInput}
                  onChange={(e) => setConditionsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  value={allergiesInput}
                  onChange={(e) => setAllergiesInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Medication Restrictions (semicolon-separated)
                </label>
                <input
                  type="text"
                  value={restrictionsInput}
                  onChange={(e) => setRestrictionsInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Primary Physician Name
                </label>
                <input
                  type="text"
                  value={doctorNameInput}
                  onChange={(e) => setDoctorNameInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Hospital
                  </label>
                  <input
                    type="text"
                    value={hospitalInput}
                    onChange={(e) => setHospitalInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Doctor Phone
                  </label>
                  <input
                    type="text"
                    value={doctorPhoneInput}
                    onChange={(e) => setDoctorPhoneInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Surgical & Medical History Summary
                </label>
                <textarea
                  rows={2}
                  value={historyInput}
                  onChange={(e) => setHistoryInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Save Encrypted Profile Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Allergies & Restrictions</span>
              </h3>
              <p className="mt-2 text-sm font-bold text-red-700 dark:text-red-400">
                {patient.allergies.join(' · ')}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                {patient.medicationRestrictions.map((r, i) => (
                  <li key={i}>• {r}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Stethoscope className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span>Diagnosed Conditions & History</span>
              </h3>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                {patient.conditions.join(' · ')}
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                {patient.medicalHistoryNotes}
              </p>
            </div>

            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Phone className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span>Doctor & Emergency Contacts</span>
              </h3>
              <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-slate-100">
                  {patient.primaryDoctor.name}
                </div>
                <div>
                  {patient.primaryDoctor.specialty} · {patient.primaryDoctor.hospital}
                </div>
                <div className="font-mono">{patient.primaryDoctor.phone}</div>
                {onShareWithDoctor && (
                  <button
                    type="button"
                    onClick={onShareWithDoctor}
                    className="mt-2 inline-flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  >
                    <span>Share Report with Doctor&apos;s Office &rarr;</span>
                  </button>
                )}
              </div>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                {patient.emergencyContacts.map((ec) => (
                  <div key={ec.id} className="flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {ec.name} ({ec.relationship})
                    </span>
                    <span className="font-mono text-slate-600 dark:text-slate-400">{ec.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Consent-Based Family & Caretaker Access Control (RBAC) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Care Circle Access Control & Patient Sovereignty
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {isPatientOwner
                ? 'Smt. Kamala Deshmukh (Active Session): You hold exclusive authority to invite members, grant/withdraw consent, or modify role permissions.'
                : `Logged in as ${currentMember.name} (${currentMember.role.toUpperCase()}): Access Matrix is Read-Only. Only Smt. Kamala Deshmukh can grant or revoke permissions.`}
            </p>
          </div>

          {isPatientOwner ? (
            <button
              type="button"
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-teal-700 whitespace-nowrap shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              <span>{showInviteForm ? 'Close Invite' : 'Authorize New Caretaker / Family'}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              <Lock className="h-3.5 w-3.5" />
              <span>Patient Consent Required to Modify Access</span>
            </span>
          )}
        </div>

        {showInviteForm && isPatientOwner && (
          <form
            onSubmit={handleInviteSubmit}
            className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <input
                type="text"
                required
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Full Name (e.g., Neha Deshmukh) *"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="family">Family Member Role</option>
                <option value="caretaker">Caretaker / Nurse Role</option>
              </select>
              <input
                type="text"
                value={inviteRelation}
                onChange={(e) => setInviteRelation(e.target.value)}
                placeholder="Relationship (e.g., Daughter-in-law)"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email for Alerts *"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={invitePasscode}
                  onChange={(e) => setInvitePasscode(e.target.value)}
                  placeholder="4-Digit PIN"
                  className="w-24 rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap"
                >
                  Grant Consent
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="py-2.5 pr-4 font-semibold">Authorized Member</th>
                <th className="px-3 py-2.5 font-semibold">Role & Scope</th>
                <th className="px-3 py-2.5 font-semibold">Contact (Pune)</th>
                <th className="px-3 py-2.5 font-semibold">RBAC Capabilities</th>
                <th className="px-3 py-2.5 font-semibold">Consent Status</th>
                <th className="py-2.5 pl-3 text-right font-semibold">Patient Governance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {members.map((m) => {
                const isActive = m.status === 'active' && m.consentGrantedByPatient;
                return (
                  <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{m.name}</div>
                      <div className="text-slate-500">{m.relationship}</div>
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums">
                      <span className="uppercase font-semibold text-teal-800 dark:text-teal-300">
                        {m.role}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {m.role === 'elderly'
                          ? 'Self Intake + Full Consent Admin'
                          : m.role === 'caretaker'
                          ? 'Clinical Rx + Nurse Vitals'
                          : 'Remote Monitor + Appointments'}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                      <div>{m.email}</div>
                      <div>{m.phone}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {(['canView', 'canAdd', 'canEdit', 'canDelete'] as const).map((permKey) => (
                          <label
                            key={permKey}
                            className="flex items-center gap-1 text-slate-700 dark:text-slate-300"
                          >
                            <input
                              type="checkbox"
                              disabled={!isPatientOwner || m.role === 'elderly'}
                              checked={m.permissions[permKey]}
                              onChange={(e) =>
                                onUpdateMember(m.id, {
                                  permissions: {
                                    ...m.permissions,
                                    [permKey]: e.target.checked,
                                  },
                                })
                              }
                              className="rounded border-slate-300 text-teal-700"
                            />
                            <span>{permKey.replace('can', '')}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {isActive ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Consent Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" />
                          Access Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      {m.role !== 'elderly' ? (
                        isPatientOwner ? (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateMember(m.id, {
                                status: isActive ? 'revoked' : 'active',
                                consentGrantedByPatient: !isActive,
                              })
                            }
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                              isActive
                                ? 'border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400'
                                : 'bg-teal-700 text-white hover:bg-teal-800'
                            }`}
                          >
                            {isActive ? 'Revoke Access' : 'Restore Consent'}
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">
                            Patient Locked
                          </span>
                        )
                      ) : (
                        <span className="font-mono text-slate-400">Primary Sovereign</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Prescriptions & Diagnostic Reports Vault */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div
          className={`rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 ${
            canUploadReports ? 'lg:col-span-7' : 'lg:col-span-12'
          }`}
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Medical Prescriptions & Diagnostic Reports (SRL Diagnostics / Sahyadri OPD)
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Centralized repository for lab results, cardiology discharge summaries, and scanned prescriptions.
          </p>

          <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {patient.reports.map((rep) => (
              <div key={rep.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    {rep.category} · {rep.doctorName}
                  </span>
                  <span className="font-mono tabular-nums">
                    Uploaded {rep.uploadedAt} by {rep.uploadedBy}
                  </span>
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {rep.title}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{rep.notes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upload New Medical Document (Caretaker Nurse Only) */}
        {canUploadReports && (
          <form
            onSubmit={handleReportUpload}
            className="rounded-xl border border-slate-200 bg-white p-6 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Upload Prescription or Lab Report (Nurse Portal)
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g., SRL Diagnostics Lipid & Renal Panel"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as MedicalReport['category'])}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                    <option value="Imaging">Imaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ordering Physician
                  </label>
                  <input
                    type="text"
                    value={reportDoctor}
                    onChange={(e) => setReportDoctor(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Clinical Findings / Summary Notes
                </label>
                <textarea
                  rows={2}
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  placeholder="Key lab values or dosage changes..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Upload className="h-4 w-4" />
                <span>{reportDataUrl ? 'Document File Attached' : 'Attach Scan / PDF / Photo'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') setReportDataUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800"
              >
                Upload to Patient Record
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Audit & Activity Logs */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
          <History className="h-5 w-5 text-teal-700 dark:text-teal-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Access History & Collaborative Activity Log
          </h3>
        </div>
        <div className="mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
          {activityLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {log.actorName}
                </span>{' '}
                <span className="text-slate-500">({log.actorRole})</span>
                <span className="mx-1.5 text-slate-400">·</span>
                <span className="font-semibold text-teal-800 dark:text-teal-300">
                  {log.action}
                </span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">{log.details}</p>
              </div>
              <span className="font-mono text-slate-500 tabular-nums">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
