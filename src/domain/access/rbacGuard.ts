/**
 * @file rbacGuard.ts
 * @module domain/access
 * @description Role-Based Access Control (RBAC) & Patient Sovereignty Policy Guard.
 * Enforces strict multi-persona privilege segregation where elderly individuals
 * hold supreme health authority, caregivers require PIN verification for clinical edits,
 * and remote family members are restricted to monitoring and emergency coordination.
 */

import type { AuthorizedMember, UserRole } from '../../types';

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
}

export class RbacSecurityGuard {
  /**
   * Verifies if an actor has permission to perform a specific action on the patient profile.
   */
  public static checkPermission(
    member: AuthorizedMember,
    action: 'view' | 'add_medication' | 'edit_prescription' | 'confirm_dose' | 'log_vital' | 'manage_access' | 'delete'
  ): AuthorizationResult {
    // Revoked members have zero access
    if (member.status === 'revoked' || !member.consentGrantedByPatient) {
      return {
        allowed: false,
        reason: `Access has been revoked by patient sovereign authority.`,
      };
    }

    switch (action) {
      case 'view':
        return { allowed: member.permissions.canView };

      case 'confirm_dose':
        // Only patient (physical intake) and primary caretaker (bedside administration)
        if (member.role === 'elderly' || member.role === 'caretaker') {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Remote family members cannot confirm physical dose intake unless on-site.',
        };

      case 'log_vital':
        // Caregiver nurse and authorized caretaker
        if (member.role === 'caretaker' && member.permissions.canEdit) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Only authenticated healthcare caretakers can record clinical bedside vitals.',
        };

      case 'add_medication':
      case 'edit_prescription':
        // Clinical guard: Patients cannot alter prescriptions to avoid accidental dosage errors
        if (member.role === 'caretaker' && member.permissions.canEdit) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Prescription editing is restricted to authenticated clinical caregivers under doctor prescription.',
        };

      case 'manage_access':
        // Supreme authority: Only elderly individual (patient) owns access delegation
        if (member.role === 'elderly' && member.permissions.canManageAccess) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: 'Patient sovereignty: Only Smt. Kamala Deshmukh can grant or revoke member permissions.',
        };

      case 'delete':
        return { allowed: member.permissions.canDelete };

      default:
        return { allowed: false, reason: 'Unrecognized action.' };
    }
  }

  /**
   * Validates 4-digit PIN for role elevation.
   */
  public static verifyPin(member: AuthorizedMember, enteredPin: string): boolean {
    if (member.role === 'elderly' || member.role === 'family') {
      // Patient and family do not require numeric PIN for basic interaction
      return true;
    }
    return member.passcode === enteredPin;
  }
}
