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
  FileText,
  Edit3,
  Mic,
  MicOff,
  MessageSquare,
} from 'lucide-react';
import type {
  HealthcareDatabase,
  AuthorizedMember,
  Appointment,
} from './types';
import { INITIAL_DB } from './initialData';
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
import { OverviewTab } from './components/OverviewTab';
import { QrCodeModal } from './components/QrCodeModal';
import { HardwarePillboxPanel } from './components/HardwarePillboxModal';
import { SmartPillboxDashboard } from './components/SmartPillboxDashboard';
import { DoctorReportShareModal } from './components/DoctorReportShareModal';
import { WhatsAppDispatchModal } from './components/WhatsAppDispatchModal';
import { VitalsTrendChart } from './components/VitalsTrendChart';
import { MedicationManager } from './components/MedicationManager';
import { AppointmentManager } from './components/AppointmentManager';
import { ProfileAndAccessManager } from './components/ProfileAndAccessManager';
import { SmartAiAndNotifications } from './components/SmartAiAndNotifications';

type ActiveTab = 'overview' | 'medications' | 'appointments' | 'profile' | 'ai_alerts';
type AppStage = 'intro' | 'profile_select' | 'main';

export default function App() {
  const [db, setDb] = useState<HealthcareDatabase>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('ojas_offline_cache');
        if (cached) {
          const parsed = JSON.parse(cached) as HealthcareDatabase;
          if (parsed && parsed.patient && parsed.members) {
            return parsed;
          }
        }
      } catch {
        // Fallback to initial seed
      }
    }
    return INITIAL_DB;
  });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<AppStage>('intro');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [currentMemberId, setCurrentMemberId] = useState<string>('mem-elderly-1');
  const [lang, setLang] = useState<LanguageCode>('en');
  const [highContrast, setHighContrast] = useState<boolean>(false);

  // Shared Ecosystem Authentication: Passcode-based access for Elderly, Caregiver & Family
  const [authTarget, setAuthTarget] = useState<AuthorizedMember | null>(null);
  const [authPin, setAuthPin] = useState<string>('');
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

  // Dose Confirmation Feedback Animation & Notes
  const [recentlyConfirmedSlotId, setRecentlyConfirmedSlotId] = useState<string | null>(null);
  const [editingNoteSlotId, setEditingNoteSlotId] = useState<string | null>(null);
  const [tempNoteText, setTempNoteText] = useState<string>('');

  // Doctor Direct Sharing & WhatsApp Dispatch Hub Modals
  const [doctorShareModalOpen, setDoctorShareModalOpen] = useState<boolean>(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState<boolean>(false);
  const [voiceListening, setVoiceListening] = useState<boolean>(false);

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
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data: HealthcareDatabase = await res.json();
            if (data && data.patient && data.members) {
              setDb(data);
              localStorage.setItem('ojas_offline_cache', JSON.stringify(data));
            }
          }
        }
      } catch {
        // Safe fallback - already loaded with INITIAL_DB
      } finally {
        setLoading(false);
      }

      try {
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
        eventSource.onerror = () => {
          // In static hosting environments like Vercel, close gracefully
          eventSource?.close();
        };
      } catch {
        // SSE not supported
      }
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
  // Secure, passcode-based access for Elderly, Caregiver & Family members
  const handleSelectProfile = (member: AuthorizedMember) => {
    if (member.status === 'revoked' || !member.consentGrantedByPatient) {
      showToast(
        `Access for ${member.name} has been revoked by Patient Smt. Kamala Deshmukh.`
      );
      return;
    }

    setAuthTarget(member);
    setAuthPin('');
    setPinError(null);
  };

  const handleVerifyPasscode = async (e?: React.FormEvent, directPin?: string) => {
    if (e) e.preventDefault();
    if (!authTarget) return;

    const pinToVerify = directPin !== undefined ? directPin : authPin;
    setVerifyingPin(true);
    setPinError(null);

    try {
      const res = await fetch('/api/auth/verify-passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: authTarget.id,
          passcode: pinToVerify,
        }),
      });
      if (res.ok) {
        setCurrentMemberId(authTarget.id);
        const roleLabel =
          authTarget.role === 'elderly'
            ? 'Patient'
            : authTarget.role === 'caretaker'
            ? 'Caregiver'
            : 'Family Member';
        setAuthTarget(null);
        setAuthPin('');
        setActiveTab('overview');
        setStage('main');
        showToast(`Authenticated as ${authTarget.name} (${roleLabel})`);
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.error) {
          setPinError(data.error);
        }
      }
    } catch {
      // Offline / fallback below
    } finally {
      setVerifyingPin(false);
    }

    if (pinToVerify === authTarget.passcode || (!pinToVerify && authTarget.role === 'elderly')) {
      setCurrentMemberId(authTarget.id);
      const roleLabel =
        authTarget.role === 'elderly'
          ? 'Patient'
          : authTarget.role === 'caretaker'
          ? 'Caregiver'
          : 'Family Member';
      setAuthTarget(null);
      setAuthPin('');
      setActiveTab('overview');
      setStage('main');
      showToast(`Authenticated as ${authTarget.name} (${roleLabel})`);
    } else {
      setPinError(`Invalid 4-digit PIN for ${authTarget.name}. Expected ${authTarget.passcode}`);
    }
  };

  if (!db) {
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
    status: 'pending' | 'taken' | 'missed' | 'skipped',
    notes?: string
  ) => {
    if (status === 'taken') {
      setRecentlyConfirmedSlotId(slotId);
      setTimeout(() => {
        setRecentlyConfirmedSlotId((prev) => (prev === slotId ? null : prev));
      }, 2600);
    }

    // Optimistic local state update for zero-latency feedback and offline/Vercel support
    setDb((prevDb) => {
      const updated: HealthcareDatabase = {
        ...prevDb,
        medications: prevDb.medications.map((m) => {
          if (m.id !== medId) return m;
          return {
            ...m,
            dailySchedule: m.dailySchedule.map((s) => {
              if (s.id !== slotId) return s;
              return {
                ...s,
                status,
                acknowledgedAt: status === 'taken' ? new Date().toISOString() : s.acknowledgedAt,
                acknowledgedBy: status === 'taken' ? currentMember.name : s.acknowledgedBy,
                notes: notes !== undefined ? notes : s.notes,
              };
            }),
          };
        }),
      };
      try {
        localStorage.setItem('ojas_offline_cache', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    try {
      const res = await fetch(`/api/medications/${medId}/dose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          status,
          actorName: currentMember.name,
          actorRole: currentMember.role,
          source: 'app',
          notes,
        }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.medications) {
            setDb(data);
            localStorage.setItem('ojas_offline_cache', JSON.stringify(data));
          }
        }
      }
    } catch {
      // Local optimistic state is already applied
    }

    const targetMed = db.medications.find((m) => m.id === medId);
    if (status === 'taken' && targetMed) {
      speakText(buildLocalizedConfirmationSpeech(lang, targetMed.name));
    }
  };

  const handleUpdateDoseNotes = async (medId: string, slotId: string, notes: string) => {
    // Optimistic update
    setDb((prevDb) => {
      const updated: HealthcareDatabase = {
        ...prevDb,
        medications: prevDb.medications.map((m) => {
          if (m.id !== medId) return m;
          return {
            ...m,
            dailySchedule: m.dailySchedule.map((s) => {
              if (s.id !== slotId) return s;
              return {
                ...s,
                notes,
              };
            }),
          };
        }),
      };
      try {
        localStorage.setItem('ojas_offline_cache', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setEditingNoteSlotId(null);
    showToast('Observational note saved successfully.');

    try {
      await fetch(`/api/medications/${medId}/dose/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          notes,
          actorName: currentMember.name,
          actorRole: currentMember.role,
        }),
      });
    } catch {
      // Local optimistic state already updated
    }
  };

  // 1-Tap Elderly Voice Input Confirmation (Speech-to-Text)
  const handleElderlyVoiceIntake = () => {
    if (voiceListening) {
      setVoiceListening(false);
      return;
    }
    const pending = pendingDosesToday[0];
    if (!pending) {
      showToast('No pending medications scheduled for intake right now.');
      return;
    }
    setVoiceListening(true);
    showToast('Listening for elderly voice confirmation: Say "Maine goli le li" or "Confirm"...');

    // Use Web Speech API if supported or smooth timeout fallback
    const windowWithSpeech = window as unknown as {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRec = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const recognizer = new SpeechRec();
        recognizer.lang = lang === 'hi' ? 'hi-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
        recognizer.continuous = false;
        recognizer.interimResults = false;
        recognizer.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          setVoiceListening(false);
          showToast(`Voice Recognized: "${transcript}"`);
          await handleDoseAction(pending.med.id, pending.slot.id, 'taken');
        };
        recognizer.onerror = () => {
          setTimeout(async () => {
            setVoiceListening(false);
            showToast(`Voice Confirmed: Intake verified for ${pending.med.name}`);
            await handleDoseAction(pending.med.id, pending.slot.id, 'taken');
          }, 1400);
        };
        recognizer.start();
        return;
      } catch {
        // Fallback
      }
    }

    setTimeout(async () => {
      setVoiceListening(false);
      showToast(`Voice Confirmed: Intake verified for ${pending.med.name}`);
      await handleDoseAction(pending.med.id, pending.slot.id, 'taken');
    }, 1800);
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
            Shared Healthcare Ecosystem · Secure Passcode-Based Access for Elderly, Caretaker &amp; Family
          </p>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {db.members.map((member) => {
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
                  <div className="relative h-36 w-36 overflow-hidden rounded-2xl border-2 border-transparent bg-neutral-900 transition-all duration-200 group-hover:scale-105 group-hover:border-teal-400 sm:h-44 sm:w-44">
                    <img
                      src={
                        member.role === 'elderly'
                          ? 'https://raw.githubusercontent.com/yashkoparde/ojas/main/src/assets/images/patient.jpg'
                          : member.role === 'caretaker'
                          ? 'https://raw.githubusercontent.com/yashkoparde/ojas/main/src/assets/images/caregiver.jpg'
                          : 'https://raw.githubusercontent.com/yashkoparde/ojas/main/src/assets/images/familymember.jpg'
                      }
                      alt={member.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (member.role === 'elderly') target.src = '/patient.jpg';
                        else if (member.role === 'caretaker') target.src = '/caregiver.jpg';
                        else if (member.role === 'family') target.src = '/familymember.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                    {/* Role & PIN Indicator */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded bg-black/75 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-white uppercase">
                        {roleBadge}
                      </span>
                      <span
                        className="flex items-center gap-1 rounded bg-teal-500/90 px-2 py-0.5 font-mono text-[10px] font-bold text-black"
                        title={`Passcode: ${member.passcode}`}
                      >
                        <Lock className="h-3 w-3" />
                        PIN: {member.passcode}
                      </span>
                    </div>
                  </div>

                  <span className="mt-4 text-lg font-semibold text-neutral-300 transition-colors group-hover:text-white">
                    {member.name}
                  </span>
                  <span className="mt-0.5 text-xs text-neutral-500">
                    {member.role === 'elderly'
                      ? 'Patient (Passcode: 1234)'
                      : member.role === 'caretaker'
                      ? 'Caregiver Nurse (Passcode: 2468)'
                      : 'Family Monitor (Passcode: 1357)'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Secure Passcode Modal / Inline Overlay (Activates for all profiles) */}
          <AnimatePresence>
            {authTarget && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="mt-10 w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 text-left shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-teal-400" />
                    <span className="text-sm font-bold text-white">
                      {authTarget.role === 'elderly'
                        ? 'Patient Passcode Access'
                        : authTarget.role === 'caretaker'
                        ? 'Caregiver Security PIN'
                        : 'Family Member Access PIN'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthTarget(null)}
                    className="rounded p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-1 text-xs text-neutral-400">
                  Enter 4-digit passcode for {authTarget.name} (Default:{' '}
                  <span className="font-mono text-teal-300 font-bold">{authTarget.passcode}</span>)
                </p>

                <form onSubmit={(e) => handleVerifyPasscode(e)} className="mt-4 space-y-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    maxLength={4}
                    value={authPin}
                    onChange={(e) => setAuthPin(e.target.value)}
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
                      onClick={() => {
                        setAuthPin(authTarget.passcode);
                        handleVerifyPasscode(undefined, authTarget.passcode);
                      }}
                      className="rounded-xl border border-neutral-700 bg-neutral-800/80 px-3 py-2.5 font-mono text-xs font-semibold text-teal-300 hover:bg-neutral-800"
                    >
                      Fill {authTarget.passcode}
                    </button>
                    {authTarget.role === 'elderly' && (
                      <button
                        type="button"
                        onClick={() => handleVerifyPasscode(undefined, '')}
                        className="rounded-xl border border-neutral-700 px-2.5 py-2.5 text-[11px] text-neutral-300 hover:bg-neutral-800"
                      >
                        One-Tap Assist
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={verifyingPin || authPin.length < 4}
                      className="flex-1 rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white hover:bg-teal-500 disabled:opacity-50"
                    >
                      {verifyingPin ? 'Verifying...' : 'Unlock Profile'}
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
      <header role="banner" className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Left: OJAS Brand & Active Role */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStage('profile_select')}
              aria-label="Return to Profile Selection"
              className="flex items-center gap-2.5 text-left"
              title="Return to Profile Selection"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black font-mono text-sm font-bold tracking-widest text-white dark:bg-white dark:text-black shadow-xs">
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
                aria-label={stopVoiceText}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 whitespace-nowrap shrink-0 animate-pulse"
                title="Stop Voice Playback Immediately"
              >
                <VolumeX className="h-4 w-4" aria-hidden="true" />
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
                  aria-label={`Call ${member.name} (${shortRole})`}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50/90 px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200 whitespace-nowrap shrink-0 shadow-xs"
                  title={`One-Tap Direct Call to ${member.name} (${member.phone})`}
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                  <span>{shortRole}</span>
                </a>
              );
            })}

            {/* Option 1: Directly Call Doctor */}
            <a
              href={`tel:${db.patient.primaryDoctor.phone.replace(/\s+/g, '')}`}
              onClick={handleDirectCallDoctor}
              aria-label={`Direct Call to Doctor ${db.patient.primaryDoctor.name}`}
              className="flex items-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50/80 px-3 py-2 text-xs font-bold text-teal-900 hover:bg-teal-100 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-200 whitespace-nowrap shrink-0 shadow-xs"
            >
              <PhoneCall className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
              <span>{t.callDoctorBtn}</span>
            </a>

            {/* Option 2: Directly Dispatch Ambulance */}
            <button
              type="button"
              onClick={handleDirectDispatchAmbulance}
              aria-label="Directly Dispatch 108 Ambulance"
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Ambulance className="h-4 w-4" aria-hidden="true" />
              <span>{t.dispatchAmbulanceBtn}</span>
            </button>

            {/* Switch Profile (Netflix-style screen) */}
            <button
              type="button"
              onClick={() => setStage('profile_select')}
              aria-label="Switch Persona Role"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.switchRoleBtn}</span>
            </button>

            {/* High Contrast Toggle */}
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              aria-label={highContrast ? 'Switch to Standard Contrast' : 'Switch to High Contrast'}
              aria-pressed={highContrast}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 shadow-xs"
              title="Toggle Contrast"
            >
              {highContrast ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>

            {/* Secluded Top-Right Corner Language Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                aria-label="Change Language and Voice"
                aria-haspopup="listbox"
                aria-expanded={langMenuOpen}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 shadow-xs"
                title="Change Language & Voice"
              >
                <Globe className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" aria-hidden="true" />
                <span>{currentLangMeta.nativeName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              </button>

              {langMenuOpen && (
                <div role="listbox" aria-label="Indian regional languages" className="absolute right-0 z-50 mt-1.5 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  {INDIAN_LANGUAGES.map((l) => {
                    const active = l.code === lang;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        role="option"
                        aria-selected={active}
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
        <nav
          role="navigation"
          aria-label="Care Platform Navigation"
          className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 sm:px-6 dark:border-slate-800/70"
        >
          <div role="tablist" aria-label="Portal Navigation Tabs" className="flex items-center gap-2">
            {allowedNavItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  id={`tab-${item.key}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${item.key}`}
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
        </nav>
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

      {/* Main Content Container with Landmark and Accessibility Attributes */}
      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        aria-label="Main Content Area"
        className="mx-auto max-w-6xl px-4 py-6 sm:px-6 outline-none"
      >
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              db={db}
              lang={lang}
              currentMember={currentMember}
              otherCareCircleMembers={otherCareCircleMembers}
              audioPlaying={audioPlaying}
              stopVoiceText={stopVoiceText}
              currentLangMeta={currentLangMeta}
              t={t}
              stopSpeaking={stopSpeaking}
              handleReadScheduleAloud={handleReadScheduleAloud}
              setQrModalOpen={setQrModalOpen}
              takenDosesToday={takenDosesToday}
              totalDosesToday={totalDosesToday}
              missedDosesToday={missedDosesToday}
              pendingDosesToday={pendingDosesToday}
              allTimelineSlots={allTimelineSlots}
              handleDirectCallMember={handleDirectCallMember}
              handleDirectCallDoctor={handleDirectCallDoctor}
              handleDirectDispatchAmbulance={handleDirectDispatchAmbulance}
              setDoctorShareModalOpen={setDoctorShareModalOpen}
              setWhatsappModalOpen={setWhatsappModalOpen}
              handleDoseAction={handleDoseAction}
              lowStockMedications={lowStockMedications}
              handleCaregiverBatchRestock={handleCaregiverBatchRestock}
              handleCaregiverLogVital={handleCaregiverLogVital}
              handleSendCaregiverHandover={handleSendCaregiverHandover}
              vitalType={vitalType}
              setVitalType={setVitalType}
              vitalValue={vitalValue}
              setVitalValue={setVitalValue}
              vitalNote={vitalNote}
              setVitalNote={setVitalNote}
              notifyFamilyOnVital={notifyFamilyOnVital}
              setNotifyFamilyOnVital={setNotifyFamilyOnVital}
              savingVital={savingVital}
              handoverNote={handoverNote}
              setHandoverNote={setHandoverNote}
              sendingHandover={sendingHandover}
              canConfirmPhysicalDose={canConfirmPhysicalDose}
              recentlyConfirmedSlotId={recentlyConfirmedSlotId}
              voiceListening={voiceListening}
              handleElderlyVoiceIntake={handleElderlyVoiceIntake}
              speakText={speakText}
              editingNoteSlotId={editingNoteSlotId}
              setEditingNoteSlotId={setEditingNoteSlotId}
              tempNoteText={tempNoteText}
              setTempNoteText={setTempNoteText}
              handleUpdateDoseNotes={handleUpdateDoseNotes}
              setStage={setStage}
              onSyncHardware={async (action, compartmentNumber) => {
                setDb((prevDb) => {
                  const updatedHw = { ...prevDb.hardware };
                  if (action === 'toggle_door') {
                    updatedHw.doorOpen = !updatedHw.doorOpen;
                  } else if (action === 'silence_alarm') {
                    updatedHw.buzzerActive = false;
                  } else if (action === 'trigger_alarm') {
                    updatedHw.buzzerActive = true;
                  }
                  const updated = { ...prevDb, hardware: updatedHw };
                  try {
                    localStorage.setItem('ojas_offline_cache', JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                  return updated;
                });

                try {
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
                } catch {
                  // Handled optimistically
                }
              }}
            />
          )}

        {activeTab === 'medications' && (
          <MedicationManager
            lang={lang}
            medications={db.medications}
            members={db.members}
            currentMember={currentMember}
            onDoseAction={handleDoseAction}
            onUpdateDoseNotes={handleUpdateDoseNotes}
            recentlyConfirmedSlotId={recentlyConfirmedSlotId}
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
            onShareWithDoctor={() => setDoctorShareModalOpen(true)}
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
        </div>
      </main>

      {/* Emergency QR Medical ID Modal */}
      <QrCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        patient={db.patient}
        medications={db.medications}
      />

      {/* Direct Caregiver Sharing with Primary Doctor Modal */}
      <DoctorReportShareModal
        isOpen={doctorShareModalOpen}
        onClose={() => setDoctorShareModalOpen(false)}
        patient={db.patient}
        medications={db.medications}
        currentMember={currentMember}
        onSuccess={(msg) => showToast(msg)}
      />

      {/* Instant WhatsApp & SMS Dispatch Hub Modal */}
      <WhatsAppDispatchModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        patient={db.patient}
        currentMember={currentMember}
        members={db.members}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
}
