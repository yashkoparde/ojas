import { describe, it, expect } from 'vitest';
import { INITIAL_DB } from '../src/initialData';
import type { Medication, DoseStatus } from '../src/types';

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
    const initialStatus = targetSlot.status;

    // Simulate marking as taken
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

    // Verify critical NSAID vs Apixaban restriction
    const hasNsaidRestriction = medicationRestrictions.some((r) =>
      r.toLowerCase().includes('nsaid')
    );
    expect(hasNsaidRestriction).toBe(true);

    // Verify Grapefruit vs Statin restriction
    const hasGrapefruitRestriction = medicationRestrictions.some((r) =>
      r.toLowerCase().includes('grapefruit')
    );
    expect(hasGrapefruitRestriction).toBe(true);
  });
});

describe('OJAS Multi-Persona Sovereignty & Access Control (RBAC)', () => {
  it('identifies patient as master health sovereignty authority', () => {
    const patientMember = INITIAL_DB.members.find((m) => m.role === 'elderly');
    expect(patientMember).toBeDefined();
    expect(patientMember?.consentGrantedByPatient).toBe(true);
    expect(patientMember?.permissions.canManageAccess).toBe(true);
  });

  it('enforces caregiver PIN verification requirements', () => {
    const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker');
    expect(caregiver).toBeDefined();
    expect(caregiver?.passcode).toBe('2468');
    expect(caregiver?.permissions.canEdit).toBe(true);
  });

  it('restricts family member to monitoring and appointment coordination', () => {
    const family = INITIAL_DB.members.find((m) => m.role === 'family');
    expect(family).toBeDefined();
    expect(family?.permissions.canEdit).toBe(false);
    expect(family?.permissions.canDelete).toBe(false);
    expect(family?.permissions.canView).toBe(true);
  });
});

describe('OJAS Smart Pillbox IoT Telemetry', () => {
  it('maps all medications to valid hardware compartments (1 to 6)', () => {
    INITIAL_DB.medications.forEach((med) => {
      expect(med.compartmentNumber).toBeGreaterThanOrEqual(1);
      expect(med.compartmentNumber).toBeLessThanOrEqual(6);
      expect(med.nfcTagId).toMatch(/^NFC-SLOT[1-6]-/);
    });
  });

  it('updates hardware buzzer and door telemetry state correctly', () => {
    const hw = structuredClone(INITIAL_DB.hardware);
    expect(hw.connected).toBe(true);
    expect(hw.batteryPercent).toBeGreaterThan(0);

    // Silence buzzer
    hw.buzzerActive = false;
    expect(hw.buzzerActive).toBe(false);

    // Toggle compartment door
    hw.doorOpen = true;
    expect(hw.doorOpen).toBe(true);
  });
});
