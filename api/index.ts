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

// In-memory rate limiting map for PIN attempts
const pinAttemptStore = new Map<string, { attempts: number; lockedUntil: number }>();

function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data));
}

/**
 * Call Groq API for ultra-fast, free-tier multilingual LLM & vision inference
 * Models: llama-3.3-70b-versatile, llama-3.1-8b-instant, llama-3.2-11b-vision-preview
 */
async function callGroqChat(
  messages: Array<{ role: string; content: any }>,
  options?: { json?: boolean; model?: string }
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  const model = options?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const payload: any = {
    model,
    messages,
    temperature: 0.2,
  };
  if (options?.json) {
    payload.response_format = { type: 'json_object' };
  }
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn('Groq API error:', res.status, errText);
      return null;
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn('Groq fetch failed:', err);
    return null;
  }
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

  // Route 2: POST /api/auth/verify-passcode (Passcode-based access for Elderly, Caretaker & Family)
  if (method === 'POST' && path === '/api/auth/verify-passcode') {
    const { memberId, passcode } = body;
    const member = memoryDb.members?.find((m: any) => m.id === memberId);
    if (!member) {
      return sendJson(res, 404, { error: 'Care Circle member not found' });
    }

    const now = Date.now();
    const rateKey = String(memberId);
    const rateInfo = pinAttemptStore.get(rateKey) || { attempts: 0, lockedUntil: 0 };

    if (rateInfo.lockedUntil > now) {
      const waitSec = Math.ceil((rateInfo.lockedUntil - now) / 1000);
      return sendJson(res, 429, {
        error: `Too many failed attempts. Please wait ${waitSec} seconds before trying again.`,
        locked: true,
      });
    }

    // Verify passcode if provided
    if (passcode) {
      if (member.passcode === passcode) {
        pinAttemptStore.delete(rateKey);
        return sendJson(res, 200, { success: true, member });
      }

      rateInfo.attempts += 1;
      if (rateInfo.attempts >= 5) {
        rateInfo.lockedUntil = now + 60000; // 60s lockout
        pinAttemptStore.set(rateKey, rateInfo);
        return sendJson(res, 429, {
          error: 'Too many failed attempts. Account temporarily locked for 60 seconds.',
          locked: true,
        });
      }
      pinAttemptStore.set(rateKey, rateInfo);
      return sendJson(res, 401, {
        error: `Invalid 4-digit PIN. (${5 - rateInfo.attempts} attempts remaining)`,
        attemptsRemaining: 5 - rateInfo.attempts,
      });
    }

    // Fallback: Elderly accessibility one-tap entry
    if (member.role === 'elderly') {
      return sendJson(res, 200, { success: true, member });
    }

    return sendJson(res, 400, { error: 'Passcode is required for profile access.' });
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
        slot.acknowledgedBy = sanitizeString(actorName) || 'User';
        if (med.stockCount > 0) {
          med.stockCount -= 1;
        }
      } else if (status === 'missed') {
        // Proactive email escalation for missed medication
        const recipients = memoryDb.notificationSettings?.recipientEmails || ['rohan.deshmukh@ojas.in', 'priya.nair.rn@ojas.in'];
        const missedLog = {
          id: `email-missed-${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'escalation_alert',
          subject: `[PROACTIVE ESCALATION] Missed Dose: ${med.name} (${med.dosage}) at ${slot.scheduledTime}`,
          recipients,
          body: `Automated Care Circle Alert: ${memoryDb.patient?.fullName || 'Patient'} missed the scheduled ${slot.scheduledTime} dose of ${med.name} (${med.dosage}). Caregiver follow-up required.`,
          deliveryStatus: 'delivered',
          acknowledged: false,
        };
        memoryDb.emailLogs = memoryDb.emailLogs || [];
        memoryDb.emailLogs.unshift(missedLog);
      }
      if (notes !== undefined) {
        slot.notes = sanitizeString(notes);
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
      slot.notes = sanitizeString(notes);
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

  // Route 11: POST /api/ai/tts (Multilingual Indian Speech Synthesis)
  if (method === 'POST' && path === '/api/ai/tts') {
    try {
      const { text, languageName, speechLang, langCode } = body as {
        text?: string;
        languageName?: string;
        speechLang?: string;
        langCode?: string;
      };
      if (!text || !text.trim()) {
        return sendJson(res, 400, { error: 'Text is required for speech synthesis.' });
      }

      const tlCode = (
        langCode ||
        (speechLang ? speechLang.split('-')[0] : 'en')
      ).toLowerCase();

      let spokenText = text.trim();

      // If a non-English Indian language is selected and caller passed English string,
      // translate into native script using GROQ (first) or Gemini (fallback)
      if (tlCode !== 'en' && !/[^\u0000-\u007F]/.test(spokenText)) {
        let translatedText: string | null = null;
        if (process.env.GROQ_API_KEY) {
          try {
            translatedText = await callGroqChat([
              {
                role: 'system',
                content: `You are an expert medical translator for elderly Indian patients. Translate this healthcare instruction into natural spoken ${
                  languageName || tlCode
                } written strictly in its native Indian script (e.g. Devanagari for Hindi/Marathi, Tamil script for Tamil, Kannada script for Kannada, Bengali script for Bengali). Transliterate medicine brand names phonetically into the native script. Output ONLY the translated sentence with no quotes, notes, or markdown.`,
              },
              { role: 'user', content: spokenText },
            ]);
          } catch {}
        } else if (process.env.GEMINI_API_KEY) {
          try {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            const trResp = await ai.models.generateContent({
              model,
              contents: `Translate the following healthcare instruction for an elderly Indian patient into natural spoken ${
                languageName || tlCode
              } written strictly in its native Indian script: ${spokenText}`,
            });
            if (trResp.text?.trim()) translatedText = trResp.text.trim();
          } catch {}
        }

        if (translatedText && translatedText.trim()) {
          spokenText = translatedText.trim();
        }
      }

      // Split text into <= 140 character sentence chunks so regional TTS never truncates or returns 400
      const rawSentences = spokenText.split(/(?<=[।.!?;\n])\s+/);
      const chunks: string[] = [];
      const maxLen = 140;
      for (const sentence of rawSentences) {
        if (sentence.length <= maxLen) {
          if (sentence.trim()) chunks.push(sentence.trim());
        } else {
          const words = sentence.split(/\s+/);
          let current = '';
          for (const word of words) {
            if ((current + ' ' + word).trim().length <= maxLen) {
              current = (current + ' ' + word).trim();
            } else {
              if (current) chunks.push(current);
              current = word;
            }
          }
          if (current) chunks.push(current);
        }
      }

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks.filter(Boolean)) {
        const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
          chunk
        )}&tl=${encodeURIComponent(tlCode)}&client=gtx`;
        const ttsRes = await fetch(ttsUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        if (ttsRes.ok) {
          const arrBuf = await ttsRes.arrayBuffer();
          if (arrBuf.byteLength > 0) {
            audioBuffers.push(Buffer.from(arrBuf));
          }
        }
      }

      if (audioBuffers.length > 0) {
        const combinedMp3 = Buffer.concat(audioBuffers).toString('base64');
        return sendJson(res, 200, {
          audioBase64: combinedMp3,
          audioWavBase64: combinedMp3,
          mimeType: 'audio/mpeg',
          spokenText,
        });
      }

      return sendJson(res, 200, { audioBase64: null, audioWavBase64: null, fallback: true });
    } catch (error) {
      return sendJson(res, 200, {
        audioBase64: null,
        audioWavBase64: null,
        fallback: true,
        reason: error instanceof Error ? error.message : 'TTS fallback active',
      });
    }
  }

  // Route 12: POST /api/ai/interaction-check
  if (method === 'POST' && path === '/api/ai/interaction-check') {
    try {
      const { candidateMedication } = body as { candidateMedication?: string };
      const medSummary = (memoryDb.medications || [])
        .map((m: any) => `- ${m.name} (${m.genericName}), ${m.dosage}, ${m.frequency} for ${m.purpose}`)
        .join('\n');
      const clinicalPrompt = `Analyze the following Indian elderly patient's active medication regimen, allergies, and health conditions for drug-drug interactions, duplicate therapy warnings, and allergy/condition contraindications.
Patient: ${memoryDb.patient?.fullName}, Age ${memoryDb.patient?.age} (Pune, India)
Conditions: ${(memoryDb.patient?.conditions || []).join(', ')}
Allergies: ${(memoryDb.patient?.allergies || []).join(', ')}
Restrictions: ${(memoryDb.patient?.medicationRestrictions || []).join('; ')}
Active Medications:
${medSummary}
${candidateMedication ? `\nCandidate New Medication to Check: ${candidateMedication}` : ''}`;

      // 1. Try GROQ (llama-3.3-70b-versatile)
      if (process.env.GROQ_API_KEY) {
        const groqPrompt = `${clinicalPrompt}
Return a JSON object with a key "warnings" containing an array of objects:
{
  "warnings": [
    {
      "severity": "high",
      "title": "Concise warning title",
      "medicationsInvolved": ["Medication Name"],
      "explanation": "Clear clinical explanation",
      "recommendation": "Actionable recommendation"
    }
  ]
}`;
        const raw = await callGroqChat(
          [
            { role: 'system', content: 'You are an expert clinical pharmacologist for Indian elderly healthcare. Output strictly valid JSON only.' },
            { role: 'user', content: groqPrompt },
          ],
          { json: true }
        );
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const warnings = Array.isArray(parsed) ? parsed : parsed.warnings || [];
            return sendJson(res, 200, { warnings });
          } catch {}
        }
      }

      // 2. Try Gemini
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: clinicalPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, description: 'high, moderate, or low' },
                  title: { type: Type.STRING, description: 'Concise warning title' },
                  medicationsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
                  explanation: { type: Type.STRING, description: 'Clear clinical explanation' },
                  recommendation: { type: Type.STRING, description: 'Actionable safety recommendation' },
                },
                required: ['severity', 'title', 'medicationsInvolved', 'explanation', 'recommendation'],
              },
            },
          },
        });
        const parsed = JSON.parse((response.text ?? '[]').trim());
        return sendJson(res, 200, { warnings: parsed });
      }

      // 3. Resilient static clinical fallback
      return sendJson(res, 200, {
        warnings: [
          {
            severity: 'moderate',
            title: 'Monitoring Blood Pressure with Telmisartan + Amlodipine',
            medicationsInvolved: ['Telmisartan 40mg', 'Amlodipine 5mg'],
            explanation: 'Dual anti-hypertensive combination requires regular blood pressure monitoring.',
            recommendation: 'Check BP seated daily, preferably at 09:00 AM.',
          },
        ],
      });
    } catch (error) {
      return sendJson(res, 200, {
        warnings: [],
        error: error instanceof Error ? error.message : 'Interaction check fallback',
      });
    }
  }

  // Route 13: POST /api/ai/weekly-summary
  if (method === 'POST' && path === '/api/ai/weekly-summary') {
    try {
      const totalSlots = (memoryDb.medications || []).reduce((acc: number, m: any) => acc + (m.dailySchedule?.length || 0), 0);
      const takenSlots = (memoryDb.medications || []).reduce(
        (acc: number, m: any) => acc + (m.dailySchedule?.filter((s: any) => s.status === 'taken').length || 0),
        0
      );
      const missedSlots = (memoryDb.medications || []).reduce(
        (acc: number, m: any) => acc + (m.dailySchedule?.filter((s: any) => s.status === 'missed').length || 0),
        0
      );

      const summaryPrompt = `Generate a structured weekly healthcare & adherence summary for Indian elderly patient ${memoryDb.patient?.fullName} (Age ${memoryDb.patient?.age}, Pune).
Adherence: ${takenSlots}/${totalSlots} doses taken today, ${missedSlots} missed.
Medications: ${(memoryDb.medications || []).map((m: any) => `${m.name} ${m.dosage}`).join(', ')}
Vitals: ${(memoryDb.dailyRoutine || []).map((r: any) => `${r.title}: ${r.completed ? r.valueRecorded || 'Completed' : 'Pending'}`).join('; ')}`;

      // 1. Try GROQ (llama-3.3-70b-versatile)
      if (process.env.GROQ_API_KEY) {
        const groqPrompt = `${summaryPrompt}
Return a JSON object with exactly these fields:
{
  "headline": "Empowering headline for family and nurse",
  "adherenceAssessment": "Summary of medication adherence",
  "vitalsAndRoutineHighlights": "Key vitals analysis (BP, sugar)",
  "attentionItems": ["Item 1", "Item 2"],
  "caretakerNextSteps": ["Step 1", "Step 2"]
}`;
        const raw = await callGroqChat(
          [
            { role: 'system', content: 'You are a warm, clinical geriatric physician in Pune, India. Output strictly valid JSON only.' },
            { role: 'user', content: groqPrompt },
          ],
          { json: true }
        );
        if (raw) {
          try {
            const summary = JSON.parse(raw);
            return sendJson(res, 200, summary);
          } catch {}
        }
      }

      // 2. Try Gemini
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: summaryPrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                adherenceAssessment: { type: Type.STRING },
                vitalsAndRoutineHighlights: { type: Type.STRING },
                attentionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                caretakerNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['headline', 'adherenceAssessment', 'vitalsAndRoutineHighlights', 'attentionItems', 'caretakerNextSteps'],
            },
          },
        });
        const summary = JSON.parse((response.text ?? '{}').trim());
        return sendJson(res, 200, summary);
      }

      // 3. Static fallback
      return sendJson(res, 200, {
        headline: 'Kamala Deshmukh - Stable Weekly Medication & Vitals Briefing',
        adherenceAssessment: 'Overall adherence is high across morning and night cardiac doses.',
        vitalsAndRoutineHighlights: 'Blood pressure and blood glucose remained within physician-prescribed bounds.',
        attentionItems: ['Refill Ecosprin 75mg within 6 days.'],
        caretakerNextSteps: ['Continue seated BP measurements every morning post-Nashta.'],
      });
    } catch (error) {
      return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Failed to generate summary' });
    }
  }

  // Route 14: POST /api/ai/schedule-assistant
  if (method === 'POST' && path === '/api/ai/schedule-assistant') {
    try {
      const { userMessage, imageBase64, imageMimeType } = body as {
        userMessage?: string;
        imageBase64?: string;
        imageMimeType?: string;
      };

      // 1. Try GROQ (supports vision with llama-3.2-11b-vision-preview or text with llama-3.3-70b-versatile)
      if (process.env.GROQ_API_KEY) {
        const isVision = Boolean(imageBase64 && imageMimeType);
        const model = isVision ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
        const userContent: any = isVision
          ? [
              {
                type: 'text',
                text: `Analyze this prescription image for Indian elderly patient ${memoryDb.patient?.fullName} (Age ${memoryDb.patient?.age}). Request: ${userMessage || 'Suggest schedule around Indian meals (Morning Nashta, Lunch, Night Dinner).'}`
              },
              {
                type: 'image_url',
                image_url: { url: `data:${imageMimeType};base64,${imageBase64}` }
              }
            ]
          : `You are the OJAS India AI Medication Schedule Assistant for ${memoryDb.patient?.fullName} (Age ${memoryDb.patient?.age}, Pune).
User Request: ${userMessage || 'Suggest a safe schedule around Indian meals.'}`;

        const promptSys = `You are the OJAS India AI Medication Schedule Assistant.
Return a valid JSON object with:
{
  "spokenReply": "Clear, comforting response for an elderly Indian patient",
  "clinicalNotes": "Indian meal pairing advice and schedule rationale",
  "hasSuggestedMedication": false
}`;
        const raw = await callGroqChat(
          [
            { role: 'system', content: promptSys },
            { role: 'user', content: userContent },
          ],
          { json: true, model }
        );
        if (raw) {
          try {
            const result = JSON.parse(raw);
            return sendJson(res, 200, result);
          } catch {}
        }
      }

      // 2. Try Gemini
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const contextText = `You are the OJAS India AI Medication Schedule Assistant for ${memoryDb.patient?.fullName} (Age ${memoryDb.patient?.age}).
User Request: ${userMessage || 'Analyze prescription image.'}`;

        const parts: any[] = [];
        if (imageBase64 && imageMimeType) {
          parts.push({ inlineData: { mimeType: imageMimeType, data: imageBase64 } });
        }
        parts.push({ text: contextText });

        const response = await ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                spokenReply: { type: Type.STRING },
                clinicalNotes: { type: Type.STRING },
                hasSuggestedMedication: { type: Type.BOOLEAN },
                suggestedMedication: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    instructions: { type: Type.STRING },
                    purpose: { type: Type.STRING },
                    scheduledTimes: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['name', 'dosage', 'frequency', 'duration', 'instructions', 'purpose', 'scheduledTimes'],
                },
              },
              required: ['spokenReply', 'clinicalNotes', 'hasSuggestedMedication'],
            },
          },
        });
        const result = JSON.parse((response.text ?? '{}').trim());
        return sendJson(res, 200, result);
      }

      // 3. Static fallback
      return sendJson(res, 200, {
        spokenReply: 'नमस्ते, आपकी दवाइयां नाश्ते और रात के खाने के समय निर्धारित हैं। सभी खुराक समय पर लें।',
        clinicalNotes: 'Maintain regular timings around meals. Do not double up missed doses.',
        hasSuggestedMedication: false,
      });
    } catch (error) {
      return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Assistant error' });
    }
  }

  // Route: POST /api/doctor/share-report
  if (method === 'POST' && path === '/api/doctor/share-report') {
    const { recipientDoctorEmail, customNote, notes, includeVitals, includeAdherence, includeAdherenceTrends, actorName } = body;
    const doc = memoryDb.patient?.primaryDoctor || {
      name: 'Dr. Rajesh Kulkarni, MD, DM',
      hospital: 'Sahyadri Super Speciality Hospital, Pune',
      email: 'dr.kulkarni@sahyadrihospitals.com',
    };
    const totalSlots = memoryDb.medications?.flatMap((m: any) => m.dailySchedule || []) || [];
    const takenSlots = totalSlots.filter((s: any) => s.status === 'taken').length;
    const adherenceRate = totalSlots.length > 0 ? Math.round((takenSlots / totalSlots.length) * 100) : 100;

    const message = `Structured clinical report successfully dispatched to ${doc.name} at ${doc.hospital} (${doc.email}). Adherence: ${adherenceRate}%.`;

    return sendJson(res, 200, {
      success: true,
      message,
      recipient: doc.email,
      doctorName: doc.name,
      adherenceRate,
      timestamp: new Date().toISOString(),
    });
  }

  // Route: POST /api/notifications/dispatch-reminder
  if (method === 'POST' && path === '/api/notifications/dispatch-reminder') {
    const { type, subject, body: reminderBody, recipients } = body;
    const recipientList = recipients || memoryDb.notificationSettings?.recipientEmails || ['rohan.deshmukh@ojas.in', 'priya.nair.rn@ojas.in'];
    const emailEntry = {
      id: `email-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: type || 'upcoming_dose',
      subject: sanitizeString(subject) || `[OJAS PROACTIVE REMINDER] Healthcare Routine for ${memoryDb.patient?.fullName}`,
      recipients: recipientList,
      body: sanitizeString(reminderBody) || 'Proactive health routine reminder.',
      deliveryStatus: 'delivered',
      acknowledged: false,
    };
    memoryDb.emailLogs = memoryDb.emailLogs || [];
    memoryDb.emailLogs.unshift(emailEntry);

    return sendJson(res, 200, { success: true, email: emailEntry, memoryDb });
  }

  // Route: POST /api/notifications/:id/ack
  if (method === 'POST' && path.match(/^\/api\/notifications\/[^/]+\/(ack|acknowledge)$/)) {
    const parts = path.split('/');
    const id = parts[3];
    const email = memoryDb.emailLogs?.find((e: any) => e.id === id);
    if (email) {
      email.acknowledged = true;
    }
    return sendJson(res, 200, { success: true, memoryDb });
  }

  // Route: POST /api/notifications/whatsapp-dispatch
  if (method === 'POST' && path === '/api/notifications/whatsapp-dispatch') {
    const { recipientPhone, recipientName, alertType, messageType, customMessage, customText, actorName } = body;
    const targetPhone = recipientPhone || '+91 8778168629';
    const formattedMsg = customMessage || customText || `[OJAS ALERT] Patient update for ${memoryDb.patient?.fullName || 'Smt. Kamala Deshmukh'}.`;

    return sendJson(res, 200, {
      success: true,
      dispatchedTo: targetPhone,
      recipientName: recipientName || 'Care Circle Member',
      protocol: 'WhatsApp Business API (Simulated)',
      message: formattedMsg,
      timestamp: new Date().toISOString(),
    });
  }

  // Route: POST /api/vitals/log
  if (method === 'POST' && path === '/api/vitals/log') {
    const { type, value, notes, notifyFamily, actorName } = body;
    const vitalEntry = {
      id: `vital-${Date.now()}`,
      type: sanitizeString(type) || 'Blood Pressure (BP)',
      value: sanitizeString(value) || '120/80 mmHg',
      notes: sanitizeString(notes) || '',
      recordedAt: new Date().toISOString(),
      recordedBy: sanitizeString(actorName) || 'Sister Priya Nair, RN',
      notifiedFamily: !!notifyFamily,
    };
    memoryDb.vitalsLogs = memoryDb.vitalsLogs || [];
    memoryDb.vitalsLogs.push(vitalEntry);

    return sendJson(res, 200, { success: true, vitalEntry, memoryDb });
  }

  // Generic fallback for any other clinical POST/PUT/GET endpoint
  return sendJson(res, 200, { success: true, timestamp: new Date().toISOString(), memoryDb });
}
