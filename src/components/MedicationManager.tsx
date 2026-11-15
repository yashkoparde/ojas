import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  CheckCircle2,
  PackagePlus,
  Trash2,
  Edit3,
  Volume2,
  Upload,
  ShieldAlert,
  Sparkles,
  Lock,
  AlertTriangle,
  Camera,
  Eye,
  X,
  Clock,
  FileText,
} from 'lucide-react';
import type {
  Medication,
  AuthorizedMember,
  InteractionWarning,
  MedicationDoseSlot,
} from '../types';
import {
  type LanguageCode,
  buildLocalizedDoseSpeech,
  buildLocalizedInteractionAlertSpeech,
  getMedicationThumbnailUrl,
} from '../i18n';

interface MedicationManagerProps {
  lang?: LanguageCode;
  medications: Medication[];
  members: AuthorizedMember[];
  currentMember: AuthorizedMember;
  onDoseAction: (
    medId: string,
    slotId: string,
    status: 'pending' | 'taken' | 'missed' | 'skipped',
    notes?: string
  ) => Promise<void>;
  onUpdateDoseNotes?: (
    medId: string,
    slotId: string,
    notes: string
  ) => Promise<void>;
  recentlyConfirmedSlotId?: string | null;
  onAddMedication: (med: Partial<Medication>) => Promise<void>;
  onUpdateMedication: (medId: string, updates: Partial<Medication>) => Promise<void>;
  onDeleteMedication: (medId: string) => Promise<void>;
  onRefillMedication: (medId: string, addedQuantity: number) => Promise<void>;
  onSpeakText: (text: string) => void;
}

/**
 * Compares all medications currently in the patient's active schedule
 * (plus an optional candidate medicine) to detect known negative
 * drug-drug interactions, duplicate therapy classes, or close timing conflicts.
 */
