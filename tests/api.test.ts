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

describe('OJAS Serverless API Integration', () => {
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
    expect(validJson.member.name).toBe('Sister Priya Nair, RN');

    // Invalid PIN
    const invalidReq = {
      method: 'POST',
      url: '/api/auth/verify-passcode',
      body: { memberId: 'mem-caretaker-1', passcode: '9999' },
    };
    const invalidRes = new MockResponse();
    await handler(invalidReq as any, invalidRes as any);

    expect(invalidRes.statusCode).toBe(401);
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
});
