/**
 * @file adherence.ts
 * @module domain/medication
 * @description Pure Domain Service for Medication Adherence, Dose State Transitions, and Contraindications.
 * Complies with Domain-Driven Design (DDD) and SOLID principles with zero UI or transport dependencies.
 */

import type { Medication, MedicationDoseSlot, DoseStatus, PatientProfile } from '../../types';

export interface AdherenceMetrics {
  totalSlotsToday: number;
  takenSlotsToday: number;
  missedSlotsToday: number;
  pendingSlotsToday: number;
  completionPercentage: number;
  adherenceRating: 'OPTIMAL' | 'ACCEPTABLE' | 'NEEDS_ATTENTION' | 'CRITICAL';
}

export interface DrugInteractionWarning {
  severity: 'CRITICAL' | 'WARNING' | 'CAUTION';
  title: string;
  description: string;
  clinicalRecommendation: string;
}

export class MedicationAdherenceService {
  /**
   * Computes holistic daily adherence metrics across all prescribed medications.
   */
  public static calculateDailyMetrics(medications: Medication[]): AdherenceMetrics {
    const allSlots = medications.flatMap((m) => m.dailySchedule || []);
    const totalSlotsToday = allSlots.length;
    const takenSlotsToday = allSlots.filter((s) => s.status === 'taken').length;
    const missedSlotsToday = allSlots.filter((s) => s.status === 'missed').length;
    const pendingSlotsToday = allSlots.filter((s) => s.status === 'pending').length;

    const completionPercentage =
      totalSlotsToday > 0 ? Math.round((takenSlotsToday / totalSlotsToday) * 100) : 100;

    let adherenceRating: AdherenceMetrics['adherenceRating'] = 'OPTIMAL';
    if (missedSlotsToday > 1 || completionPercentage < 50) {
      adherenceRating = 'CRITICAL';
    } else if (missedSlotsToday === 1 || completionPercentage < 75) {
      adherenceRating = 'NEEDS_ATTENTION';
    } else if (completionPercentage < 90) {
      adherenceRating = 'ACCEPTABLE';
    }

    return {
      totalSlotsToday,
      takenSlotsToday,
      missedSlotsToday,
      pendingSlotsToday,
      completionPercentage,
      adherenceRating,
    };
  }

  /**
   * Applies an intake state transition with immutability and timestamping.
   */
  public static recordDoseIntake(
    medication: Medication,
    slotId: string,
    newStatus: DoseStatus,
    actorName: string,
    notes?: string
  ): { updatedMedication: Medication; updatedSlot: MedicationDoseSlot | null } {
    const clonedMed: Medication = structuredClone(medication);
    const slot = clonedMed.dailySchedule.find((s) => s.id === slotId);

    if (!slot) {
      return { updatedMedication: clonedMed, updatedSlot: null };
    }

    slot.status = newStatus;
    if (newStatus === 'taken') {
      slot.acknowledgedAt = new Date().toISOString();
      slot.acknowledgedBy = actorName;
      if (clonedMed.stockCount > 0) {
        clonedMed.stockCount -= 1;
      }
    } else if (newStatus === 'pending') {
      slot.acknowledgedAt = undefined;
      slot.acknowledgedBy = undefined;
    }

    if (notes !== undefined) {
      slot.notes = notes.trim();
    }

    return { updatedMedication: clonedMed, updatedSlot: slot };
  }

  /**
   * Evaluates patient profile and active medications for polypharmacy contraindications.
   */
  public static evaluateContraindications(
    patient: PatientProfile,
    medications: Medication[],
    candidateDrug?: string
  ): DrugInteractionWarning[] {
    const warnings: DrugInteractionWarning[] = [];
    const activeNames = medications.map((m) => m.name.toLowerCase());
    const candidateLower = candidateDrug?.toLowerCase() || '';

    // Rule 1: Apixaban / Blood Thinners vs NSAIDs
    const hasAnticoagulant = activeNames.some((n) => n.includes('eliquis') || n.includes('apixaban'));
    const introducesNsaid =
      candidateLower.includes('combiflam') ||
      candidateLower.includes('ibuprofen') ||
      candidateLower.includes('brufen') ||
      candidateLower.includes('diclofenac');

    if (hasAnticoagulant && introducesNsaid) {
      warnings.push({
        severity: 'CRITICAL',
        title: 'Severe Bleeding Hazard: Anticoagulant + NSAID',
        description: 'Co-administration of Apixaban (Eliquis) with NSAIDs significantly elevates gastrointestinal and systemic bleeding risks.',
        clinicalRecommendation: 'Strictly avoid NSAIDs. Prescribe Paracetamol / Acetaminophen as first-line analgesic alternative under Dr. Kulkarni consultation.',
      });
    }

    // Rule 2: Atorvastatin vs CYP3A4 inhibitors (Grapefruit juice)
    const hasStatin = activeNames.some((n) => n.includes('atorva') || n.includes('statin'));
    if (hasStatin && (candidateLower.includes('grapefruit') || candidateLower.includes('chakotra'))) {
      warnings.push({
        severity: 'WARNING',
        title: 'CYP3A4 Inhibition: Statin Toxicity Risk',
        description: 'Grapefruit inhibits CYP3A4 enzymes responsible for metabolizing Atorvastatin, elevating plasma drug concentration and rhabdomyolysis risk.',
        clinicalRecommendation: 'Advise patient to completely omit grapefruit and citrus hybrid juices while on daily bedtime statin therapy.',
      });
    }

    // Rule 3: Penicillin Anaphylaxis Check
    const hasPenicillinAllergy = patient.allergies.some((a) => a.toLowerCase().includes('penicillin'));
    if (hasPenicillinAllergy && (candidateLower.includes('amoxicillin') || candidateLower.includes('augmentin') || candidateLower.includes('penicillin'))) {
      warnings.push({
        severity: 'CRITICAL',
        title: 'Severe Anaphylaxis Contraindication: Penicillin Class',
        description: `Patient Smt. Kamala Deshmukh has a documented life-threatening anaphylactic allergy to the penicillin class.`,
        clinicalRecommendation: 'Immediate stop. Substitute with macrolide or fluoroquinolone class following culture sensitivity.',
      });
    }

    return warnings;
  }
}
