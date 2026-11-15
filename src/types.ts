export type UserRole = 'elderly' | 'caretaker' | 'family';

export interface RolePermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageAccess: boolean;
}

export interface AuthorizedMember {
  id: string;
  name: string;
  role: UserRole;
  relationship: string;
  email: string;
  phone: string;
  passcode: string;
  avatarUrl: string;
  status: 'active' | 'revoked';
  consentGrantedByPatient: boolean;
  permissions: RolePermissions;
  lastActiveAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface MedicalReport {
  id: string;
  title: string;
  category: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Imaging';
  doctorName: string;
  uploadedBy: string;
  uploadedAt: string;
  notes: string;
  fileDataUrl?: string;
}

export interface PatientProfile {
  id: string;
  qrCodeId: string;
  fullName: string;
  age: number;
  dateOfBirth: string;
  bloodGroup: string;
  weightKg: number;
  heightCm: number;
  address: string;
  phone: string;
  email: string;
  avatarUrl: string;
  primaryDoctor: {
    name: string;
    specialty: string;
    hospital: string;
    phone: string;
    email: string;
  };
  conditions: string[];
  allergies: string[];
  medicationRestrictions: string[];
  medicalHistoryNotes: string;
  emergencyContacts: EmergencyContact[];
  reports: MedicalReport[];
  encryptionKeyFingerprint: string;
}

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped';

export interface MedicationDoseSlot {
  id: string;
  scheduledTime: string; // HH:mm in 24h format, e.g., "08:00"
  label: string; // e.g., "Morning (After Breakfast)"
  status: DoseStatus;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  escalated?: boolean;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  duration: string;
  startDate: string;
  endDate: string;
  instructions: string;
  purpose: string;
  prescribedBy: string;
  assignedCaretakerId: string;
  stockCount: number;
  refillThreshold: number;
  compartmentNumber: number; // 1 to 6 for Smart Pillbox hardware
  nfcTagId: string;
  prescriptionImageUrl?: string;
  bottleOrStripImageUrl?: string;
  dailySchedule: MedicationDoseSlot[];
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospitalLocation: string;
  roomOrDept: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'upcoming' | 'completed' | 'cancelled';
  assignedMemberId: string;
  reason: string;
  consultationNotes: string;
  followUpInstructions: string;
  reminderSent: boolean;
}

export interface DailyRoutineItem {
  id: string;
  time: string;
  title: string;
  category: 'Vitals' | 'Hydration' | 'Exercise' | 'Nutrition' | 'Rest';
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  valueRecorded?: string;
}

export interface NotificationSettings {
  emailRemindersEnabled: boolean;
  missedDoseGracePeriodMinutes: number;
  autoCaretakerEscalation: boolean;
  escalationDelayMinutes: number;
  lowStockEmailAlerts: boolean;
  appointmentReminderHoursBefore: number;
  recipientEmails: string[];
  reminderFrequency: 'once' | 'every_15_min' | 'every_30_min';
}

export interface EmailNotificationLog {
  id: string;
  timestamp: string;
  type: 'upcoming_dose' | 'missed_dose' | 'escalation_alert' | 'appointment_reminder' | 'refill_alert' | 'sos_emergency' | 'routine_reminder';
  subject: string;
  recipients: string[];
  body: string;
  deliveryStatus: 'delivered' | 'queued';
  acknowledged: boolean;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole | 'system' | 'hardware';
  action: string;
  category: 'medication' | 'appointment' | 'profile' | 'security' | 'emergency' | 'hardware';
  details: string;
}

export interface HardwareBoxState {
  deviceId: string;
  firmwareVersion: string;
  connected: boolean;
  wifiRssiDbm: number;
  batteryPercent: number;
  lastSyncAt: string;
  buzzerActive: boolean;
  voicePromptActive: boolean;
  activeSlotLed: number | null;
  doorOpen: boolean;
  lastPhysicalButtonPressAt?: string;
  lastScannedQrOrNfc?: string;
}

export interface HealthcareDatabase {
  patient: PatientProfile;
  members: AuthorizedMember[];
  medications: Medication[];
  appointments: Appointment[];
  dailyRoutine: DailyRoutineItem[];
  notificationSettings: NotificationSettings;
  emailLogs: EmailNotificationLog[];
  activityLogs: ActivityLogEntry[];
  hardware: HardwareBoxState;
  lastUpdated: string;
}

export interface InteractionWarning {
  severity: 'high' | 'moderate' | 'low';
  title: string;
  medicationsInvolved: string[];
  explanation: string;
  recommendation: string;
}
