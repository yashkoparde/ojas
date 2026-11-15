import { describe, it, expect } from 'vitest';
import { INITIAL_DB } from '../src/initialData';
import handler from '../api/index';

class MockResponse {
  statusCode: number = 200;
  headers: Record<string, string> = {};
  data: string = '';

  setHeader(key: string, value: string) {
    this.headers[key.toLowerCase()] = value;
  }
  writeHead(code: number, headers?: Record<string, string>) {
    this.statusCode = code;
    if (headers) {
      Object.entries(headers).forEach(([k, v]) => this.setHeader(k, v));
    }
  }
  end(data?: string) {
    if (data) this.data = data;
  }
}

describe('OJAS Emergency Escalation & Physician Continuity Suite', () => {
  it('generates high-priority emergency payload for 108 Ambulance dispatch', () => {
    const patient = INITIAL_DB.patient;
    const ambulancePayload = {
      service: '108 Emergency Ambulance',
      city: 'Pune',
      pickupAddress: patient.address,
      patientName: patient.fullName,
      age: patient.age,
      bloodGroup: patient.bloodGroup,
      chronicConditions: patient.conditions,
      criticalAllergies: patient.allergies,
      primaryContact: patient.emergencyContacts.find((c) => c.isPrimary)?.phone,
      primaryHospital: patient.primaryDoctor.hospital,
    };

    expect(ambulancePayload.service).toBe('108 Emergency Ambulance');
    expect(ambulancePayload.city).toBe('Pune');
    expect(ambulancePayload.bloodGroup).toBe('O+');
    expect(ambulancePayload.chronicConditions).toContain('Stage 2 Essential Hypertension');
    expect(ambulancePayload.criticalAllergies).toContain('Penicillin (Severe Anaphylaxis)');
    expect(ambulancePayload.primaryHospital).toContain('Sahyadri Super Speciality Hospital');
  });

  it('formats structured clinical adherence report for Dr. Rajesh Kulkarni', async () => {
    const req = {
      method: 'POST',
      url: '/api/doctor/share-report',
      body: {
        recipientDoctorEmail: INITIAL_DB.patient.primaryDoctor.email,
        notes: 'Monthly geriatric review: BP and fasting glucose well-stabilized on current Telma and Glycomet regimen.',
        includeVitals: true,
        includeAdherenceTrends: true,
      },
    };
    const res = new MockResponse();

    await handler(req as any, res as any);
    expect(res.statusCode).toBe(200);

    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
    expect(json.message).toContain('Dr. Rajesh Kulkarni');
  });

  it('dispatches WhatsApp alert to Care Circle for missed doses or vital anomalies', async () => {
    const familyMember = INITIAL_DB.members.find((m) => m.role === 'family');
    const req = {
      method: 'POST',
      url: '/api/notifications/whatsapp-dispatch',
      body: {
        recipientPhone: familyMember?.phone,
        recipientName: familyMember?.name,
        alertType: 'missed_dose',
        customMessage: 'Kamala Aaji has not taken her 08:00 AM Telma 40 dose. Sister Priya has been notified.',
      },
    };
    const res = new MockResponse();

    await handler(req as any, res as any);
    expect(res.statusCode).toBe(200);

    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
    expect(json.dispatchedTo).toBe(familyMember?.phone);
  });

  it('validates First-Responder Emergency QR Health Pass data integrity', () => {
    const patient = INITIAL_DB.patient;
    const qrData = {
      id: patient.qrCodeId,
      name: patient.fullName,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      conditions: patient.conditions,
      primaryDoctorPhone: patient.primaryDoctor.phone,
      emergencyPhone: patient.emergencyContacts[0].phone,
    };

    expect(qrData.id).toMatch(/^OJAS-IND-/);
    expect(qrData.name).toBe('Smt. Kamala Deshmukh');
    expect(qrData.allergies.length).toBeGreaterThan(0);
    expect(qrData.primaryDoctorPhone).toBeDefined();
    expect(qrData.emergencyPhone).toBeDefined();
  });

  it('sanitizes telephone dialing URLs for native cellular integration', () => {
    const rawPhones = [
      '+91 98230 45120',
      '+91 20 6721 3000',
      '+91 98201 11223',
    ];

    rawPhones.forEach((phone) => {
      const sanitized = `tel:${phone.replace(/\s+/g, '')}`;
      expect(sanitized).toMatch(/^tel:\+91\d{10,}$/);
    });
  });

  it('verifies Sahyadri Hospital clinical dispatch email subject structure', () => {
    const patient = INITIAL_DB.patient;
    const subject = `[CLINICAL REPORT] ${patient.fullName} (Age ${patient.age}) - Routine & Adherence Summary`;
    expect(subject).toContain('CLINICAL REPORT');
    expect(subject).toContain('Smt. Kamala Deshmukh');
    expect(subject).toContain('Age 76');
  });
});
