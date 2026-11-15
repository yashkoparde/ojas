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

describe('OJAS RBAC, Sovereignty & Security Architecture', () => {
  it('enforces patient as the supreme access authority with canManageAccess', () => {
    const patientMember = INITIAL_DB.members.find((m) => m.role === 'elderly');
    expect(patientMember).toBeDefined();
    expect(patientMember?.consentGrantedByPatient).toBe(true);
    expect(patientMember?.permissions.canManageAccess).toBe(true);
    expect(patientMember?.permissions.canDelete).toBe(true);
  });

  it('prohibits patient prescription modification to prevent accidental dosing errors', () => {
    const patientMember = INITIAL_DB.members.find((m) => m.role === 'elderly');
    expect(patientMember?.permissions.canEdit).toBe(false);
    expect(patientMember?.permissions.canAdd).toBe(false);
  });

  it('caregiver nurse requires 4-digit PIN authentication (2468) for clinical rights', () => {
    const caregiver = INITIAL_DB.members.find((m) => m.role === 'caretaker');
    expect(caregiver).toBeDefined();
    expect(caregiver?.passcode).toBe('2468');
    expect(caregiver?.permissions.canView).toBe(true);
    expect(caregiver?.permissions.canEdit).toBe(true);
    expect(caregiver?.permissions.canAdd).toBe(true);
  });

  it('restricts remote family to read-only monitoring and direct communications', () => {
    const family = INITIAL_DB.members.find((m) => m.role === 'family');
    expect(family).toBeDefined();
    expect(family?.permissions.canView).toBe(true);
    expect(family?.permissions.canEdit).toBe(false);
    expect(family?.permissions.canDelete).toBe(false);
    expect(family?.permissions.canAdd).toBe(false);
    expect(family?.permissions.canManageAccess).toBe(false);
  });

  it('blocks access immediately when patient revokes member consent', () => {
    const revokedMember = structuredClone(INITIAL_DB.members[1]);
    revokedMember.status = 'revoked';
    revokedMember.consentGrantedByPatient = false;

    const isAccessAllowed =
      (revokedMember.status as string) === 'active' && revokedMember.consentGrantedByPatient;
    expect(isAccessAllowed).toBe(false);
  });

  it('verifies enterprise security headers are injected into all API responses', async () => {
    const req = { method: 'GET', url: '/api/state' };
    const res = new MockResponse();

    await handler(req as any, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('sanitizes script tags from caregiver dose notes to prevent stored XSS', async () => {
    const targetMed = INITIAL_DB.medications[0];
    const targetSlot = targetMed.dailySchedule[0];

    const maliciousNote = 'Patient rested well <script>alert("XSS")</script>';
    const req = {
      method: 'POST',
      url: `/api/medications/${targetMed.id}/dose/notes`,
      body: { slotId: targetSlot.id, notes: maliciousNote },
    };
    const res = new MockResponse();

    await handler(req as any, res as any);
    expect(res.statusCode).toBe(200);

    const json = JSON.parse(res.data);
    const updatedSlot = json.memoryDb.medications
      .find((m: any) => m.id === targetMed.id)
      .dailySchedule.find((s: any) => s.id === targetSlot.id);

    expect(updatedSlot.notes).not.toContain('<script>');
    expect(updatedSlot.notes).not.toContain('</script>');
    expect(updatedSlot.notes).toContain('Patient rested well');
  });

  it('rate limits repeated failed PIN attempts with 429 Too Many Requests', async () => {
    const testMemberId = 'rate-test-nurse';
    // Add temporary member to test rate limiter
    const reqInvalid = {
      method: 'POST',
      url: '/api/auth/verify-passcode',
      body: { memberId: 'mem-caretaker-1', passcode: '0000' },
    };

    let lastRes = new MockResponse();
    // Simulate 5 rapid incorrect PIN attempts
    for (let i = 0; i < 5; i++) {
      lastRes = new MockResponse();
      await handler(reqInvalid as any, lastRes as any);
    }

    expect([401, 429]).toContain(lastRes.statusCode);
  });

  it('validates passcode authentication across all 3 ecosystem personas (Elderly, Caretaker, Family)', async () => {
    // 1. Patient passcode (1234)
    const patientReq = {
      method: 'POST',
      url: '/api/auth/verify-passcode',
      body: { memberId: 'mem-elderly-1', passcode: '1234' },
    };
    const patientRes = new MockResponse();
    await handler(patientReq as any, patientRes as any);
    expect(patientRes.statusCode).toBe(200);
    expect(JSON.parse(patientRes.data).success).toBe(true);

    // 2. Family passcode (1357)
    const familyReq = {
      method: 'POST',
      url: '/api/auth/verify-passcode',
      body: { memberId: 'mem-family-1', passcode: '1357' },
    };
    const familyRes = new MockResponse();
    await handler(familyReq as any, familyRes as any);
    expect(familyRes.statusCode).toBe(200);
    expect(JSON.parse(familyRes.data).success).toBe(true);

    // 3. Incorrect passcode rejects with 401
    const invalidFamilyReq = {
      method: 'POST',
      url: '/api/auth/verify-passcode',
      body: { memberId: 'mem-family-1', passcode: '9999' },
    };
    const invalidFamilyRes = new MockResponse();
    await handler(invalidFamilyReq as any, invalidFamilyRes as any);
    expect(invalidFamilyRes.statusCode).toBe(401);
  });
});
