import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneCall,
  Ambulance,
  Volume2,
  VolumeX,
  Square,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Globe,
  Sun,
  Moon,
  Lock,
  Activity,
  Cpu,
  ChevronDown,
  ChevronUp,
  Users,
  ShieldCheck,
  X,
  Stethoscope,
  HeartPulse,
  ClipboardCheck,
  Send,
  PackagePlus,
} from 'lucide-react';
import type {
  HealthcareDatabase,
  AuthorizedMember,
  Appointment,
} from './types';
import {
  INDIAN_LANGUAGES,
  TRANSLATIONS,
  type LanguageCode,
  buildLocalizedDoseSpeech,
  buildLocalizedConfirmationSpeech,
  buildLocalizedEmergencySpeech,
  buildLocalizedMemberCallSpeech,
  getStopVoiceLabel,
  selectBestBrowserVoice,
  getMedicationThumbnailUrl,
} from './i18n';
import { QrCodeModal } from './components/QrCodeModal';
import { HardwarePillboxPanel } from './components/HardwarePillboxModal';
import { MedicationManager } from './components/MedicationManager';
import { AppointmentManager } from './components/AppointmentManager';
import { ProfileAndAccessManager } from './components/ProfileAndAccessManager';
import { SmartAiAndNotifications } from './components/SmartAiAndNotifications';

type ActiveTab = 'overview' | 'medications' | 'appointments' | 'profile' | 'ai_alerts';
type AppStage = 'intro' | 'profile_select' | 'main';

