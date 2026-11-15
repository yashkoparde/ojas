import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';

// Load initial database seed cleanly from local data.json
let memoryDb: any;
try {
  const dataPath = new URL('./data.json', import.meta.url);
  memoryDb = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
} catch (err) {
  memoryDb = {
    patient: {},
    medications: [],
    members: [],
    appointments: [],
    activityLogs: [],
    emailLogs: [],
    hardware: {},
    notificationSettings: {},
  };
}

async function parseBody(req: any): Promise<any> {
  if (req.body) return req.body;
  if (!req.on || typeof req.on !== 'function') return {};
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.end();
  }

  // Extract path from url (strip query params and normalize)
  const fullUrl = req.url || '';
  const pathname = fullUrl.split('?')[0].replace(/\/$/, '') || '/';
  const path = pathname.startsWith('/api') ? pathname : `/api${pathname}`;
  const method = req.method?.toUpperCase() || 'GET';

  // Parse body if body exists or already parsed by Vercel
  const body = req.body || (['POST', 'PUT', 'PATCH'].includes(method) ? await parseBody(req) : {});

  // Route 1: GET /api/state
  if (method === 'GET' && (path === '/api/state' || path === '/api')) {
    return sendJson(res, 200, memoryDb);
  }

  // Route 2: POST /api/auth/verify-passcode
  if (method === 'POST' && path === '/api/auth/verify-passcode') {
    const { memberId, passcode } = body;
    const member = memoryDb.members?.find((m: any) => m.id === memberId);
    if (!member) {
      return sendJson(res, 404, { error: 'Care Circle member not found' });
    }
    if (member.role === 'elderly' || member.role === 'family') {
      return sendJson(res, 200, { success: true, member });
    }
    if (member.passcode === passcode) {
      return sendJson(res, 200, { success: true, member });
    }
    return sendJson(res, 401, { error: 'Invalid 4-digit PIN.' });
  }

  // Route 3: POST /api/medications/:id/dose
  if (method === 'POST' && path.match(/^\/api\/medications\/[^/]+\/dose$/)) {
    const parts = path.split('/');
    const id = parts[3];
    const { slotId, status, actorName, notes } = body;
    const med = memoryDb.medications?.find((m: any) => m.id === id);
    if (!med) return sendJson(res, 404, { error: 'Medication not found' });

    const slot = med.dailySchedule?.find((s: any) => s.id === slotId);
    if (slot) {
      slot.status = status;
      if (status === 'taken') {
        slot.acknowledgedAt = new Date().toISOString();
        slot.acknowledgedBy = actorName || 'User';
      }
      if (notes !== undefined) {
        slot.notes = notes;
      }
    }
    return sendJson(res, 200, memoryDb);
  }

  // Route 4: POST /api/medications/:id/dose/notes
  if (method === 'POST' && path.match(/^\/api\/medications\/[^/]+\/dose\/notes$/)) {
    const parts = path.split('/');
    const id = parts[3];
    const { slotId, notes } = body;
    const med = memoryDb.medications?.find((m: any) => m.id === id);
    if (!med) return sendJson(res, 404, { error: 'Medication not found' });

    const slot = med.dailySchedule?.find((s: any) => s.id === slotId);
    if (slot) {
      slot.notes = notes;
    }
    return sendJson(res, 200, { success: true, memoryDb });
  }

  // Route 5: POST /api/medications/:id/refill
  if (method === 'POST' && path.match(/^\/api\/medications\/[^/]+\/refill$/)) {
    const parts = path.split('/');
    const id = parts[3];
    const { addedQuantity } = body;
    const med = memoryDb.medications?.find((m: any) => m.id === id);
    if (med) {
      med.stockCount = (med.stockCount || 0) + (Number(addedQuantity) || 30);
    }
    return sendJson(res, 200, { success: true, memoryDb });
  }

  // Route 6: POST /api/medications
  if (method === 'POST' && path === '/api/medications') {
    const { medication } = body;
    if (medication) {
      memoryDb.medications = memoryDb.medications || [];
      memoryDb.medications.push(medication);
    }
    return sendJson(res, 200, { success: true, memoryDb });
  }

  // Route 7: PUT /api/medications/:id
  if (method === 'PUT' && path.match(/^\/api\/medications\/[^/]+$/)) {
    const parts = path.split('/');
    const id = parts[3];
    const { updates } = body;
    const med = memoryDb.medications?.find((m: any) => m.id === id);
    if (med && updates) {
      Object.assign(med, updates);
    }
    return sendJson(res, 200, { success: true, memoryDb });
  }

  // Route 8: DELETE /api/medications/:id
  if (method === 'DELETE' && path.match(/^\/api\/medications\/[^/]+$/)) {
    const parts = path.split('/');
    const id = parts[3];
    memoryDb.medications = memoryDb.medications?.filter((m: any) => m.id !== id);
    return sendJson(res, 200, { success: true, memoryDb });
  }

  // Route 9: POST /api/hardware/sync
  if (method === 'POST' && path === '/api/hardware/sync') {
    const { action, compartmentNumber } = body;
    memoryDb.hardware = memoryDb.hardware || {};
    if (action === 'toggle_door') {
      memoryDb.hardware.doorOpen = !memoryDb.hardware.doorOpen;
    } else if (action === 'dismiss_buzzer' || action === 'silence_alarm') {
      memoryDb.hardware.buzzerActive = false;
    } else if (action === 'trigger_alarm') {
      memoryDb.hardware.buzzerActive = true;
    } else if (action === 'light_slot' && compartmentNumber) {
      memoryDb.hardware.activeSlotLed = compartmentNumber;
    }
    return sendJson(res, 200, memoryDb.hardware);
  }

  // Route 10: GET /api/events (SSE)
  if (method === 'GET' && path === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify(memoryDb)}\n\n`);
    return res.end();
  }

  // Generic fallback for any other clinical POST/PUT/GET endpoint
  return sendJson(res, 200, { success: true, timestamp: new Date().toISOString(), memoryDb });
}
