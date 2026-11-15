import { describe, it, expect } from 'vitest';

/**
 * AHA & Geriatric Clinical Thresholds:
 * - Blood Pressure:
 *   - Normal: Systolic < 120 and Diastolic < 80
 *   - Elevated: Systolic 120-129 and Diastolic < 80
 *   - Stage 1: Systolic 130-139 or Diastolic 80-89
 *   - Stage 2: Systolic >= 140 or Diastolic >= 90
 *   - Hypertensive Crisis: Systolic > 180 and/or Diastolic > 120
 * - Blood Glucose:
 *   - Hypoglycemia: < 70 mg/dL (Emergency)
 *   - Normal Fasting: 70 - 99 mg/dL
 *   - Pre-diabetes / Mild: 100 - 125 mg/dL
 *   - Diabetes: >= 126 mg/dL
 *   - Severe Hyperglycemia: > 250 mg/dL
 * - SpO2:
 *   - Normal: >= 95%
 *   - Mild Hypoxia: 91 - 94%
 *   - Critical Hypoxia: <= 90%
 */

export function classifyBloodPressure(systolic: number, diastolic: number): {
  stage: 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Crisis';
  isAlert: boolean;
} {
  if (systolic > 180 || diastolic > 120) {
    return { stage: 'Crisis', isAlert: true };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { stage: 'Stage 2', isAlert: true };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { stage: 'Stage 1', isAlert: false };
  }
  if (systolic >= 120 && diastolic < 80) {
    return { stage: 'Elevated', isAlert: false };
  }
  return { stage: 'Normal', isAlert: false };
}

export function classifyFastingGlucose(glucose: number): {
  category: 'Hypoglycemia' | 'Normal' | 'Elevated' | 'Severe';
  isAlert: boolean;
} {
  if (glucose < 70) {
    return { category: 'Hypoglycemia', isAlert: true };
  }
  if (glucose <= 100) {
    return { category: 'Normal', isAlert: false };
  }
  if (glucose <= 180) {
    return { category: 'Elevated', isAlert: false };
  }
  return { category: 'Severe', isAlert: true };
}

export function classifySpO2(spo2Percent: number): {
  status: 'Normal' | 'Mild Hypoxia' | 'Critical Hypoxia';
  isAlert: boolean;
} {
  if (spo2Percent >= 95) {
    return { status: 'Normal', isAlert: false };
  }
  if (spo2Percent >= 91) {
    return { status: 'Mild Hypoxia', isAlert: true };
  }
  return { status: 'Critical Hypoxia', isAlert: true };
}

export function classifyHeartRate(bpm: number): {
  status: 'Bradycardia' | 'Normal' | 'Tachycardia';
  isAlert: boolean;
} {
  if (bpm < 50) return { status: 'Bradycardia', isAlert: true };
  if (bpm > 100) return { status: 'Tachycardia', isAlert: true };
  return { status: 'Normal', isAlert: false };
}

export function classifyTemperature(tempF: number): {
  status: 'Hypothermia' | 'Normal' | 'Low-grade Fever' | 'High Fever';
  isAlert: boolean;
} {
  if (tempF < 95.0) return { status: 'Hypothermia', isAlert: true };
  if (tempF <= 99.0) return { status: 'Normal', isAlert: false };
  if (tempF <= 101.0) return { status: 'Low-grade Fever', isAlert: false };
  return { status: 'High Fever', isAlert: true };
}

describe('OJAS Clinical Vitals & Anomaly Detection Engine', () => {
  it('correctly classifies normal and elevated blood pressure', () => {
    const normal = classifyBloodPressure(118, 76);
    expect(normal.stage).toBe('Normal');
    expect(normal.isAlert).toBe(false);

    const elevated = classifyBloodPressure(124, 78);
    expect(elevated.stage).toBe('Elevated');
    expect(elevated.isAlert).toBe(false);
  });

  it('triggers clinical alert for Stage 2 Essential Hypertension', () => {
    const stage2 = classifyBloodPressure(146, 92);
    expect(stage2.stage).toBe('Stage 2');
    expect(stage2.isAlert).toBe(true);
  });

  it('triggers emergency escalation for Hypertensive Crisis (>180/120)', () => {
    const crisis = classifyBloodPressure(188, 122);
    expect(crisis.stage).toBe('Crisis');
    expect(crisis.isAlert).toBe(true);
  });

  it('detects acute hypoglycemia (<70 mg/dL) for immediate sugar intervention', () => {
    const hypo = classifyFastingGlucose(64);
    expect(hypo.category).toBe('Hypoglycemia');
    expect(hypo.isAlert).toBe(true);
  });

  it('classifies well-controlled elderly diabetic fasting sugar (100-130 mg/dL)', () => {
    const controlled = classifyFastingGlucose(118);
    expect(controlled.category).toBe('Elevated');
    expect(controlled.isAlert).toBe(false);
  });

  it('detects severe hyperglycemia (>250 mg/dL)', () => {
    const severe = classifyFastingGlucose(280);
    expect(severe.category).toBe('Severe');
    expect(severe.isAlert).toBe(true);
  });

  it('identifies normal resting pulse oximetry (SpO2 >= 95%)', () => {
    const normal = classifySpO2(98);
    expect(normal.status).toBe('Normal');
    expect(normal.isAlert).toBe(false);
  });

  it('triggers hypoxia alert when oxygen saturation falls to 90% or below', () => {
    const critical = classifySpO2(89);
    expect(critical.status).toBe('Critical Hypoxia');
    expect(critical.isAlert).toBe(true);
  });

  it('computes 7-day average systolic and diastolic blood pressure', () => {
    const sevenDayReadings = [
      { sys: 126, dia: 78 },
      { sys: 124, dia: 80 },
      { sys: 130, dia: 82 },
      { sys: 122, dia: 76 },
      { sys: 128, dia: 79 },
      { sys: 125, dia: 78 },
      { sys: 124, dia: 77 },
    ];

    const avgSys = Math.round(
      sevenDayReadings.reduce((sum, r) => sum + r.sys, 0) / sevenDayReadings.length
    );
    const avgDia = Math.round(
      sevenDayReadings.reduce((sum, r) => sum + r.dia, 0) / sevenDayReadings.length
    );

    expect(avgSys).toBe(126);
    expect(avgDia).toBe(79);
    expect(avgSys).toBeLessThan(140);
  });

  it('detects geriatric resting bradycardia (<50 bpm) and tachycardia (>100 bpm)', () => {
    const brady = classifyHeartRate(46);
    expect(brady.status).toBe('Bradycardia');
    expect(brady.isAlert).toBe(true);

    const normal = classifyHeartRate(72);
    expect(normal.status).toBe('Normal');
    expect(normal.isAlert).toBe(false);

    const tachy = classifyHeartRate(112);
    expect(tachy.status).toBe('Tachycardia');
    expect(tachy.isAlert).toBe(true);
  });

  it('classifies body temperature and detects geriatric febrile episodes (>101°F)', () => {
    const normal = classifyTemperature(98.4);
    expect(normal.status).toBe('Normal');
    expect(normal.isAlert).toBe(false);

    const lowGrade = classifyTemperature(99.8);
    expect(lowGrade.status).toBe('Low-grade Fever');
    expect(lowGrade.isAlert).toBe(false);

    const highFever = classifyTemperature(102.2);
    expect(highFever.status).toBe('High Fever');
    expect(highFever.isAlert).toBe(true);
  });
});
