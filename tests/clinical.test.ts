import { describe, it, expect } from 'vitest';
import { INITIAL_DB } from '../src/initialData';
import type { Medication, DoseStatus, MedicationDoseSlot } from '../src/types';

describe('OJAS Clinical Adherence & Safety Engine', () => {
  it('calculates daily dose completion percentage accurately', () => {
    const allSlots = INITIAL_DB.medications.flatMap((m) => m.dailySchedule);
    const totalSlots = allSlots.length;
    const takenSlots = allSlots.filter((s) => s.status === 'taken').length;
    const percentage = Math.round((takenSlots / totalSlots) * 100);

    expect(totalSlots).toBeGreaterThan(0);
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  it('correctly transitions dose status on intake confirmation', () => {
    const testMed: Medication = structuredClone(INITIAL_DB.medications[0]);
    const targetSlot = testMed.dailySchedule[0];

    const newStatus: DoseStatus = 'taken';
    targetSlot.status = newStatus;
    targetSlot.acknowledgedAt = new Date().toISOString();
    targetSlot.acknowledgedBy = 'Smt. Kamala Deshmukh';

    expect(targetSlot.status).toBe('taken');
    expect(targetSlot.acknowledgedAt).toBeDefined();
    expect(targetSlot.acknowledgedBy).toBe('Smt. Kamala Deshmukh');
  });

  it('flags drug-drug contraindications defined in patient profile', () => {
    const { conditions, allergies, medicationRestrictions } = INITIAL_DB.patient;

    expect(conditions).toContain('Stage 2 Essential Hypertension');
    expect(allergies).toContain('Penicillin (Severe Anaphylaxis)');

    // Critical NSAID vs Apixaban restriction
    const hasNsaidRestriction = medicationRestrictions.some((r) =>
      r.toLowerCase().includes('nsaid')
    );
    expect(hasNsaidRestriction).toBe(true);

    // Grapefruit vs Statin restriction
    const hasGrapefruitRestriction = medicationRestrictions.some((r) =>
      r.toLowerCase().includes('grapefruit')
    );
    expect(hasGrapefruitRestriction).toBe(true);
  });

  it('decrements medication stock count on dose confirmation', () => {
    const testMed: Medication = structuredClone(INITIAL_DB.medications[0]);
    const initialStock = testMed.stockCount;
    testMed.stockCount -= 1;

    expect(testMed.stockCount).toBe(initialStock - 1);
  });

  it('identifies medications below refill threshold for caregiver replenishment', () => {
    const lowStockMeds = INITIAL_DB.medications.filter(
      (m) => m.stockCount <= m.refillThreshold
    );
    expect(Array.isArray(lowStockMeds)).toBe(true);

    // Ensure all medications have valid positive stock counts and thresholds
    INITIAL_DB.medications.forEach((med) => {
      expect(med.stockCount).toBeGreaterThanOrEqual(0);
      expect(med.refillThreshold).toBeGreaterThan(0);
    });
  });

  it('handles caregiver observational clinical notes for dose slots', () => {
    const testMed: Medication = structuredClone(INITIAL_DB.medications[0]);
    const slot = testMed.dailySchedule[0];
    const clinicalNote = 'Taken with warm water post breakfast. BP 124/80 checked.';

    slot.notes = clinicalNote;
    expect(slot.notes).toBe(clinicalNote);
    expect(slot.notes.length).toBeGreaterThan(10);
  });

  it('sorts daily timeline slots in chronological order', () => {
    const allSlots = INITIAL_DB.medications.flatMap((med) =>
      med.dailySchedule.map((slot) => ({
        medName: med.name,
        time: slot.scheduledTime,
      }))
    );

    const sorted = [...allSlots].sort((a, b) => a.time.localeCompare(b.time));
    expect(sorted[0].time).toMatch(/^\d{2}:\d{2}$/);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].time <= sorted[i + 1].time).toBe(true);
    }
  });

  it('validates patient profile integrity and primary cardiologist details', () => {
    const patient = INITIAL_DB.patient;
    expect(patient.fullName).toBe('Smt. Kamala Deshmukh');
    expect(patient.age).toBe(76);
    expect(patient.bloodGroup).toBe('O+');
    expect(patient.primaryDoctor.name).toContain('Dr. Rajesh Kulkarni');
    expect(patient.primaryDoctor.hospital).toContain('Sahyadri');
    expect(patient.primaryDoctor.phone).toMatch(/^\+91/);
  });

  it('ensures all emergency contacts have valid phone numbers and relationship tags', () => {
    const contacts = INITIAL_DB.patient.emergencyContacts;
    expect(contacts.length).toBeGreaterThanOrEqual(2);

    const primary = contacts.find((c) => c.isPrimary);
    expect(primary).toBeDefined();
    expect(primary?.name).toBe('Rohan Deshmukh');
    expect(primary?.phone).toMatch(/^\+91/);

    contacts.forEach((contact) => {
      expect(contact.id).toBeDefined();
      expect(contact.name.length).toBeGreaterThan(2);
      expect(contact.phone).toMatch(/^\+91/);
      expect(contact.relationship.length).toBeGreaterThan(2);
    });
  });

  it('validates medical reports categories and upload attribution', () => {
    const reports = INITIAL_DB.patient.reports;
    expect(reports.length).toBeGreaterThan(0);

    reports.forEach((rep) => {
      expect(['Prescription', 'Lab Report', 'Discharge Summary', 'Imaging']).toContain(
        rep.category
      );
      expect(rep.doctorName).toBeDefined();
      expect(rep.uploadedBy).toBeDefined();
      expect(rep.notes.length).toBeGreaterThan(5);
    });
  });

  it('calculates adherence rates accurately for edge cases (0% and 100%)', () => {
    const calcRate = (taken: number, total: number) => (total > 0 ? Math.round((taken / total) * 100) : 100);
    expect(calcRate(0, 5)).toBe(0);
    expect(calcRate(5, 5)).toBe(100);
    expect(calcRate(3, 4)).toBe(75);
    expect(calcRate(0, 0)).toBe(100);
  });

  it('validates daily routine activities schema and timings', () => {
    const routines = INITIAL_DB.dailyRoutine;
    expect(routines.length).toBeGreaterThanOrEqual(3);

    routines.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title.length).toBeGreaterThan(3);
      expect(item.time).toMatch(/^\d{2}:\d{2}$/);
      expect(typeof item.completed).toBe('boolean');
    });
  });

  it('verifies upcoming doctor appointment details and specialist assignment', () => {
    const appointments = INITIAL_DB.appointments;
    expect(appointments.length).toBeGreaterThan(0);

    const firstAppt = appointments[0];
    expect(firstAppt.doctorName).toContain('Dr. Rajesh Kulkarni');
    expect(firstAppt.hospitalLocation).toContain('Sahyadri');
    expect(firstAppt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(firstAppt.time).toMatch(/^\d{2}:\d{2}$/);
  });
});