function analyzeScheduleInteractions(
  medications: Medication[],
  candidateMedication?: string
): InteractionWarning[] {
  const detected: InteractionWarning[] = [];
  if (medications.length < 2 && !candidateMedication?.trim()) {
    return detected;
  }

  const allItems = [
    ...medications.map((m) => ({
      displayName: m.name,
      searchBlob: `${m.name} ${m.genericName} ${m.purpose} ${m.instructions}`.toLowerCase(),
      times: m.dailySchedule.map((s) => s.scheduledTime),
    })),
    ...(candidateMedication?.trim()
      ? [
          {
            displayName: candidateMedication.trim(),
            searchBlob: candidateMedication.trim().toLowerCase(),
            times: [] as string[],
          },
        ]
      : []),
  ];

  const findMatchingMeds = (keywords: string[]) =>
    allItems.filter((item) => keywords.some((kw) => item.searchBlob.includes(kw)));

  // 1. Anticoagulant / Blood Thinner + NSAID / Painkiller / Antiplatelet (High Severity Bleeding Risk)
  const anticoagulants = findMatchingMeds([
    'apixaban',
    'eliquis',
    'warfarin',
    'acitrom',
    'rivaroxaban',
    'xarelto',
    'dabigatran',
  ]);
  const nsaidsOrAntiplatelets = findMatchingMeds([
    'combiflam',
    'ibuprofen',
    'brufen',
    'diclofenac',
    'voveran',
    'aspirin',
    'ecosprin',
    'clopidogrel',
    'naproxen',
    'aceclofenac',
    'zerodol',
  ]);
  if (anticoagulants.length > 0 && nsaidsOrAntiplatelets.length > 0) {
    const involved = Array.from(
      new Set([
        ...anticoagulants.map((m) => m.displayName),
        ...nsaidsOrAntiplatelets.map((m) => m.displayName),
      ])
    );
    if (involved.length >= 2) {
      detected.push({
        severity: 'high',
        title: 'Severe Bleeding Risk: Anticoagulant + NSAID / Antiplatelet',
        medicationsInvolved: involved,
        explanation:
          'Combining an oral blood thinner (such as Apixaban / Eliquis) with NSAID painkillers or antiplatelets significantly increases the risk of gastrointestinal and internal bleeding in elderly patients.',
        recommendation:
          'Avoid NSAID painkillers (Combiflam, Brufen, Diclofenac, Aspirin). Consult Dr. Rajesh Kulkarni for safe paracetamol-based pain relief if needed.',
      });
    }
  }

  // 2. Apixaban / Anticoagulant + Atorvastatin / Statin (CYP3A4 & P-gp Metabolic Overlap)
  const statins = findMatchingMeds([
    'atorvastatin',
    'atorva',
    'rosuvastatin',
    'rosuvas',
    'simvastatin',
  ]);
  if (anticoagulants.length > 0 && statins.length > 0) {
    const involved = Array.from(
      new Set([...anticoagulants.map((m) => m.displayName), ...statins.map((m) => m.displayName)])
    );
    if (involved.length >= 2) {
      detected.push({
        severity: 'moderate',
        title: 'Hepatic CYP3A4 & P-gp Pathway Interaction',
        medicationsInvolved: involved,
        explanation:
          'Both Apixaban (Eliquis) and Atorvastatin (Atorva) share hepatic CYP3A4 and P-glycoprotein transport pathways. In elderly patients (76 yrs), co-administration can mildly increase anticoagulant exposure or muscle fatigue.',
        recommendation:
          'Keep doses separated (Eliquis in morning/afternoon; Atorva 20 strictly at 21:30 bedtime) and watch for unusual gum bleeding, bruising, or calf soreness.',
      });
    }
  }

  // 3. Telmisartan (ARB Antihypertensive) + Metformin / Glimepiride (Antidiabetic)
  const antihypertensives = findMatchingMeds([
    'telmisartan',
    'telma',
    'losartan',
    'ramipril',
    'amlodipine',
    'stamlo',
    'metoprolol',
  ]);
  const antidiabetics = findMatchingMeds([
    'metformin',
    'glycomet',
    'glimepiride',
    'amaryl',
    'gliclazide',
    'insulin',
    'sitagliptin',
    'janumet',
  ]);
  if (antihypertensives.length > 0 && antidiabetics.length > 0) {
    const involved = Array.from(
      new Set([
        ...antihypertensives.map((m) => m.displayName),
        ...antidiabetics.map((m) => m.displayName),
      ])
    );
    if (involved.length >= 2) {
      detected.push({
        severity: 'moderate',
        title: 'Hypoglycemia & Renal Clearance Watch (ARB + Antidiabetic)',
        medicationsInvolved: involved,
        explanation:
          'Co-administration of Telmisartan (Telma 40) with oral diabetes therapy (Glycomet-GP 1) can enhance insulin sensitivity and lower morning blood sugar or blood pressure if breakfast is delayed.',
        recommendation:
          'Ensure Smt. Kamala Deshmukh eats morning breakfast (Poha/Upma) within 25–30 minutes of Telma 40 before taking Glycomet-GP 1, and monitor renal function (Serum Creatinine & Potassium) every 6 months.',
      });
    }
  }

  // 4. Duplicate Therapeutic Class Check (2+ medicines in the same class)
  if (antihypertensives.length >= 2) {
    detected.push({
      severity: 'moderate',
      title: 'Additive Blood Pressure Lowering (Multiple Antihypertensives)',
      medicationsInvolved: antihypertensives.map((m) => m.displayName),
      explanation:
        'Two or more blood pressure medications are active in the schedule, which can cause postural hypotension (dizziness when standing up quickly).',
      recommendation:
        'Check sitting and standing blood pressure daily and advise the patient to sit on the bed edge for 1 minute before standing.',
    });
  }

  if (antidiabetics.length >= 2) {
    detected.push({
      severity: 'high',
      title: 'Duplicate Antidiabetic Therapy (Low Blood Sugar Alert)',
      medicationsInvolved: antidiabetics.map((m) => m.displayName),
      explanation:
        'Multiple blood-sugar-lowering medications are scheduled concurrently, increasing the risk of hypoglycemic episodes (sweating, shakiness, confusion).',
      recommendation:
        'Verify fasting blood sugar before morning administration and keep glucose tablets or sugar water accessible.',
    });
  }

  // 5. Morning Polypharmacy Time-Window Clustering Check
  const morningMeds = medications.filter((m) =>
    m.dailySchedule.some((s) => {
      const hour = parseInt(s.scheduledTime.split(':')[0], 10);
      return hour >= 7 && hour <= 9;
    })
  );
  if (morningMeds.length >= 3) {
    detected.push({
      severity: 'low',
      title: 'Morning Schedule Clustering (Gastric Tolerance & Absorption)',
      medicationsInvolved: morningMeds.map((m) => m.name),
      explanation: `${morningMeds.length} medications (${morningMeds
        .map((m) => m.name)
        .join(', ')}) are scheduled between 07:00 and 09:00. Taking multiple tablets simultaneously on an empty stomach can cause gastric irritation or variable absorption.`,
      recommendation:
        'Maintain the staggered 30-minute morning intervals (08:00 pre-breakfast, 08:30 post-nashta, 09:00 with water).',
    });
  }

  return detected;
}

