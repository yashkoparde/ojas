import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import type {
  HealthcareDatabase,
  EmailNotificationLog,
  ActivityLogEntry,
  Medication,
  Appointment,
  AuthorizedMember,
  MedicalReport,
} from './src/types.ts';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'healthcare_db.json');

function getGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const INITIAL_DB: HealthcareDatabase = {
  patient: {
    id: 'pat-kamala-01',
    qrCodeId: 'CB-IND-8842-KD',
    fullName: 'Smt. Kamala Deshmukh',
    age: 76,
    dateOfBirth: '1950-08-19',
    bloodGroup: 'O+',
    weightKg: 61,
    heightCm: 158,
    address: 'Flat 402, Shanti Niketan CHS, Prabhat Road, Deccan Gymkhana, Pune, Maharashtra 411004',
    phone: '+91 98230 45120',
    email: 'kamala.deshmukh@carebridge.in',
    avatarUrl: '/src/assets/images/avatar_patient_kamala_1794718340266.jpg',
    primaryDoctor: {
      name: 'Dr. Rajesh Kulkarni, MD, DM (Cardiology)',
      specialty: 'Geriatric Cardiology & Internal Medicine',
      hospital: 'Sahyadri Super Speciality Hospital, Deccan Gymkhana, Pune',
      phone: '+91 20 6721 3000',
      email: 'dr.kulkarni@sahyadrihospitals.com',
    },
    conditions: [
      'Stage 2 Essential Hypertension',
      'Type 2 Diabetes Mellitus (Controlled)',
      'Mild Bilateral Knee Osteoarthritis',
      'Paroxysmal Atrial Fibrillation',
    ],
    allergies: [
      'Penicillin (Severe Anaphylaxis)',
      'Sulphonamides / Sulfa Drugs (Skin Rash)',
      'Prawns / Shellfish',
    ],
    medicationRestrictions: [
      'Strictly avoid NSAID painkillers (Combiflam, Ibuprofen, Diclofenac) due to Apixaban bleeding risk',
      'Avoid Grapefruit / Chakotra juice with Atorvastatin',
    ],
    medicalHistoryNotes:
      'Cataract surgery (Left Eye, 2022) atHV Desai Eye Hospital. Routine 2D Echo normal (July 2026). Walks independently indoors; uses support stick for evening society garden walks.',
    emergencyContacts: [
      {
        id: 'ec-1',
        name: 'Rohan Deshmukh',
        relationship: 'Son (Primary Family Proxy - Kothrud, Pune)',
        phone: '+91 98201 11223',
        email: 'yashkoparde2022@gmail.com',
        isPrimary: true,
      },
      {
        id: 'ec-2',
        name: 'Sister Priya Nair, RN',
        relationship: 'Lead Home Care Nurse (Day Shift)',
        phone: '+91 98231 67890',
        email: 'priya.nair.rn@carebridge.in',
        isPrimary: false,
      },
    ],
    reports: [
      {
        id: 'rep-101',
        title: 'HbA1c, Fasting Blood Sugar & Renal Function Panel (SRL Diagnostics)',
        category: 'Lab Report',
        doctorName: 'Dr. Rajesh Kulkarni, MD, DM',
        uploadedBy: 'Sister Priya Nair, RN',
        uploadedAt: '2026-11-02 10:15',
        notes: 'HbA1c well-controlled at 6.5%. Fasting blood glucose 106 mg/dL. Serum Creatinine 0.9 mg/dL.',
      },
      {
        id: 'rep-102',
        title: 'Sahyadri Cardiology OPD Prescription — Anticoagulation & BP',
        category: 'Prescription',
        doctorName: 'Dr. Rajesh Kulkarni, MD, DM',
        uploadedBy: 'Sister Priya Nair, RN',
        uploadedAt: '2026-10-18 14:30',
        notes: 'Continue Telma 40mg (Telmisartan) after breakfast and Eliquis 5mg (Apixaban) twice daily.',
      },
    ],
    encryptionKeyFingerprint: 'AES256-GCM:IN:9F:4B:2C:81:E7:04',
  },
  members: [
    {
      id: 'mem-elderly-1',
      name: 'Smt. Kamala Deshmukh',
      role: 'elderly',
      relationship: 'Patient (Self · Exclusive Consent & Access Authority)',
      email: 'kamala.deshmukh@carebridge.in',
      phone: '+91 98230 45120',
      passcode: '1234',
      avatarUrl: '/src/assets/images/avatar_patient_kamala_1794718340266.jpg',
      status: 'active',
      consentGrantedByPatient: true,
      permissions: {
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: true,
        canManageAccess: true,
      },
      lastActiveAt: '2026-11-14 08:05',
    },
    {
      id: 'mem-caretaker-1',
      name: 'Sister Priya Nair, RN',
      role: 'caretaker',
      relationship: 'Primary Home Care Nurse (Clinical Execution)',
      email: 'priya.nair.rn@carebridge.in',
      phone: '+91 98231 67890',
      passcode: '2468',
      avatarUrl: '/src/assets/images/avatar_caretaker_priya_1794718340849.jpg',
      status: 'active',
      consentGrantedByPatient: true,
      permissions: {
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canManageAccess: false,
      },
      lastActiveAt: '2026-11-14 09:15',
    },
    {
      id: 'mem-family-1',
      name: 'Rohan Deshmukh',
      role: 'family',
      relationship: 'Son (Remote Monitoring & Appointment Booking)',
      email: 'yashkoparde2022@gmail.com',
      phone: '+91 98201 11223',
      passcode: '1357',
      avatarUrl: '/src/assets/images/avatar_family_rohan_1794718340820.jpg',
      status: 'active',
      consentGrantedByPatient: true,
      permissions: {
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canManageAccess: false,
      },
      lastActiveAt: '2026-11-14 07:50',
    },
  ],
  medications: [
    {
      id: 'med-1',
      name: 'Telma 40 (Telmisartan)',
      genericName: 'Telmisartan IP 40 mg',
      dosage: '40 mg (1 Tablet)',
      frequency: 'Once Daily',
      duration: 'Ongoing Maintenance',
      startDate: '2026-01-10',
      endDate: '2027-01-10',
      instructions: 'Take in the morning with warm water after waking up. Monitor blood pressure.',
      purpose: 'Blood Pressure Control (Hypertension)',
      prescribedBy: 'Dr. Rajesh Kulkarni, MD, DM',
      assignedCaretakerId: 'mem-caretaker-1',
      stockCount: 24,
      refillThreshold: 7,
      compartmentNumber: 1,
      nfcTagId: 'NFC-SLOT1-TELMA40',
      dailySchedule: [
        {
          id: 'slot-med1-1',
          scheduledTime: '08:00',
          label: 'Morning (With Warm Water)',
          status: 'taken',
          acknowledgedAt: '08:04',
          acknowledgedBy: 'Smt. Kamala Deshmukh',
        },
      ],
    },
    {
      id: 'med-2',
      name: 'Glycomet-GP 1 (Metformin)',
      genericName: 'Metformin HCl 500 mg SR',
      dosage: '500 mg (1 Tablet)',
      frequency: 'Twice Daily',
      duration: 'Ongoing Maintenance',
      startDate: '2026-02-01',
      endDate: '2027-02-01',
      instructions: 'Take immediately after morning Poha/Upma breakfast and after night dinner.',
      purpose: 'Blood Sugar Control (Type 2 Diabetes)',
      prescribedBy: 'Dr. Ananya Gokhale, MD',
      assignedCaretakerId: 'mem-caretaker-1',
      stockCount: 5,
      refillThreshold: 10,
      compartmentNumber: 2,
      nfcTagId: 'NFC-SLOT2-GLY500',
      dailySchedule: [
        {
          id: 'slot-med2-1',
          scheduledTime: '08:30',
          label: 'Morning (After Nashta)',
          status: 'taken',
          acknowledgedAt: '08:32',
          acknowledgedBy: 'Sister Priya Nair, RN',
        },
        {
          id: 'slot-med2-2',
          scheduledTime: '20:00',
          label: 'Night (After Dinner)',
          status: 'pending',
        },
      ],
    },
    {
      id: 'med-3',
      name: 'Eliquis 5 mg (Apixaban)',
      genericName: 'Apixaban IP 5 mg',
      dosage: '5 mg (1 Tablet)',
      frequency: 'Twice Daily',
      duration: 'Ongoing Maintenance',
      startDate: '2026-03-15',
      endDate: '2027-03-15',
      instructions: 'Do not skip doses. Strictly avoid Combiflam, Brufen, or Aspirin.',
      purpose: 'Stroke Prevention (Atrial Fibrillation)',
      prescribedBy: 'Dr. Rajesh Kulkarni, MD, DM',
      assignedCaretakerId: 'mem-caretaker-1',
      stockCount: 18,
      refillThreshold: 7,
      compartmentNumber: 3,
      nfcTagId: 'NFC-SLOT3-APIX5',
      dailySchedule: [
        {
          id: 'slot-med3-1',
          scheduledTime: '09:00',
          label: 'Morning Dose',
          status: 'taken',
          acknowledgedAt: '09:02',
          acknowledgedBy: 'Smt. Kamala Deshmukh',
        },
        {
          id: 'slot-med3-2',
          scheduledTime: '14:00',
          label: 'Afternoon Post-Lunch Dose',
          status: 'missed',
          escalated: true,
        },
      ],
    },
    {
      id: 'med-4',
      name: 'Atorva 20 (Atorvastatin)',
      genericName: 'Atorvastatin Calcium IP 20 mg',
      dosage: '20 mg (1 Tablet)',
      frequency: 'Once Daily at Bedtime',
      duration: 'Ongoing Maintenance',
      startDate: '2026-01-10',
      endDate: '2027-01-10',
      instructions: 'Take at bedtime with water.',
      purpose: 'Cholesterol & Cardiac Protection',
      prescribedBy: 'Dr. Rajesh Kulkarni, MD, DM',
      assignedCaretakerId: 'mem-caretaker-1',
      stockCount: 4,
      refillThreshold: 7,
      compartmentNumber: 4,
      nfcTagId: 'NFC-SLOT4-ATOR20',
      dailySchedule: [
        {
          id: 'slot-med4-1',
          scheduledTime: '21:30',
          label: 'Night (Before Sleep)',
          status: 'pending',
        },
      ],
    },
  ],
  appointments: [
    {
      id: 'apt-1',
      doctorName: 'Dr. Rajesh Kulkarni, MD, DM',
      specialty: 'Geriatric Cardiology',
      hospitalLocation: 'Sahyadri Super Speciality Hospital, Deccan Gymkhana, Pune',
      roomOrDept: 'Cardiology OPD - Wing B, Room 204',
      date: '2026-11-18',
      time: '10:30',
      status: 'upcoming',
      assignedMemberId: 'mem-family-1',
      reason: 'Quarterly ECG, AFib & Blood Pressure Review',
      consultationNotes: 'Carry 14-day home BP notebook and current prescription file.',
      followUpInstructions: 'Fasting lipid profile at SRL Diagnostics 24 hours before visit.',
      reminderSent: true,
    },
    {
      id: 'apt-2',
      doctorName: 'Dr. Ananya Gokhale, MD',
      specialty: 'Endocrinology & Diabetology',
      hospitalLocation: 'Ruby Hall Clinic, Sassoon Road, Pune',
      roomOrDept: 'Diabetic Foot & Metabolic Wing - 1st Floor',
      date: '2026-11-24',
      time: '16:15',
      status: 'upcoming',
      assignedMemberId: 'mem-caretaker-1',
      reason: 'Routine HbA1c Review & Knee Osteoarthritis Physiotherapy Check',
      consultationNotes: 'Check evening post-dinner glucose trends.',
      followUpInstructions: 'Continue gentle seated knee exercises and warm fomentation.',
      reminderSent: false,
    },
    {
      id: 'apt-3',
      doctorName: 'Dr. Rajesh Kulkarni, MD, DM',
      specialty: 'Geriatric Cardiology',
      hospitalLocation: 'Sahyadri Super Speciality Hospital, Deccan Gymkhana, Pune',
      roomOrDept: 'Cardiology OPD - Wing B, Room 204',
      date: '2026-10-18',
      time: '11:00',
      status: 'completed',
      assignedMemberId: 'mem-family-1',
      reason: 'Telma 40 Titration & 12-Lead ECG Check',
      consultationNotes: 'Resting BP 126/78 mmHg. Normal sinus rhythm on ECG. Tolerating Telma 40mg well.',
      followUpInstructions: 'Low salt diet (avoid papad/pickles). Review in 1 month.',
      reminderSent: true,
    },
  ],
  dailyRoutine: [
    {
      id: 'rout-1',
      time: '07:30',
      title: 'Morning Omron BP & Glucometer Check',
      category: 'Vitals',
      completed: true,
      completedAt: '07:35',
      completedBy: 'Smt. Kamala Deshmukh',
      valueRecorded: 'BP: 124/78 mmHg · Pulse: 68 BPM',
    },
    {
      id: 'rout-2',
      time: '08:15',
      title: 'Warm Methi Water & Oats / Poha Nashta',
      category: 'Nutrition',
      completed: true,
      completedAt: '08:25',
      completedBy: 'Sister Priya Nair, RN',
      valueRecorded: 'Fasting Sugar: 106 mg/dL',
    },
    {
      id: 'rout-3',
      time: '10:30',
      title: '15-Minute Anulom Vilom Pranayama & Society Garden Walk',
      category: 'Exercise',
      completed: true,
      completedAt: '10:50',
      completedBy: 'Sister Priya Nair, RN',
      valueRecorded: 'Comfortable pace, no knee pain',
    },
    {
      id: 'rout-4',
      time: '15:30',
      title: 'Afternoon Jeera Buttermilk (Chaas) & Warm Water Hydration',
      category: 'Hydration',
      completed: false,
    },
    {
      id: 'rout-5',
      time: '20:30',
      title: 'Evening Blood Pressure & Pedal Edema Check',
      category: 'Vitals',
      completed: false,
    },
  ],
  notificationSettings: {
    emailRemindersEnabled: true,
    missedDoseGracePeriodMinutes: 30,
    autoCaretakerEscalation: true,
    escalationDelayMinutes: 45,
    lowStockEmailAlerts: true,
    appointmentReminderHoursBefore: 24,
    recipientEmails: [
      'yashkoparde2022@gmail.com',
      'priya.nair.rn@carebridge.in',
      'kamala.deshmukh@carebridge.in',
    ],
    reminderFrequency: 'every_15_min',
  },
  emailLogs: [
    {
      id: 'email-101',
      timestamp: '2026-11-14 14:45',
      type: 'escalation_alert',
      subject: '[ESCALATION] Unacknowledged 14:00 Eliquis 5mg Dose — Smt. Kamala Deshmukh',
      recipients: ['yashkoparde2022@gmail.com', 'priya.nair.rn@carebridge.in'],
      body: 'Automated CareBridge Escalation: Smt. Kamala Deshmukh has not confirmed her 14:00 dose of Eliquis (Apixaban) 5mg after the 45-minute grace window. Sister Priya Nair & Rohan Deshmukh have been alerted.',
      deliveryStatus: 'delivered',
      acknowledged: false,
    },
    {
      id: 'email-102',
      timestamp: '2026-11-14 09:05',
      type: 'refill_alert',
      subject: '[LOW STOCK] Glycomet-GP 1 & Atorva 20 Wellness Forever Pharmacy Refill Needed',
      recipients: ['yashkoparde2022@gmail.com', 'priya.nair.rn@carebridge.in'],
      body: 'Inventory Alert: Glycomet-GP 1 (500mg) has 5 tablets remaining (threshold: 10) and Atorva 20mg has 4 tablets remaining (threshold: 7). Please order refill from Prabhat Road Chemist.',
      deliveryStatus: 'delivered',
      acknowledged: true,
    },
    {
      id: 'email-103',
      timestamp: '2026-11-14 07:45',
      type: 'upcoming_dose',
      subject: '[REMINDER] Morning Medication Schedule (08:00 - 09:00) for Smt. Kamala Deshmukh',
      recipients: ['kamala.deshmukh@carebridge.in', 'priya.nair.rn@carebridge.in'],
      body: 'Namaste Kamala Aaji! Your morning medications are scheduled: 08:00 Telma 40mg (Slot #1), 08:30 Glycomet-GP 500mg (Slot #2), and 09:00 Eliquis 5mg (Slot #3).',
      deliveryStatus: 'delivered',
      acknowledged: true,
    },
  ],
  activityLogs: [
    {
      id: 'act-1',
      timestamp: '2026-11-14 14:45',
      actorName: 'CareBridge Scheduler',
      actorRole: 'system',
      action: 'Missed Dose Escalation Triggered',
      category: 'medication',
      details: 'Eliquis 5mg (14:00 slot) marked as missed; escalation email dispatched to Sister Priya Nair, RN & Rohan Deshmukh.',
    },
    {
      id: 'act-2',
      timestamp: '2026-11-14 09:02',
      actorName: 'Smt. Kamala Deshmukh',
      actorRole: 'elderly',
      action: 'Confirmed Medication Intake (Physical Box Button)',
      category: 'hardware',
      details: 'Eliquis 5mg (09:00 slot) confirmed via ESP32 Smart Pillbox Compartment #3.',
    },
    {
      id: 'act-3',
      timestamp: '2026-11-14 08:32',
      actorName: 'Sister Priya Nair, RN',
      actorRole: 'caretaker',
      action: 'Verified Medication Intake',
      category: 'medication',
      details: 'Glycomet-GP 500mg (08:30 slot) administered after Poha breakfast.',
    },
    {
      id: 'act-4',
      timestamp: '2026-11-14 08:04',
      actorName: 'Smt. Kamala Deshmukh',
      actorRole: 'elderly',
      action: 'One-Tap Medication Confirmation',
      category: 'medication',
      details: 'Telma 40mg (08:00 slot) confirmed via Elderly Portal.',
    },
  ],
  hardware: {
    deviceId: 'ESP32-PUNE-BOX99',
    firmwareVersion: 'v2.4.1-ESP32S3-IN',
    connected: true,
    wifiRssiDbm: -52,
    batteryPercent: 95,
    lastSyncAt: '2026-11-14 14:45:12',
    buzzerActive: true,
    voicePromptActive: false,
    activeSlotLed: 3,
    lastPhysicalButtonPressAt: '2026-11-14 09:02:18',
    lastScannedQrOrNfc: 'NFC-SLOT3-APIX5',
  },
  lastUpdated: new Date().toISOString(),
};

