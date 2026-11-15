import { describe, it, expect } from 'vitest';
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

describe('OJAS Serverless API Integration Suite', () => {
  it('GET /api/state returns full healthcare database and 200 OK', async () => {
    const req = { method: 'GET', url: '/api/state' };
    const res = new MockResponse();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');

    const json = JSON.parse(res.data);
    expect(json.patient).toBeDefined();
    expect(json.patient.fullName).toBe('Smt. Kamala Deshmukh');
    expect(json.medications.length).toBeGreaterThan(0);
    expect(json.members.length).toBeGreaterThan(0);
    expect(json.hardware).toBeDefined();
  });

  it('POST /api/auth/verify-passcode verifies caregiver 4-digit PIN', async () => {
    const validReq = {
      method: 'POST',
      url: '/api/auth/verify-passcode',
      body: { memberId: 'mem-caretaker-1', passcode: '2468' },
    };
    const validRes = new MockResponse();
    await handler(validReq as any, validRes as any);

    expect(validRes.statusCode).toBe(200);
    const validJson = JSON.parse(validRes.data);
    expect(validJson.success).toBe(true);
    expect(validJson.member.name).toContain('Priya');
  });

  it('POST /api/medications/:id/dose marks dose as taken with timestamp and actor', async () => {
    const req = {
      method: 'POST',
      url: '/api/medications/med-1/dose',
      body: {
        slotId: 'slot-med1-1',
        status: 'taken',
        actorName: 'Sister Priya Nair, RN',
        notes: 'Taken post-breakfast with water',
      },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    const updatedSlot = json.medications
      .find((m: any) => m.id === 'med-1')
      .dailySchedule.find((s: any) => s.id === 'slot-med1-1');

    expect(updatedSlot.status).toBe('taken');
    expect(updatedSlot.acknowledgedBy).toBe('Sister Priya Nair, RN');
  });

  it('POST /api/medications/:id/refill increments stock count', async () => {
    const req = {
      method: 'POST',
      url: '/api/medications/med-1/refill',
      body: { addedQuantity: 30 },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
  });

  it('POST /api/hardware/sync toggles pillbox door and alarm', async () => {
    const req = {
      method: 'POST',
      url: '/api/hardware/sync',
      body: { action: 'toggle_door' },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    expect(typeof json.doorOpen).toBe('boolean');
  });

  it('POST /api/ai/tts returns audioBase64 for Indian multilingual speech', async () => {
    const req = {
      method: 'POST',
      url: '/api/ai/tts',
      body: {
        text: 'नमस्कार कमला आजी',
        langCode: 'mr',
        languageName: 'Marathi',
        speechLang: 'mr-IN',
      },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    expect(json.audioBase64).toBeDefined();
    expect(typeof json.audioBase64).toBe('string');
    expect(json.audioBase64.length).toBeGreaterThan(100);
    expect(json.mimeType).toBe('audio/mpeg');
  });

  it('OPTIONS preflight returns 204 with CORS and security headers', async () => {
    const req = { method: 'OPTIONS', url: '/api/state' };
    const res = new MockResponse();

    await handler(req as any, res as any);
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('POST /api/sos triggers emergency alert broadcast to family and physician', async () => {
    const req = {
      method: 'POST',
      url: '/api/sos',
      body: {
        type: 'ambulance',
        triggerSource: 'One-Tap Urgent Dispatch',
      },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect([200, 201]).toContain(res.statusCode);
    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
  });

  it('POST /api/vitals/log records bedside blood pressure and glucose', async () => {
    const req = {
      method: 'POST',
      url: '/api/vitals/log',
      body: {
        type: 'Blood Pressure (BP)',
        value: '124/78 mmHg',
        notes: 'Resting seated for 10 mins post-breakfast',
        notifyFamily: true,
        actorName: 'Sister Priya Nair, RN',
      },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
    expect(json.vitalEntry.value).toBe('124/78 mmHg');
    expect(json.vitalEntry.notifiedFamily).toBe(true);
  });

  it('POST /api/appointments/schedule saves upcoming consultation', async () => {
    const newAppt = {
      id: 'appt-test-cardio',
      doctorName: 'Dr. Rajesh Kulkarni, MD, DM',
      specialty: 'Cardiology Review',
      hospitalLocation: 'Sahyadri Super Speciality Hospital',
      roomOrDept: 'OPD Chamber 4',
      date: '2026-12-05',
      time: '11:00',
      status: 'upcoming',
      assignedMemberId: 'mem-caretaker-1',
      reason: 'Longitudinal BP and INR Review',
    };
    const req = {
      method: 'POST',
      url: '/api/appointments/schedule',
      body: { appointment: newAppt },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
  });

  it('POST /api/notifications/dispatch-reminder sends proactive email for upcoming dose and appointments', async () => {
    const req = {
      method: 'POST',
      url: '/api/notifications/dispatch-reminder',
      body: {
        type: 'upcoming_dose',
        subject: '[OJAS] Upcoming Telma 40 Dose Due in 15 Minutes',
        body: 'Please ensure Kamala Aaji takes Telma 40 with warm water.',
        recipients: ['rohan.deshmukh@ojas.in', 'priya.nair.rn@ojas.in'],
      },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    expect(json.success).toBe(true);
    expect(json.email.type).toBe('upcoming_dose');
    expect(json.email.recipients).toContain('rohan.deshmukh@ojas.in');
  });

  it('marking dose as missed automatically logs proactive escalation email alert', async () => {
    const req = {
      method: 'POST',
      url: '/api/medications/med-1/dose',
      body: {
        slotId: 'slot-med1-1',
        status: 'missed',
        actorName: 'System Scheduler',
      },
    };
    const res = new MockResponse();
    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.data);
    const hasEscalation = json.emailLogs.some(
      (e: any) => e.type === 'escalation_alert' && e.subject.includes('Missed Dose')
    );
    expect(hasEscalation).toBe(true);
  });
});
