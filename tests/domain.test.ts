import { describe, it, expect } from 'vitest';
import { INITIAL_DB } from '../src/initialData';
import { MedicationAdherenceService } from '../src/domain/medication/adherence';
import { VitalsClassificationService } from '../src/domain/vitals/classifier';
import { ProactiveEmailReminderService } from '../src/domain/notification/emailDispatcher';
import { RbacSecurityGuard } from '../src/domain/access/rbacGuard';
import { PillboxHardwareController } from '../src/domain/hardware/pillboxController';

describe('OJAS Domain-Driven Design (DDD) Core Architecture Suite', () => {
  describe('MedicationAdherenceService', () => {
    it('evaluates daily adherence metrics accurately', () => {
      const metrics = MedicationAdherenceService.calculateDailyMetrics(INITIAL_DB.medications);
      expect(metrics.totalSlotsToday).toBeGreaterThan(0);
      expect(metrics.completionPercentage).toBeGreaterThanOrEqual(0);
      expect(['OPTIMAL', 'ACCEPTABLE', 'NEEDS_ATTENTION', 'CRITICAL']).toContain(metrics.adherenceRating);
    });

    it('records dose intake with stock decrement and timestamp', () => {
      const med = INITIAL_DB.medications[0];
      const slot = med.dailySchedule[0];
      const initialStock = med.stockCount;

      const { updatedMedication, updatedSlot } = MedicationAdherenceService.recordDoseIntake(
        med,
        slot.id,
        'taken',
        'Sister Priya Nair, RN',
        'Taken with warm water'
      );

      expect(updatedSlot).not.toBeNull();
      expect(updatedSlot?.status).toBe('taken');
      expect(updatedSlot?.acknowledgedBy).toBe('Sister Priya Nair, RN');
      expect(updatedMedication.stockCount).toBe(initialStock - 1);
    });

    it('evaluates critical polypharmacy contraindications (Apixaban + NSAID)', () => {
      const warnings = MedicationAdherenceService.evaluateContraindications(
        INITIAL_DB.patient,
        INITIAL_DB.medications,
        'Combiflam (Ibuprofen + Paracetamol)'
      );

      expect(warnings.length).toBeGreaterThan(0);
      const nsaidWarn = warnings.find((w) => w.title.includes('NSAID'));
      expect(nsaidWarn).toBeDefined();
      expect(nsaidWarn?.severity).toBe('CRITICAL');
    });

    it('evaluates dietary contraindications (Statin + Grapefruit juice)', () => {
      const warnings = MedicationAdherenceService.evaluateContraindications(
        INITIAL_DB.patient,
        INITIAL_DB.medications,
        'Fresh Grapefruit juice'
      );

      expect(warnings.length).toBeGreaterThan(0);
      const statinWarn = warnings.find((w) => w.title.includes('Statin'));
      expect(statinWarn).toBeDefined();
      expect(statinWarn?.severity).toBe('WARNING');
    });

    it('detects severe penicillin allergy contraindication', () => {
      const warnings = MedicationAdherenceService.evaluateContraindications(
        INITIAL_DB.patient,
        INITIAL_DB.medications,
        'Amoxicillin 500mg'
      );

      expect(warnings.length).toBeGreaterThan(0);
      const penWarn = warnings.find((w) => w.title.includes('Penicillin'));
      expect(penWarn).toBeDefined();
      expect(penWarn?.severity).toBe('CRITICAL');
    });

    it('returns zero warnings for safe non-contraindicated medications (e.g. Paracetamol)', () => {
      const warnings = MedicationAdherenceService.evaluateContraindications(
        INITIAL_DB.patient,
        INITIAL_DB.medications,
        'Paracetamol 500mg'
      );
      expect(warnings.length).toBe(0);
    });

    it('evaluates perfect 100% adherence when all scheduled doses are marked taken', () => {
      const mockMeds = structuredClone(INITIAL_DB.medications);
      mockMeds.forEach((m) => {
        m.dailySchedule.forEach((s) => (s.status = 'taken'));
      });
      const metrics = MedicationAdherenceService.calculateDailyMetrics(mockMeds);
      expect(metrics.completionPercentage).toBe(100);
      expect(metrics.adherenceRating).toBe('OPTIMAL');
    });
  });

  describe('VitalsClassificationService', () => {
    it('classifies blood pressure stages with clinical action guidance', () => {
      const normal = VitalsClassificationService.evaluateBloodPressure(118, 76);
      expect(normal.stage).toBe('Normal');
      expect(normal.isAlert).toBe(false);

      const crisis = VitalsClassificationService.evaluateBloodPressure(185, 125);
      expect(crisis.stage).toBe('Hypertensive Crisis');
      expect(crisis.isAlert).toBe(true);
      expect(crisis.actionGuidance).toContain('108');
    });

    it('evaluates fasting blood glucose and detects acute hypoglycemia', () => {
      const hypo = VitalsClassificationService.evaluateGlucose(58, true);
      expect(hypo.category).toBe('Hypoglycemia');
      expect(hypo.isAlert).toBe(true);
      expect(hypo.actionGuidance).toContain('fast-acting carbohydrates');

      const controlled = VitalsClassificationService.evaluateGlucose(115, true);
      expect(controlled.category).toBe('Elevated');
      expect(controlled.isAlert).toBe(false);
    });

    it('evaluates SpO2 pulse oximetry and heart rate', () => {
      const spo2 = VitalsClassificationService.evaluateSpO2(88);
      expect(spo2.status).toBe('Critical Hypoxia');
      expect(spo2.isAlert).toBe(true);

      const hr = VitalsClassificationService.evaluateHeartRate(48);
      expect(hr.status).toBe('Bradycardia');
      expect(hr.isAlert).toBe(true);
    });

    it('evaluates postprandial blood glucose ceiling (140-180 mg/dL)', () => {
      const postPrandial = VitalsClassificationService.evaluateGlucose(135, false);
      expect(postPrandial.category).toBe('Normal Postprandial');
      expect(postPrandial.isAlert).toBe(false);
    });

    it('evaluates severe hyperglycemia alert when sugar exceeds 180 mg/dL', () => {
      const hyper = VitalsClassificationService.evaluateGlucose(220, false);
      expect(hyper.category).toBe('Severe Hyperglycemia');
      expect(hyper.isAlert).toBe(true);
    });
  });

  describe('ProactiveEmailReminderService', () => {
    it('generates proactive email for upcoming scheduled doses', () => {
      const med = INITIAL_DB.medications[0];
      const slot = med.dailySchedule[0];
      const email = ProactiveEmailReminderService.createUpcomingDoseReminder(
        INITIAL_DB.patient,
        med,
        slot,
        ['rohan.deshmukh@ojas.in']
      );

      expect(email.type).toBe('upcoming_dose');
      expect(email.subject).toContain('UPCOMING DOSE');
      expect(email.recipients).toContain('rohan.deshmukh@ojas.in');
      expect(email.body).toContain(med.name);
    });

    it('generates proactive email for missed medication escalation', () => {
      const med = INITIAL_DB.medications[0];
      const slot = med.dailySchedule[0];
      const email = ProactiveEmailReminderService.createMissedDoseEscalation(
        INITIAL_DB.patient,
        med,
        slot,
        ['priya.nair.rn@ojas.in', 'rohan.deshmukh@ojas.in']
      );

      expect(email.type).toBe('escalation_alert');
      expect(email.subject).toContain('URGENT ESCALATION');
      expect(email.recipients.length).toBe(2);
    });

    it('generates proactive email for upcoming doctor appointment continuity', () => {
      const appt = INITIAL_DB.appointments[0];
      const email = ProactiveEmailReminderService.createAppointmentReminder(
        INITIAL_DB.patient,
        appt,
        ['kamala.deshmukh@ojas.in', 'rohan.deshmukh@ojas.in']
      );

      expect(email.type).toBe('appointment_reminder');
      expect(email.subject).toContain('APPOINTMENT REMINDER');
      expect(email.body).toContain(appt.doctorName);
    });

    it('generates proactive email for daily routine wellness activities', () => {
      const routine = INITIAL_DB.dailyRoutine[0];
      const email = ProactiveEmailReminderService.createRoutineReminder(
        INITIAL_DB.patient,
        routine,
        ['priya.nair.rn@ojas.in']
      );

      expect(email.type).toBe('routine_reminder');
      expect(email.subject).toContain('DAILY ROUTINE REMINDER');
      expect(email.body).toContain(routine.title);
    });
  });

  describe('RbacSecurityGuard', () => {
    it('grants patient exclusive sovereignty over access delegation', () => {
      const patient = INITIAL_DB.members.find((m) => m.role === 'elderly')!;
      const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker')!;
      const family = INITIAL_DB.members.find((m) => m.role === 'family')!;

      expect(RbacSecurityGuard.checkPermission(patient, 'manage_access').allowed).toBe(true);
      expect(RbacSecurityGuard.checkPermission(caregiver, 'manage_access').allowed).toBe(false);
      expect(RbacSecurityGuard.checkPermission(family, 'manage_access').allowed).toBe(false);
    });

    it('verifies 4-digit PIN requirement for caregiver clinical rights', () => {
      const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker')!;
      expect(RbacSecurityGuard.verifyPin(caregiver, '2468')).toBe(true);
      expect(RbacSecurityGuard.verifyPin(caregiver, '0000')).toBe(false);
    });

    it('prevents remote family from confirming physical pills', () => {
      const family = INITIAL_DB.members.find((m) => m.role === 'family')!;
      const res = RbacSecurityGuard.checkPermission(family, 'confirm_dose');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('Remote family');
    });

    it('allows verified caregiver nurse to record bedside clinical vitals', () => {
      const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker')!;
      const res = RbacSecurityGuard.checkPermission(caregiver, 'log_vital');
      expect(res.allowed).toBe(true);
    });

    it('denies unauthenticated actors from altering prescriptions', () => {
      const patient = INITIAL_DB.members.find((m) => m.role === 'elderly')!;
      const res = RbacSecurityGuard.checkPermission(patient, 'edit_prescription');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('restricted');
    });

    it('enforces sovereign patient management of access delegation', () => {
      const patient = INITIAL_DB.members.find((m) => m.role === 'elderly')!;
      const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker')!;

      const patientResult = RbacSecurityGuard.checkPermission(patient, 'manage_access');
      expect(patientResult.allowed).toBe(true);

      const caregiverResult = RbacSecurityGuard.checkPermission(caregiver, 'manage_access');
      expect(caregiverResult.allowed).toBe(false);
      expect(caregiverResult.reason).toContain('sovereignty');
    });

    it('handles member deletion and view permissions correctly', () => {
      const patient = INITIAL_DB.members.find((m) => m.role === 'elderly')!;
      const family = INITIAL_DB.members.find((m) => m.role === 'family')!;

      expect(RbacSecurityGuard.checkPermission(patient, 'delete').allowed).toBe(true);
      expect(RbacSecurityGuard.checkPermission(family, 'view').allowed).toBe(true);
      expect(RbacSecurityGuard.checkPermission(family, 'invalid' as any).allowed).toBe(false);
    });

    it('verifies 4-digit PIN for role elevation and passcodes', () => {
      const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker')!;
      const patient = INITIAL_DB.members.find((m) => m.role === 'elderly')!;

      expect(RbacSecurityGuard.verifyPin(caregiver, '2468')).toBe(true);
      expect(RbacSecurityGuard.verifyPin(caregiver, '0000')).toBe(false);
      expect(RbacSecurityGuard.verifyPin(patient, '1234')).toBe(true);
      expect(RbacSecurityGuard.verifyPin(patient, '')).toBe(true);
    });
  });

  describe('PillboxHardwareController', () => {
    it('computes 6-compartment LED light states for due medications', () => {
      const ledStates = PillboxHardwareController.calculateLedRingStatus(
        INITIAL_DB.hardware,
        INITIAL_DB.medications,
        '08:00'
      );

      expect(ledStates.length).toBe(6);
      expect(ledStates[0].slotNumber).toBe(1);
    });

    it('transitions hardware state machine on alarm and door events', () => {
      const initial = INITIAL_DB.hardware;
      const opened = PillboxHardwareController.transitionHardwareState(initial, 'toggle_door');
      expect(opened.doorOpen).toBe(!initial.doorOpen);

      const alarmed = PillboxHardwareController.transitionHardwareState(initial, 'trigger_alarm');
      expect(alarmed.buzzerActive).toBe(true);

      const silenced = PillboxHardwareController.transitionHardwareState(alarmed, 'silence_alarm');
      expect(silenced.buzzerActive).toBe(false);

      const ledSwitched = PillboxHardwareController.transitionHardwareState(initial, 'set_active_led', 3);
      expect(ledSwitched.activeSlotLed).toBe(3);
    });
  });

  describe('VitalsClassificationService Extreme Ranges', () => {
    it('identifies mild hypoxia and critical hypoxia', () => {
      const mild = VitalsClassificationService.evaluateSpO2(93);
      expect(mild.status).toBe('Mild Hypoxia');
      expect(mild.isAlert).toBe(true);

      const normal = VitalsClassificationService.evaluateSpO2(98);
      expect(normal.status).toBe('Normal');
      expect(normal.isAlert).toBe(false);
    });

    it('identifies bradycardia and tachycardia', () => {
      const brady = VitalsClassificationService.evaluateHeartRate(45);
      expect(brady.status).toBe('Bradycardia');
      expect(brady.isAlert).toBe(true);

      const tachy = VitalsClassificationService.evaluateHeartRate(110);
      expect(tachy.status).toBe('Tachycardia');
      expect(tachy.isAlert).toBe(true);

      const normal = VitalsClassificationService.evaluateHeartRate(72);
      expect(normal.status).toBe('Normal Resting');
      expect(normal.isAlert).toBe(false);
    });

    it('evaluates fasting blood glucose categories accurately', () => {
      const normalFasting = VitalsClassificationService.evaluateGlucose(95, true);
      expect(normalFasting.category).toBe('Optimal Fasting');
      expect(normalFasting.isAlert).toBe(false);

      const elevatedFasting = VitalsClassificationService.evaluateGlucose(120, true);
      expect(elevatedFasting.category).toBe('Elevated');
      expect(elevatedFasting.isAlert).toBe(false);

      const postprandial = VitalsClassificationService.evaluateGlucose(160, false);
      expect(postprandial.category).toBe('Elevated');
      expect(postprandial.isAlert).toBe(false);
    });
  });
});
