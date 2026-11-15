import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  FileText,
  Bell,
  CheckCircle2,
  UserCheck,
  Lock,
} from 'lucide-react';
import type { Appointment, AuthorizedMember } from '../types';

interface AppointmentManagerProps {
  appointments: Appointment[];
  members: AuthorizedMember[];
  currentMember: AuthorizedMember;
  onAddAppointment: (apt: Partial<Appointment>) => Promise<void>;
  onUpdateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  onSendReminderEmail: (apt: Appointment) => Promise<void>;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({
  appointments,
  members,
  currentMember,
  onAddAppointment,
  onUpdateAppointment,
  onSendReminderEmail,
}) => {
  const [tab, setTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [followUpDraft, setFollowUpDraft] = useState('');

  // New Appointment form state (Indian hospitals in Pune)
  const [doctorName, setDoctorName] = useState('Dr. Rajesh Kulkarni, MD, DM');
  const [specialty, setSpecialty] = useState('Geriatric Cardiology');
  const [hospitalLocation, setHospitalLocation] = useState(
    'Sahyadri Super Speciality Hospital, Deccan Gymkhana, Pune'
  );
  const [roomOrDept, setRoomOrDept] = useState('Cardiology OPD - Wing B, Room 204');
  const [date, setDate] = useState('2026-12-04');
  const [time, setTime] = useState('10:30');
  const [reason, setReason] = useState('');
  const [assignedMemberId, setAssignedMemberId] = useState('mem-family-1');

  // Strict Role & Patient-Consent Segregation:
  // Elderly users have a clean Read-Only view of their upcoming visits and cannot modify clinical notes.
  // Family members and Caregivers require active consent authorization from the elderly patient.
  const isAuthorizedByPatient =
    currentMember.role !== 'elderly' &&
    currentMember.status === 'active' &&
    currentMember.consentGrantedByPatient;

  const canScheduleAppointment =
    isAuthorizedByPatient &&
    (currentMember.role === 'caretaker' ||
      currentMember.role === 'family' ||
      currentMember.permissions.canAdd);
  const canEditClinicalNotes =
    isAuthorizedByPatient &&
    (currentMember.role === 'caretaker' || currentMember.permissions.canEdit);

  const filteredAppointments = appointments.filter((a) =>
    tab === 'upcoming' ? a.status === 'upcoming' : a.status !== 'upcoming'
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorName.trim() || !date) return;
    await onAddAppointment({
      doctorName,
      specialty,
      hospitalLocation,
      roomOrDept,
      date,
      time,
      reason: reason || 'Routine Clinical Checkup',
      assignedMemberId,
    });
    setReason('');
    setShowModal(false);
  };

  const handleSaveNotes = async (aptId: string) => {
    await onUpdateAppointment(aptId, {
      consultationNotes: notesDraft,
      followUpInstructions: followUpDraft,
    });
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Hospital OPD Appointments & Clinical Follow-Ups
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {currentMember.role === 'elderly'
              ? 'Patient View: See your upcoming hospital visits and which family member or nurse is accompanying you.'
              : currentMember.role === 'caretaker'
              ? 'Caretaker Nurse View: Record doctor consultation notes, post-OPD instructions, and mark visits completed.'
              : 'Family Member View: Book hospital OPD appointments and assign accompaniment.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setTab('upcoming')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                tab === 'upcoming'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Upcoming Visits ({appointments.filter((a) => a.status === 'upcoming').length})
            </button>
            <button
              type="button"
              onClick={() => setTab('completed')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                tab === 'completed'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Past History ({appointments.filter((a) => a.status !== 'upcoming').length})
            </button>
          </div>

          {canScheduleAppointment && (
            <button
              type="button"
              onClick={() => setShowModal(!showModal)}
              className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{showModal ? 'Close Form' : 'Book OPD Appointment'}</span>
            </button>
          )}
        </div>
      </div>

      {showModal && canScheduleAppointment && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Book New Doctor OPD Appointment
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Doctor Name *
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Specialty
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hospital / Clinic Location
              </label>
              <input
                type="text"
                value={hospitalLocation}
                onChange={(e) => setHospitalLocation(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Appointment Time *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Accompanying Caretaker / Family Member
              </label>
              <select
                value={assignedMemberId}
                onChange={(e) => setAssignedMemberId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relationship})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Visit & Preparation Questions
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., 3-Month Cardiology Checkup & Blood Pressure Review at Sahyadri Hospital"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              Confirm & Send Calendar Alert
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {filteredAppointments.map((apt) => {
          const companion = members.find((m) => m.id === apt.assignedMemberId);
          const isEditing = editingNotesId === apt.id;

          return (
            <div
              key={apt.id}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-slate-500 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {apt.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <Clock className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {apt.time}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">{apt.status}</span>
                  </div>

                  <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
                    {apt.doctorName} — {apt.specialty}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>
                      {apt.hospitalLocation} ({apt.roomOrDept})
                    </span>
                  </p>
                </div>

                {canScheduleAppointment && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSendReminderEmail(apt)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>Send Email Reminder</span>
                    </button>

                    {apt.status === 'upcoming' && canEditClinicalNotes && (
                      <button
                        type="button"
                        onClick={() => onUpdateAppointment(apt.id, { status: 'completed' })}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Mark Visit Completed</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2 dark:border-slate-800">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Visit Reason & Assigned Companion
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                    {apt.reason}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-teal-800 dark:text-teal-300">
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>
                      Accompanied by: {companion?.name || 'Rohan Deshmukh'} (
                      {companion?.relationship})
                    </span>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Consultation Notes & Follow-Up Instructions
                    </span>
                    {canEditClinicalNotes ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            setEditingNotesId(null);
                          } else {
                            setEditingNotesId(apt.id);
                            setNotesDraft(apt.consultationNotes);
                            setFollowUpDraft(apt.followUpInstructions);
                          }
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>{isEditing ? 'Cancel' : 'Edit Clinical Notes'}</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Lock className="h-3 w-3" />
                        Nurse Edit Only
                      </span>
                    )}
                  </div>

                  {isEditing && canEditClinicalNotes ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={2}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        placeholder="Enter doctor's consultation notes..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={followUpDraft}
                        onChange={(e) => setFollowUpDraft(e.target.value)}
                        placeholder="Follow-up instructions..."
                        className="w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveNotes(apt.id)}
                        className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800"
                      >
                        Save Consultation Notes
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <p>
                        <strong>Notes:</strong>{' '}
                        {apt.consultationNotes || 'No consultation notes recorded yet.'}
                      </p>
                      <p>
                        <strong>Follow-Up:</strong>{' '}
                        {apt.followUpInstructions || 'None specified.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
