import { describe, it, expect } from 'vitest';
import {
  INDIAN_LANGUAGES,
  buildLocalizedDoseSpeech,
  buildLocalizedConfirmationSpeech,
  buildLocalizedEmergencySpeech,
  buildLocalizedMemberCallSpeech,
  getStopVoiceLabel,
} from '../src/i18n';

describe('OJAS Multilingual Speech & Localization System', () => {
  it('supports all major scheduled Indian regional languages', () => {
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
  });

  it('builds authentic localized dosage audio prompts', () => {
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

  it('provides localized Stop Voice labels across languages', () => {
    expect(getStopVoiceLabel('en')).toBe('Stop Voice');
    expect(getStopVoiceLabel('hi')).toBe('आवाज़ रोकें');
    expect(getStopVoiceLabel('mr')).toBe('आवाज थांबवा');
  });
});
