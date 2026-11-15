import express, { Request, Response } from 'express';
import { INITIAL_DB } from '../src/initialData';
import type { HealthcareDatabase } from '../src/types';

const app = express();
app.use(express.json());

// In-memory state for serverless execution
let memoryDb: HealthcareDatabase = structuredClone(INITIAL_DB);

// Normalize request url in Vercel serverless environment:
// Vercel rewrites might pass /state or /api/state; ensure it always has /api prefix
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  next();
});

app.get('/api/state', (_req: Request, res: Response) => {
  res.json(memoryDb);
});

app.post('/api/auth/verify-passcode', (req: Request, res: Response) => {
  const { memberId, passcode } = req.body;
  const member = memoryDb.members.find((m) => m.id === memberId);
  if (!member) {
    return res.status(404).json({ error: 'Care Circle member not found' });
  }
  if (member.role === 'elderly' || member.role === 'family') {
    return res.json({ success: true, member });
  }
  if (member.passcode === passcode) {
    return res.json({ success: true, member });
  }
  return res.status(401).json({ error: 'Invalid 4-digit PIN.' });
});

app.post('/api/medications/:id/dose', (req: Request, res: Response) => {
  const { id } = req.params;
  const { slotId, status, actorName, notes } = req.body;
  const med = memoryDb.medications.find((m) => m.id === id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  const slot = med.dailySchedule.find((s) => s.id === slotId);
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
  res.json(memoryDb);
});

app.post('/api/medications/:id/dose/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { slotId, notes } = req.body;
  const med = memoryDb.medications.find((m) => m.id === id);
  if (!med) return res.status(404).json({ error: 'Medication not found' });

  const slot = med.dailySchedule.find((s) => s.id === slotId);
  if (slot) {
    slot.notes = notes;
  }
  res.json({ success: true, memoryDb });
});

app.post('/api/medications/:id/refill', (req: Request, res: Response) => {
  const { id } = req.params;
  const { addedQuantity } = req.body;
  const med = memoryDb.medications.find((m) => m.id === id);
  if (med) {
    med.stockCount = (med.stockCount || 0) + (Number(addedQuantity) || 30);
  }
  res.json({ success: true, memoryDb });
});

app.post('/api/medications', (req: Request, res: Response) => {
  const { medication } = req.body;
  if (medication) {
    memoryDb.medications.push(medication);
  }
  res.json({ success: true, memoryDb });
});

app.put('/api/medications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { updates } = req.body;
  const med = memoryDb.medications.find((m) => m.id === id);
  if (med && updates) {
    Object.assign(med, updates);
  }
  res.json({ success: true, memoryDb });
});

app.delete('/api/medications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  memoryDb.medications = memoryDb.medications.filter((m) => m.id !== id);
  res.json({ success: true, memoryDb });
});

app.post('/api/appointments', (req: Request, res: Response) => {
  const { appointment } = req.body;
  if (appointment) {
    memoryDb.appointments.push(appointment);
  }
  res.json({ success: true, memoryDb });
});

app.put('/api/appointments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { updates } = req.body;
  const appt = memoryDb.appointments.find((a) => a.id === id);
  if (appt && updates) {
    Object.assign(appt, updates);
  }
  res.json({ success: true, memoryDb });
});

app.put('/api/patient', (req: Request, res: Response) => {
  const { updates } = req.body;
  if (updates) {
    Object.assign(memoryDb.patient, updates);
  }
  res.json({ success: true, memoryDb });
});

app.post('/api/patient/reports', (req: Request, res: Response) => {
  const { report } = req.body;
  if (report) {
    memoryDb.patient.reports = memoryDb.patient.reports || [];
    memoryDb.patient.reports.push(report);
  }
  res.json({ success: true, memoryDb });
});

app.post('/api/members', (req: Request, res: Response) => {
  const { member } = req.body;
  if (member) {
    memoryDb.members.push(member);
  }
  res.json({ success: true, memoryDb });
});

app.put('/api/members/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { updates } = req.body;
  const m = memoryDb.members.find((mem) => mem.id === id);
  if (m && updates) {
    Object.assign(m, updates);
  }
  res.json({ success: true, memoryDb });
});

app.post('/api/hardware/sync', (req: Request, res: Response) => {
  const { action, compartmentNumber } = req.body;
  if (action === 'toggle_door') {
    memoryDb.hardware.doorOpen = !memoryDb.hardware.doorOpen;
  } else if (action === 'dismiss_buzzer' || action === 'silence_alarm') {
    memoryDb.hardware.buzzerActive = false;
  } else if (action === 'trigger_alarm') {
    memoryDb.hardware.buzzerActive = true;
  } else if (action === 'light_slot' && compartmentNumber) {
    memoryDb.hardware.activeSlotLed = compartmentNumber;
  }
  res.json(memoryDb.hardware);
});

app.post('/api/routine/:id/toggle', (req: Request, res: Response) => {
  res.json({ success: true });
});

app.post('/api/caregiver/vitals', (req: Request, res: Response) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.post('/api/doctor/share-report', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Clinical summary dispatched to Dr. Rajesh Kulkarni, MD, DM',
  });
});

app.post('/api/notifications/whatsapp-dispatch', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Simulated WhatsApp message sent successfully.',
  });
});

app.post('/api/notifications/send-reminder', (req: Request, res: Response) => {
  res.json({ success: true, timestamp: new Date().toISOString() });
});

app.put('/api/notifications/settings', (req: Request, res: Response) => {
  const { settings } = req.body;
  if (settings) {
    Object.assign(memoryDb.notificationSettings, settings);
  }
  res.json({ success: true, memoryDb });
});

app.post('/api/notifications/:id/ack', (_req: Request, res: Response) => {
  res.json({ success: true });
});

app.post('/api/sos', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Emergency dispatch triggered.' });
});

app.get('/api/events', (_req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`data: ${JSON.stringify(memoryDb)}\n\n`);
  // End gracefully on serverless
  res.end();
});

export default app;