export const MedicationManager: React.FC<MedicationManagerProps> = ({
  lang = 'en',
  medications,
  members,
  currentMember,
  onDoseAction,
  onUpdateDoseNotes,
  recentlyConfirmedSlotId,
  onAddMedication,
  onUpdateMedication,
  onDeleteMedication,
  onRefillMedication,
  onSpeakText,
}) => {
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'missed'>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Dose Confirmation Feedback Animation & Notes
  const [localConfirmedSlotId, setLocalConfirmedSlotId] = useState<string | null>(null);
  const [editingNoteSlotId, setEditingNoteSlotId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  const activeConfirmedSlotId = recentlyConfirmedSlotId || localConfirmedSlotId;

  const handleConfirmDoseWithAnimation = async (medId: string, slotId: string) => {
    setLocalConfirmedSlotId(slotId);
    setTimeout(() => {
      setLocalConfirmedSlotId((prev) => (prev === slotId ? null : prev));
    }, 2600);
    await onDoseAction(medId, slotId, 'taken');
  };

  const handleSaveNote = async (medId: string, slotId: string, noteText: string) => {
    if (onUpdateDoseNotes) {
      await onUpdateDoseNotes(medId, slotId, noteText);
    } else {
      await fetch(`/api/medications/${medId}/dose/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          notes: noteText,
          actorName: currentMember.name,
          actorRole: currentMember.role,
        }),
      });
    }
    setEditingNoteSlotId(null);
  };

  // Form states (Indian clinical defaults)
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once Daily');
  const [duration, setDuration] = useState('30 Days');
  const [instructions, setInstructions] = useState('');
  const [purpose, setPurpose] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('Dr. Rajesh Kulkarni, MD, DM');
  const [assignedCaretakerId, setAssignedCaretakerId] = useState('mem-caretaker-1');
  const [stockCount, setStockCount] = useState(30);
  const [refillThreshold, setRefillThreshold] = useState(7);
  const [compartmentNumber, setCompartmentNumber] = useState(5);
  const [scheduleTimesText, setScheduleTimesText] = useState('08:30');
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState<string | undefined>(undefined);
  const [bottleOrStripImageUrl, setBottleOrStripImageUrl] = useState<string | undefined>(undefined);

  // Enlarged photo modal for elderly visual identification
  const [enlargedPhotoMed, setEnlargedPhotoMed] = useState<{
    medName: string;
    dosage: string;
    compartmentNumber: number;
    instructions: string;
    imageUrl: string;
  } | null>(null);

  // AI Interaction Checker state (supplements automatic schedule interaction checker)
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [aiWarnings, setAiWarnings] = useState<InteractionWarning[]>([]);
  const [candidateDrug, setCandidateDrug] = useState('');
  const [interactionError, setInteractionError] = useState<string | null>(null);

  // Automatic real-time interaction analysis of the patient's current medication schedule
  const scheduleWarnings = useMemo(
    () => analyzeScheduleInteractions(medications, candidateDrug),
    [medications, candidateDrug]
  );

  // Combined warnings (AI warnings if run, otherwise automatic schedule interaction warnings)
  const activeWarnings: InteractionWarning[] = useMemo(() => {
    if (aiWarnings.length > 0) {
      const existingTitles = new Set(aiWarnings.map((w) => w.title.toLowerCase()));
      const extraLocal = scheduleWarnings.filter(
        (w) => !existingTitles.has(w.title.toLowerCase())
      );
      return [...aiWarnings, ...extraLocal];
    }
    return scheduleWarnings;
  }, [aiWarnings, scheduleWarnings]);

  // Chronological Daily Medication Timeline across all scheduled medications
  const dailyTimeline = useMemo(
    () =>
      medications
        .flatMap((med) =>
          med.dailySchedule.map((slot) => ({
            med,
            slot,
            thumbnailUrl: getMedicationThumbnailUrl(med),
          }))
        )
        .sort((a, b) => a.slot.scheduledTime.localeCompare(b.slot.scheduledTime)),
    [medications]
  );

  // Strict Role & Patient-Consent Permissions:
  // 1. Elderly users cannot modify clinical medication prescriptions (canAdd/canEdit/canDelete = false).
  // 2. Family members and Caregivers have read-only or restricted-write access unless authorized by the elderly patient.
  const isAuthorizedByPatient =
    currentMember.role !== 'elderly' &&
    currentMember.status === 'active' &&
    currentMember.consentGrantedByPatient;

  const canAdd = isAuthorizedByPatient && currentMember.permissions.canAdd;
  const canEdit = isAuthorizedByPatient && currentMember.permissions.canEdit;
  const canDelete = isAuthorizedByPatient && currentMember.permissions.canDelete;
  const canConfirmPhysicalDose =
    currentMember.role === 'elderly' ||
    (currentMember.role === 'caretaker' && isAuthorizedByPatient) ||
    (currentMember.role === 'family' && isAuthorizedByPatient && currentMember.permissions.canEdit);

  const filteredMedications = medications.filter((m) => {
    if (filter === 'low_stock') return m.stockCount <= m.refillThreshold;
    if (filter === 'missed') return m.dailySchedule.some((s) => s.status === 'missed');
    return true;
  });

  const resetForm = () => {
    setName('');
    setGenericName('');
    setDosage('');
    setFrequency('Once Daily');
    setDuration('30 Days');
    setInstructions('');
    setPurpose('');
    setStockCount(30);
    setRefillThreshold(7);
    setCompartmentNumber((medications.length % 6) + 1);
    setScheduleTimesText('08:30');
    setPrescriptionImageUrl(undefined);
    setBottleOrStripImageUrl(undefined);
    setEditingMedId(null);
    setShowAddForm(false);
  };

  const startEdit = (med: Medication) => {
    setEditingMedId(med.id);
    setName(med.name);
    setGenericName(med.genericName);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setDuration(med.duration);
    setInstructions(med.instructions);
    setPurpose(med.purpose);
    setPrescribedBy(med.prescribedBy);
    setAssignedCaretakerId(med.assignedCaretakerId);
    setStockCount(med.stockCount);
    setRefillThreshold(med.refillThreshold);
    setCompartmentNumber(med.compartmentNumber);
    setScheduleTimesText(med.dailySchedule.map((s) => s.scheduledTime).join(', '));
    setPrescriptionImageUrl(med.prescriptionImageUrl);
    setBottleOrStripImageUrl(med.bottleOrStripImageUrl);
    setShowAddForm(true);
  };

  // Existing FileReader DataURL pattern for prescription upload
  const handlePrescriptionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPrescriptionImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Same FileReader DataURL pattern for uploading or capturing medication bottle / pill strip photo in Add/Edit form
  const handleBottleOrStripFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBottleOrStripImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct card-level upload or camera capture of bottle or pill strip photo for existing medications
  const handleDirectCardBottlePhotoUpload = (
    med: Medication,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await onUpdateMedication(med.id, {
          bottleOrStripImageUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dosage.trim()) return;

    const times = scheduleTimesText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const dailySchedule: MedicationDoseSlot[] = (times.length > 0 ? times : ['09:00']).map(
      (timeStr, idx) => ({
        id: `slot-${Date.now()}-${idx}`,
        scheduledTime: timeStr,
        label:
          parseInt(timeStr.split(':')[0], 10) < 12
            ? 'Morning (After Nashta)'
            : parseInt(timeStr.split(':')[0], 10) < 17
            ? 'Afternoon (Post-Lunch)'
            : 'Night (After Dinner)',
        status: 'pending',
      })
    );

    if (editingMedId) {
      await onUpdateMedication(editingMedId, {
        name,
        genericName: genericName || name,
        dosage,
        frequency,
        duration,
        instructions,
        purpose,
        prescribedBy,
        assignedCaretakerId,
        stockCount: Number(stockCount),
        refillThreshold: Number(refillThreshold),
        compartmentNumber: Number(compartmentNumber),
        prescriptionImageUrl,
        bottleOrStripImageUrl,
        dailySchedule,
      });
    } else {
      await onAddMedication({
        name,
        genericName: genericName || name,
        dosage,
        frequency,
        duration,
        instructions,
        purpose,
        prescribedBy,
        assignedCaretakerId,
        stockCount: Number(stockCount),
        refillThreshold: Number(refillThreshold),
        compartmentNumber: Number(compartmentNumber),
        prescriptionImageUrl,
        bottleOrStripImageUrl,
        dailySchedule,
      });
    }
    resetForm();
  };

  const runInteractionCheck = async () => {
    setCheckingInteractions(true);
    setInteractionError(null);
    try {
      const res = await fetch('/api/ai/interaction-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateMedication: candidateDrug.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInteractionError(data.error || 'Interaction check failed.');
      } else {
        setAiWarnings(data.warnings || []);
      }
    } catch (err) {
      setInteractionError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setCheckingInteractions(false);
    }
  };

  const highOrModerateCount = activeWarnings.filter(
    (w) => w.severity === 'high' || w.severity === 'moderate'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header & Interactive Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Medication Regimen &amp; Pharmacy Stock Control
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {currentMember.role === 'caretaker'
              ? 'Clinical Nurse Access: Add/edit prescriptions, upload or capture pill strip photos for elderly visual ID, and verify dose intake.'
              : 'Family Member Access: Monitor adherence, check multi-drug interactions, and view pill bottle/strip photos for elderly recognition.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              All Active ({medications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('low_stock')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filter === 'low_stock'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Low Stock ({medications.filter((m) => m.stockCount <= m.refillThreshold).length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('missed')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                filter === 'missed'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              Missed Doses ({medications.filter((m) => m.dailySchedule.some((s) => s.status === 'missed')).length})
            </button>
          </div>

          {canAdd ? (
            <button
              type="button"
              onClick={() => {
                if (showAddForm) resetForm();
                else setShowAddForm(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>{showAddForm ? 'Close Form' : 'Add Prescribed Medicine'}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
              <Lock className="h-3.5 w-3.5 text-amber-600" />
              <span>Prescription Editing Locked for {currentMember.role.toUpperCase()} Role</span>
            </span>
          )}
        </div>
      </div>

      {/* Add / Edit Medication Form (Caretaker Only) */}
      {showAddForm && canAdd && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {editingMedId ? 'Edit Medication & Schedule' : 'Add New Prescribed Medication'}
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Medicine Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Stamlo 5 (Amlodipine)"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Generic / IP Composition
              </label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g., Amlodipine Besylate IP 5 mg"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Dosage *
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="e.g., 5 mg (1 Tablet)"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Frequency
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="Once Daily">Once Daily</option>
                <option value="Twice Daily">Twice Daily</option>
                <option value="Three Times Daily">Three Times Daily</option>
                <option value="Once Daily at Bedtime">Once Daily at Bedtime</option>
                <option value="As Needed (SOS)">As Needed (SOS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                24h Schedule Times (comma-separated)
              </label>
              <input
                type="text"
                value={scheduleTimesText}
                onChange={(e) => setScheduleTimesText(e.target.value)}
                placeholder="08:30, 20:30"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 30 Days or Ongoing"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Clinical Purpose / Condition
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g., Blood Pressure Support"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Supervising Nurse / Member
              </label>
              <select
                value={assignedCaretakerId}
                onChange={(e) => setAssignedCaretakerId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Stock
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockCount}
                  onChange={(e) => setStockCount(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Min Alert
                </label>
                <input
                  type="number"
                  min={1}
                  value={refillThreshold}
                  onChange={(e) => setRefillThreshold(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Box Slot #
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={compartmentNumber}
                  onChange={(e) => setCompartmentNumber(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Administration Instructions
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Take after morning Poha/Upma breakfast with warm water."
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Visual Identification Upload or Camera Capture: Bottle or Pill Strip Photo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Medication Bottle / Pill Strip Photo (Upload or Capture for Elderly Visual ID)
              </label>
              <div className="mt-1 flex flex-wrap items-center gap-2.5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-teal-600 bg-teal-50/50 px-3.5 py-2.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:bg-teal-950/30 dark:text-teal-300">
                  <Upload className="h-4 w-4" />
                  <span>
                    {bottleOrStripImageUrl ? 'Replace Strip/Bottle Photo' : 'Upload Strip/Bottle Photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBottleOrStripFile}
                    className="hidden"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-teal-600 bg-white px-3.5 py-2.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:bg-slate-800 dark:text-teal-300">
                  <Camera className="h-4 w-4" />
                  <span>Capture with Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleBottleOrStripFile}
                    className="hidden"
                  />
                </label>

                {bottleOrStripImageUrl && (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800">
                    <img
                      src={bottleOrStripImageUrl}
                      alt="Medication bottle or pill strip preview"
                      className="h-10 w-14 rounded object-cover"
                    />
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      Visual ID Ready
                    </span>
                    <button
                      type="button"
                      onClick={() => setBottleOrStripImageUrl(undefined)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
                      title="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Upload Doctor Prescription (Optional)
              </label>
              <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Upload className="h-4 w-4" />
                <span>{prescriptionImageUrl ? 'Rx Image Attached' : 'Choose Rx Image'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrescriptionFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-800"
            >
              {editingMedId ? 'Save Medication Changes' : 'Save & Sync Medication'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================
          MEDICATION INTERACTION CHECKER & CLEAR WARNING BANNER
          ======================================================================== */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Medication Interaction Checker
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              Automatically compares all {medications.length} scheduled medicines (
              {medications.map((m) => m.name.split(' ')[0]).join(', ')}) for known negative drug-drug interactions, duplicate therapy, and timing conflicts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={candidateDrug}
              onChange={(e) => setCandidateDrug(e.target.value)}
              placeholder="Test additional medicine (e.g., Combiflam / Brufen)"
              className="w-64 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              disabled={checkingInteractions}
              onClick={runInteractionCheck}
              className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {checkingInteractions ? 'Checking Schedule...' : 'Deep AI Interaction Check'}
              </span>
            </button>
          </div>
        </div>

        {/* Clear Warning Alert Banner when negative interactions are found */}
        {activeWarnings.length > 0 ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/50"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <h4 className="text-sm font-extrabold text-amber-950 dark:text-amber-200">
                    Medication Interaction Warning: {activeWarnings.length} Potential Negative Interaction
                    {activeWarnings.length > 1 ? 's' : ''} Detected in Active Schedule
                    {highOrModerateCount > 0
                      ? ` (${highOrModerateCount} Moderate/High Priority)`
                      : ''}
                  </h4>
                  <p className="mt-0.5 text-xs font-medium text-amber-900 dark:text-amber-300">
                    Interacting Medications:{' '}
                    <span className="font-bold">
                      {Array.from(new Set(activeWarnings.flatMap((w) => w.medicationsInvolved))).join(' · ')}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  onSpeakText(
                    buildLocalizedInteractionAlertSpeech(
                      lang,
                      activeWarnings.length,
                      Array.from(new Set(activeWarnings.flatMap((w) => w.medicationsInvolved)))
                    )
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-amber-500 bg-white px-3.5 py-2 text-xs font-bold text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-200 whitespace-nowrap shrink-0"
              >
                <Volume2 className="h-4 w-4" />
                <span>Speak Warning Alert</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>No negative interactions detected between the currently scheduled medications.</span>
          </div>
        )}

        {interactionError && (
          <p className="mt-3 text-xs font-medium text-red-600">{interactionError}</p>
        )}

        {activeWarnings.length > 0 && (
          <div className="mt-4 divide-y divide-slate-200 border-t border-slate-200 pt-3 dark:divide-slate-800 dark:border-slate-800">
            {activeWarnings.map((w, idx) => (
              <div key={idx} className="py-3.5 first:pt-1 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`h-4 w-4 shrink-0 ${
                        w.severity === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : w.severity === 'moderate'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-teal-700 dark:text-teal-400'
                      }`}
                    />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {w.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold uppercase text-slate-600 dark:text-slate-400">
                    Severity: {w.severity} · {w.medicationsInvolved.join(' + ')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{w.explanation}</p>
                <p className="mt-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
                  Recommendation: {w.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================
          DAILY MEDICATION TIMELINE WITH SMALL VISUAL THUMBNAIL PREVIEWS
          ======================================================================== */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-700 dark:text-teal-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Daily Medication Timeline (Visual Pill Strip &amp; Bottle Preview)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Tap any medicine thumbnail to enlarge for elderly visual verification
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dailyTimeline.map(({ med, slot, thumbnailUrl }) => {
            const isTaken = slot.status === 'taken';
            const isMissed = slot.status === 'missed';

            return (
              <div
                key={slot.id}
                className={`relative overflow-hidden flex flex-col justify-between gap-2.5 rounded-xl border p-3.5 transition-all duration-300 ${
                  isMissed
                    ? 'border-red-300 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                    : isTaken
                    ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/15'
                    : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'
                }`}
              >
                {/* Subtle Green Checkmark Animation Overlay on Dose Confirmation */}
                <AnimatePresence>
                  {activeConfirmedSlotId === slot.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-xl bg-emerald-600/95 text-white backdrop-blur-xs shadow-lg"
                    >
                      <motion.div
                        initial={{ scale: 0.2, rotate: -25 }}
                        animate={{ scale: [0.2, 1.25, 1], rotate: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="flex items-center justify-center rounded-full bg-white p-2 text-emerald-600 shadow-xl ring-4 ring-emerald-300/50"
                      >
                        <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.25 }}
                        className="mt-1.5 text-xs font-extrabold tracking-wide uppercase drop-shadow-sm text-white"
                      >
                        Dose Confirmed Taken!
                      </motion.span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Small Thumbnail Preview of the Medicine */}
                    <button
                      type="button"
                      onClick={() =>
                        setEnlargedPhotoMed({
                          medName: med.name,
                          dosage: med.dosage,
                          compartmentNumber: med.compartmentNumber,
                          instructions: med.instructions,
                          imageUrl: thumbnailUrl,
                        })
                      }
                      className="group relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xs dark:border-slate-700"
                      title="Tap to enlarge medicine strip/bottle photo"
                    >
                      <img
                        src={thumbnailUrl}
                        alt={`${med.name} thumbnail`}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="h-4 w-4 text-white" />
                      </span>
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-teal-800 dark:text-teal-300 tabular-nums">
                        <span>{slot.scheduledTime}</span>
                        <span>·</span>
                        <span>Box #{med.compartmentNumber}</span>
                      </div>
                      <div className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {med.name}
                      </div>
                      <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {med.dosage} · <span className={isTaken ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>{slot.status.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {canConfirmPhysicalDose && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isTaken ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmDoseWithAnimation(med.id, slot.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 shadow-sm active:scale-95 transition-transform"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Confirm</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onDoseAction(med.id, slot.id, 'pending')}
                          className="flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Taken</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Caregiver Observational Notes Field */}
                <div className="border-t border-slate-100 pt-2 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 min-w-0">
                      <FileText className="h-3 w-3 text-teal-700 dark:text-teal-400 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Note:</span>
                      {slot.notes ? (
                        <span className="truncate italic font-medium text-slate-900 dark:text-slate-100 text-[11px]">
                          &ldquo;{slot.notes}&rdquo;
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">None recorded</span>
                      )}
                    </div>

                    {canConfirmPhysicalDose && (
                      <button
                        type="button"
                        onClick={() => {
                          if (editingNoteSlotId === slot.id) {
                            setEditingNoteSlotId(null);
                          } else {
                            setEditingNoteSlotId(slot.id);
                            setTempNoteText(slot.notes || '');
                          }
                        }}
                        className="text-[11px] font-semibold text-teal-800 hover:underline dark:text-teal-300 shrink-0"
                      >
                        {slot.notes ? 'Edit' : '+ Note'}
                      </button>
                    )}
                  </div>

                  {editingNoteSlotId === slot.id && (
                    <div className="mt-2 rounded-lg bg-teal-50/70 p-2.5 border border-teal-200 dark:bg-slate-800/90 dark:border-teal-800 space-y-1.5">
                      <input
                        type="text"
                        value={tempNoteText}
                        onChange={(e) => setTempNoteText(e.target.value)}
                        placeholder="Observational notes (e.g. taken with water, BP 120/80)..."
                        className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <div className="flex flex-wrap gap-1">
                          {['With water', 'BP normal', 'Post-meal'].map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setTempNoteText((prev) => (prev ? `${prev}, ${tag}` : tag))}
                              className="rounded bg-white px-1.5 py-0.5 text-[9px] border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingNoteSlotId(null)}
                            className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-slate-900 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(med.id, slot.id, tempNoteText)}
                            className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-teal-800"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Medication Cards List */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {filteredMedications.map((med) => {
          const isLowStock = med.stockCount <= med.refillThreshold;
          const caretaker = members.find((m) => m.id === med.assignedCaretakerId);
          const hasCustomPhoto = Boolean(med.bottleOrStripImageUrl || med.prescriptionImageUrl);
          const visualPhotoUrl = getMedicationThumbnailUrl(med);

          return (
            <div
              key={med.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                {/* Unboxed Clean Metadata Header (Zero-Pill Compliance) */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono tabular-nums">
                    <span>Compartment #{med.compartmentNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{med.frequency}</span>
                    <span aria-hidden="true">·</span>
                    <span className={isLowStock ? 'font-bold text-amber-700 dark:text-amber-400' : ''}>
                      {med.stockCount} Tablets Left {isLowStock ? '(Low Stock Alert)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        onSpeakText(
                          med.dailySchedule
                            .map((s) =>
                              buildLocalizedDoseSpeech(
                                lang,
                                med.name,
                                med.dosage,
                                s.scheduledTime,
                                med.compartmentNumber,
                                s.status === 'taken'
                              )
                            )
                            .join(' ')
                        )
                      }
                      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                      title="Read medication instructions aloud"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => startEdit(med)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800"
                        title="Edit medication"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeleteMedication(med.id)}
                        className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-slate-800"
                        title="Delete medication"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Dosage */}
                <div className="mt-2 flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {med.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {med.genericName} · {med.purpose}
                    </p>
                  </div>
                  <span className="font-mono text-base font-bold text-teal-800 dark:text-teal-300 tabular-nums">
                    {med.dosage}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  {med.instructions}
                </p>

                {/* Elderly Visual Identification Section: Upload or Capture Medication Bottle or Pill Strip Photo */}
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setEnlargedPhotoMed({
                            medName: med.name,
                            dosage: med.dosage,
                            compartmentNumber: med.compartmentNumber,
                            instructions: med.instructions,
                            imageUrl: visualPhotoUrl,
                          })
                        }
                        className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-300 bg-white dark:border-slate-700"
                        title="Tap to enlarge bottle or pill strip photo for elderly visual verification"
                      >
                        <img
                          src={visualPhotoUrl}
                          alt={`${med.name} bottle or pill strip`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="h-5 w-5 text-white" />
                        </span>
                      </button>

                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Visual Identification (Bottle / Pill Strip)
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {hasCustomPhoto
                            ? 'Custom bottle/strip photo attached to help Smt. Kamala visually recognize this medicine.'
                            : 'Upload or capture a photo of the medicine bottle or blister strip for visual recognition.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEnlargedPhotoMed({
                            medName: med.name,
                            dosage: med.dosage,
                            compartmentNumber: med.compartmentNumber,
                            instructions: med.instructions,
                            imageUrl: visualPhotoUrl,
                          })
                        }
                        className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Enlarge</span>
                      </button>

                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-teal-600 bg-white px-2.5 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-50 dark:border-teal-500 dark:bg-slate-900 dark:text-teal-300 dark:hover:bg-slate-800 whitespace-nowrap shrink-0">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{hasCustomPhoto ? 'Update Photo' : 'Upload Photo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleDirectCardBottlePhotoUpload(med, e)}
                          className="hidden"
                        />
                      </label>

                      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 whitespace-nowrap shrink-0">
                        <Camera className="h-3.5 w-3.5" />
                        <span>Capture</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleDirectCardBottlePhotoUpload(med, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Daily Schedule Slots with Small Thumbnail Preview */}
                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Today&apos;s Scheduled Intake Slots
                  </div>
                  {med.dailySchedule.map((slot) => (
                    <div
                      key={slot.id}
                      className={`relative overflow-hidden flex flex-col justify-between gap-2 rounded-lg border p-3 transition-all duration-300 ${
                        slot.status === 'taken'
                          ? 'border-emerald-300 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                          : slot.status === 'missed'
                          ? 'border-red-300 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                          : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50'
                      }`}
                    >
                      {/* Subtle Green Checkmark Animation Overlay on Dose Confirmation */}
                      <AnimatePresence>
                        {activeConfirmedSlotId === slot.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-lg bg-emerald-600/95 text-white backdrop-blur-xs shadow-lg"
                          >
                            <motion.div
                              initial={{ scale: 0.2, rotate: -25 }}
                              animate={{ scale: [0.2, 1.25, 1], rotate: 0 }}
                              transition={{ duration: 0.4, ease: 'easeOut' }}
                              className="flex items-center justify-center rounded-full bg-white p-2 text-emerald-600 shadow-xl ring-4 ring-emerald-300/50"
                            >
                              <CheckCircle2 className="h-7 w-7 stroke-[2.5]" />
                            </motion.div>
                            <motion.span
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15, duration: 0.25 }}
                              className="mt-1 text-xs font-extrabold tracking-wide uppercase drop-shadow-sm text-white"
                            >
                              Dose Confirmed Taken!
                            </motion.span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={visualPhotoUrl}
                            alt={`${med.name} strip thumbnail`}
                            onClick={() =>
                              setEnlargedPhotoMed({
                                medName: med.name,
                                dosage: med.dosage,
                                compartmentNumber: med.compartmentNumber,
                                instructions: med.instructions,
                                imageUrl: visualPhotoUrl,
                              })
                            }
                            className="h-9 w-12 shrink-0 cursor-pointer rounded border border-slate-300 object-cover dark:border-slate-700"
                            title="Tap to enlarge visual ID"
                          />
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {slot.scheduledTime}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {slot.label}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {slot.status === 'taken'
                                ? `Confirmed at ${slot.acknowledgedAt} by ${slot.acknowledgedBy}`
                                : slot.status === 'missed'
                                ? 'Missed · Escalated to Caretaker & Family'
                                : slot.status === 'skipped'
                                ? 'Dose Skipped'
                                : 'Awaiting Confirmation'}
                            </div>
                          </div>
                        </div>

                        {canConfirmPhysicalDose ? (
                          <div className="flex items-center gap-1.5">
                            {slot.status !== 'taken' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmDoseWithAnimation(med.id, slot.id)}
                                  className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0 shadow-sm active:scale-95 transition-transform"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Confirm Taken</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDoseAction(med.id, slot.id, 'skipped')}
                                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap shrink-0"
                                >
                                  Skip
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onDoseAction(med.id, slot.id, 'pending')}
                                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400 whitespace-nowrap shrink-0"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Taken · Undo</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-semibold uppercase text-slate-500">
                            Status: {slot.status} (View-Only)
                          </span>
                        )}
                      </div>

                      {/* Caregiver Observational Notes on Dose Slot */}
                      <div className="border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <FileText className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Caregiver Note:</span>
                            {slot.notes ? (
                              <span className="font-medium italic text-slate-900 dark:text-slate-100 text-[11px]">
                                &ldquo;{slot.notes}&rdquo;
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">No observational note recorded</span>
                            )}
                          </div>

                          {canConfirmPhysicalDose && (
                            <button
                              type="button"
                              onClick={() => {
                                if (editingNoteSlotId === slot.id) {
                                  setEditingNoteSlotId(null);
                                } else {
                                  setEditingNoteSlotId(slot.id);
                                  setTempNoteText(slot.notes || '');
                                }
                              }}
                              className="text-[11px] font-semibold text-teal-800 hover:underline dark:text-teal-300 shrink-0"
                            >
                              {slot.notes ? 'Edit' : '+ Add Note'}
                            </button>
                          )}
                        </div>

                        {editingNoteSlotId === slot.id && (
                          <div className="mt-2 rounded-lg bg-teal-50/70 p-2.5 border border-teal-200 dark:bg-slate-800/90 dark:border-teal-800 space-y-1.5">
                            <input
                              type="text"
                              value={tempNoteText}
                              onChange={(e) => setTempNoteText(e.target.value)}
                              placeholder="Observational notes (e.g. taken with water, BP 120/80)..."
                              className="w-full rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <div className="flex flex-wrap gap-1">
                                {['With water', 'BP normal', 'Post-meal', 'Resting'].map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setTempNoteText((prev) => (prev ? `${prev}, ${tag}` : tag))}
                                    className="rounded bg-white px-1.5 py-0.5 text-[9px] border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                  >
                                    +{tag}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingNoteSlotId(null)}
                                  className="px-2 py-0.5 text-[10px] text-slate-600 hover:text-slate-900 dark:text-slate-400"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveNote(med.id, slot.id, tempNoteText)}
                                  className="rounded bg-teal-700 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-teal-800"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Metadata & Refill Action */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
                <span>
                  Prescribed by {med.prescribedBy} · Supervised by{' '}
                  {caretaker?.name || 'Sister Priya Nair, RN'}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onRefillMedication(med.id, 30)}
                    className="flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 whitespace-nowrap shrink-0"
                  >
                    <PackagePlus className="h-3.5 w-3.5" />
                    <span>Log +30 Strip Refill</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Large Elderly-Friendly Visual Identification Lightbox Modal */}
      {enlargedPhotoMed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4"
          onClick={() => setEnlargedPhotoMed(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <span className="font-mono text-xs font-bold uppercase text-teal-700 dark:text-teal-400">
                  Pillbox Compartment #{enlargedPhotoMed.compartmentNumber} · Visual ID
                </span>
                <h3 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">
                  {enlargedPhotoMed.medName} ({enlargedPhotoMed.dosage})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedPhotoMed(null)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
              <img
                src={enlargedPhotoMed.imageUrl}
                alt={enlargedPhotoMed.medName}
                className="max-h-80 w-full object-contain"
              />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
              {enlargedPhotoMed.instructions}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  onSpeakText(
                    `This is the visual identification photo for ${enlargedPhotoMed.medName}, ${enlargedPhotoMed.dosage}, located in pillbox compartment number ${enlargedPhotoMed.compartmentNumber}. ${enlargedPhotoMed.instructions}`
                  )
                }
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <Volume2 className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                <span>Read Identification Aloud</span>
              </button>
              <button
                type="button"
                onClick={() => setEnlargedPhotoMed(null)}
                className="rounded-lg bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
