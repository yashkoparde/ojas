<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e74fdf02-1026-4279-b6b8-fec9a767357e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


---

## Architecture & Features

### Core Modules
- **Smart Pillbox IoT Simulation**: 6-compartment hardware telemetry, NFC tag scanning, compartment LEDs, and lid status sensors.
- **AI Clinical Assistant**: Powered by Google Gemini (`@google/genai`), supporting drug contraindication analysis, schedule optimization, and multi-lingual voice synthesis.
- **Multilingual Support**: Real-time localization in English, Hindi (हिन्दी), and Marathi (मराठी).
- **Role-Based Access Control**: Granular roles for Elderly Patients, Primary Caregivers, and Family Members protected by PIN verification.
- **Emergency First-Responder QR Pass**: Instant access to chronic conditions, blood group, allergies, and emergency doctor contacts.
- **Adherence & Notification Engine**: SSE real-time state syncing with automated dose escalation and SMS/email simulation logs.
