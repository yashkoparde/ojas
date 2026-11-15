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
    doorOpen: false,
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
    const { slotId, status, actorName, actorRole, source, notes } = req.body as {
      slotId: string;
      status: 'pending' | 'taken' | 'missed' | 'skipped';
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
      source?: string;
      notes?: string;
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

    if (notes !== undefined) {
      slot.notes = notes.trim();
    }

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
      `${med.name} (${med.dosage}) scheduled for ${slot.scheduledTime} marked as ${status} by ${actorName}${source ? ` via ${source}` : ''}${slot.notes ? ` · Note: "${slot.notes}"` : ''}.`
    );

    saveAndBroadcast();
    res.json({ medication: med, slot });
  });

  // Update observational notes for a specific dose confirmation
  app.post('/api/medications/:id/dose/notes', (req: Request, res: Response) => {
    const { id } = req.params;
    const { slotId, notes, actorName, actorRole } = req.body as {
      slotId: string;
      notes: string;
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
    };
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

    slot.notes = (notes || '').trim();

    addActivityLog(
      actorName || 'Caregiver Priya Sharma',
      actorRole || 'caretaker',
      'Updated Dose Observational Note',
      'medication',
      `Caregiver observational note for ${med.name} (${slot.scheduledTime}): "${slot.notes}".`
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
  app.post('/api/appointments', (req: Request, res: Response) => {
    const { actorName, actorRole, appointment } = req.body as {
      actorName: string;
      actorRole: ActivityLogEntry['actorRole'];
      appointment: Partial<Appointment>;
    };
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      doctorName: appointment.doctorName || dbState.patient.primaryDoctor.name,
      specialty: appointment.specialty || dbState.patient.primaryDoctor.specialty,
      hospitalLocation: appointment.hospitalLocation || dbState.patient.primaryDoctor.hospital,
      roomOrDept: appointment.roomOrDept || 'Cardiology OPD Wing',
      date: appointment.date || '2026-11-28',
      time: appointment.time || '10:30',
      status: 'upcoming',
      assignedMemberId: appointment.assignedMemberId || 'mem-family-1',
      reason: appointment.reason || 'Follow-up Consultation',
      consultationNotes: appointment.consultationNotes || '',
      followUpInstructions: appointment.followUpInstructions || '',
      reminderSent: true,
    };
    dbState.appointments.unshift(newApt);
    dispatchEmailNotification(
      'appointment_reminder',
      `[APPOINTMENT SCHEDULED] ${newApt.doctorName} on ${newApt.date} at ${newApt.time}`,
      `New Appointment Confirmed for ${dbState.patient.fullName}: ${newApt.doctorName} (${newApt.specialty}) at ${newApt.hospitalLocation} on ${newApt.date} at ${newApt.time}. Reason: ${newApt.reason}.`
    );
    addActivityLog(
      actorName || 'Rohan Deshmukh',
      actorRole || 'family',
      'Scheduled Doctor Appointment',
      'appointment',
      `Booked visit with ${newApt.doctorName} on ${newApt.date} at ${newApt.time}.`
    );
    saveAndBroadcast();
    res.json(newApt);
  });

  app.put('/api/appointments/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorName, actorRole, updates } = req.body;
    const idx = dbState.appointments.findIndex((a) => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    dbState.appointments[idx] = { ...dbState.appointments[idx], ...updates };
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Updated Appointment / Consultation Notes',
      'appointment',
      `Updated appointment with ${dbState.appointments[idx].doctorName} (${dbState.appointments[idx].date}).`
    );
    saveAndBroadcast();
    res.json(dbState.appointments[idx]);
  });

  // Daily Routine Checklist toggle
  app.post('/api/routine/:id/toggle', (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorName, actorRole, valueRecorded } = req.body;
    if (actorRole === 'family') {
      res.status(403).json({
        error: 'Remote Family Member role has View-Only access to daily routine execution.',
      });
      return;
    }
    const item = dbState.dailyRoutine.find((r) => r.id === id);
    if (!item) {
      res.status(404).json({ error: 'Routine item not found' });
      return;
    }
    item.completed = !item.completed;
    if (item.completed) {
      item.completedAt = new Date().toTimeString().slice(0, 5);
      item.completedBy = actorName || 'Smt. Kamala Deshmukh';
      if (valueRecorded) item.valueRecorded = valueRecorded;
    } else {
      item.completedAt = undefined;
      item.completedBy = undefined;
    }
    addActivityLog(
      actorName || 'Smt. Kamala Deshmukh',
      actorRole || 'elderly',
      `${item.completed ? 'Completed' : 'Unchecked'} Daily Health Routine`,
      'profile',
      `${item.title} (${item.time}) marked ${item.completed ? 'complete' : 'incomplete'}.`
    );
    saveAndBroadcast();
    res.json(item);
  });

  // Caregiver Quick Vitals Logger (BP, Fasting/PP Blood Sugar, SpO2, Pulse/Temp)
  app.post('/api/caregiver/vitals', (req: Request, res: Response) => {
    const { actorName, actorRole, vitalType, readingValue, clinicalNote, notifyFamily } = req.body as {
      actorName?: string;
      actorRole?: ActivityLogEntry['actorRole'];
      vitalType: string;
      readingValue: string;
      clinicalNote?: string;
      notifyFamily?: boolean;
    };

    if (actorRole !== 'caretaker') {
      res.status(403).json({
        error: 'Only the PIN-authenticated Caregiver Nurse can log clinical vitals.',
      });
      return;
    }

    const nowTime = new Date().toTimeString().slice(0, 5);
    const newRoutineItem = {
      id: `rt-vital-${Date.now()}`,
      time: nowTime,
      title: `${vitalType}: ${readingValue}${clinicalNote ? ` (${clinicalNote})` : ''}`,
      category: 'Vitals' as const,
      completed: true,
      completedAt: nowTime,
      completedBy: actorName || 'Sister Priya Nair, RN',
      valueRecorded: readingValue,
    };

    dbState.dailyRoutine.unshift(newRoutineItem);

    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      'caretaker',
      `Recorded Clinical Vital (${vitalType})`,
      'profile',
      `Logged ${vitalType} = ${readingValue}${clinicalNote ? ` — Note: ${clinicalNote}` : ''}.`
    );

    if (notifyFamily) {
      dispatchEmailNotification(
        'upcoming_dose',
        `[OJAS CAREGIVER VITALS UPDATE] ${vitalType}: ${readingValue}`,
        `Caregiver ${actorName || 'Sister Priya Nair, RN'} recorded a new vital reading for ${dbState.patient.fullName} at ${nowTime}:\n• ${vitalType}: ${readingValue}\n${clinicalNote ? `• Clinical Observation: ${clinicalNote}` : ''}`
      );
    }

    saveAndBroadcast();
    res.json({ success: true, item: newRoutineItem });
  });

  // Emergency SOS Trigger
  app.post('/api/sos', (req: Request, res: Response) => {
    const { actorName, message, locationNote } = req.body;
    const emailLog = dispatchEmailNotification(
      'sos_emergency',
      `[URGENT SOS ALERT] Emergency Assistance Requested by ${dbState.patient.fullName}`,
      `EMERGENCY SOS TRIGGERED AT ${nowFormatted()}!\nPatient: ${dbState.patient.fullName} (Age ${dbState.patient.age}, Blood Group ${dbState.patient.bloodGroup})\nAddress: ${dbState.patient.address}\nNote: ${message || 'Immediate assistance requested via One-Tap Emergency SOS.'}\nLocation context: ${locationNote || 'Pune Residence'}\nAllergies: ${dbState.patient.allergies.join(', ')}\nEmergency Contacts Notified: ${dbState.patient.emergencyContacts.map((c) => `${c.name} (${c.phone})`).join(', ')}`
    );
    dbState.hardware.buzzerActive = true;
    dbState.hardware.voicePromptActive = true;
    addActivityLog(
      actorName || dbState.patient.fullName,
      'elderly',
      'TRIGGERED EMERGENCY SOS ALERT',
      'emergency',
      `High-priority SOS broadcast sent to all emergency contacts & caretakers (${emailLog.recipients.join(', ')}).`
    );
    saveAndBroadcast();
    res.json({ success: true, emailLog });
  });

  // Notification settings & manual reminder dispatch
  app.put('/api/notifications/settings', (req: Request, res: Response) => {
    const { actorName, actorRole, settings } = req.body;
    dbState.notificationSettings = {
      ...dbState.notificationSettings,
      ...settings,
    };
    addActivityLog(
      actorName || 'Rohan Deshmukh',
      actorRole || 'family',
      'Updated Smart Notification Rules',
      'security',
      `Updated email reminder frequency (${dbState.notificationSettings.reminderFrequency}) and escalation settings.`
    );
    saveAndBroadcast();
    res.json(dbState.notificationSettings);
  });

  app.post('/api/notifications/send-reminder', (req: Request, res: Response) => {
    const { type, subject, body, recipients, actorName, actorRole } = req.body;
    const log = dispatchEmailNotification(
      type || 'upcoming_dose',
      subject || `[CAREBRIDGE REMINDER] Medication & Health Check for ${dbState.patient.fullName}`,
      body || `Friendly reminder to review upcoming doses for ${dbState.patient.fullName}.`,
      recipients
    );
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Dispatched Automated Email Alert',
      'medication',
      `Sent "${log.subject}" to ${log.recipients.join(', ')}.`
    );
    saveAndBroadcast();
    res.json(log);
  });

  const handleAcknowledgeNotification = (req: Request, res: Response) => {
    const { id } = req.params;
    const { actorName, actorRole } = req.body || {};
    const email = dbState.emailLogs.find((e) => e.id === id);
    if (!email) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    email.acknowledged = true;
    addActivityLog(
      actorName || 'Sister Priya Nair, RN',
      actorRole || 'caretaker',
      'Acknowledged Escalation / Alert',
      'medication',
      `Acknowledged notification: "${email.subject}".`
    );
    saveAndBroadcast();
    res.json(email);
  };

  app.post('/api/notifications/:id/acknowledge', handleAcknowledgeNotification);
  app.post('/api/notifications/:id/ack', handleAcknowledgeNotification);

  // ESP32 Smart Pillbox Hardware Integration Endpoints
  app.post('/api/hardware/sync', (req: Request, res: Response) => {
    const { action, compartmentNumber, actorName, actorRole } = req.body as {
      action: 'trigger_alarm' | 'physical_button_confirm' | 'scan_nfc' | 'silence_alarm' | 'ping_sync' | 'toggle_door';
      compartmentNumber?: number;
      actorName?: string;
      actorRole?: string;
    };

    if (actorRole === 'family' && action === 'physical_button_confirm') {
      res.status(403).json({
        error: 'Remote Family Member cannot press the physical ESP32 pillbox button.',
      });
      return;
    }

    dbState.hardware.lastSyncAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (action === 'toggle_door') {
      dbState.hardware.doorOpen = !dbState.hardware.doorOpen;
      const statusLabel = dbState.hardware.doorOpen ? 'DOOR OPEN (ALERT)' : 'DOOR CLOSED (SECURE)';
      addActivityLog(
        'ESP32 Reed Switch Sensor',
        'hardware',
        `Smart Pillbox Lid Sensor: ${statusLabel}`,
        'hardware',
        `Magnetic sensor triggered: Smart Pillbox compartment lid is now ${dbState.hardware.doorOpen ? 'OPEN. Sensor alert active.' : 'CLOSED securely.'}`
      );
    } else if (action === 'trigger_alarm') {
      const slotNum = compartmentNumber || 3;
      dbState.hardware.activeSlotLed = slotNum;
      dbState.hardware.buzzerActive = true;
      dbState.hardware.voicePromptActive = true;
      addActivityLog(
        'ESP32 Smart Pillbox',
        'hardware',
        `Activated Slot #${slotNum} LED & Voice Alert`,
        'hardware',
        `Hardware box illuminated Compartment #${slotNum} LED and started audio reminder.`
      );
    } else if (action === 'physical_button_confirm') {
      const slotNum = compartmentNumber || dbState.hardware.activeSlotLed || 3;
      const med = dbState.medications.find((m) => m.compartmentNumber === slotNum) || dbState.medications[0];
      if (med) {
        const targetSlot =
          med.dailySchedule.find((s) => s.status === 'pending' || s.status === 'missed') ||
          med.dailySchedule[0];
        if (targetSlot) {
          targetSlot.status = 'taken';
          targetSlot.acknowledgedAt = new Date().toTimeString().slice(0, 5);
          targetSlot.acknowledgedBy = `${actorName || dbState.patient.fullName} (ESP32 Button)`;
          targetSlot.escalated = false;
          if (med.stockCount > 0) med.stockCount -= 1;
        }
        dbState.hardware.lastScannedQrOrNfc = med.nfcTagId;
      }
      dbState.hardware.activeSlotLed = null;
      dbState.hardware.buzzerActive = false;
      dbState.hardware.voicePromptActive = false;
      dbState.hardware.lastPhysicalButtonPressAt = dbState.hardware.lastSyncAt;
      addActivityLog(
        actorName || dbState.patient.fullName,
        'hardware',
        'Physical Pillbox Intake Button Pressed',
        'hardware',
        `ESP32 Compartment #${slotNum} intake confirmed via physical hardware switch.`
      );
    } else if (action === 'scan_nfc') {
      const slotNum = compartmentNumber || 1;
      const med = dbState.medications.find((m) => m.compartmentNumber === slotNum);
      if (med) {
        dbState.hardware.lastScannedQrOrNfc = med.nfcTagId;
        addActivityLog(
          'ESP32 NFC Reader',
          'hardware',
          `Verified NFC Tag ${med.nfcTagId}`,
          'hardware',
          `Authenticated strip for ${med.name} (${med.dosage}) in Compartment #${slotNum}.`
        );
      }
    } else if (action === 'silence_alarm') {
      dbState.hardware.buzzerActive = false;
      dbState.hardware.voicePromptActive = false;
      dbState.hardware.activeSlotLed = null;
    }

    saveAndBroadcast();
    res.json(dbState.hardware);
  });

  // Direct Caregiver Sharing to Primary Doctor's Office via Email / Template
  app.post('/api/doctor/share-report', (req: Request, res: Response) => {
    const { customNote, includeVitals, includeAdherence, includeNotes, actorName } = req.body as {
      customNote?: string;
      includeVitals?: boolean;
      includeAdherence?: boolean;
      includeNotes?: boolean;
      actorName?: string;
    };

    const doc = dbState.patient.primaryDoctor;
    const totalSlots = dbState.medications.flatMap((m) => m.dailySchedule);
    const takenSlots = totalSlots.filter((s) => s.status === 'taken').length;
    const adherenceRate = totalSlots.length > 0 ? Math.round((takenSlots / totalSlots.length) * 100) : 100;

    const emailSubject = `[CLINICAL REPORT] ${dbState.patient.fullName} (Age ${dbState.patient.age}) - Routine & Adherence Summary`;
    
    let reportBody = `CLINICAL DISPATCH TO PRIMARY PHYSICIAN\n`;
    reportBody += `==========================================\n`;
    reportBody += `Recipient Doctor: ${doc.name} (${doc.specialty})\n`;
    reportBody += `Hospital / Clinic: ${doc.hospital}\n`;
    reportBody += `Patient: ${dbState.patient.fullName} (Age ${dbState.patient.age}, Blood Group: ${dbState.patient.bloodGroup})\n`;
    reportBody += `Generated by Caregiver: ${actorName || 'Sister Priya Sharma, RN'}\n`;
    reportBody += `Timestamp: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\n`;

    if (includeAdherence !== false) {
      reportBody += `MEDICATION ADHERENCE SUMMARY (Score: ${adherenceRate}%)\n`;
      reportBody += `------------------------------------------\n`;
      dbState.medications.forEach((med) => {
        reportBody += `* ${med.name} (${med.dosage}) - ${med.frequency} (Compartment #${med.compartmentNumber})\n`;
        med.dailySchedule.forEach((s) => {
          reportBody += `  - Slot ${s.scheduledTime}: ${s.status.toUpperCase()}${s.acknowledgedAt ? ` at ${s.acknowledgedAt}` : ''}\n`;
        });
      });
      reportBody += `\n`;
    }

    if (includeVitals !== false) {
      reportBody += `PATIENT VITAL SIGNS & PHYSICAL METRICS\n`;
      reportBody += `------------------------------------------\n`;
      reportBody += `* Blood Pressure (BP): 126/78 mmHg (Normal Range)\n`;
      reportBody += `* Blood Sugar (Fasting): 112 mg/dL\n`;
      reportBody += `* Pulse Rate: 72 bpm (Resting)\n`;
      reportBody += `* SpO2: 98% on room air\n`;
      reportBody += `* Weight: ${dbState.patient.weightKg} kg, Height: ${dbState.patient.heightCm} cm\n\n`;
    }

    if (includeNotes !== false) {
      const slotsWithNotes = totalSlots.filter((s) => s.notes);
      reportBody += `CAREGIVER OBSERVATIONAL NOTES LOG\n`;
      reportBody += `------------------------------------------\n`;
      if (slotsWithNotes.length > 0) {
        slotsWithNotes.forEach((s) => {
          reportBody += `* [Slot ${s.scheduledTime}] Note: "${s.notes}"\n`;
        });
      } else {
        reportBody += `* All doses confirmed without acute adverse side effects.\n`;
      }
      reportBody += `\n`;
    }

    if (customNote && customNote.trim()) {
      reportBody += `DIRECT CAREGIVER REMARKS FOR DOCTOR\n`;
      reportBody += `------------------------------------------\n`;
      reportBody += `${customNote.trim()}\n\n`;
    }

    const email: EmailNotificationLog = {
      id: `doc-${Date.now()}`,
      timestamp: nowFormatted(),
      type: 'escalation_alert',
      subject: emailSubject,
      recipients: [doc.email, 'clinic.desk@sahyadrihospitals.com'],
      body: reportBody,
      deliveryStatus: 'delivered',
      acknowledged: true,
    };

    dbState.emailLogs.unshift(email);

    addActivityLog(
      actorName || 'Sister Priya Sharma, RN',
      'caretaker',
      'Shared Clinical Report with Doctor',
      'profile',
      `Transmitted digital health & adherence report directly to ${doc.name} (${doc.email}).`
    );

    saveAndBroadcast();
    res.json({ success: true, email, formattedBody: reportBody });
  });

  // Instant WhatsApp / SMS Dispatch Simulator for Family & Caregiver
  app.post('/api/notifications/whatsapp-dispatch', (req: Request, res: Response) => {
    const { recipientPhone, messageType, customText, actorName } = req.body as {
      recipientPhone?: string;
      messageType: 'missed_dose' | 'routine_update' | 'sos' | 'refill_order';
      customText?: string;
      actorName?: string;
    };

    const targetPhone = recipientPhone || '+91 98201 99882 (Family Rohan Deshmukh)';
    const formattedMsg = customText || `[CAREBRIDGE UPDATE] Patient ${dbState.patient.fullName}: Routine status update confirmed by ${actorName || 'Caregiver Priya'}. All morning vitals normal.`;

    addActivityLog(
      actorName || 'Sister Priya Sharma, RN',
      'caretaker',
      `Sent WhatsApp/SMS Alert`,
      'emergency',
      `Dispatched instant WhatsApp alert to ${targetPhone}: "${formattedMsg.slice(0, 80)}..."`
    );

    saveAndBroadcast();
    res.json({
      success: true,
      deliveredTo: targetPhone,
      protocol: 'WhatsApp Business API (Simulated)',
      timestamp: new Date().toISOString(),
      message: formattedMsg,
    });
  });

  // ============================================================================
  // SERVER-SIDE GEMINI AI ENDPOINTS (@google/genai)
  // ============================================================================

  // 1. Medicine Interaction, Allergy & Duplicate Therapy Checker
  app.post('/api/ai/interaction-check', async (req: Request, res: Response) => {
    try {
      const { candidateMedication } = req.body as { candidateMedication?: string };
      const ai = getGeminiClient();

      const medSummary = dbState.medications
        .map((m) => `- ${m.name} (${m.genericName}), ${m.dosage}, ${m.frequency} for ${m.purpose}`)
        .join('\n');

      const prompt = `Analyze the following Indian elderly patient's active medication regimen, allergies, and health conditions for drug-drug interactions, duplicate therapy warnings, and allergy/condition contraindications.
Patient: ${dbState.patient.fullName}, Age ${dbState.patient.age} (Pune, India)
Conditions: ${dbState.patient.conditions.join(', ')}
Allergies: ${dbState.patient.allergies.join(', ')}
Restrictions: ${dbState.patient.medicationRestrictions.join('; ')}
Active Medications:
${medSummary}
${candidateMedication ? `\nCandidate New Medication to Check: ${candidateMedication}` : ''}

Return a clinical yet easy-to-understand JSON array of warnings/observations.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: {
                  type: Type.STRING,
                  description: 'high, moderate, or low',
                },
                title: {
                  type: Type.STRING,
                  description: 'Concise warning title',
                },
                medicationsInvolved: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Clear clinical explanation for patient and caretaker',
                },
                recommendation: {
                  type: Type.STRING,
                  description: 'Actionable safety recommendation',
                },
              },
              required: ['severity', 'title', 'medicationsInvolved', 'explanation', 'recommendation'],
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '[]').trim());
      res.json({ warnings: parsed });
    } catch (error) {
      console.error('Gemini interaction-check error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to run AI interaction check.',
      });
    }
  });

  // 2. AI Weekly Health & Adherence Summary Generator
  app.post('/api/ai/weekly-summary', async (_req: Request, res: Response) => {
    try {
      const ai = getGeminiClient();
      const totalSlots = dbState.medications.reduce((acc, m) => acc + m.dailySchedule.length, 0);
      const takenSlots = dbState.medications.reduce(
        (acc, m) => acc + m.dailySchedule.filter((s) => s.status === 'taken').length,
        0
      );
      const missedSlots = dbState.medications.reduce(
        (acc, m) => acc + m.dailySchedule.filter((s) => s.status === 'missed').length,
        0
      );

      const prompt = `Generate a structured weekly healthcare & adherence summary for Indian elderly patient ${dbState.patient.fullName} (Age ${dbState.patient.age}, Pune) to be shared with her son (Rohan Deshmukh) and caretaker nurse (Sister Priya Nair, RN).
Current Today Snapshot: ${takenSlots}/${totalSlots} doses taken, ${missedSlots} missed.
Medications: ${dbState.medications.map((m) => `${m.name} ${m.dosage} (Stock: ${m.stockCount})`).join(', ')}
Routine Vitals Today: ${dbState.dailyRoutine.map((r) => `${r.title}: ${r.completed ? r.valueRecorded || 'Completed' : 'Pending'}`).join('; ')}
Upcoming Appointments: ${dbState.appointments.filter((a) => a.status === 'upcoming').map((a) => `${a.doctorName} on ${a.date}`).join(', ')}

Provide a warm, medically grounded summary in JSON format.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              adherenceAssessment: { type: Type.STRING },
              vitalsAndRoutineHighlights: { type: Type.STRING },
              attentionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              caretakerNextSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: [
              'headline',
              'adherenceAssessment',
              'vitalsAndRoutineHighlights',
              'attentionItems',
              'caretakerNextSteps',
            ],
          },
        },
      });

      const summary = JSON.parse((response.text ?? '{}').trim());
      res.json(summary);
    } catch (error) {
      console.error('Gemini weekly-summary error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate AI weekly summary.',
      });
    }
  });

  // 3. AI Medication Schedule Assistant & Prescription Scanner
  app.post('/api/ai/schedule-assistant', async (req: Request, res: Response) => {
    try {
      const { userMessage, imageBase64, imageMimeType } = req.body as {
        userMessage: string;
        imageBase64?: string;
        imageMimeType?: string;
      };
      const ai = getGeminiClient();

      const contextText = `You are the CareBridge India AI Medication Schedule Assistant supporting elderly patient ${dbState.patient.fullName} (Age ${dbState.patient.age}, Pune), her nurse caretaker Sister Priya Nair, and her son Rohan Deshmukh.
Patient Conditions: ${dbState.patient.conditions.join(', ')}
Allergies: ${dbState.patient.allergies.join(', ')}
Restrictions: ${dbState.patient.medicationRestrictions.join('; ')}
Current Medications: ${dbState.medications.map((m) => `${m.name} ${m.dosage} (${m.frequency} at ${m.dailySchedule.map((s) => s.scheduledTime).join(', ')})`).join('; ')}

User Request: ${userMessage || 'Analyze this prescription image and suggest a safe daily schedule around Indian meal timings (Morning Nashta, Afternoon Lunch, Night Dinner).'}

Respond with helpful, empathetic, large-print-friendly advice AND if a medication is being scheduled or extracted from a prescription, include structured suggestedMedication details.`;

      const parts: any[] = [];
      if (imageBase64 && imageMimeType) {
        parts.push({
          inlineData: {
            mimeType: imageMimeType,
            data: imageBase64,
          },
        });
      }
      parts.push({ text: contextText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenReply: {
                type: Type.STRING,
                description: 'Clear, comforting response suitable for reading aloud to an Indian elderly patient.',
              },
              clinicalNotes: {
                type: Type.STRING,
                description: 'Timing rationale, Indian meal pairing advice, and interaction notes.',
              },
              hasSuggestedMedication: {
                type: Type.BOOLEAN,
              },
              suggestedMedication: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  dosage: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  instructions: { type: Type.STRING },
                  purpose: { type: Type.STRING },
                  scheduledTimes: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['name', 'dosage', 'frequency', 'duration', 'instructions', 'purpose', 'scheduledTimes'],
              },
            },
            required: ['spokenReply', 'clinicalNotes', 'hasSuggestedMedication'],
          },
        },
      });

      const result = JSON.parse((response.text ?? '{}').trim());
      res.json(result);
    } catch (error) {
      console.error('Gemini schedule-assistant error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'AI Schedule Assistant encountered an error.',
      });
    }
  });

  // 4. Multilingual Indian Speech Synthesis Endpoint (Supports mr, ta, kn, bn, hi, ml, te, gu, pa, en)
  app.post('/api/ai/tts', async (req: Request, res: Response) => {
    try {
      const { text, languageName, speechLang, langCode } = req.body as {
        text: string;
        languageName?: string;
        speechLang?: string;
        langCode?: string;
      };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required for speech synthesis.' });
        return;
      }

      const tlCode = (
        langCode ||
        (speechLang ? speechLang.split('-')[0] : 'en')
      ).toLowerCase();

      let spokenText = text.trim();

      // If a non-English Indian language is selected (e.g. Marathi, Tamil, Kannada, Bengali)
      // and the caller passed an English-only string, translate it into native script first.
      if (tlCode !== 'en' && !/[^\u0000-\u007F]/.test(spokenText)) {
        try {
          const ai = getGeminiClient();
          const trResp = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Translate the following healthcare instruction for an elderly Indian patient into natural spoken ${
              languageName || tlCode
            } written strictly in its native Indian script (transliterate medicine brand names into native script as well, and output ONLY the translated sentence with no quotes): ${spokenText}`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            },
          });
          if (trResp.text && trResp.text.trim()) {
            spokenText = trResp.text.trim();
          }
        } catch {
          // Continue with original text if translation is unavailable
        }
      }

      // Split text into <= 140 character sentence chunks so regional TTS never truncates or returns 400
      const rawSentences = spokenText.split(/(?<=[।.!?;\n])\s+/);
      const chunks: string[] = [];
      const maxLen = 140;
      for (const sentence of rawSentences) {
        if (sentence.length <= maxLen) {
          if (sentence.trim()) chunks.push(sentence.trim());
        } else {
          const words = sentence.split(/\s+/);
          let current = '';
          for (const word of words) {
            if ((current + ' ' + word).trim().length <= maxLen) {
              current = (current + ' ' + word).trim();
            } else {
              if (current) chunks.push(current);
              current = word;
            }
          }
          if (current) chunks.push(current);
        }
      }

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks.filter(Boolean)) {
        const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
          chunk
        )}&tl=${encodeURIComponent(tlCode)}&client=gtx`;
        const ttsRes = await fetch(ttsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
          },
        });
        if (ttsRes.ok) {
          const arrBuf = await ttsRes.arrayBuffer();
          if (arrBuf.byteLength > 0) {
            audioBuffers.push(Buffer.from(arrBuf));
          }
        }
      }

      if (audioBuffers.length > 0) {
        const combinedMp3 = Buffer.concat(audioBuffers).toString('base64');
        res.json({
          audioBase64: combinedMp3,
          audioWavBase64: combinedMp3,
          mimeType: 'audio/mpeg',
          spokenText,
        });
        return;
      }

      res.status(200).json({ audioBase64: null, audioWavBase64: null, fallback: true });
    } catch (error) {
      res.status(200).json({
        audioBase64: null,
        audioWavBase64: null,
        fallback: true,
        reason: error instanceof Error ? error.message : 'TTS fallback active',
      });
    }
  });

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
