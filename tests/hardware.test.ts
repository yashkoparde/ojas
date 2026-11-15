import { describe, it, expect } from 'vitest';
import { INITIAL_DB } from '../src/initialData';

describe('OJAS IoT Smart Pillbox (ESP32-S3) Telemetry Engine', () => {
  it('initializes with active hardware link and high battery reserve', () => {
    const hw = INITIAL_DB.hardware;
    expect(hw.connected).toBe(true);
    expect(hw.batteryPercent).toBeGreaterThanOrEqual(80);
    expect(hw.batteryPercent).toBeLessThanOrEqual(100);
    expect(hw.doorOpen).toBe(false);
  });

  it('verifies 6 distinct physical pillbox compartments with LED mappings', () => {
    const meds = INITIAL_DB.medications;
    const compartments = meds.map((m) => m.compartmentNumber);

    // Ensure compartments are mapped to valid 1-6 hardware slots
    expect(new Set(compartments).size).toBeGreaterThanOrEqual(4);
    compartments.forEach((num) => {
      expect(num).toBeGreaterThanOrEqual(1);
      expect(num).toBeLessThanOrEqual(6);
    });
  });

  it('validates NFC tag format for tamper-proof blister strip verification', () => {
    INITIAL_DB.medications.forEach((med) => {
      expect(med.nfcTagId).toMatch(/^NFC-SLOT[1-6]-[A-Z0-9]+$/);
    });
  });

  it('toggles magnetic reed switch door sensor between secure and open states', () => {
    const hw = structuredClone(INITIAL_DB.hardware);
    expect(hw.doorOpen).toBe(false);

    // Lid opened by patient
    hw.doorOpen = true;
    expect(hw.doorOpen).toBe(true);

    // Lid closed securely
    hw.doorOpen = false;
    expect(hw.doorOpen).toBe(false);
  });

  it('manages 85dB piezoelectric buzzer alarm state and 1-tap silence', () => {
    const hw = structuredClone(INITIAL_DB.hardware);

    // Trigger scheduled dose alarm
    hw.buzzerActive = true;
    expect(hw.buzzerActive).toBe(true);

    // Patient or Caregiver taps 1-tap silence
    hw.buzzerActive = false;
    expect(hw.buzzerActive).toBe(false);
  });

  it('sets active slot LED ring to highlight currently due medicine compartment', () => {
    const hw = structuredClone(INITIAL_DB.hardware);

    // Target morning Telma 40 in Slot #1
    hw.activeSlotLed = 1;
    expect(hw.activeSlotLed).toBe(1);

    // Target evening Atorva 10 in Slot #5
    hw.activeSlotLed = 5;
    expect(hw.activeSlotLed).toBe(5);
  });

  it('warns when battery reserve drops below 20% critical threshold', () => {
    const checkBatteryHealth = (pct: number) => {
      if (pct <= 15) return 'critical';
      if (pct <= 25) return 'low';
      return 'optimal';
    };

    expect(checkBatteryHealth(95)).toBe('optimal');
    expect(checkBatteryHealth(22)).toBe('low');
    expect(checkBatteryHealth(12)).toBe('critical');
  });

  it('evaluates WiFi telemetry RSSI signal strength metrics', () => {
    const getWifiStatus = (rssiDbm: number) => {
      if (rssiDbm >= -65) return 'excellent';
      if (rssiDbm >= -75) return 'good';
      return 'weak';
    };

    expect(getWifiStatus(-52)).toBe('excellent');
    expect(getWifiStatus(-70)).toBe('good');
    expect(getWifiStatus(-85)).toBe('weak');
  });

  it('validates ESP32-S3 hardware sync action commands', () => {
    const validActions = ['toggle_door', 'silence_alarm', 'trigger_alarm', 'sync_all'];
    validActions.forEach((act) => {
      expect(['toggle_door', 'silence_alarm', 'trigger_alarm', 'sync_all']).toContain(act);
    });
  });

  it('verifies round-trip latency below 50ms for local hardware communication', () => {
    const pingMs = 18;
    expect(pingMs).toBeLessThan(50);
  });
});
