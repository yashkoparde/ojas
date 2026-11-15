/**
 * @file classifier.ts
 * @module domain/vitals
 * @description Geriatric Vital Signs Classification and Anomaly Detection Domain Service.
 * Implements clinical guidelines from the American Heart Association (AHA) and Geriatric Medicine.
 */

export interface BloodPressureResult {
  systolic: number;
  diastolic: number;
  stage: 'Optimal' | 'Normal' | 'Elevated' | 'Stage 1' | 'Stage 2' | 'Hypertensive Crisis';
  isAlert: boolean;
  actionGuidance: string;
}

export interface BloodGlucoseResult {
  valueMgDl: number;
  category: 'Hypoglycemia' | 'Optimal Fasting' | 'Normal Postprandial' | 'Elevated' | 'Severe Hyperglycemia';
  isAlert: boolean;
  actionGuidance: string;
}

export interface PulseOximetryResult {
  spo2Percent: number;
  status: 'Normal' | 'Mild Hypoxia' | 'Critical Hypoxia';
  isAlert: boolean;
  actionGuidance: string;
}

export interface PulseRateResult {
  bpm: number;
  status: 'Bradycardia' | 'Normal Resting' | 'Tachycardia';
  isAlert: boolean;
}

export class VitalsClassificationService {
  public static evaluateBloodPressure(systolic: number, diastolic: number): BloodPressureResult {
    if (systolic > 180 || diastolic > 120) {
      return {
        systolic,
        diastolic,
        stage: 'Hypertensive Crisis',
        isAlert: true,
        actionGuidance: 'Emergency medical consultation required immediately. Contact Dr. Rajesh Kulkarni or call 108 Ambulance.',
      };
    }
    if (systolic >= 140 || diastolic >= 90) {
      return {
        systolic,
        diastolic,
        stage: 'Stage 2',
        isAlert: true,
        actionGuidance: 'Stage 2 Hypertension detected. Re-verify in 15 minutes after seated rest. Ensure Telma 40 was taken.',
      };
    }
    if (systolic >= 130 || diastolic >= 80) {
      return {
        systolic,
        diastolic,
        stage: 'Stage 1',
        isAlert: false,
        actionGuidance: 'Stage 1 Hypertension. Maintain regular hydration and low sodium diet.',
      };
    }
    if (systolic >= 120 && diastolic < 80) {
      return {
        systolic,
        diastolic,
        stage: 'Elevated',
        isAlert: false,
        actionGuidance: 'Slightly elevated. Continue routine monitoring.',
      };
    }
    return {
      systolic,
      diastolic,
      stage: 'Normal',
      isAlert: false,
      actionGuidance: 'Healthy normal resting blood pressure.',
    };
  }

  public static evaluateGlucose(glucoseMgDl: number, isFasting: boolean = true): BloodGlucoseResult {
    if (glucoseMgDl < 70) {
      return {
        valueMgDl: glucoseMgDl,
        category: 'Hypoglycemia',
        isAlert: true,
        actionGuidance: 'Acute hypoglycemia danger! Administer 15g fast-acting carbohydrates (fruit juice, glucose powder) immediately.',
      };
    }
    if (isFasting) {
      if (glucoseMgDl <= 99) {
        return {
          valueMgDl: glucoseMgDl,
          category: 'Optimal Fasting',
          isAlert: false,
          actionGuidance: 'Optimal fasting blood sugar.',
        };
      }
      if (glucoseMgDl <= 130) {
        return {
          valueMgDl: glucoseMgDl,
          category: 'Elevated',
          isAlert: false,
          actionGuidance: 'Target controlled range for elderly diabetic patient on Glycomet-GP.',
        };
      }
    } else {
      if (glucoseMgDl <= 140) {
        return {
          valueMgDl: glucoseMgDl,
          category: 'Normal Postprandial',
          isAlert: false,
          actionGuidance: 'Post-meal reading within target.',
        };
      }
      if (glucoseMgDl <= 180) {
        return {
          valueMgDl: glucoseMgDl,
          category: 'Elevated',
          isAlert: false,
          actionGuidance: 'Acceptable elderly postprandial ceiling.',
        };
      }
    }

    return {
      valueMgDl: glucoseMgDl,
      category: 'Severe Hyperglycemia',
      isAlert: true,
      actionGuidance: 'Significantly elevated blood glucose (>180 mg/dL). Caregiver review required.',
    };
  }

  public static evaluateSpO2(spo2: number): PulseOximetryResult {
    if (spo2 >= 95) {
      return {
        spo2Percent: spo2,
        status: 'Normal',
        isAlert: false,
        actionGuidance: 'Normal oxygen saturation on room air.',
      };
    }
    if (spo2 >= 91) {
      return {
        spo2Percent: spo2,
        status: 'Mild Hypoxia',
        isAlert: true,
        actionGuidance: 'Mild hypoxia. Encourage upright seated position and deep breathing exercises.',
      };
    }
    return {
      spo2Percent: spo2,
      status: 'Critical Hypoxia',
      isAlert: true,
      actionGuidance: 'Critical hypoxia (<91%). Supplemental oxygen and immediate clinical intervention required.',
    };
  }

  public static evaluateHeartRate(bpm: number): PulseRateResult {
    if (bpm < 50) return { bpm, status: 'Bradycardia', isAlert: true };
    if (bpm > 100) return { bpm, status: 'Tachycardia', isAlert: true };
    return { bpm, status: 'Normal Resting', isAlert: false };
  }
}
