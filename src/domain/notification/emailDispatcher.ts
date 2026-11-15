/**
 * @file emailDispatcher.ts
 * @module domain/notification
 * @description Proactive Healthcare Reminder & Escalation Email Engine.
 * Formats and dispatches automated email reminders for missed medications,
 * upcoming doses, medical appointments, and daily wellness routines.
 */

import type {
  EmailNotificationLog,
  NotificationSettings,
  PatientProfile,
  Medication,
  MedicationDoseSlot,
  Appointment,
  DailyRoutineItem,
} from '../../types';

export class ProactiveEmailReminderService {
  /**
   * Dispatches automated email notification when a dose is missed.
   */
  public static createMissedDoseEscalation(
    patient: PatientProfile,
    medication: Medication,
    slot: MedicationDoseSlot,
    recipients: string[]
  ): EmailNotificationLog {
    const subject = `[URGENT ESCALATION] Missed Dose: ${medication.name} (${medication.dosage}) at ${slot.scheduledTime}`;
    const body = `OJAS Proactive Adherence Alert
===========================================
Patient: ${patient.fullName} (Age ${patient.age})
Medication: ${medication.name} (${medication.genericName})
Prescribed Dosage: ${medication.dosage} - Compartment #${medication.compartmentNumber}
Scheduled Time: ${slot.scheduledTime} (Status: MISSED)
Primary Doctor: ${patient.primaryDoctor.name} (${patient.primaryDoctor.phone})

Action Required:
Patient or caregiver must follow up immediately. If the missed dose is close to the next scheduled dose, DO NOT double dose. Contact primary cardiologist if dizzy or experiencing palpitations.

Dispatched automatically by OJAS Proactive Adherence Daemon.`;

    return {
      id: `email-missed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'escalation_alert',
      subject,
      recipients,
      body,
      deliveryStatus: 'delivered',
      acknowledged: false,
    };
  }

  /**
   * Dispatches proactive reminder for upcoming dose window.
   */
  public static createUpcomingDoseReminder(
    patient: PatientProfile,
    medication: Medication,
    slot: MedicationDoseSlot,
    recipients: string[]
  ): EmailNotificationLog {
    const subject = `[UPCOMING DOSE REMINDER] ${medication.name} Due at ${slot.scheduledTime} for ${patient.fullName}`;
    const body = `Dear Care Circle,

This is a proactive reminder that ${patient.fullName}'s scheduled medication is due shortly:
- Medicine: ${medication.name} (${medication.dosage})
- Purpose: ${medication.purpose}
- Pillbox Compartment: Slot #${medication.compartmentNumber}
- Instructions: ${medication.instructions}

The circular LED indicator on the Smart Pillbox will illuminate at ${slot.scheduledTime}.

Warm regards,
OJAS Vital Care Circle`;

    return {
      id: `email-upcoming-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'upcoming_dose',
      subject,
      recipients,
      body,
      deliveryStatus: 'delivered',
      acknowledged: false,
    };
  }

  /**
   * Dispatches proactive reminder for upcoming medical appointments.
   */
  public static createAppointmentReminder(
    patient: PatientProfile,
    appointment: Appointment,
    recipients: string[]
  ): EmailNotificationLog {
    const subject = `[APPOINTMENT REMINDER] ${appointment.doctorName} on ${appointment.date} at ${appointment.time}`;
    const body = `OJAS Medical Appointment Continuity Alert
===========================================
Patient: ${patient.fullName}
Consultant: ${appointment.doctorName} (${appointment.specialty})
Location: ${appointment.hospitalLocation} - ${appointment.roomOrDept}
Date & Time: ${appointment.date} at ${appointment.time}
Consultation Purpose: ${appointment.reason}

Preparation Checklist:
1. Carry recent 7-day Blood Pressure and Fasting Blood Sugar logs.
2. Bring current prescription strips (Telma, Glycomet, Eliquis).
3. First-Responder Emergency QR Health Pass is accessible on patient phone.

Dispatched automatically by OJAS Appointment Engine.`;

    return {
      id: `email-appt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'appointment_reminder',
      subject,
      recipients,
      body,
      deliveryStatus: 'delivered',
      acknowledged: false,
    };
  }

  /**
   * Dispatches proactive reminder for daily wellness routines (BP, glucose, exercise).
   */
  public static createRoutineReminder(
    patient: PatientProfile,
    routine: DailyRoutineItem,
    recipients: string[]
  ): EmailNotificationLog {
    const subject = `[DAILY ROUTINE REMINDER] ${routine.title} at ${routine.time} for ${patient.fullName}`;
    const body = `OJAS Daily Health Routine Reminder
===========================================
Patient: ${patient.fullName}
Routine Activity: ${routine.title}
Scheduled Time: ${routine.time}

Please ensure this daily health routine is performed and recorded in the Caregiver Clinical Command Hub.`;

    return {
      id: `email-routine-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'routine_reminder',
      subject,
      recipients,
      body,
      deliveryStatus: 'delivered',
      acknowledged: false,
    };
  }
}
