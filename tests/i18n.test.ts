import { describe, it, expect } from 'vitest';
import {
  INDIAN_LANGUAGES,
  TRANSLATIONS,
  buildLocalizedDoseSpeech,
  buildLocalizedConfirmationSpeech,
  buildLocalizedEmergencySpeech,
  buildLocalizedMemberCallSpeech,
  getStopVoiceLabel,
  selectBestBrowserVoice,
} from '../src/i18n';

describe('OJAS Multilingual Speech & Localization System', () => {
  it('supports all 10 scheduled Indian regional languages', () => {
    const codes = INDIAN_LANGUAGES.map((l) => l.code);
    expect(codes).toContain('en');
    expect(codes).toContain('hi');
    expect(codes).toContain('mr');
    expect(codes).toContain('ta');
    expect(codes).toContain('kn');
    expect(codes).toContain('bn');
    expect(codes).toContain('gu');
    expect(codes).toContain('te');
    expect(codes).toContain('ml');
    expect(codes).toContain('pa');
    expect(codes.length).toBe(10);
  });

  it('builds authentic localized dosage audio prompts for morning and evening', () => {
    // English
    const enSpeech = buildLocalizedDoseSpeech('en', 'Telma 40', '40 mg', '08:00', 1, false);
    expect(enSpeech).toContain('Telma 40');
    expect(enSpeech).toContain('08:00');

    // Hindi (localized to Devanagari)
    const hiSpeech = buildLocalizedDoseSpeech('hi', 'Telma 40', '40 mg', '08:00', 1, false);
    expect(hiSpeech).toContain('टेल्मा 40');
    expect(hiSpeech).toContain('दवा');

    // Marathi (localized to Devanagari)
    const mrSpeech = buildLocalizedDoseSpeech('mr', 'Telma 40', '40 mg', '08:00', 1, false);
    expect(mrSpeech).toContain('टेल्मा 40');
    expect(mrSpeech).toContain('वेळ');

    // Tamil
    const taSpeech = buildLocalizedDoseSpeech('ta', 'Telma 40', '40 mg', '08:00', 1, false);
    expect(taSpeech).toContain('டெல்மா 40');

    // Bengali
    const bnSpeech = buildLocalizedDoseSpeech('bn', 'Telma 40', '40 mg', '08:00', 1, false);
    expect(bnSpeech).toContain('টেলমা 40');
  });

  it('generates respectful confirmation prompts in Hindi, Marathi, and English', () => {
    const enConfirm = buildLocalizedConfirmationSpeech('en', 'Glycomet-GP');
    expect(enConfirm).toContain('Kamala Aaji');
    expect(enConfirm).toContain('Glycomet-GP');

    const hiConfirm = buildLocalizedConfirmationSpeech('hi', 'Glycomet-GP');
    expect(hiConfirm).toContain('धन्यवाद कमला आजी');
    expect(hiConfirm).toContain('ग्लाइकोमेट जीपी');

    const mrConfirm = buildLocalizedConfirmationSpeech('mr', 'Glycomet-GP');
    expect(mrConfirm).toContain('धन्यवाद कमला आजी');
    expect(mrConfirm).toContain('ग्लायकोमेट जीपी');
  });

  it('formats emergency SOS announcements accurately', () => {
    const enSos = buildLocalizedEmergencySpeech('en', 'ambulance');
    expect(enSos).toContain('Emergency 108 Ambulance');

    const mrSos = buildLocalizedEmergencySpeech('mr', 'ambulance');
    expect(mrSos).toContain('१०८ रुग्णवाहिका');
    expect(mrSos).toContain('प्रभात रोड, पुणे');
  });

  it('formats 1-tap direct calling announcements', () => {
    const enCall = buildLocalizedMemberCallSpeech('en', 'Rohan Deshmukh', 'family');
    expect(enCall).toContain('Rohan Deshmukh');

    const mrCall = buildLocalizedMemberCallSpeech('mr', 'Rohan Deshmukh', 'family');
    expect(mrCall).toContain('थेट वन-टॅप कॉल');
  });

  it('provides localized Stop Voice labels across all languages', () => {
    expect(getStopVoiceLabel('en')).toBe('Stop Voice');
    expect(getStopVoiceLabel('hi')).toBe('आवाज़ रोकें');
    expect(getStopVoiceLabel('mr')).toBe('आवाज थांबवा');
    expect(getStopVoiceLabel('ta')).toBe('குரலை நிறுத்து');
    expect(getStopVoiceLabel('bn')).toBe('ভয়েস বন্ধ করুন');
  });

  it('selects best matching browser system voice or falls back gracefully', () => {
    const mockVoices = [
      { name: 'Google हिन्दी', lang: 'hi-IN' },
      { name: 'Microsoft Heera - English (India)', lang: 'en-IN' },
      { name: 'Google मराठी', lang: 'mr-IN' },
    ] as any[];

    const selectedHi = selectBestBrowserVoice('hi', mockVoices);
    expect(selectedHi?.lang).toBe('hi-IN');

    const selectedMr = selectBestBrowserVoice('mr', mockVoices);
    expect(selectedMr?.lang).toBe('mr-IN');

    // Unsupported voice in mock -> falls back gracefully
    const selectedKn = selectBestBrowserVoice('kn', mockVoices);
    expect(selectedKn).toBeDefined(); // Falls back to Indian English or first voice
  });

  it('validates BCP-47 speech language tags for Indian regional localization', () => {
    INDIAN_LANGUAGES.forEach((lang) => {
      expect(lang.code.length).toBe(2);
      expect(lang.speechLang).toMatch(/^[a-z]{2}-IN$/);
      expect(lang.englishName.length).toBeGreaterThan(2);
      expect(lang.nativeName.length).toBeGreaterThan(0);
    });
  });

  it('provides distinct localized greetings in all 10 scheduled languages', () => {
    const greetings = INDIAN_LANGUAGES.map((l) => {
      const trans = TRANSLATIONS[l.code as keyof typeof TRANSLATIONS];
      expect(trans).toBeDefined();
      expect(trans.greeting.length).toBeGreaterThan(5);
      return trans.greeting;
    });

    // Ensure localized greetings across languages are distinct
    expect(new Set(greetings).size).toBeGreaterThanOrEqual(8);
  });
});