export default function App() {
  const [db, setDb] = useState<HealthcareDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<AppStage>('intro');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentMemberId, setCurrentMemberId] = useState<string>('mem-elderly-1');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Caregiver PIN prompt state on the Netflix-styled profile selection screen
  const [caregiverTarget, setCaregiverTarget] = useState<AuthorizedMember | null>(null);
  const [caregiverPin, setCaregiverPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifyingPin, setVerifyingPin] = useState<boolean>(false);

  // Modals & UI states
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [showHardwareBox, setShowHardwareBox] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [activeEmergencyBanner, setActiveEmergencyBanner] = useState<{
    type: 'doctor' | 'ambulance' | 'member_call';
    title: string;
    detail: string;
    phone?: string;
  } | null>(null);

  // Caregiver Clinical Command & Vitals Hub states
  const [vitalType, setVitalType] = useState<string>('Blood Pressure (BP)');
  const [vitalValue, setVitalValue] = useState<string>('126/78 mmHg');
  const [vitalNote, setVitalNote] = useState<string>('Seated rest, post-morning medication');
  const [notifyFamilyOnVital, setNotifyFamilyOnVital] = useState<boolean>(true);
  const [savingVital, setSavingVital] = useState<boolean>(false);
  const [handoverNote, setHandoverNote] = useState<string>('');
  const [sendingHandover, setSendingHandover] = useState<boolean>(false);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const langDropdownRef = useRef<HTMLDivElement | null>(null);
  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechSessionRef = useRef<number>(0);

  const t = TRANSLATIONS[lang];
  const stopVoiceText = getStopVoiceLabel(lang);
  const currentLangMeta =
    INDIAN_LANGUAGES.find((l) => l.code === lang) || INDIAN_LANGUAGES[0];

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 5000);
  }, []);

  // Preload browser SpeechSynthesis voices (for Marathi, Tamil, Kannada, Bengali, Hindi, etc.)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        cachedVoicesRef.current = voices;
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Automatic transition from minimalist black OJAS typography intro to Netflix-style profile picker
  useEffect(() => {
    if (stage !== 'intro') return;
    const timer = setTimeout(() => {
      setStage('profile_select');
    }, 2300);
    return () => clearTimeout(timer);
  }, [stage]);

  // Close secluded corner language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        langDropdownRef.current &&
        !langDropdownRef.current.contains(e.target as Node)
      ) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial state fetch + SSE subscription
  useEffect(() => {
    let eventSource: EventSource | null = null;

    async function init() {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data: HealthcareDatabase = await res.json();
          setDb(data);
        }
      } catch {
        // Offline cache fallback
        const cached = localStorage.getItem('ojas_offline_cache');
        if (cached) {
          setDb(JSON.parse(cached));
        }
      } finally {
        setLoading(false);
      }

      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const updated: HealthcareDatabase = JSON.parse(event.data);
          setDb(updated);
          localStorage.setItem('ojas_offline_cache', JSON.stringify(updated));
        } catch {
          // Ignore malformed event
        }
      };
    }

    init();
    return () => {
      eventSource?.close();
    };
  }, []);

  /**
   * Immediately stops any active browser SpeechSynthesis or server-synthesized audio playback.
   */
  const stopSpeaking = useCallback(() => {
    speechSessionRef.current += 1;
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.currentTime = 0;
      activeAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioPlaying(false);
    setToastMessage(null);
  }, []);

  /**
   * Multilingual Indian speech synthesis supporting Marathi (mr), Tamil (ta),
   * Kannada (kn), Bengali (bn), Hindi (hi), Malayalam (ml), Telugu (te),
   * Gujarati (gu), Punjabi (pa), and English (en).
   *
   * Primary choice: High-quality native browser system voice mapped via `selectBestBrowserVoice`.
   * Fallback choice: Server-side regional TTS engine (`/api/ai/tts`) when no native voice
   * is installed for that language or if browser playback encounters an error.
   */
  const speakText = useCallback(
    async (text: string, overrideLang?: LanguageCode) => {
      const targetLang = overrideLang || lang;
      const targetMeta =
        INDIAN_LANGUAGES.find((l) => l.code === targetLang) || currentLangMeta;

      // Increment session ID so cancelled requests never resume
      const currentSession = speechSessionRef.current + 1;
      speechSessionRef.current = currentSession;

      // Stop any currently playing audio before starting new speech
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      showToast(text);
      setAudioPlaying(true);

      const playServerFallbackTts = async () => {
        if (speechSessionRef.current !== currentSession) return;
        try {
          const res = await fetch('/api/ai/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              langCode: targetLang,
              languageName: targetMeta.englishName,
              speechLang: targetMeta.speechLang,
            }),
          });
          if (speechSessionRef.current !== currentSession) return;
          if (res.ok) {
            const data = await res.json();
            const b64 = data.audioBase64 || data.audioWavBase64;
            const mime = data.mimeType || 'audio/mpeg';
            if (data.spokenText && speechSessionRef.current === currentSession) {
              showToast(data.spokenText);
            }
            if (b64 && speechSessionRef.current === currentSession) {
              const audio = new Audio(`data:${mime};base64,${b64}`);
              activeAudioRef.current = audio;
              audio.onended = () => {
                if (speechSessionRef.current === currentSession) {
                  setAudioPlaying(false);
                }
              };
              audio.onerror = () => {
                if (speechSessionRef.current === currentSession) {
                  setAudioPlaying(false);
                }
              };
              await audio.play();
              return;
            }
          }
        } catch {
          // Server TTS fallback failed; try generic utterance as last resort
        }

        if (
          speechSessionRef.current === currentSession &&
          typeof window !== 'undefined' &&
          'speechSynthesis' in window
        ) {
          const fallbackUtterance = new SpeechSynthesisUtterance(text);
          fallbackUtterance.lang = targetMeta.speechLang;
          fallbackUtterance.rate = 0.92;
          fallbackUtterance.onend = () => {
            if (speechSessionRef.current === currentSession) {
              setAudioPlaying(false);
            }
          };
          fallbackUtterance.onerror = () => {
            if (speechSessionRef.current === currentSession) {
              setAudioPlaying(false);
            }
          };
          window.speechSynthesis.speak(fallbackUtterance);
        } else if (speechSessionRef.current === currentSession) {
          setAudioPlaying(false);
        }
      };

      // 1. PRIMARY CHOICE: Check for a high-quality native Marathi, Tamil, Kannada, Bengali, or regional system voice via selectBestBrowserVoice
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const availableVoices =
          cachedVoicesRef.current.length > 0
            ? cachedVoicesRef.current
            : window.speechSynthesis.getVoices();
        const bestNativeVoice = selectBestBrowserVoice(targetLang, availableVoices);

        if (bestNativeVoice) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.voice = bestNativeVoice;
          utterance.lang = bestNativeVoice.lang || targetMeta.speechLang;
          utterance.rate = 0.92;
          utterance.onend = () => {
            if (speechSessionRef.current === currentSession) {
              setAudioPlaying(false);
            }
          };
          utterance.onerror = () => {
            if (speechSessionRef.current === currentSession) {
              void playServerFallbackTts();
            }
          };
          window.speechSynthesis.speak(utterance);
          return;
        }
      }

      // 2. FALLBACK ENGINE: Use server-side regional TTS engine (/api/ai/tts) when no native system voice is installed
      await playServerFallbackTts();
    },
    [lang, currentLangMeta, showToast]
  );

  // Handle Netflix-styled profile selection:
  // Patient & Family require NO PIN; Caregiver requires 4-digit PIN (2468).
  const handleSelectProfile = async (member: AuthorizedMember) => {
    if (member.status === 'revoked' || !member.consentGrantedByPatient) {
      showToast(
        `Access for ${member.name} has been revoked by Patient Smt. Kamala Deshmukh.`
      );
      return;
    }

    if (member.role === 'caretaker') {
      setCaregiverTarget(member);
      setCaregiverPin('');
      setPinError(null);
      return;
    }

    // Patient (elderly) or Family: immediate entry with NO PIN
    try {
      await fetch('/api/auth/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });
    } catch {
      // Offline entry allowed
    }
    setCurrentMemberId(member.id);
    setActiveTab('overview');
    setStage('main');
    showToast(`Welcome to OJAS, ${member.name}`);
  };

  const handleVerifyCaregiverPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caregiverTarget) return;
    setVerifyingPin(true);
    setPinError(null);
    try {
      const res = await fetch('/api/auth/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: caregiverTarget.id,
          passcode: caregiverPin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'Invalid Caregiver PIN.');
      } else {
        setCurrentMemberId(caregiverTarget.id);
        setCaregiverTarget(null);
        setCaregiverPin('');
        setActiveTab('overview');
        setStage('main');
        showToast(`Caregiver session unlocked: ${caregiverTarget.name}`);
      }
    } catch {
      if (caregiverPin === caregiverTarget.passcode) {
        setCurrentMemberId(caregiverTarget.id);
        setCaregiverTarget(null);
        setStage('main');
      } else {
        setPinError('Invalid 4-digit Caregiver PIN.');
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  if (loading || !db) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="font-mono text-xs tracking-[0.4em] text-neutral-500 uppercase">
            Initializing OJAS
          </div>
        </div>
      </div>
    );
  }

  const currentMember: AuthorizedMember =
    db.members.find((m) => m.id === currentMemberId) || db.members[0];

  // Other members in the Care Circle for 1-Tap Direct Calling (Patient <-> Caregiver <-> Family)
  const otherCareCircleMembers = db.members.filter(
    (m) => m.id !== currentMember.id && m.status === 'active'
  );

  // Strict Role-Based Access Permissions:
  // 1. Elderly Patient cannot modify clinical data (prescriptions, dosages, consultation notes),
  //    can confirm her own medicine intake, and controls Care Circle consent.
  // 2. Family & Caregiver have read-only or restricted-write access unless authorized by the elderly patient.
  const isAuthorizedByPatient =
    currentMember.role !== 'elderly' &&
    currentMember.status === 'active' &&
    currentMember.consentGrantedByPatient;

  const canConfirmPhysicalDose =
    currentMember.role === 'elderly' ||
    (currentMember.role === 'caretaker' && isAuthorizedByPatient) ||
    (currentMember.role === 'family' && isAuthorizedByPatient && currentMember.permissions.canEdit);

  const allowedNavItems: { key: ActiveTab; label: string }[] =
    currentMember.role === 'elderly'
      ? [
          { key: 'overview', label: t.navOverview },
          { key: 'appointments', label: t.navAppointments },
          { key: 'profile', label: t.navProfileAndAccess },
        ]
      : [
          { key: 'overview', label: t.navOverview },
          { key: 'medications', label: t.navMedications },
          { key: 'appointments', label: t.navAppointments },
          { key: 'profile', label: t.navProfileAndAccess },
          { key: 'ai_alerts', label: t.navSmartAiAndAlerts },
        ];

  const allTimelineSlots = db.medications
    .flatMap((med) =>
      med.dailySchedule.map((slot) => ({
        med,
        slot,
      }))
    )
    .sort((a, b) => a.slot.scheduledTime.localeCompare(b.slot.scheduledTime));

  const totalDosesToday = allTimelineSlots.length;
  const takenDosesToday = allTimelineSlots.filter(
    (item) => item.slot.status === 'taken'
  ).length;
  const missedDosesToday = allTimelineSlots.filter(
    (item) => item.slot.status === 'missed'
  );
  const pendingDosesToday = allTimelineSlots.filter(
    (item) => item.slot.status === 'pending'
  );
  const lowStockMedications = db.medications.filter(
    (med) => med.stockCount <= med.refillThreshold
  );

  const handleDoseAction = async (
    medId: string,
    slotId: string,
    status: 'pending' | 'taken' | 'missed' | 'skipped'
  ) => {
    const res = await fetch(`/api/medications/${medId}/dose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId,
        status,
        actorName: currentMember.name,
        actorRole: currentMember.role,
        source: 'app',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      showToast(err.error || 'Action restricted for your role.');
      return;
    }
    const targetMed = db.medications.find((m) => m.id === medId);
    if (status === 'taken' && targetMed) {
      speakText(buildLocalizedConfirmationSpeech(lang, targetMed.name));
    }
  };

  // Direct One-Tap Call to Any Care Circle Member (Patient <-> Caregiver <-> Family)
  const handleDirectCallMember = async (target: AuthorizedMember) => {
    const roleLabel =
      target.role === 'caretaker'
        ? 'Caregiver Nurse'
        : target.role === 'family'
        ? 'Family Member'
        : 'Patient';

    setActiveEmergencyBanner({
      type: 'member_call',
      title: `One-Tap Direct Call: ${target.name} (${target.phone})`,
      detail: `${roleLabel} · ${target.relationship} · Initiated by ${currentMember.name}`,
      phone: target.phone,
    });

    speakText(buildLocalizedMemberCallSpeech(lang, target.name, target.role));

    await fetch('/api/notifications/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'upcoming_dose',
        subject: `[OJAS ONE-TAP CALL] ${currentMember.name} called ${target.name}`,
        body: `${currentMember.name} (${currentMember.role}) initiated a direct one-tap call to ${target.name} (${roleLabel} · ${target.phone}).`,
        actorName: currentMember.name,
        actorRole: currentMember.role,
      }),
    });
  };

  // Direct One-Tap Option 1: Call Doctor
  const handleDirectCallDoctor = async () => {
    const doc = db.patient.primaryDoctor;
    setActiveEmergencyBanner({
      type: 'doctor',
      title: `Calling ${doc.name} (${doc.phone})`,
      detail: `${doc.specialty} · ${doc.hospital}`,
      phone: doc.phone,
    });
    speakText(buildLocalizedEmergencySpeech(lang, 'doctor'));
    await fetch('/api/notifications/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'upcoming_dose',
        subject: `[OJAS DIRECT DOCTOR CALL] ${currentMember.name} initiated call to ${doc.name}`,
        body: `${currentMember.name} (${currentMember.role}) initiated a direct tele-consultation call to ${doc.name} (${doc.phone}) at ${doc.hospital}.`,
        actorName: currentMember.name,
        actorRole: currentMember.role,
      }),
    });
  };

  // Direct One-Tap Option 2: Dispatch 108 Ambulance
  const handleDirectDispatchAmbulance = async () => {
    setActiveEmergencyBanner({
      type: 'ambulance',
      title: '108 Emergency Ambulance Dispatched to Residence',
      detail: `Destination: ${db.patient.address} · Paramedic & Family Notified`,
      phone: '108',
    });
    speakText(buildLocalizedEmergencySpeech(lang, 'ambulance'));
    await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorName: currentMember.name,
        message: `108 Emergency Ambulance Dispatched by ${currentMember.name} (${currentMember.role})`,
        locationNote: db.patient.address,
      }),
    });
  };

  // Direct SOS Emergency Broadcast
  const handleDirectSosBroadcast = async () => {
    setActiveEmergencyBanner({
      type: 'ambulance',
      title: 'Direct Emergency SOS Broadcast Dispatched',
      detail: `All Emergency Contacts, Caregiver & Family Notified · ${db.patient.address}`,
    });
    speakText(buildLocalizedEmergencySpeech(lang, 'ambulance'));
    await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorName: currentMember.name,
        message: 'Direct Emergency SOS triggered from OJAS.',
        locationNote: db.patient.address,
      }),
    });
  };

  const handleReadScheduleAloud = () => {
    const sentences = allTimelineSlots.map(({ med, slot }) =>
      buildLocalizedDoseSpeech(
        lang,
        med.name,
        med.dosage,
        slot.scheduledTime,
        med.compartmentNumber,
        slot.status === 'taken'
      )
    );
    speakText(`${t.voiceScheduleIntro} ${sentences.join(' ')}`);
  };

  // Caregiver Feature 1: Log Clinical Vital Reading
  const handleCaregiverLogVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vitalValue.trim()) return;
    setSavingVital(true);
    try {
      const res = await fetch('/api/caregiver/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorName: currentMember.name,
          actorRole: currentMember.role,
          vitalType,
          readingValue: vitalValue.trim(),
          clinicalNote: vitalNote.trim(),
          notifyFamily: notifyFamilyOnVital,
        }),
      });
      if (res.ok) {
        showToast(`Logged ${vitalType}: ${vitalValue}`);
        setVitalNote('');
      }
    } finally {
      setSavingVital(false);
    }
  };

  // Caregiver Feature 2: Send Shift Handover / Clinical Observation Broadcast to Family
  const handleSendCaregiverHandover = async (customText?: string) => {
    const noteToSend = (customText ?? handoverNote).trim();
    if (!noteToSend) return;
    setSendingHandover(true);
    try {
      await fetch('/api/notifications/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly_summary',
          subject: `[OJAS CAREGIVER SHIFT UPDATE] ${currentMember.name}`,
          body: `Clinical Caregiver Shift Update for ${db.patient.fullName}:\n"${noteToSend}"\n— Recorded by ${currentMember.name} (${currentMember.phone})`,
          actorName: currentMember.name,
          actorRole: currentMember.role,
        }),
      });
      setHandoverNote('');
      showToast('Caregiver shift update sent to Family & logged.');
    } finally {
      setSendingHandover(false);
    }
  };

  // Caregiver Feature 3: One-Tap Restock All Low-Stock Medicines
  const handleCaregiverBatchRestock = async () => {
    for (const med of lowStockMedications) {
      await fetch(`/api/medications/${med.id}/refill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addedQuantity: 30,
          actorName: currentMember.name,
          actorRole: currentMember.role,
        }),
      });
    }
    showToast(`Restocked ${lowStockMedications.length} low-stock medication(s) (+30 tablets each).`);
  };

  // ============================================================================
  // STAGE 1: MINIMALIST BLACK BACKGROUND & OJAS TYPOGRAPHY ANIMATION INTRO
  // ============================================================================
  if (stage === 'intro') {
    return (
      <div
        onClick={() => setStage('profile_select')}
        className="flex min-h-screen cursor-pointer flex-col items-center justify-center bg-black px-6 text-white select-none"
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center text-center"
          >
            <div className="flex items-center justify-center space-x-4 sm:space-x-7">
              {['O', 'J', 'A', 'S'].map((letter, idx) => (
                <motion.span
                  key={letter}
                  initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{
                    duration: 0.7,
                    delay: 0.15 + idx * 0.14,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="text-6xl font-bold tracking-[0.25em] text-white sm:text-8xl"
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.85, ease: 'easeOut' }}
              className="mt-6 h-[1px] w-48 bg-gradient-to-r from-transparent via-teal-400 to-transparent sm:w-64"
            />

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.05 }}
              className="mt-5 font-mono text-xs tracking-[0.35em] text-neutral-400 uppercase sm:text-sm"
            >
              ओजस् · Vital Elder Care
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================================
  // STAGE 2: NETFLIX-STYLED SIMPLISTIC PROFILE SELECTION SCREEN
  // (No PIN for Patient or Family; PIN required ONLY for Caregiver)
  // ============================================================================
  if (stage === 'profile_select') {
    return (
      <div className="relative flex min-h-screen flex-col justify-between bg-[#0a0a0a] px-6 py-8 text-white">
        {/* Top Minimalist Bar with OJAS Wordmark, Stop Voice button (if playing) & Secluded Corner Language Selector */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <button
            type="button"
            onClick={() => setStage('intro')}
            className="text-2xl font-bold tracking-[0.3em] text-white hover:text-teal-400 transition-colors"
          >
            OJAS
          </button>

          <div className="flex items-center gap-2.5">
            {audioPlaying && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                <span>{stopVoiceText}</span>
              </button>
            )}

            {/* Secluded Corner Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-1.5 text-xs font-semibold text-neutral-200 hover:border-neutral-700"
              >
                <Globe className="h-3.5 w-3.5 text-teal-400" />
                <span>{currentLangMeta.nativeName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-neutral-800 bg-neutral-950 p-1.5 shadow-2xl">
                  <div className="grid grid-cols-1 gap-0.5">
                    {INDIAN_LANGUAGES.map((l) => {
                      const active = l.code === lang;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => {
                            setLang(l.code);
                            setLangMenuOpen(false);
                            speakText(TRANSLATIONS[l.code].greeting, l.code);
                          }}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                            active
                              ? 'bg-teal-600 font-bold text-white'
                              : 'text-neutral-300 hover:bg-neutral-900'
                          }`}
                        >
                          <span>{l.nativeName}</span>
                          <span className="font-mono text-[10px] opacity-75">
                            {l.englishName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Netflix-Styled Profile Picker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="mx-auto my-auto flex w-full max-w-4xl flex-col items-center text-center"
        >
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            Who&apos;s using OJAS?
          </h1>
          <p className="mt-3 text-sm text-neutral-400">
            One-tap entry for Patient &amp; Family · PIN required only for Caregiver Nurse
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {db.members.map((member) => {
              const isCaregiver = member.role === 'caretaker';
              const isRevoked =
                member.status === 'revoked' || !member.consentGrantedByPatient;
              const roleBadge =
                member.role === 'elderly'
                  ? 'Patient'
                  : member.role === 'family'
                  ? 'Family'
                  : 'Caregiver';

              return (
                <button
                  key={member.id}
                  type="button"
                  disabled={isRevoked}
                  onClick={() => handleSelectProfile(member)}
                  className="group flex flex-col items-center focus:outline-none disabled:opacity-40"
                >
                  <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-transparent bg-neutral-900 transition-all duration-200 group-hover:scale-105 group-hover:border-white sm:h-44 sm:w-44">
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Role & PIN Indicator */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded bg-black/75 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-white uppercase">
                        {roleBadge}
                      </span>
                      {isCaregiver && (
                        <span
                          className="flex items-center gap-1 rounded bg-amber-500/90 px-2 py-0.5 font-mono text-[10px] font-bold text-black"
                          title="PIN Required for Caregiver"
                        >
                          <Lock className="h-3 w-3" />
                          PIN
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="mt-4 text-lg font-semibold text-neutral-300 transition-colors group-hover:text-white">
                    {member.name}
                  </span>
                  <span className="mt-0.5 text-xs text-neutral-500">
                    {isCaregiver
                      ? 'Clinical Caregiver (PIN: 2468)'
                      : member.role === 'elderly'
                      ? 'Patient · One-Tap Access'
                      : 'Family · Read-Only Monitor'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Caregiver PIN Modal / Inline Overlay (Only shown when Caregiver tile is clicked) */}
          <AnimatePresence>
            {caregiverTarget && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mt-10 w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 text-left shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      Caregiver Security PIN
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCaregiverTarget(null)}
                    className="rounded p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 text-xs text-neutral-400">
                  Enter 4-digit PIN for {caregiverTarget.name} (Default:{' '}
                  <span className="font-mono text-amber-300">2468</span>)
                </p>

                <form onSubmit={handleVerifyCaregiverPin} className="mt-4 space-y-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    maxLength={4}
                    value={caregiverPin}
                    onChange={(e) => setCaregiverPin(e.target.value)}
                    placeholder="••••"
                    className="w-full rounded-xl border border-neutral-700 bg-black px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-white focus:border-teal-500 focus:outline-none"
                  />
                  {pinError && (
                    <p className="text-center text-xs font-medium text-red-400">
                      {pinError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCaregiverPin('2468')}
                      className="rounded-xl border border-neutral-700 px-3 py-2.5 font-mono text-xs text-neutral-300 hover:bg-neutral-800"
                    >
                      Fill 2468
                    </button>
                    <button
                      type="submit"
                      disabled={verifyingPin || caregiverPin.length < 4}
                      className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                    >
                      {verifyingPin ? 'Verifying...' : 'Unlock Caregiver Access'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Clean Minimalist Login Footer: Call Dr. Directly (Urgent) & 108 Ambulance */}
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-4 border-t border-neutral-900 pt-6">
          <a
            href={`tel:${db.patient.primaryDoctor.phone.replace(/\s+/g, '')}`}
            onClick={handleDirectCallDoctor}
            className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white hover:border-teal-500"
          >
            <PhoneCall className="h-4 w-4 text-teal-400" />
            <span>
              Call Dr. Directly (Urgent): {db.patient.primaryDoctor.name.split(',')[0]}
            </span>
          </a>

          <button
            type="button"
            onClick={handleDirectDispatchAmbulance}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-500"
          >
            <Ambulance className="h-4 w-4" />
            <span>{t.dispatchAmbulanceBtn}</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STAGE 3: SIMPLISTIC ROLE-BASED OJAS WORKSPACE
  // ============================================================================
  return (
    <div
      className={`min-h-screen transition-colors ${
        highContrast
          ? 'dark bg-slate-950 text-white'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Minimalist Top Header with One-Tap Direct Calling (Caregiver/Family/Patient + Doctor + Ambulance), Stop Voice & Corner Language Dropdown */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Left: OJAS Brand & Active Role */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStage('profile_select')}
              className="flex items-center gap-2.5 text-left"
              title="Return to Profile Selection"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black font-mono text-sm font-bold tracking-widest text-white dark:bg-white dark:text-black">
                OJ
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-[0.2em] text-slate-900 dark:text-white">
                  OJAS
                </span>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {currentMember.name} ·{' '}
                  <span className="font-semibold uppercase text-teal-700 dark:text-teal-400">
                    {currentMember.role === 'elderly'
                      ? 'Patient'
                      : currentMember.role === 'caretaker'
                      ? 'Caregiver Nurse'
                      : 'Family'}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Center/Right: One-Tap Direct Call Buttons for Other Roles + Doctor + Ambulance + Stop Voice + Secluded Corner Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Stop Voice Button (Visible whenever speech is active) */}
            {audioPlaying && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 whitespace-nowrap shrink-0 animate-pulse"
                title="Stop Voice Playback Immediately"
              >
                <VolumeX className="h-4 w-4" />
                <span>{stopVoiceText}</span>
              </button>
            )}

            {/* One-Tap Direct Call Buttons for Other Care Circle Members (Patient <-> Caregiver <-> Family) */}
            {otherCareCircleMembers.map((member) => {
              const shortRole =
                member.role === 'caretaker'
                  ? 'Call Caregiver'
                  : member.role === 'family'
                  ? 'Call Family'
                  : 'Call Patient';
              return (
                <a
                  key={member.id}
                  href={`tel:${member.phone.replace(/\s+/g, '')}`}
                  onClick={() => handleDirectCallMember(member)}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50/90 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200 whitespace-nowrap shrink-0"
                  title={`One-Tap Direct Call to ${member.name} (${member.phone})`}
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>{shortRole}</span>
                </a>
              );
            })}

            {/* Option 1: Directly Call Doctor */}
            <a
              href={`tel:${db.patient.primaryDoctor.phone.replace(/\s+/g, '')}`}
              onClick={handleDirectCallDoctor}
              className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50/80 px-3 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-200 whitespace-nowrap shrink-0"
            >
              <PhoneCall className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
              <span>{t.callDoctorBtn}</span>
            </a>

            {/* Option 2: Directly Dispatch Ambulance */}
            <button
              type="button"
              onClick={handleDirectDispatchAmbulance}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 whitespace-nowrap shrink-0"
            >
              <Ambulance className="h-4 w-4" />
              <span>{t.dispatchAmbulanceBtn}</span>
            </button>

            {/* Switch Profile (Netflix-style screen) */}
            <button
              type="button"
              onClick={() => setStage('profile_select')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0"
            >
              <Users className="h-3.5 w-3.5" />
              <span>{t.switchRoleBtn}</span>
            </button>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Toggle Contrast"
            >
              {highContrast ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Secluded Top-Right Corner Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                title="Change Language & Voice"
              >
                <Globe className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
                <span>{currentLangMeta.nativeName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 z-50 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  {INDIAN_LANGUAGES.map((l) => {
                    const active = l.code === lang;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setLang(l.code);
                          setLangMenuOpen(false);
                          speakText(TRANSLATIONS[l.code].greeting, l.code);
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          active
                            ? 'bg-teal-700 font-bold text-white'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{l.nativeName}</span>
                        <span className="font-mono text-[10px] opacity-75">
                          {l.englishName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Minimalist Navigation Bar */}
        <div className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-6 dark:border-slate-800/70">
          {allowedNavItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-teal-600'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Active Call Member / Doctor / Ambulance Status Banner */}
      {activeEmergencyBanner && (
        <div
          className={`border-b px-4 py-3 ${
            activeEmergencyBanner.type === 'ambulance'
              ? 'border-red-300 bg-red-600 text-white'
              : activeEmergencyBanner.type === 'member_call'
              ? 'border-emerald-300 bg-emerald-800 text-white'
              : 'border-teal-300 bg-teal-800 text-white'
          }`}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {activeEmergencyBanner.type === 'ambulance' ? (
                <Ambulance className="h-5 w-5 shrink-0 animate-bounce" />
              ) : (
                <PhoneCall className="h-5 w-5 shrink-0 animate-pulse" />
              )}
              <div>
                <div className="text-sm font-bold">{activeEmergencyBanner.title}</div>
                <div className="text-xs opacity-90">{activeEmergencyBanner.detail}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {audioPlaying && (
                <button
                  type="button"
                  onClick={stopSpeaking}
                  className="flex items-center gap-1 rounded-lg bg-black/30 px-3 py-1 text-xs font-bold hover:bg-black/40"
                >
                  <VolumeX className="h-3.5 w-3.5" />
                  <span>{stopVoiceText}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveEmergencyBanner(null)}
                className="rounded-lg bg-black/20 px-3 py-1 text-xs font-semibold hover:bg-black/30"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spoken Audio / Action Toast with Instant "Stop Voice" Control */}
      {(toastMessage || audioPlaying) && (
        <div className="fixed bottom-5 right-5 z-40 flex max-w-md items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900/95 px-4 py-3 text-xs font-medium text-white shadow-2xl">
          <div className="flex items-center gap-2.5">
            <Volume2
              className={`h-4 w-4 shrink-0 text-teal-400 ${
                audioPlaying ? 'animate-bounce' : ''
              }`}
            />
            <span className="line-clamp-3">
              {toastMessage || `Speaking in ${currentLangMeta.nativeName}...`}
            </span>
          </div>

          {audioPlaying && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 shrink-0"
            >
              <Square className="h-3 w-3 fill-current" />
              <span>{stopVoiceText}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Content Container */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Greeting + One-Tap Direct Calling Hub (Caregiver <-> Family <-> Patient + Doctor + Ambulance) */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={db.patient.avatarUrl}
                      alt={db.patient.fullName}
                      className="h-16 w-16 rounded-2xl border border-slate-200 object-cover"
                    />
                    <div>
                      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {t.greeting}
                      </h1>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        Blood Group <span className="font-mono font-bold">{db.patient.bloodGroup}</span> ·{' '}
                        {db.patient.primaryDoctor.name.split(',')[0]}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={audioPlaying ? stopSpeaking : handleReadScheduleAloud}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-colors ${
                        audioPlaying
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-teal-700 hover:bg-teal-800'
                      }`}
                    >
                      {audioPlaying ? (
                        <>
                          <Square className="h-4 w-4 fill-current" />
                          <span>{stopVoiceText}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-4 w-4" />
                          <span>
                            {t.speakSchedule} ({currentLangMeta.nativeName})
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <QrCode className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                      <span>{t.qrCardBtn}</span>
                    </button>
                  </div>
                </div>

                {/* Simple Progress Strip */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
                    <div className="text-xs font-semibold text-slate-500">
                      {t.dosesCompletedLabel}
                    </div>
                    <div className="mt-1 font-mono text-2xl font-bold text-teal-800 dark:text-teal-300 tabular-nums">
                      {takenDosesToday} / {totalDosesToday}
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
                    <div className="text-xs font-semibold text-slate-500">
                      {t.missedAlertLabel}
                    </div>
                    <div
                      className={`mt-1 font-mono text-2xl font-bold tabular-nums ${
                        missedDosesToday.length > 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {missedDosesToday.length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated One-Tap Direct Calling & Emergency Card:
                  - Call Caregiver / Call Family / Call Patient in 1 Tap
                  - Call Doctor in 1 Tap
                  - Dispatch 108 Ambulance in 1 Tap */}
              <div className="flex flex-col justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    One-Tap Care Circle &amp; Emergency Connect
                  </span>
                  <span className="font-mono text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                    Direct Dial
                  </span>
                </div>

                {/* One-Tap Direct Call Tiles for the Other 2 Care Circle Roles */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {otherCareCircleMembers.map((member) => {
                    const roleTitle =
                      member.role === 'caretaker'
                        ? 'Call Caregiver'
                        : member.role === 'family'
                        ? 'Call Family'
                        : 'Call Patient';
                    return (
                      <a
                        key={member.id}
                        href={`tel:${member.phone.replace(/\s+/g, '')}`}
                        onClick={() => handleDirectCallMember(member)}
                        className="flex items-center gap-3 rounded-xl border border-emerald-600/70 bg-emerald-50/70 p-3 text-left transition-colors hover:bg-emerald-100/80 dark:border-emerald-500/50 dark:bg-emerald-950/40"
                      >
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover border border-emerald-300 dark:border-emerald-700"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                            <PhoneCall className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                            <span className="truncate">{roleTitle}</span>
                          </div>
                          <div className="truncate text-xs font-semibold text-slate-800 dark:text-white">
                            {member.name.split(',')[0]}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {member.phone}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* One-Tap Call Doctor & One-Tap Dispatch Ambulance */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <a
                    href={`tel:${db.patient.primaryDoctor.phone.replace(/\s+/g, '')}`}
                    onClick={handleDirectCallDoctor}
                    className="flex items-center gap-3 rounded-xl border border-teal-600 bg-teal-50/70 p-3 text-left transition-colors hover:bg-teal-100/80 dark:border-teal-500/60 dark:bg-teal-950/40"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white">
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {t.callDoctorBtn}
                      </div>
                      <div className="truncate text-[11px] text-slate-600 dark:text-slate-300">
                        {db.patient.primaryDoctor.name.split(',')[0]}
                      </div>
                    </div>
                  </a>

                  <button
                    type="button"
                    onClick={handleDirectDispatchAmbulance}
                    className="flex items-center gap-3 rounded-xl bg-red-600 p-3 text-left text-white transition-colors hover:bg-red-700"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-800 text-white">
                      <Ambulance className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold">{t.dispatchAmbulanceBtn}</div>
                      <div className="truncate text-[11px] text-red-100">
                        108 Pune Dispatch
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================
                DEDICATED CAREGIVER CLINICAL COMMAND & SHIFT HUB (Only for Caregiver Role)
                ======================================================================== */}
            {currentMember.role === 'caretaker' && (
              <div className="rounded-2xl border-2 border-teal-600/80 bg-white p-6 shadow-xs dark:border-teal-500/60 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-700 text-white">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          Caregiver Clinical Command &amp; Shift Hub
                        </h2>
                        <span className="rounded-md bg-teal-100 px-2 py-0.5 font-mono text-[11px] font-bold text-teal-900 dark:bg-teal-950 dark:text-teal-300">
                          RN PIN Verified
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Record bedside vitals, broadcast shift handover notes to Family, and manage pillbox inventory
                      </p>
                    </div>
                  </div>

                  {/* Quick 1-Tap Caregiver Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    {pendingDosesToday.length > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          const nextPending = pendingDosesToday[0];
                          await handleDoseAction(
                            nextPending.med.id,
                            nextPending.slot.id,
                            'taken'
                          );
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                        <span>
                          Confirm Next Due ({pendingDosesToday[0].slot.scheduledTime})
                        </span>
                      </button>
                    )}

                    {lowStockMedications.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCaregiverBatchRestock}
                        className="flex items-center gap-1.5 rounded-xl border border-amber-500 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-200"
                      >
                        <PackagePlus className="h-4 w-4" />
                        <span>
                          Restock {lowStockMedications.length} Low-Stock Med(s)
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Left: Quick Bedside Vitals Logger */}
                  <form
                    onSubmit={handleCaregiverLogVital}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <HeartPulse className="h-4 w-4 text-rose-600" />
                        <span>Log Patient Bedside Vitals</span>
                      </span>
                      <div className="flex gap-1">
                        {[
                          { label: 'BP', type: 'Blood Pressure (BP)', val: '124/78 mmHg' },
                          { label: 'Sugar', type: 'Blood Glucose', val: '118 mg/dL' },
                          { label: 'SpO2', type: 'Oxygen Saturation (SpO2)', val: '98% on Room Air' },
                          { label: 'Temp/Pulse', type: 'Pulse & Temp', val: '74 bpm · 98.4°F' },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              setVitalType(preset.type);
                              setVitalValue(preset.val);
                            }}
                            className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700 hover:border-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Vital Sign Type
                        </label>
                        <input
                          type="text"
                          value={vitalType}
                          onChange={(e) => setVitalType(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500">
                          Recorded Value
                        </label>
                        <input
                          type="text"
                          value={vitalValue}
                          onChange={(e) => setVitalValue(e.target.value)}
                          placeholder="e.g., 126/80 mmHg"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={vitalNote}
                        onChange={(e) => setVitalNote(e.target.value)}
                        placeholder="Clinical observation note (optional)..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={notifyFamilyOnVital}
                          onChange={(e) => setNotifyFamilyOnVital(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-teal-700"
                        />
                        <span>Email reading to Family (Rohan)</span>
                      </label>

                      <button
                        type="submit"
                        disabled={savingVital}
                        className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:opacity-50"
                      >
                        {savingVital ? 'Logging...' : 'Record Vital'}
                      </button>
                    </div>
                  </form>

                  {/* Right: Caregiver Shift Handover & Observation Broadcast */}
                  <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                    <div>
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                        <Send className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                        <span>Caregiver Shift Handover &amp; Family Broadcast</span>
                      </span>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        One-tap clinical status updates sent directly to Family &amp; logged in patient history:
                      </p>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {[
                          'Morning vitals stable; breakfast & morning medicines taken on time.',
                          'Afternoon blood sugar & BP normal; Kamala Aaji rested comfortably.',
                          'Evening physiotherapy walk completed; no dizziness or ankle swelling.',
                        ].map((template, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendCaregiverHandover(template)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-700 hover:border-teal-600 hover:text-teal-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            + &ldquo;{template}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={handoverNote}
                        onChange={(e) => setHandoverNote(e.target.value)}
                        placeholder="Write custom shift handover note for family..."
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        disabled={sendingHandover || !handoverNote.trim()}
                        onClick={() => handleSendCaregiverHandover()}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500 whitespace-nowrap"
                      >
                        {sendingHandover ? 'Sending...' : 'Broadcast Note'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Missed Dose Alert (1-Tap Confirmation) */}
            {missedDosesToday.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-red-300 bg-red-50 p-5 dark:border-red-900/70 dark:bg-red-950/40">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400" />
                  <div>
                    <h2 className="text-base font-bold text-red-900 dark:text-red-200">
                      {missedDosesToday
                        .map(({ med, slot }) => `${slot.scheduledTime} — ${med.name} (${med.dosage})`)
                        .join(' · ')}
                    </h2>
                    <p className="text-xs text-red-800 dark:text-red-300">
                      {t.doseMissed}
                    </p>
                  </div>
                </div>

                {canConfirmPhysicalDose && (
                  <div className="flex items-center gap-2">
                    {missedDosesToday.map(({ med, slot }) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => handleDoseAction(med.id, slot.id, 'taken')}
                        className="flex items-center gap-2 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{t.oneTapConfirm}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Main 2-Column View: Today's Medicines + Daily Health Checklist */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t.todaysMedicationTimeline}
                  </h2>
                  <div className="flex items-center gap-2">
                    {audioPlaying && (
                      <button
                        type="button"
                        onClick={stopSpeaking}
                        className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-700"
                      >
                        <Square className="h-3 w-3 fill-current" />
                        <span>{stopVoiceText}</span>
                      </button>
                    )}
                    <span className="font-mono text-xs text-slate-500">
                      {currentMember.role === 'elderly'
                        ? 'Patient One-Tap Intake'
                        : currentMember.role === 'caretaker'
                        ? 'Caregiver Clinical View'
                        : 'Family Read-Only View'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {allTimelineSlots.map(({ med, slot }) => {
                    const isTaken = slot.status === 'taken';
                    const isMissed = slot.status === 'missed';
                    const medVisualPhoto = getMedicationThumbnailUrl(med);

                    return (
                      <div
                        key={slot.id}
                        className={`flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 ${
                          isMissed
                            ? 'border-red-300 bg-red-50/40 dark:border-red-900/60 dark:bg-red-950/20'
                            : isTaken
                            ? 'border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/30'
                            : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-14 w-16 flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-100 font-mono dark:border-slate-700 dark:bg-slate-800">
                            <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                              {slot.scheduledTime}
                            </span>
                            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300">
                              Box #{med.compartmentNumber}
                            </span>
                          </div>

                          <img
                            src={medVisualPhoto}
                            alt={`${med.name} visual identification thumbnail`}
                            className="h-14 w-20 shrink-0 rounded-lg border border-slate-200 object-cover shadow-2xs dark:border-slate-700"
                          />

                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {med.name}
                            </h3>
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                              {med.dosage} · {slot.label}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              speakText(
                                buildLocalizedDoseSpeech(
                                  lang,
                                  med.name,
                                  med.dosage,
                                  slot.scheduledTime,
                                  med.compartmentNumber,
                                  isTaken
                                )
                              )
                            }
                            className="rounded-lg border border-slate-200 p-3 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            title={`Listen in ${currentLangMeta.nativeName}`}
                          >
                            <Volume2 className="h-5 w-5" />
                          </button>

                          {audioPlaying && (
                            <button
                              type="button"
                              onClick={stopSpeaking}
                              className="rounded-lg bg-red-600 p-3 text-white hover:bg-red-700"
                              title={stopVoiceText}
                            >
                              <VolumeX className="h-5 w-5" />
                            </button>
                          )}

                          {canConfirmPhysicalDose ? (
                            !isTaken ? (
                              <button
                                type="button"
                                onClick={() => handleDoseAction(med.id, slot.id, 'taken')}
                                className="flex min-h-[48px] items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 whitespace-nowrap shrink-0"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                                <span>{t.oneTapConfirm}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDoseAction(med.id, slot.id, 'pending')}
                                className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 whitespace-nowrap shrink-0"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                <span>{t.doseTaken}</span>
                              </button>
                            )
                          ) : (
                            <span className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <Lock className="h-3.5 w-3.5" />
                              <span>
                                {isTaken ? t.doseTaken : isMissed ? t.doseMissed : t.dosePending}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Daily Routine + Role Access Summary */}
              <div className="space-y-6 lg:col-span-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {t.dailyRoutineTitle}
                      </h2>
                    </div>
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                      {db.dailyRoutine.filter((r) => r.completed).length}/{db.dailyRoutine.length}
                    </span>
                  </div>

                  <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {db.dailyRoutine.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center justify-between gap-3 py-3.5 first:pt-1 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            disabled={!canConfirmPhysicalDose}
                            checked={item.completed}
                            onChange={async () => {
                              await fetch(`/api/routine/${item.id}/toggle`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  actorName: currentMember.name,
                                  actorRole: currentMember.role,
                                }),
                              });
                            }}
                            className="mt-0.5 h-5 w-5 rounded border-slate-300 text-teal-700 disabled:opacity-50"
                          />
                          <div>
                            <div
                              className={`text-sm font-bold ${
                                item.completed
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="font-mono text-xs text-slate-500 tabular-nums">
                              {item.time}
                              {item.valueRecorded ? ` · ${item.valueRecorded}` : ''}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Role-Based Governance Card */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        OJAS Role Permissions
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStage('profile_select')}
                      className="text-xs font-bold text-teal-700 underline dark:text-teal-400"
                    >
                      {t.switchRoleBtn}
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                    {currentMember.role === 'elderly'
                      ? 'Patient Mode: Clinical prescription editing is locked for your safety. You can confirm daily medicine doses, call Caregiver or Family in 1 tap, and authorize or revoke Family/Caregiver access in Profile & Access.'
                      : currentMember.role === 'caretaker'
                      ? 'Caregiver Mode (PIN Verified): Authorized by patient to log clinical vitals, broadcast shift notes, manage medications, upload pill strip photos, and record consultation notes.'
                      : 'Family Mode: Read-only monitoring unless explicitly granted write permissions by Smt. Kamala Deshmukh. One-tap calling to Caregiver & Patient is always active.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Collapsible Smart Pillbox Hardware Sync */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setShowHardwareBox(!showHardwareBox)}
                className="flex w-full items-center justify-between text-left text-sm font-bold text-slate-800 dark:text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-teal-700 dark:text-teal-400" />
                  <span>OJAS Smart Pillbox Hardware (ESP32 · 6 LED Compartments)</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {showHardwareBox ? 'Hide' : 'Open'}
                  {showHardwareBox ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </span>
              </button>

              {showHardwareBox && (
                <div className="mt-4">
                  <HardwarePillboxPanel
                    hardware={db.hardware}
                    medications={db.medications}
                    actorName={currentMember.name}
                    actorRole={currentMember.role}
                    onSpeakText={speakText}
                    onSyncAction={async (action, compartmentNumber) => {
                      await fetch('/api/hardware/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action,
                          compartmentNumber,
                          actorName: currentMember.name,
                          actorRole: currentMember.role,
                        }),
                      });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <MedicationManager
            lang={lang}
            medications={db.medications}
            members={db.members}
            currentMember={currentMember}
            onDoseAction={handleDoseAction}
            onSpeakText={speakText}
            onAddMedication={async (med) => {
              const res = await fetch('/api/medications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  medication: med,
                }),
              });
              if (res.ok) {
                showToast(`Added ${med.name}.`);
              } else {
                const err = await res.json();
                showToast(err.error || 'Restricted for your role.');
              }
            }}
            onUpdateMedication={async (medId, updates) => {
              const res = await fetch(`/api/medications/${medId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  updates,
                }),
              });
              if (res.ok) {
                showToast('Medication updated.');
              } else {
                const err = await res.json();
                showToast(err.error || 'Restricted for your role.');
              }
            }}
            onDeleteMedication={async (medId) => {
              const res = await fetch(`/api/medications/${medId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                }),
              });
              if (res.ok) {
                showToast('Medication removed.');
              } else {
                const err = await res.json();
                showToast(err.error || 'Restricted for your role.');
              }
            }}
            onRefillMedication={async (medId, addedQuantity) => {
              await fetch(`/api/medications/${medId}/refill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  addedQuantity,
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                }),
              });
              showToast(`Restocked +${addedQuantity} tablets.`);
            }}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentManager
            appointments={db.appointments}
            members={db.members}
            currentMember={currentMember}
            onAddAppointment={async (apt: Partial<Appointment>) => {
              await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  appointment: apt,
                }),
              });
              showToast(`Appointment scheduled with ${apt.doctorName}.`);
            }}
            onUpdateAppointment={async (id, updates) => {
              await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  updates,
                }),
              });
              showToast('Appointment updated.');
            }}
            onSendReminderEmail={async (apt) => {
              await fetch('/api/notifications/send-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'appointment_reminder',
                  subject: `[OJAS OPD REMINDER] ${apt.doctorName} on ${apt.date} at ${apt.time}`,
                  body: `Reminder: ${db.patient.fullName} has an appointment with ${apt.doctorName} (${apt.specialty}) at ${apt.hospitalLocation} on ${apt.date} at ${apt.time}.`,
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                }),
              });
              showToast('Appointment reminder sent.');
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileAndAccessManager
            patient={db.patient}
            members={db.members}
            currentMember={currentMember}
            activityLogs={db.activityLogs}
            onOpenQrPassport={() => setQrModalOpen(true)}
            onUpdatePatient={async (updates) => {
              const res = await fetch('/api/patient', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  updates,
                }),
              });
              if (res.ok) showToast('Clinical profile updated.');
            }}
            onUploadReport={async (report) => {
              const res = await fetch('/api/patient/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  report,
                }),
              });
              if (res.ok) showToast(`Uploaded "${report.title}".`);
            }}
            onInviteMember={async (member) => {
              const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  member,
                }),
              });
              if (res.ok) showToast(`Authorized ${member.name}.`);
            }}
            onUpdateMember={async (id, updates) => {
              const res = await fetch(`/api/members/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  updates,
                }),
              });
              if (res.ok) showToast('Updated member access permissions.');
            }}
          />
        )}

        {activeTab === 'ai_alerts' && (
          <SmartAiAndNotifications
            notificationSettings={db.notificationSettings}
            emailLogs={db.emailLogs}
            currentMember={currentMember}
            onSpeakText={speakText}
            onAddSuggestedMedication={async (med) => {
              const res = await fetch('/api/medications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  medication: med,
                }),
              });
              if (res.ok) showToast(`Added AI schedule for ${med.name}.`);
            }}
            onUpdateSettings={async (settings) => {
              await fetch('/api/notifications/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                  settings,
                }),
              });
              showToast('Notification settings saved.');
            }}
            onSendManualNotification={async (payload) => {
              await fetch('/api/notifications/send-reminder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...payload,
                  actorName: currentMember.name,
                  actorRole: currentMember.role,
                }),
              });
              showToast('Alert dispatched.');
            }}
            onAcknowledgeNotification={async (id) => {
              await fetch(`/api/notifications/${id}/ack`, {
                method: 'POST',
              });
            }}
          />
        )}
      </main>

      {/* Emergency QR Medical ID Modal */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        patient={db.patient}
        medications={db.medications}
      />
    </div>
  );
}