function ensureDb(): HealthcareDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
    return structuredClone(INITIAL_DB);
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as HealthcareDatabase;
    // Automatically migrate if old non-Indian seed ('Eleanor Vance') is detected
    if (parsed.patient?.fullName?.includes('Eleanor')) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return structuredClone(INITIAL_DB);
    }
    return parsed;
  } catch {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
    return structuredClone(INITIAL_DB);
  }
}

let dbState: HealthcareDatabase = ensureDb();
const sseClients = new Set<Response>();

function saveAndBroadcast() {
  dbState.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  const payload = `data: ${JSON.stringify(dbState)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function nowFormatted(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function addActivityLog(
  actorName: string,
  actorRole: ActivityLogEntry['actorRole'],
  action: string,
  category: ActivityLogEntry['category'],
  details: string
) {
  const entry: ActivityLogEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowFormatted(),
    actorName,
    actorRole,
    action,
    category,
    details,
  };
  dbState.activityLogs.unshift(entry);
  if (dbState.activityLogs.length > 100) {
    dbState.activityLogs = dbState.activityLogs.slice(0, 100);
  }
}

function dispatchEmailNotification(
  type: EmailNotificationLog['type'],
  subject: string,
  body: string,
  customRecipients?: string[]
): EmailNotificationLog {
  const recipients =
    customRecipients && customRecipients.length > 0
      ? customRecipients
      : dbState.notificationSettings.recipientEmails;
  const emailEntry: EmailNotificationLog = {
    id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowFormatted(),
    type,
    subject,
    recipients,
    body,
    deliveryStatus: 'delivered',
    acknowledged: false,
  };
  dbState.emailLogs.unshift(emailEntry);
  if (dbState.emailLogs.length > 80) {
    dbState.emailLogs = dbState.emailLogs.slice(0, 80);
  }
  return emailEntry;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Real-time SSE stream
  app.get('/api/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    res.write(`data: ${JSON.stringify(dbState)}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Get full centralized state
  app.get('/api/state', (_req: Request, res: Response) => {
    res.json(dbState);
  });

  // Profile selection authentication: No PIN for Patient or Family; PIN required only for Caregiver
  app.post('/api/auth/verify-passcode', (req: Request, res: Response) => {
    const { memberId, passcode } = req.body as { memberId: string; passcode?: string };
    const member = dbState.members.find((m) => m.id === memberId);
    if (!member) {
      res.status(404).json({ error: 'Member profile not found.' });
      return;
    }
    if (member.status === 'revoked' || !member.consentGrantedByPatient) {
      res.status(403).json({
        error: 'Access revoked by Smt. Kamala Deshmukh. Elderly patient retains full consent authority.',
      });
      return;
    }

    // PIN is strictly required ONLY for Caregiver (caretaker role)
    if (member.role === 'caretaker' && member.passcode !== String(passcode || '').trim()) {
      addActivityLog(
        member.name,
        member.role,
        'Failed Caregiver PIN Attempt',
        'security',
        `Invalid PIN entered for Caregiver ${member.name}.`
      );
      saveAndBroadcast();
      res.status(401).json({ error: 'Invalid 4-digit Caregiver security PIN.' });
      return;
    }

    member.lastActiveAt = nowFormatted();
    addActivityLog(
      member.name,
      member.role,
      member.role === 'caretaker'
        ? 'Caregiver Unlocked via PIN'
        : 'Selected Profile Session',
      'security',
      `${member.name} entered OJAS as ${member.role.toUpperCase()}.`
    );
    saveAndBroadcast();
    res.json({ success: true, member });
  });

  // Update patient clinical profile (Restricted: Elderly cannot modify clinical parameters; Family/Caretaker require patient consent + canEdit)
  app.put('/api/patient', (req: Request, res: Response) => {
    const { actorName, actorRole, updates } = req.body;
    const actor = dbState.members.find((m) => m.role === actorRole);
    if (actorRole === 'elderly') {
      res.status(403).json({
        error: 'Elderly patient view cannot modify clinical diagnostic parameters directly.',
      });
      return;
    }
    if (!actor || !actor.consentGrantedByPatient || !actor.permissions.canEdit) {
      res.status(403).json({
        error: 'Read-only access: Patient authorization (canEdit) is required to modify clinical profile parameters.',
      });
      return;
    }
    dbState.patient = {
      ...dbState.patient,
      ...updates,
    };
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Updated Patient Healthcare Profile',
      'profile',
      'Updated clinical profile, allergies, conditions, or emergency contacts.'
    );
    saveAndBroadcast();
    res.json(dbState.patient);
  });

  // Upload medical prescription or report
  app.post('/api/patient/reports', (req: Request, res: Response) => {
    const { actorName, actorRole, report } = req.body as {
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
      report: Omit<MedicalReport, 'id' | 'uploadedAt'>;
    };
    const actor = dbState.members.find((m) => m.role === actorRole);
    if (actorRole === 'elderly' || !actor?.consentGrantedByPatient || !actor?.permissions.canAdd) {
      res.status(403).json({
        error: 'Authorized Caregiver permission (canAdd) is required to upload clinical reports.',
      });
      return;
    }
    const newReport: MedicalReport = {
      ...report,
      id: `rep-${Date.now()}`,
      uploadedAt: nowFormatted(),
    };
    dbState.patient.reports.unshift(newReport);
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      `Uploaded ${newReport.category}`,
      'profile',
      `Added medical document "${newReport.title}" (${newReport.doctorName}).`
    );
    saveAndBroadcast();
    res.json(newReport);
  });

  // Invite or update authorized family member / caretaker (STRICTLY ELDERLY PATIENT ONLY)
  app.post('/api/members', (req: Request, res: Response) => {
    const { actorName, actorRole, member } = req.body as {
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
      member: Partial<AuthorizedMember>;
    };
    if (actorRole !== 'elderly') {
      res.status(403).json({
        error: 'Only Smt. Kamala Deshmukh (Elderly Patient) has consent authority to invite or authorize members.',
      });
      return;
    }
    const newMember: AuthorizedMember = {
      id: `mem-${Date.now()}`,
      name: member.name || 'New Care Member',
      role: member.role || 'family',
      relationship: member.relationship || 'Family Member',
      email: member.email || 'family@ojas.in',
      phone: member.phone || '+91 98200 00000',
      passcode: member.passcode || '4321',
      avatarUrl:
        member.avatarUrl ||
        (member.role === 'caretaker'
          ? '/src/assets/images/avatar_caretaker_priya_1794718340849.jpg'
          : '/src/assets/images/avatar_family_rohan_1794718340820.jpg'),
      status: 'active',
      consentGrantedByPatient: true,
      permissions: member.permissions || {
        canView: true,
        canAdd: member.role === 'caretaker',
        canEdit: member.role === 'caretaker',
        canDelete: false,
        canManageAccess: false,
      },
      lastActiveAt: nowFormatted(),
    };
    dbState.members.push(newMember);
    if (newMember.email && !dbState.notificationSettings.recipientEmails.includes(newMember.email)) {
      dbState.notificationSettings.recipientEmails.push(newMember.email);
    }
    addActivityLog(
      actorName || 'Smt. Kamala Deshmukh',
      'elderly',
      'Authorized New Care Circle Member',
      'security',
      `Granted ${newMember.role} access to ${newMember.name} (${newMember.relationship}).`
    );
    saveAndBroadcast();
    res.json(newMember);
  });

  app.put('/api/members/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorName, actorRole, updates } = req.body;
    if (actorRole !== 'elderly') {
      res.status(403).json({
        error: 'Only Smt. Kamala Deshmukh (Elderly Patient) can modify role permissions or revoke consent.',
      });
      return;
    }
    const idx = dbState.members.findIndex((m) => m.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    dbState.members[idx] = { ...dbState.members[idx], ...updates };
    addActivityLog(
      actorName || 'Smt. Kamala Deshmukh',
      'elderly',
      'Updated Member Access & Consent',
      'security',
      `Modified access status/permissions for ${dbState.members[idx].name} (Status: ${dbState.members[idx].status}).`
    );
    saveAndBroadcast();
    res.json(dbState.members[idx]);
  });

  // Medication CRUD + Dose Tracking (Elderly cannot modify clinical medication schedules; Family/Caretaker require patient consent + permissions)
  app.post('/api/medications', (req: Request, res: Response) => {
    const { actorName, actorRole, medication } = req.body as {
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
      medication: Partial<Medication>;
    };
    const actor = dbState.members.find((m) => m.role === actorRole);
    if (actorRole === 'elderly') {
      res.status(403).json({
        error: 'Elderly users cannot add or modify clinical medication prescriptions.',
      });
      return;
    }
    if (!actor || !actor.consentGrantedByPatient || !actor.permissions.canAdd) {
      res.status(403).json({
        error: 'Read-only access: Patient authorization (canAdd) is required to add medications.',
      });
      return;
    }
    const newMed: Medication = {
      id: `med-${Date.now()}`,
      name: medication.name || 'Unnamed Medication',
      genericName: medication.genericName || medication.name || '',
      dosage: medication.dosage || '1 Tablet',
      frequency: medication.frequency || 'Once Daily',
      duration: medication.duration || '30 Days',
      startDate: medication.startDate || '2026-11-14',
      endDate: medication.endDate || '2026-12-14',
      instructions: medication.instructions || 'Take with warm water as directed.',
      purpose: medication.purpose || 'General Health',
      prescribedBy: medication.prescribedBy || dbState.patient.primaryDoctor.name,
      assignedCaretakerId: medication.assignedCaretakerId || 'mem-caretaker-1',
      stockCount: Number(medication.stockCount ?? 30),
      refillThreshold: Number(medication.refillThreshold ?? 7),
      compartmentNumber: Number(medication.compartmentNumber ?? ((dbState.medications.length % 6) + 1)),
      nfcTagId: medication.nfcTagId || `NFC-SLOT-${Date.now().toString().slice(-4)}`,
      prescriptionImageUrl: medication.prescriptionImageUrl,
      bottleOrStripImageUrl: medication.bottleOrStripImageUrl,
      dailySchedule:
        medication.dailySchedule && medication.dailySchedule.length > 0
          ? medication.dailySchedule
          : [
              {
                id: `slot-${Date.now()}-1`,
                scheduledTime: '09:00',
                label: 'Morning Dose',
                status: 'pending',
              },
            ],
    };
    dbState.medications.push(newMed);
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Added New Medication',
      'medication',
      `Added ${newMed.name} (${newMed.dosage}, ${newMed.frequency}) in Pillbox Compartment #${newMed.compartmentNumber}.`
    );
    saveAndBroadcast();
    res.json(newMed);
  });

  app.put('/api/medications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorName, actorRole, updates } = req.body;
    const actor = dbState.members.find((m) => m.role === actorRole);
    const isPhotoOnlyUpdate =
      updates &&
      Object.keys(updates).every(
        (k) => k === 'bottleOrStripImageUrl' || k === 'prescriptionImageUrl'
      );
    if (actorRole === 'elderly' && !isPhotoOnlyUpdate) {
      res.status(403).json({
        error: 'Elderly users cannot modify clinical medication dosages or schedules.',
      });
      return;
    }
    if (!isPhotoOnlyUpdate && (!actor || !actor.consentGrantedByPatient || !actor.permissions.canEdit)) {
      res.status(403).json({
        error: 'Read-only access: Patient authorization (canEdit) is required to edit medication schedules.',
      });
      return;
    }
    const idx = dbState.medications.findIndex((m) => m.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    dbState.medications[idx] = { ...dbState.medications[idx], ...updates };
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      isPhotoOnlyUpdate ? 'Uploaded Medication Bottle/Strip Photo' : 'Updated Medication Details',
      'medication',
      isPhotoOnlyUpdate
        ? `Uploaded visual identification photo (bottle/pill strip) for ${dbState.medications[idx].name}.`
        : `Updated schedule or stock for ${dbState.medications[idx].name}.`
    );
    saveAndBroadcast();
    res.json(dbState.medications[idx]);
  });

  app.delete('/api/medications/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorName, actorRole } = req.body || {};
    const actor = dbState.members.find((m) => m.role === actorRole);
    if (actorRole === 'elderly' || !actor || !actor.consentGrantedByPatient || !actor.permissions.canDelete) {
      res.status(403).json({
        error: 'Restricted action: Only an authorized member with Delete permission granted by the patient may remove clinical prescriptions.',
      });
      return;
    }
    const target = dbState.medications.find((m) => m.id === id);
    if (!target) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    dbState.medications = dbState.medications.filter((m) => m.id !== id);
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Removed Medication',
      'medication',
      `Removed ${target.name} (${target.dosage}) from active schedule.`
    );
    saveAndBroadcast();
    res.json({ success: true });
  });

  // Update dose status (Taken / Missed / Skipped / Pending) - Restricted to Elderly & On-Site Caretaker
  app.post('/api/medications/:id/dose', (req: Request, res: Response) => {
    const { id } = req.params;
    const { slotId, status, actorName, actorRole, source } = req.body as {
      slotId: string;
      status: 'pending' | 'taken' | 'missed' | 'skipped';
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
      source?: string;
    };
    if (actorRole === 'family') {
      res.status(403).json({
        error: 'Remote Family Member role cannot mark physical doses as taken. Only the Patient or on-site Caretaker Nurse can confirm physical intake.',
      });
      return;
    }
    const med = dbState.medications.find((m) => m.id === id);
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    const slot = med.dailySchedule.find((s) => s.id === slotId);
    if (!slot) {
      res.status(404).json({ error: 'Schedule slot not found' });
      return;
    }

    const prevStatus = slot.status;
    slot.status = status;
    const nowTime = new Date().toTimeString().slice(0, 5);

    if (status === 'taken') {
      slot.acknowledgedAt = nowTime;
      slot.acknowledgedBy = actorName;
      slot.escalated = false;
      if (prevStatus !== 'taken' && med.stockCount > 0) {
        med.stockCount -= 1;
      }
      if (dbState.hardware.activeSlotLed === med.compartmentNumber) {
        dbState.hardware.activeSlotLed = null;
        dbState.hardware.buzzerActive = false;
        dbState.hardware.voicePromptActive = false;
      }
      if (med.stockCount <= med.refillThreshold && dbState.notificationSettings.lowStockEmailAlerts) {
        dispatchEmailNotification(
          'refill_alert',
          `[LOW STOCK] ${med.name} (${med.dosage}) Down to ${med.stockCount} Doses`,
          `Refill Reminder: ${dbState.patient.fullName}'s supply of ${med.name} (${med.dosage}) has ${med.stockCount} tablets remaining (Refill threshold: ${med.refillThreshold}). Prescribed by ${med.prescribedBy}.`
        );
      }
    } else if (status === 'missed') {
      slot.escalated = true;
      if (dbState.notificationSettings.autoCaretakerEscalation) {
        dispatchEmailNotification(
          'escalation_alert',
          `[ESCALATION] Missed Dose: ${med.name} (${med.dosage}) at ${slot.scheduledTime}`,
          `Automated Caretaker & Family Alert: ${dbState.patient.fullName} missed the ${slot.scheduledTime} dose of ${med.name} (${med.dosage}). Please follow up immediately.`
        );
      }
    }

    addActivityLog(
      actorName || 'Smt. Kamala Deshmukh',
      actorRole || 'elderly',
      `Marked Dose as ${status.toUpperCase()}`,
      source === 'hardware' ? 'hardware' : 'medication',
      `${med.name} (${med.dosage}) scheduled for ${slot.scheduledTime} marked as ${status} by ${actorName}${source ? ` via ${source}` : ''}.`
    );

    saveAndBroadcast();
    res.json({ medication: med, slot });
  });

  // Refill medication stock
  app.post('/api/medications/:id/refill', (req: Request, res: Response) => {
    const { id } = req.params;
    const { addedQuantity, actorName, actorRole } = req.body;
    const med = dbState.medications.find((m) => m.id === id);
    if (!med) {
      res.status(404).json({ error: 'Medication not found' });
      return;
    }
    const qty = Number(addedQuantity) || 30;
    med.stockCount += qty;
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Restocked Medication Supply',
      'medication',
      `Added +${qty} tablets to ${med.name}. Total stock is now ${med.stockCount}.`
    );
    saveAndBroadcast();
    res.json(med);
  });

  // Appointments CRUD
  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CareBridge India Healthcare Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
