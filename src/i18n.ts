export type LanguageCode =
  | 'en'
  | 'hi'
  | 'kn'
  | 'mr'
  | 'ta'
  | 'ml'
  | 'te'
  | 'gu'
  | 'bn'
  | 'pa';

export interface LanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  speechLang: string;
}

export const INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', speechLang: 'hi-IN' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', speechLang: 'kn-IN' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', speechLang: 'mr-IN' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', speechLang: 'ta-IN' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', speechLang: 'bn-IN' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', speechLang: 'ml-IN' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', speechLang: 'te-IN' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', speechLang: 'gu-IN' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', speechLang: 'pa-IN' },
  { code: 'en', nativeName: 'English', englishName: 'English', speechLang: 'en-IN' },
];

/**
 * Explicit mapping and priority ranking of Indian language codes
 * (specifically prioritizing Marathi, Tamil, Kannada, and Bengali native system voices)
 * to high-quality Natural/Neural/Google/Microsoft/Apple SpeechSynthesis voices.
 */
export interface VoiceLocaleSpec {
  preferredVoiceNames: string[];
  bcp47Tags: string[];
  nameTokens: string[];
}

export const BROWSER_VOICE_LOCALE_MAP: Record<LanguageCode, VoiceLocaleSpec> = {
  mr: {
    preferredVoiceNames: [
      'Microsoft Aarohi Online (Natural)',
      'Microsoft Manohar Online (Natural)',
      'Google मराठी',
      'Google Marathi',
      'Microsoft Aarohi',
      'Microsoft Manohar',
      'Ananya',
    ],
    bcp47Tags: ['mr-in', 'mr_in', 'mr'],
    nameTokens: ['marathi', 'मराठी', 'mr-in', 'aarohi', 'manohar'],
  },
  ta: {
    preferredVoiceNames: [
      'Microsoft Pallavi Online (Natural)',
      'Microsoft Valluvar Online (Natural)',
      'Google தமிழ்',
      'Google Tamil',
      'Microsoft Anbu Online (Natural)',
      'Microsoft Kani Online (Natural)',
      'Vani',
      'Microsoft Pallavi',
      'Microsoft Valluvar',
    ],
    bcp47Tags: ['ta-in', 'ta_in', 'ta-sg', 'ta-lk', 'ta-my', 'ta'],
    nameTokens: ['tamil', 'தமிழ்', 'ta-in', 'pallavi', 'valluvar', 'anbu', 'kani', 'vani'],
  },
  kn: {
    preferredVoiceNames: [
      'Microsoft Sapna Online (Natural)',
      'Microsoft Gagan Online (Natural)',
      'Google ಕನ್ನಡ',
      'Google Kannada',
      'Microsoft Sapna',
      'Microsoft Gagan',
      'Soumya',
    ],
    bcp47Tags: ['kn-in', 'kn_in', 'kn'],
    nameTokens: ['kannada', 'ಕನ್ನಡ', 'kn-in', 'sapna', 'gagan', 'soumya'],
  },
  bn: {
    preferredVoiceNames: [
      'Microsoft Tanishaa Online (Natural)',
      'Microsoft Bashkar Online (Natural)',
      'Google বাংলা',
      'Google Bengali',
      'Microsoft Nabanita Online (Natural)',
      'Microsoft Pradeep Online (Natural)',
      'Microsoft Tanishaa',
      'Microsoft Bashkar',
      'Piya',
    ],
    bcp47Tags: ['bn-in', 'bn_in', 'bn-bd', 'bn_bd', 'bn'],
    nameTokens: [
      'bengali',
      'bangla',
      'বাংলা',
      'bn-in',
      'bn-bd',
      'tanishaa',
      'bashkar',
      'nabanita',
      'pradeep',
      'piya',
    ],
  },
  hi: {
    preferredVoiceNames: [
      'Microsoft Swara Online (Natural)',
      'Microsoft Madhur Online (Natural)',
      'Google हिन्दी',
      'Google Hindi',
      'Lekha',
      'Microsoft Swara',
      'Microsoft Madhur',
    ],
    bcp47Tags: ['hi-in', 'hi_in', 'hi'],
    nameTokens: ['hindi', 'हिन्दी', 'hi-in', 'swara', 'madhur', 'lekha'],
  },
  ml: {
    preferredVoiceNames: [
      'Microsoft Sobhana Online (Natural)',
      'Microsoft Midhun Online (Natural)',
      'Google മലയാളം',
      'Google Malayalam',
    ],
    bcp47Tags: ['ml-in', 'ml_in', 'ml'],
    nameTokens: ['malayalam', 'മലയാളം', 'ml-in', 'sobhana', 'midhun'],
  },
  te: {
    preferredVoiceNames: [
      'Microsoft Shruti Online (Natural)',
      'Microsoft Mohan Online (Natural)',
      'Google తెలుగు',
      'Google Telugu',
    ],
    bcp47Tags: ['te-in', 'te_in', 'te'],
    nameTokens: ['telugu', 'తెలుగు', 'te-in', 'shruti', 'mohan'],
  },
  gu: {
    preferredVoiceNames: [
      'Microsoft Dhwani Online (Natural)',
      'Microsoft Niranjan Online (Natural)',
      'Google ગુજરાતી',
      'Google Gujarati',
    ],
    bcp47Tags: ['gu-in', 'gu_in', 'gu'],
    nameTokens: ['gujarati', 'ગુજરાતી', 'gu-in', 'dhwani', 'niranjan'],
  },
  pa: {
    preferredVoiceNames: [
      'Google ਪੰਜਾਬੀ',
      'Google Punjabi',
    ],
    bcp47Tags: ['pa-in', 'pa_in', 'pa'],
    nameTokens: ['punjabi', 'ਪੰਜਾਬੀ', 'gurmukhi', 'pa-in'],
  },
  en: {
    preferredVoiceNames: [
      'Microsoft Neerja Online (Natural)',
      'Microsoft Prabhat Online (Natural)',
      'Google English (India)',
      'Rishi',
      'Veena',
    ],
    bcp47Tags: ['en-in', 'en_in', 'en-gb', 'en-us', 'en'],
    nameTokens: ['india', 'neerja', 'prabhat', 'rishi', 'veena', 'en-in'],
  },
};

/**
 * Selects and ranks the highest-quality native browser SpeechSynthesisVoice
 * for Marathi, Tamil, Kannada, Bengali, and other Indian languages.
 * Returns null if no genuine voice for that language exists locally so the caller
 * can fall back to the server-side regional TTS engine.
 */
export function selectBestBrowserVoice(
  lang: LanguageCode,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;
  const spec = BROWSER_VOICE_LOCALE_MAP[lang] || BROWSER_VOICE_LOCALE_MAP.en;

  let bestVoice: SpeechSynthesisVoice | null = null;
  let bestScore = 0;

  for (const voice of voices) {
    const normalizedLang = (voice.lang || '').toLowerCase().replace(/_/g, '-');
    const normalizedName = (voice.name || '').toLowerCase();
    const normalizedUri = (voice.voiceURI || '').toLowerCase();

    let score = 0;

    // 1. Check explicit high-priority native voice names (Aarohi, Pallavi, Sapna, Tanishaa, Google मराठी/தமிழ்/ಕನ್ನಡ/বাংলা)
    const prefIdx = spec.preferredVoiceNames.findIndex((pref) =>
      normalizedName.includes(pref.toLowerCase())
    );
    if (prefIdx !== -1) {
      score += 120 - prefIdx * 5;
    }

    // 2. Check exact BCP-47 tag match (e.g. 'mr-in', 'ta-in', 'kn-in', 'bn-in')
    const exactTagIdx = spec.bcp47Tags.findIndex((tag) => normalizedLang === tag);
    if (exactTagIdx !== -1) {
      score += 70 - exactTagIdx * 5;
    } else {
      // Check primary subtag prefix match (e.g. 'mr', 'ta', 'kn', 'bn')
      const primaryPrefix = spec.bcp47Tags[0].split('-')[0];
      if (
        normalizedLang === primaryPrefix ||
        normalizedLang.startsWith(`${primaryPrefix}-`)
      ) {
        score += 45;
      }
    }

    // 3. Check native language/voice name tokens
    const matchedToken = spec.nameTokens.some(
      (token) => normalizedName.includes(token) || normalizedUri.includes(token)
    );
    if (matchedToken) {
      score += 35;
    }

    // Only consider this voice if it actually matched the target language
    if (score > 0) {
      // Boost high-quality neural/natural/cloud voices
      if (normalizedName.includes('natural') || normalizedName.includes('neural')) {
        score += 30;
      }
      if (normalizedName.includes('google') || normalizedName.includes('microsoft')) {
        score += 20;
      }
      if (voice.default) {
        score += 5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }
  }

  return bestVoice;
}

export interface Translations {
  appName: string;
  greeting: string;
  chooseLanguageLabel: string;
  navOverview: string;
  navMedications: string;
  navAppointments: string;
  navProfileAndAccess: string;
  navSmartAiAndAlerts: string;
  emergencySos: string;
  callDoctorBtn: string;
  dispatchAmbulanceBtn: string;
  speakSchedule: string;
  stopVoiceBtn?: string;
  voiceAssistantBtn: string;
  todaysMedicationTimeline: string;
  oneTapConfirm: string;
  markTaken: string;
  markSkipped: string;
  doseTaken: string;
  doseMissed: string;
  dosePending: string;
  doseSkipped: string;
  dailyRoutineTitle: string;
  switchRoleBtn: string;
  qrCardBtn: string;
  dosesCompletedLabel: string;
  missedAlertLabel: string;
  nextDoctorVisitLabel: string;
  voiceScheduleIntro: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  hi: {
    appName: 'OJAS · ओजस्',
    greeting: 'नमस्ते, कमला आजी',
    chooseLanguageLabel: 'भाषा',
    navOverview: 'आज की दवा',
    navMedications: 'दवाइयाँ',
    navAppointments: 'अपॉइंटमेंट',
    navProfileAndAccess: 'प्रोफ़ाइल व अधिकार',
    navSmartAiAndAlerts: 'AI सहायक',
    emergencySos: 'आपातकालीन SOS',
    callDoctorBtn: 'डॉक्टर को कॉल करें',
    dispatchAmbulanceBtn: 'एम्बुलेंस बुलाएं (108)',
    speakSchedule: 'आवाज़ में सुनें',
    voiceAssistantBtn: 'बोलकर बताएं',
    todaysMedicationTimeline: 'आज की दवाइयों का समय',
    oneTapConfirm: 'दवा ले ली ✓',
    markTaken: 'दवा ले ली',
    markSkipped: 'छोड़ें',
    doseTaken: 'ले ली गई',
    doseMissed: 'छूट गई · नर्स को सूचित किया',
    dosePending: 'बाकी है',
    doseSkipped: 'छोड़ी गई',
    dailyRoutineTitle: 'दैनिक स्वास्थ्य दिनचर्या',
    switchRoleBtn: 'प्रोफ़ाइल बदलें',
    qrCardBtn: 'QR कार्ड',
    dosesCompletedLabel: 'आज ली गई दवाइयाँ',
    missedAlertLabel: 'छूटी हुई दवा',
    nextDoctorVisitLabel: 'अगली डॉक्टर भेंट',
    voiceScheduleIntro: 'नमस्ते कमला आजी, ओजस् पर आज की आपकी दवाइयों का समय इस प्रकार है:',
  },
  kn: {
    appName: 'OJAS · ಓಜಸ್',
    greeting: 'ನಮಸ್ಕಾರ, ಕಮಲಾ ಅಜ್ಜಿ',
    chooseLanguageLabel: 'ಭಾಷೆ',
    navOverview: 'ಇಂದಿನ ಔಷಧಿ',
    navMedications: 'ಔಷಧಿಗಳು',
    navAppointments: 'ವೈದ್ಯರ ಭೇಟಿ',
    navProfileAndAccess: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಅನುಮತಿ',
    navSmartAiAndAlerts: 'AI ಸಹಾಯಕ',
    emergencySos: 'ತುರ್ತು SOS',
    callDoctorBtn: 'ವೈದ್ಯರಿಗೆ ಕರೆ ಮಾಡಿ',
    dispatchAmbulanceBtn: 'ಆಂಬ್ಯುಲೆನ್ಸ್ ಕರೆಸಿ (108)',
    speakSchedule: 'ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ',
    voiceAssistantBtn: 'ಮಾತನಾಡಿ',
    todaysMedicationTimeline: 'ಇಂದಿನ ಔಷಧಿ ಸಮಯಪಟ್ಟಿ',
    oneTapConfirm: 'ಔಷಧಿ ತೆಗೆದುಕೊಂಡೆ ✓',
    markTaken: 'ತೆಗೆದುಕೊಂಡೆ',
    markSkipped: 'ಬಿಟ್ಟುಬಿಡಿ',
    doseTaken: 'ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ',
    doseMissed: 'ತಪ್ಪಿದೆ · ನರ್ಸ್‌ಗೆ ತಿಳಿಸಲಾಗಿದೆ',
    dosePending: 'ಬಾಕಿ ಇದೆ',
    doseSkipped: 'ಬಿಡಲಾಗಿದೆ',
    dailyRoutineTitle: 'ದೈನಂದಿನ ಆರೋಗ್ಯ ದಿನಚರಿ',
    switchRoleBtn: 'ಪ್ರೊಫೈಲ್ ಬದಲಿಸಿ',
    qrCardBtn: 'QR ಕಾರ್ಡ್',
    dosesCompletedLabel: 'ಇಂದು ತೆಗೆದುಕೊಂಡ ಔಷಧಿ',
    missedAlertLabel: 'ತಪ್ಪಿದ ಔಷಧಿ',
    nextDoctorVisitLabel: 'ಮುಂದಿನ ವೈದ್ಯರ ಭೇಟಿ',
    voiceScheduleIntro: 'ನಮಸ್ಕಾರ ಕಮಲಾ ಅಜ್ಜಿ, ಓಜಸ್ ನಲ್ಲಿ ಇಂದಿನ ನಿಮ್ಮ ಔಷಧಿಗಳ ಮಾಹಿತಿ ಇಲ್ಲಿದೆ:',
  },
  mr: {
    appName: 'OJAS · ओजस्',
    greeting: 'नमस्कार, कमला आजी',
    chooseLanguageLabel: 'भाषा',
    navOverview: 'आजची औषधे',
    navMedications: 'औषधे',
    navAppointments: 'डॉक्टर भेट',
    navProfileAndAccess: 'प्रोफाईल आणि संमती',
    navSmartAiAndAlerts: 'AI मदतनीस',
    emergencySos: 'तातडीची SOS मदत',
    callDoctorBtn: 'डॉक्टरांना कॉल करा',
    dispatchAmbulanceBtn: 'रुग्णवाहिका बोलवा (108)',
    speakSchedule: 'आवाजात ऐका',
    voiceAssistantBtn: 'बोलून सांगा',
    todaysMedicationTimeline: 'आजचे औषधांचे वेळापत्रक',
    oneTapConfirm: 'औषध घेतले ✓',
    markTaken: 'औषध घेतले',
    markSkipped: 'वगळा',
    doseTaken: 'घेतले',
    doseMissed: 'राहिले · नर्सला कळवले',
    dosePending: 'बाकी आहे',
    doseSkipped: 'वगळले',
    dailyRoutineTitle: 'दैनंदिन आरोग्य दिनचर्या',
    switchRoleBtn: 'प्रोफाईल बदला',
    qrCardBtn: 'QR कार्ड',
    dosesCompletedLabel: 'आज घेतलेली औषधे',
    missedAlertLabel: 'राहिलेला डोस',
    nextDoctorVisitLabel: 'पुढील डॉक्टर भेट',
    voiceScheduleIntro: 'नमस्कार कमला आजी, ओजस् वर आजच्या तुमच्या औषधांची वेळ खालीलप्रमाणे आहे:',
  },
  ta: {
    appName: 'OJAS · ஓஜஸ்',
    greeting: 'வணக்கம், கமலா பாட்டி',
    chooseLanguageLabel: 'மொழி',
    navOverview: 'இன்றைய மருந்து',
    navMedications: 'மருந்துகள்',
    navAppointments: 'மருத்துவர் சந்திப்பு',
    navProfileAndAccess: 'சுயவிவரம் & அனுமதி',
    navSmartAiAndAlerts: 'AI உதவி',
    emergencySos: 'அவசர SOS',
    callDoctorBtn: 'மருத்துவரை அழைக்கவும்',
    dispatchAmbulanceBtn: 'ஆம்புலன்ஸ் அழை (108)',
    speakSchedule: 'குரலில் கேட்க',
    voiceAssistantBtn: 'குரல் கட்டளை',
    todaysMedicationTimeline: 'இன்றைய மருந்து அட்டவணை',
    oneTapConfirm: 'மருந்து சாப்பிட்டேன் ✓',
    markTaken: 'சாப்பிட்டேன்',
    markSkipped: 'தவிர்',
    doseTaken: 'எடுக்கப்பட்டது',
    doseMissed: 'தவறியது · செவிலியருக்கு தகவல்',
    dosePending: 'நிலுவையில்',
    doseSkipped: 'தவிர்க்கப்பட்டது',
    dailyRoutineTitle: 'தினசரி ஆரோக்கியப் பட்டியல்',
    switchRoleBtn: 'சுயவிவரம் மாற்று',
    qrCardBtn: 'QR அட்டை',
    dosesCompletedLabel: 'இன்று எடுத்த மருந்துகள்',
    missedAlertLabel: 'தவறிய மருந்து',
    nextDoctorVisitLabel: 'அடுத்த மருத்துவர் சந்திப்பு',
    voiceScheduleIntro: 'வணக்கம் கமலா பாட்டி, ஓஜஸ் தளத்தில் இன்றைய உங்கள் மருந்து விவரங்கள்:',
  },
  ml: {
    appName: 'OJAS · ഓജസ്',
    greeting: 'നമസ്കാരം, കമല അമ്മൂമ്മ',
    chooseLanguageLabel: 'ഭാഷ',
    navOverview: 'ഇന്നത്തെ മരുന്ന്',
    navMedications: 'മരുന്നുകൾ',
    navAppointments: 'ഡോക്ടർ സന്ദർശനം',
    navProfileAndAccess: 'പ്രൊഫൈലും അനുമതിയും',
    navSmartAiAndAlerts: 'AI സഹായി',
    emergencySos: 'അടിയന്തര SOS',
    callDoctorBtn: 'ഡോക്ടറെ വിളിക്കുക',
    dispatchAmbulanceBtn: 'ആംബുലൻസ് വിളിക്കുക (108)',
    speakSchedule: 'ശബ്ദത്തിൽ കേൾക്കുക',
    voiceAssistantBtn: 'ശബ്ദ നിർദ്ദേശം',
    todaysMedicationTimeline: 'ഇന്നത്തെ മരുന്ന് സമയക്രമം',
    oneTapConfirm: 'മരുന്ന് കഴിച്ചു ✓',
    markTaken: 'കഴിച്ചു',
    markSkipped: 'ഒഴിവാക്കുക',
    doseTaken: 'കഴിച്ചു',
    doseMissed: 'വിട്ടുപോയി · നഴ്സിനെ അറിയിച്ചു',
    dosePending: 'ബാക്കിയുണ്ട്',
    doseSkipped: 'ഒഴിവാക്കി',
    dailyRoutineTitle: 'ദൈനംദിന ആരോഗ്യ ദിനചര്യ',
    switchRoleBtn: 'പ്രൊഫൈൽ മാറ്റുക',
    qrCardBtn: 'QR കാർഡ്',
    dosesCompletedLabel: 'ഇന്ന് കഴിച്ച മരുന്നുകൾ',
    missedAlertLabel: 'വിട്ടുപോയ മരുന്ന്',
    nextDoctorVisitLabel: 'അടുത്ത ഡോക്ടർ സന്ദർശനം',
    voiceScheduleIntro: 'നമസ്കാരം കമല അമ്മൂമ്മേ, ഇന്നത്തെ മരുന്നുകളുടെ സമയം താഴെ പറയുന്നവയാണ്:',
  },
  te: {
    appName: 'OJAS · ఓజస్',
    greeting: 'నమస్కారం, కమల బామ్మ',
    chooseLanguageLabel: 'భాష',
    navOverview: 'నేటి మందులు',
    navMedications: 'మందులు',
    navAppointments: 'డాక్టర్ భేటీ',
    navProfileAndAccess: 'ప్రొఫైల్ & అనుమతి',
    navSmartAiAndAlerts: 'AI సహాయం',
    emergencySos: 'అత్యవసర SOS',
    callDoctorBtn: 'డాక్టర్‌కు కాల్ చేయండి',
    dispatchAmbulanceBtn: 'అంబులెన్స్ పిలవండి (108)',
    speakSchedule: 'వాయిస్‌లో వినండి',
    voiceAssistantBtn: 'మాట్లాడండి',
    todaysMedicationTimeline: 'నేటి మందుల సమయ పట్టిక',
    oneTapConfirm: 'మందు వేసుకున్నాను ✓',
    markTaken: 'వేసుకున్నాను',
    markSkipped: 'దాటవేయి',
    doseTaken: 'తీసుకున్నారు',
    doseMissed: 'మిస్ అయింది · నర్సుకు సమాచారం',
    dosePending: 'మిగిలి ఉంది',
    doseSkipped: 'దాటవేయబడింది',
    dailyRoutineTitle: 'రోజువారీ ఆరోగ్య దినచర్య',
    switchRoleBtn: 'ప్రొఫైల్ మార్చండి',
    qrCardBtn: 'QR కార్డ్',
    dosesCompletedLabel: 'ఈరోజు వేసుకున్న మందులు',
    missedAlertLabel: 'తప్పిన మోతాదు',
    nextDoctorVisitLabel: 'తదుపరి డాక్టర్ భేటీ',
    voiceScheduleIntro: 'నమస్కారం కమల బామ్మ గారు, ఈరోజు మీ మందుల వివరాలు ఇక్కడ ఉన్నాయి:',
  },
  gu: {
    appName: 'OJAS · ઓજસ્',
    greeting: 'નમસ્તે, કમલા બા',
    chooseLanguageLabel: 'ભાષા',
    navOverview: 'આજની દવા',
    navMedications: 'દવાઓ',
    navAppointments: 'ડોક્ટર મુલાકાત',
    navProfileAndAccess: 'પ્રોફાઇલ અને સંમતિ',
    navSmartAiAndAlerts: 'AI સહાયક',
    emergencySos: 'કટોકટી SOS',
    callDoctorBtn: 'ડોક્ટરને કૉલ કરો',
    dispatchAmbulanceBtn: 'એમ્બ્યુલન્સ બોલાવો (108)',
    speakSchedule: 'અવાજમાં સાંભળો',
    voiceAssistantBtn: 'બોલીને કહો',
    todaysMedicationTimeline: 'આજનું દવાનું સમયપત્રક',
    oneTapConfirm: 'દવા લીધી ✓',
    markTaken: 'દવા લીધી',
    markSkipped: 'છોડો',
    doseTaken: 'લીધી છે',
    doseMissed: 'ચૂકી ગયા · નર્સને જાણ કરી',
    dosePending: 'બાકી છે',
    doseSkipped: 'છોડી દીધી',
    dailyRoutineTitle: 'દૈનિક સ્વાસ્થ્ય દિનચર્યા',
    switchRoleBtn: 'પ્રોફાઇલ બદલો',
    qrCardBtn: 'QR કાર્ડ',
    dosesCompletedLabel: 'આજે લીધેલી દવાઓ',
    missedAlertLabel: 'ચૂકી ગયેલી દવા',
    nextDoctorVisitLabel: 'આગામી ડોક્ટર મુલાકાત',
    voiceScheduleIntro: 'નમસ્તે કમલા બા, આજની તમારી દવાઓનો સમય આ મુજબ છે:',
  },
  bn: {
    appName: 'OJAS · ওজস',
    greeting: 'নমস্কার, কমলা ঠাকুমা',
    chooseLanguageLabel: 'ভাষা',
    navOverview: 'আজকের ওষুধ',
    navMedications: 'ওষুধ',
    navAppointments: 'ডাক্তার সাক্ষাৎ',
    navProfileAndAccess: 'প্রোফাইল ও সম্মতি',
    navSmartAiAndAlerts: 'AI সহায়ক',
    emergencySos: 'জরুরি SOS',
    callDoctorBtn: 'ডাক্তারকে কল করুন',
    dispatchAmbulanceBtn: 'অ্যাম্বুলেন্স ডাকুন (108)',
    speakSchedule: 'কণ্ঠে শুনুন',
    voiceAssistantBtn: 'মুখে বলুন',
    todaysMedicationTimeline: 'আজকের ওষুধের সময়সূচী',
    oneTapConfirm: 'ওষুধ খেয়েছি ✓',
    markTaken: 'খেয়েছি',
    markSkipped: 'বাদ দিন',
    doseTaken: 'নেওয়া হয়েছে',
    doseMissed: 'মিস হয়েছে · নার্সকে জানানো হয়েছে',
    dosePending: 'বাকি আছে',
    doseSkipped: 'বাদ দেওয়া হয়েছে',
    dailyRoutineTitle: 'দৈনিক স্বাস্থ্য রুটিন',
    switchRoleBtn: 'প্রোফাইল পরিবর্তন',
    qrCardBtn: 'QR কার্ড',
    dosesCompletedLabel: 'আজ খাওয়া ওষুধ',
    missedAlertLabel: 'বাকি থাকা ওষুধ',
    nextDoctorVisitLabel: 'পরবর্তী ডাক্তার সাক্ষাৎ',
    voiceScheduleIntro: 'নমস্কার কমলা ঠাকুমা, ওজস-এ আজকের আপনার ওষুধের সময়সূচী নিচে দেওয়া হলো:',
  },
  pa: {
    appName: 'OJAS · ਓਜਸ',
    greeting: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਕਮਲਾ ਬੇਬੇ ਜੀ',
    chooseLanguageLabel: 'ਭਾਸ਼ਾ',
    navOverview: 'ਅੱਜ ਦੀ ਦਵਾਈ',
    navMedications: 'ਦਵਾਈਆਂ',
    navAppointments: 'ਡਾਕਟਰ ਮੁਲਾਕਾਤ',
    navProfileAndAccess: 'ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਸਹਿਮਤੀ',
    navSmartAiAndAlerts: 'AI ਸਹਾਇਕ',
    emergencySos: 'ਐਮਰਜੈਂਸੀ SOS',
    callDoctorBtn: 'ਡਾਕਟਰ ਨੂੰ ਕਾਲ ਕਰੋ',
    dispatchAmbulanceBtn: 'ਐਂਬੂਲੈਂਸ ਬੁਲਾਓ (108)',
    speakSchedule: 'ਆਵਾਜ਼ ਵਿੱਚ ਸੁਣੋ',
    voiceAssistantBtn: 'ਬੋਲ ਕੇ ਦੱਸੋ',
    todaysMedicationTimeline: 'ਅੱਜ ਦੀਆਂ ਦਵਾਈਆਂ ਦਾ ਸਮਾਂ',
    oneTapConfirm: 'ਦਵਾਈ ਲੈ ਲਈ ✓',
    markTaken: 'ਲੈ ਲਈ',
    markSkipped: 'ਛੱਡੋ',
    doseTaken: 'ਲੈ ਲਈ ਗਈ',
    doseMissed: 'ਛੁੱਟ ਗਈ · ਨਰਸ ਨੂੰ ਦੱਸਿਆ',
    dosePending: 'ਬਾਕੀ ਹੈ',
    doseSkipped: 'ਛੱਡੀ ਗਈ',
    dailyRoutineTitle: 'ਰੋਜ਼ਾਨਾ ਸਿਹਤ ਰੁਟੀਨ',
    switchRoleBtn: 'ਪ੍ਰੋਫਾਈਲ ਬਦਲੋ',
    qrCardBtn: 'QR ਕਾਰਡ',
    dosesCompletedLabel: 'ਅੱਜ ਲਈਆਂ ਦਵਾਈਆਂ',
    missedAlertLabel: 'ਛੁੱਟੀ ਹੋਈ ਦਵਾਈ',
    nextDoctorVisitLabel: 'ਅਗਲੀ ਡਾਕਟਰ ਮੁਲਾਕਾਤ',
    voiceScheduleIntro: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਮਲਾ ਬੇਬੇ ਜੀ, ਅੱਜ ਦੀਆਂ ਦਵਾਈਆਂ ਦਾ ਵੇਰਵਾ ਇਸ ਪ੍ਰਕਾਰ ਹੈ:',
  },
  en: {
    appName: 'OJAS',
    greeting: 'Namaste, Smt. Kamala Deshmukh',
    chooseLanguageLabel: 'Language',
    navOverview: 'Daily Care',
    navMedications: 'Medications',
    navAppointments: 'Appointments',
    navProfileAndAccess: 'Profile & Access',
    navSmartAiAndAlerts: 'AI & Alerts',
    emergencySos: 'Emergency SOS',
    callDoctorBtn: 'Call Doctor',
    dispatchAmbulanceBtn: 'Dispatch Ambulance (108)',
    speakSchedule: 'Listen in Voice',
    voiceAssistantBtn: 'Speak Command',
    todaysMedicationTimeline: "Today's Medicine Schedule",
    oneTapConfirm: 'Medicine Taken ✓',
    markTaken: 'Mark Taken',
    markSkipped: 'Skip Dose',
    doseTaken: 'Taken',
    doseMissed: 'Missed · Nurse Alerted',
    dosePending: 'Pending',
    doseSkipped: 'Skipped',
    dailyRoutineTitle: 'Daily Health Checklist',
    switchRoleBtn: 'Switch Profile',
    qrCardBtn: 'QR Card',
    dosesCompletedLabel: 'Doses Taken Today',
    missedAlertLabel: 'Missed Doses',
    nextDoctorVisitLabel: 'Next Doctor Visit',
    voiceScheduleIntro: 'Namaste Kamala Aaji, welcome to OJAS. Here is your medicine schedule for today:',
  },
};

/**
 * Transliterates common Indian brand/generic medicine names and dosage units
 * into the selected Indian script so regional TTS engines pronounce every word natively.
 */
export function localizeMedicineTerms(lang: LanguageCode, raw: string): string {
  if (lang === 'en') return raw;

  const mapByLang: Record<Exclude<LanguageCode, 'en'>, Array<[RegExp, string]>> = {
    mr: [
      [/Telma/gi, 'टेल्मा'],
      [/Telmisartan/gi, 'टेलमिसार्टन'],
      [/Glycomet-GP/gi, 'ग्लायकोमेट जीपी'],
      [/Glycomet/gi, 'ग्लायकोमेट'],
      [/Metformin/gi, 'मेटफॉर्मिन'],
      [/Eliquis/gi, 'एलिक्विस'],
      [/Apixaban/gi, 'अपिक्साबॅन'],
      [/Atorva/gi, 'अटोर्वा'],
      [/Atorvastatin/gi, 'अटोर्वास्टॅटिन'],
      [/Stamlo/gi, 'स्टॅमलो'],
      [/Amlodipine/gi, 'अम्लोडिपिन'],
      [/Combiflam/gi, 'कॉम्बिफ्लॅम'],
      [/mg\b/gi, 'मिलीग्राम'],
      [/Tablet\b/gi, 'गोळी'],
    ],
    hi: [
      [/Telma/gi, 'टेल्मा'],
      [/Telmisartan/gi, 'टेलमिसार्टन'],
      [/Glycomet-GP/gi, 'ग्लाइकोमेट जीपी'],
      [/Glycomet/gi, 'ग्लाइकोमेट'],
      [/Metformin/gi, 'मेटफॉर्मिन'],
      [/Eliquis/gi, 'एलिक्विस'],
      [/Apixaban/gi, 'एपिक्साबैन'],
      [/Atorva/gi, 'अटोर्वा'],
      [/Atorvastatin/gi, 'अटोर्वास्टेटिन'],
      [/Stamlo/gi, 'स्टैमलो'],
      [/Amlodipine/gi, 'एम्लोडिपिन'],
      [/Combiflam/gi, 'कॉम्बिफ्लैम'],
      [/mg\b/gi, 'मिलीग्राम'],
      [/Tablet\b/gi, 'गोली'],
    ],
    kn: [
      [/Telma/gi, 'ಟೆಲ್ಮಾ'],
      [/Telmisartan/gi, 'ಟೆಲ್ಮಿಸಾರ್ಟನ್'],
      [/Glycomet-GP/gi, 'ಗ್ಲೈಕೊಮೆಟ್ ಜಿಪಿ'],
      [/Glycomet/gi, 'ಗ್ಲೈಕೊಮೆಟ್'],
      [/Metformin/gi, 'ಮೆಟ್‌ಫಾರ್ಮಿನ್'],
      [/Eliquis/gi, 'ಎಲಿಕ್ವಿಸ್'],
      [/Apixaban/gi, 'ಅಪಿಕ್ಸಾಬಾನ್'],
      [/Atorva/gi, 'ಅಟೋರ್ವಾ'],
      [/Atorvastatin/gi, 'ಅಟೋರ್ವಾಸ್ಟಾಟಿನ್'],
      [/Stamlo/gi, 'ಸ್ಟ್ಯಾಮ್ಲೊ'],
      [/Amlodipine/gi, 'ಅಮ್ಲೋಡಿಪಿನ್'],
      [/Combiflam/gi, 'ಕಾಂಬಿಫ್ಲಾಮ್'],
      [/mg\b/gi, 'ಮಿಲಿಗ್ರಾಂ'],
      [/Tablet\b/gi, 'ಮಾತ್ರೆ'],
    ],
    ta: [
      [/Telma/gi, 'டெல்மா'],
      [/Telmisartan/gi, 'டெல்மிசார்டன்'],
      [/Glycomet-GP/gi, 'கிளைகோமெட் ஜிபி'],
      [/Glycomet/gi, 'கிளைகோமெட்'],
      [/Metformin/gi, 'மெட்ஃபார்மின்'],
      [/Eliquis/gi, 'எலிகுவிஸ்'],
      [/Apixaban/gi, 'அபிக்சபான்'],
      [/Atorva/gi, 'அடோர்வா'],
      [/Atorvastatin/gi, 'அடோர்வாஸ்டாடின்'],
      [/Stamlo/gi, 'ஸ்டாம்லோ'],
      [/Amlodipine/gi, 'அம்லோடிபைன்'],
      [/Combiflam/gi, 'காம்பிஃப்ளாம்'],
      [/mg\b/gi, 'மில்லிகிராம்'],
      [/Tablet\b/gi, 'மாத்திரை'],
    ],
    bn: [
      [/Telma/gi, 'টেলমা'],
      [/Telmisartan/gi, 'টেলমিসার্টান'],
      [/Glycomet-GP/gi, 'গ্লাইকোমেট জিপি'],
      [/Glycomet/gi, 'গ্লাইকোমেট'],
      [/Metformin/gi, 'মেটফরমিন'],
      [/Eliquis/gi, 'এলিকুইস'],
      [/Apixaban/gi, 'অ্যাপিক্সাব্যান'],
      [/Atorva/gi, 'অ্যাটোরভা'],
      [/Atorvastatin/gi, 'অ্যাটোরভাস্ট্যাটিন'],
      [/Stamlo/gi, 'স্ট্যামলো'],
      [/Amlodipine/gi, 'অ্যামলোডিপিন'],
      [/Combiflam/gi, 'কম্বিফ্ল্যাম'],
      [/mg\b/gi, 'মিলিগ্রাম'],
      [/Tablet\b/gi, 'ট্যাবলেট'],
    ],
    ml: [
      [/Telma/gi, 'ടെൽമ'],
      [/Glycomet-GP/gi, 'ഗ്ലൈക്കോമെറ്റ് ജിപി'],
      [/Glycomet/gi, 'ഗ്ലൈക്കോമെറ്റ്'],
      [/Eliquis/gi, 'എലിക്വിസ്'],
      [/Atorva/gi, 'അറ്റോർവ'],
      [/Stamlo/gi, 'സ്റ്റാംലോ'],
      [/mg\b/gi, 'മില്ലിഗ്രാം'],
      [/Tablet\b/gi, 'ഗുളിക'],
    ],
    te: [
      [/Telma/gi, 'టెల్మా'],
      [/Glycomet-GP/gi, 'గ్లైకోమెట్ జిపి'],
      [/Glycomet/gi, 'గ్లైకోమెట్'],
      [/Eliquis/gi, 'ఎలిక్విస్'],
      [/Atorva/gi, 'అటోర్వా'],
      [/Stamlo/gi, 'స్టామ్లో'],
      [/mg\b/gi, 'మిల్లీగ్రాములు'],
      [/Tablet\b/gi, 'మాత్ర'],
    ],
    gu: [
      [/Telma/gi, 'ટેલ્મા'],
      [/Glycomet-GP/gi, 'ગ્લાયકોમેટ જીપી'],
      [/Glycomet/gi, 'ગ્લાયકોમેટ'],
      [/Eliquis/gi, 'એલિક્વિસ'],
      [/Atorva/gi, 'અટોર્વા'],
      [/Stamlo/gi, 'સ્ટેમલો'],
      [/mg\b/gi, 'મિલીગ્રામ'],
      [/Tablet\b/gi, 'ગોળી'],
    ],
    pa: [
      [/Telma/gi, 'ਟੇਲਮਾ'],
      [/Glycomet-GP/gi, 'ਗਲਾਈਕੋਮੇਟ ਜੀਪੀ'],
      [/Glycomet/gi, 'ਗਲਾਈਕੋਮੇਟ'],
      [/Eliquis/gi, 'ਐਲੀਕੁਇਸ'],
      [/Atorva/gi, 'ਅਟੋਰਵਾ'],
      [/Stamlo/gi, 'ਸਟੈਮਲੋ'],
      [/mg\b/gi, 'ਮਿਲੀਗ੍ਰਾਮ'],
      [/Tablet\b/gi, 'ਗੋਲੀ'],
    ],
  };

  let out = raw;
  for (const [regex, replacement] of mapByLang[lang] || []) {
    out = out.replace(regex, replacement);
  }
  return out;
}

/**
 * Generates a 100% localized native Indian language sentence for any single medication dose
 * so spoken audio never mixes raw English instructions into regional language playback.
 */
export function buildLocalizedDoseSpeech(
  lang: LanguageCode,
  medName: string,
  dosage: string,
  time: string,
  compartment: number,
  isTaken: boolean
): string {
  const cleanName = localizeMedicineTerms(lang, medName.split('(')[0].trim());
  const cleanDose = localizeMedicineTerms(lang, dosage.split('(')[0].trim());

  switch (lang) {
    case 'hi':
      return `समय ${time} बजे, दवा ${cleanName}, मात्रा ${cleanDose}, बॉक्स नंबर ${compartment} से पानी या भोजन के साथ लें। स्थिति: ${
        isTaken ? 'यह दवा ले ली गई है' : 'लेना बाकी है'
      }।`;
    case 'kn':
      return `ಸಮಯ ${time} ಗಂಟೆಗೆ, ${cleanName}, ಪ್ರಮಾಣ ${cleanDose} ಮಾತ್ರೆಯನ್ನು ಬಾಕ್ಸ್ ಸಂಖ್ಯೆ ${compartment} ರಿಂದ ತೆಗೆದುಕೊಳ್ಳಿ. ಸ್ಥಿತಿ: ${
        isTaken ? 'ಈ ಔಷಧಿಯನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ' : 'ತೆಗೆದುಕೊಳ್ಳಲು ಬಾಕಿ ಇದೆ'
      }.`;
    case 'mr':
      return `वेळ ${time} वाजता, ${cleanName}, मात्रा ${cleanDose} हे औषध बॉक्स क्रमांक ${compartment} मधून घ्यावे. स्थिती: ${
        isTaken ? 'हे औषध घेतले आहे' : 'घेणे बाकी आहे'
      }.`;
    case 'ta':
      return `நேரம் ${time} மணிக்கு, ${cleanName}, அளவு ${cleanDose} மாத்திரையை பெட்டி எண் ${compartment} இலிருந்து எடுத்துக்கொள்ளவும். நிலை: ${
        isTaken ? 'மருந்து சாப்பிட்டாயிற்று' : 'இன்னும் சாப்பிடவில்லை'
      }.`;
    case 'ml':
      return `സമയം ${time} മണിക്ക്, ${cleanName}, അളവ് ${cleanDose} മരുന്ന് ബോക്സ് നമ്പർ ${compartment} ൽ നിന്ന് കഴിക്കുക. അവസ്ഥ: ${
        isTaken ? 'ഈ മരുന്ന് കഴിച്ചു കഴിഞ്ഞു' : 'കഴിക്കാൻ ബാക്കിയുണ്ട്'
      }.`;
    case 'te':
      return `సమయం ${time} గంటలకు, ${cleanName}, మోతాదు ${cleanDose} మందును బాక్స్ నంబర్ ${compartment} నుండి వేసుకోండి. స్థితి: ${
        isTaken ? 'ఈ మందు వేసుకున్నారు' : 'వేసుకోవడం మిగిలి ఉంది'
      }.`;
    case 'gu':
      return `સમય ${time} વાગ્યે, ${cleanName}, માત્રા ${cleanDose} દવા બોક્સ નંબર ${compartment} માંથી લો. સ્થિતિ: ${
        isTaken ? 'આ દવા લઈ લીધી છે' : 'લેવાની બાકી છે'
      }.`;
    case 'bn':
      return `সময় ${time} টায়, ${cleanName}, মাত্রা ${cleanDose} ওষুধটি বক্স নম্বর ${compartment} থেকে নিন। অবস্থা: ${
        isTaken ? 'এই ওষুধটি খাওয়া হয়েছে' : 'খাওয়া বাকি আছে'
      }।`;
    case 'pa':
      return `ਸਮਾਂ ${time} ਵਜੇ, ${cleanName}, ਮਾਤਰਾ ${cleanDose} ਦਵਾਈ ਬਾਕਸ ਨੰਬਰ ${compartment} ਵਿੱਚੋਂ ਲਓ। ਸਥਿਤੀ: ${
        isTaken ? 'ਇਹ ਦਵਾਈ ਲੈ ਲਈ ਗਈ ਹੈ' : 'ਲੈਣੀ ਬਾਕੀ ਹੈ'
      }।`;
    default:
      return `At ${time}, take ${cleanName} (${cleanDose}) from Pillbox compartment ${compartment}. Status: ${
        isTaken ? 'Already taken' : 'Scheduled to take'
      }.`;
  }
}

export function buildLocalizedConfirmationSpeech(
  lang: LanguageCode,
  medName: string
): string {
  const cleanName = localizeMedicineTerms(lang, medName.split('(')[0].trim());
  switch (lang) {
    case 'hi':
      return `धन्यवाद कमला आजी, ${cleanName} की खुराक दर्ज कर ली गई है।`;
    case 'kn':
      return `ಧನ್ಯವಾದಗಳು ಕಮಲಾ ಅಜ್ಜಿ, ${cleanName} ಔಷಧಿ ತೆಗೆದುಕೊಂಡಿರುವುದನ್ನು ದಾಖಲಿಸಲಾಗಿದೆ.`;
    case 'mr':
      return `धन्यवाद कमला आजी, ${cleanName} हे औषध घेतल्याची नोंद झाली आहे.`;
    case 'ta':
      return `நன்றி கமலா பாட்டி, ${cleanName} மருந்து சாப்பிட்டது பதிவு செய்யப்பட்டது.`;
    case 'ml':
      return `നന്ദി കമല അമ്മൂമ്മേ, ${cleanName} മരുന്ന് കഴിച്ചത് രേഖപ്പെടുത്തിയിട്ടുണ്ട്.`;
    case 'te':
      return `ధన్యవాదాలు కమల బామ్మ గారు, ${cleanName} మందు వేసుకున్నట్లు నమోదు చేయబడింది.`;
    case 'gu':
      return `આભાર કમલા બા, ${cleanName} દવા લીધાની નોંધ થઈ ગઈ છે.`;
    case 'bn':
      return `ধন্যবাদ কমলা ঠাকুমা, ${cleanName} ওষুধ খাওয়ার তথ্য নথিভুক্ত করা হয়েছে।`;
    case 'pa':
      return `ਧੰਨਵਾਦ ਕਮਲਾ ਬੇਬੇ ਜੀ, ${cleanName} ਦਵਾਈ ਲੈਣ ਦੀ ਚੋਣ ਦਰਜ ਕਰ ਲਈ ਗਈ ਹੈ।`;
    default:
      return `Thank you Kamala Aaji, ${cleanName} has been marked as taken.`;
  }
}

export function buildLocalizedInteractionAlertSpeech(
  lang: LanguageCode,
  warningCount: number,
  involvedMeds: string[]
): string {
  const localizedMeds = involvedMeds
    .map((m) => localizeMedicineTerms(lang, m.split('(')[0].trim()))
    .join(', ');

  switch (lang) {
    case 'hi':
      return `सावधान! आपकी दवाइयों की सूची में ${warningCount} संभावित दवा इंटरैक्शन पाए गए हैं, जिनमें ${localizedMeds} शामिल हैं। कृपया दवाइयों के बीच अंतराल रखें और डॉक्टर की सलाह का पालन करें।`;
    case 'kn':
      return `ಎಚ್ಚರಿಕೆ! ನಿಮ್ಮ ಔಷಧಿ ಪಟ್ಟಿಯಲ್ಲಿ ${warningCount} ಸಂಭಾವ್ಯ ಔಷಧಿ ಪ್ರತಿಕ್ರಿಯೆಗಳು ಕಂಡುಬಂದಿವೆ: ${localizedMeds}. ದಯವಿಟ್ಟು ಔಷಧಿಗಳ ನಡುವೆ ಸಮಯದ ಅಂತರವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ.`;
    case 'mr':
      return `सावधान! तुमच्या औषधांच्या वेळापत्रकात ${warningCount} संभाव्य औषध परस्परक्रिया आढळल्या आहेत, ज्यामध्ये ${localizedMeds} यांचा समावेश आहे. कृपया औषधांमध्ये योग्य अंतर ठेवा आणि डॉक्टरांच्या सूचनेचे पालन करा.`;
    case 'ta':
      return `கவனம்! உங்கள் மருந்து அட்டவணையில் ${localizedMeds} உட்பட ${warningCount} மருந்து எதிர்வினை எச்சரிக்கைகள் கண்டறியப்பட்டுள்ளன. மருந்துகளுக்கு இடையில் நேர இடைவெளியைப் பின்பற்றவும்.`;
    case 'ml':
      return `ശ്രദ്ധിക്കുക! നിങ്ങളുടെ മരുന്ന് പട്ടികയിൽ ${localizedMeds} ഉൾപ്പെടെ ${warningCount} മരുന്ന് പ്രതിപ്രവർത്തന മുന്നറിയിപ്പുകൾ കണ്ടെത്തിയിട്ടുണ്ട്.`;
    case 'te':
      return `గమనిక! మీ మందుల జాబితాలో ${localizedMeds} తో సహా ${warningCount} మందుల పరస్పర చర్య హెచ్చరికలు కనుగొనబడ్డాయి. దయచేసి మందుల మధ్య సమయ విరామం పాటించండి.`;
    case 'gu':
      return `સાવધાન! તમારી દવાઓના સમયપત્રકમાં ${localizedMeds} સહિત ${warningCount} સંભવિત દવા આડઅસર ચેતવણીઓ મળી છે. કૃપા કરીને દવાઓ વચ્ચે યોગ્ય અંતર રાખો.`;
    case 'bn':
      return `সতর্কবার্তা! আপনার ওষুধের তালিকায় ${localizedMeds} সহ ${warningCount} টি সম্ভাব্য ওষুধের আন্তঃক্রিয়া পাওয়া গেছে। অনুগ্রহ করে ওষুধ খাওয়ার সময়ের মধ্যে ব্যবধান বজায় রাখুন।`;
    case 'pa':
      return `ਸਾਵਧਾਨ! ਤੁਹਾਡੀਆਂ ਦਵਾਈਆਂ ਦੀ ਸੂਚੀ ਵਿੱਚ ${localizedMeds} ਸਮੇਤ ${warningCount} ਸੰਭਾਵੀ ਦਵਾਈ ਪ੍ਰਤੀਕਿਰਿਆਵਾਂ ਮਿਲੀਆਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਦਵਾਈਆਂ ਵਿਚਕਾਰ ਸਮੇਂ ਦਾ ਅੰਤਰ ਰੱਖੋ।`;
    default:
      return `Medication Interaction Warning Alert. ${warningCount} potential interactions found in your schedule involving ${localizedMeds}. Please maintain recommended spacing between doses.`;
  }
}

export function buildLocalizedEmergencySpeech(
  lang: LanguageCode,
  kind: 'doctor' | 'ambulance'
): string {
  if (kind === 'doctor') {
    switch (lang) {
      case 'mr':
        return 'डॉक्टर राजेश कुलकर्णी यांना सह्याद्री हॉस्पिटल पुणे येथे थेट कॉल जोडला जात आहे.';
      case 'ta':
        return 'மருத்துவர் ராஜேஷ் குல்கர்னி அவர்களுக்கு நேரடி அழைப்பு இணைக்கப்படுகிறது.';
      case 'kn':
        return 'ಡಾಕ್ಟರ್ ರಾಜೇಶ್ ಕುಲಕರ್ಣಿ ಅವರಿಗೆ ನೇರ ಕರೆ ಮಾಡಲಾಗುತ್ತಿದೆ.';
      case 'bn':
        return 'ডাক্তার রাজেশ কুলকার্নির সাথে সরাসরি কল সংযোগ করা হচ্ছে।';
      case 'hi':
        return 'डॉक्टर राजेश कुलकर्णी को सह्याद्री अस्पताल पुणे में सीधा कॉल लगाया जा रहा है।';
      default:
        return 'Connecting direct call to Dr. Rajesh Kulkarni at Sahyadri Hospital Pune.';
    }
  } else {
    switch (lang) {
      case 'mr':
        return 'तातडीची १०८ रुग्णवाहिका प्रभात रोड, पुणे येथील तुमच्या घरी पाठवण्यात आली आहे. घाबरू नका.';
      case 'ta':
        return 'அவசர 108 ஆம்புலன்ஸ் உங்கள் புனே முகவரிக்கு அனுப்பப்பட்டுள்ளது. தைரியமாக இருங்கள்.';
      case 'kn':
        return 'ತುರ್ತು 108 ಆಂಬ್ಯುಲೆನ್ಸ್ ಅನ್ನು ನಿಮ್ಮ ಪುಣೆ ವಿಳಾಸಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಧೈರ್ಯವಾಗಿರಿ.';
      case 'bn':
        return 'জরুরি ১০৮ অ্যাম্বুলেন্স আপনার পুনের বাড়ির ঠিকানায় পাঠানো হয়েছে। চিন্তার কিছু নেই।';
      case 'hi':
        return 'आपातकालीन 108 एम्बुलेंस आपके प्रभात रोड पुणे के पते पर रवाना कर दी गई है। कृपया शांत रहें।';
      default:
        return 'Emergency 108 Ambulance has been dispatched to Flat 402, Shanti Niketan, Prabhat Road, Pune.';
    }
  }
}

export function buildLocalizedMemberCallSpeech(
  lang: LanguageCode,
  targetName: string,
  targetRole: 'elderly' | 'caretaker' | 'family'
): string {
  const cleanName = targetName.split(',')[0].trim();
  const roleWord =
    targetRole === 'caretaker'
      ? {
          mr: 'केअरगिव्हर सिस्टर प्रिया नायर',
          ta: 'செவிலியர் சகோதரி பிரியா நாயர்',
          kn: 'ಆರೈಕೆದಾರ ಸಿಸ್ಟರ್ ಪ್ರಿಯಾ ನಾಯರ್',
          bn: 'কেয়ারগিভার সিস্টার প্রিয়া নায়ার',
          hi: 'केयरगिवर सिस्टर प्रिया नायर',
          ml: 'കെയർഗിവർ സിസ്റ്റർ പ്രിയ നായർ',
          te: 'కేర్‌గివర్ సిస్టర్ ప్రియా నాయర్',
          gu: 'કેરગિવર સિસ્ટર પ્રિયા નાયર',
          pa: 'ਕੇਅਰਗਿਵਰ ਸਿਸਟਰ ਪ੍ਰਿਆ ਨਾਇਰ',
          en: `Caregiver ${cleanName}`,
        }[lang]
      : targetRole === 'family'
      ? {
          mr: 'कुटुंब सदस्य रोहन देशमुख',
          ta: 'குடும்ப সদস্য ரோகன் தேஷ்முக்',
          kn: 'ಕುಟುಂಬ ಸದಸ್ಯ ರೋಹನ್ ದೇಶಮುಖ್',
          bn: 'পরিবারের সদস্য রোহন দেশমুখ',
          hi: 'परिवार सदस्य रोहन देशमुख',
          ml: 'കുടുംബാംഗം രോഹൻ ദേശ്മുഖ്',
          te: 'కుటుంబ సభ్యుడు రోహన్ దేశ్‌ముఖ్',
          gu: 'પરિવાર સભ્ય રોહન દેશમુખ',
          pa: 'ਪਰਿਵਾਰਕ ਮੈਂਬਰ ਰੋਹਨ ਦੇਸ਼ਮੁਖ',
          en: `Family Member ${cleanName}`,
        }[lang]
      : {
          mr: 'रुग्ण कमला आजी देशमुख',
          ta: 'நோயாளி கமலா பாட்டி தேஷ்முக்',
          kn: 'ರೋಗಿ ಕಮಲಾ ಅಜ್ಜಿ ದೇಶಮುಖ್',
          bn: 'রোগী কমলা ঠাকুমা দেশমুখ',
          hi: 'मरीज कमला आजी देशमुख',
          ml: 'രോഗി കമല അമ്മൂമ്മ ദേശ്മുഖ്',
          te: 'రోగి కమల బామ్మ దేశ్‌ముఖ్',
          gu: 'દર્દી કમલા બા દેશમુખ',
          pa: 'ਮਰੀਜ਼ ਕਮਲਾ ਬੇਬੇ ਦੇਸ਼ਮੁਖ',
          en: `Patient ${cleanName}`,
        }[lang];

  switch (lang) {
    case 'mr':
      return `${roleWord} यांना थेट वन-टॅप कॉल जोडला जात आहे.`;
    case 'ta':
      return `${roleWord} அவர்களுக்கு நேரடி அழைப்பு இணைக்கப்படுகிறது.`;
    case 'kn':
      return `${roleWord} ಅವರಿಗೆ ನೇರ ಕರೆ ಮಾಡಲಾಗುತ್ತಿದೆ.`;
    case 'bn':
      return `${roleWord} এর সাথে সরাসরি কল সংযোগ করা হচ্ছে।`;
    case 'hi':
      return `${roleWord} को सीधा वन-टैप कॉल लगाया जा रहा है।`;
    case 'ml':
      return `${roleWord} ലേക്ക് നേരിട്ട് കോൾ കണക്റ്റ് ചെയ്യുന്നു.`;
    case 'te':
      return `${roleWord} గారికి నేరుగా కాల్ కనెక్ట్ చేయబడుతోంది.`;
    case 'gu':
      return `${roleWord} ને સીધો કોલ જોડવામાં આવી રહ્યો છે.`;
    case 'pa':
      return `${roleWord} ਨੂੰ ਸਿੱਧੀ ਕਾਲ ਮਿਲਾਈ ਜਾ ਰਹੀ ਹੈ।`;
    default:
      return `Connecting direct one-tap call to ${roleWord}.`;
  }
}

export function getStopVoiceLabel(lang: LanguageCode): string {
  switch (lang) {
    case 'mr':
      return 'आवाज थांबवा';
    case 'ta':
      return 'குரலை நிறுத்து';
    case 'kn':
      return 'ಧ್ವನಿ ನಿಲ್ಲಿಸಿ';
    case 'bn':
      return 'ভয়েস বন্ধ করুন';
    case 'hi':
      return 'आवाज़ रोकें';
    case 'ml':
      return 'ശബ്ദം നിർത്തുക';
    case 'te':
      return 'వాయిస్ ఆపండి';
    case 'gu':
      return 'અવાજ બંધ કરો';
    case 'pa':
      return 'ਆਵਾਜ਼ ਰੋਕੋ';
    default:
      return 'Stop Voice';
  }
}

/**
 * Returns the uploaded/captured bottle or pill strip photo URL if present,
 * or generates a realistic high-contrast SVG blister-strip / bottle thumbnail
 * so elderly users always have a clear visual medicine preview in every timeline slot.
 */
export function getMedicationThumbnailUrl(med: {
  name: string;
  dosage: string;
  compartmentNumber: number;
  bottleOrStripImageUrl?: string;
  prescriptionImageUrl?: string;
}): string {
  if (med.bottleOrStripImageUrl) return med.bottleOrStripImageUrl;
  if (med.prescriptionImageUrl) return med.prescriptionImageUrl;

  const shortTitle = med.name.split('(')[0].trim().slice(0, 14);
  const shortDose = med.dosage.split('(')[0].trim().slice(0, 12);

  // Distinct high-contrast color palettes by compartment number for instant elderly recognition
  const palettes: Record<number, { bg: string; strip: string; pill: string; accent: string }> = {
    1: { bg: '#0f172a', strip: '#e2e8f0', pill: '#38bdf8', accent: '#0284c7' }, // Blue strip (Telma 40)
    2: { bg: '#1e1b4b', strip: '#fef3c7', pill: '#f59e0b', accent: '#d97706' }, // Amber strip (Glycomet-GP 1)
    3: { bg: '#3b0764', strip: '#fce7f3', pill: '#ec4899', accent: '#db2777' }, // Pink tablet strip (Eliquis 5mg)
    4: { bg: '#064e3b', strip: '#d1fae5', pill: '#10b981', accent: '#059669' }, // Emerald strip (Atorva 20)
    5: { bg: '#451a03', strip: '#ffedd5', pill: '#f97316', accent: '#ea580c' },
    6: { bg: '#1f2937', strip: '#f3f4f6', pill: '#a855f7', accent: '#9333ea' },
  };
  const pal = palettes[med.compartmentNumber] || palettes[1];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 110" width="160" height="110">
    <rect width="160" height="110" rx="14" fill="${pal.bg}"/>
    <rect x="12" y="12" width="136" height="62" rx="9" fill="${pal.strip}" stroke="${pal.accent}" stroke-width="2"/>
    <circle cx="38" cy="32" r="10" fill="${pal.pill}" stroke="${pal.accent}" stroke-width="1.5"/>
    <line x1="31" y1="32" x2="45" y2="32" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="80" cy="32" r="10" fill="${pal.pill}" stroke="${pal.accent}" stroke-width="1.5"/>
    <line x1="73" y1="32" x2="87" y2="32" stroke="#ffffff" stroke-width="1.5"/>
    <circle cx="122" cy="32" r="10" fill="${pal.pill}" stroke="${pal.accent}" stroke-width="1.5"/>
    <line x1="115" y1="32" x2="129" y2="32" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="20" y="50" width="120" height="18" rx="4" fill="${pal.accent}"/>
    <text x="80" y="62" font-family="monospace, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">${shortTitle}</text>
    <text x="80" y="96" font-family="monospace, sans-serif" font-size="11" font-weight="bold" fill="#f8fafc" text-anchor="middle">BOX #${med.compartmentNumber} · ${shortDose}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}


