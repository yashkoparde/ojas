# OJAS (ओजस्) — Vital Elder Care & Smart Medication Ecosystem

[![Live Demo](https://img.shields.io/badge/Live%20Demo-ojas--catalyst26.vercel.app-brightgreen?style=for-the-badge&logo=vercel)](https://ojas-catalyst26.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/yashkoparde/ojas)
[![Built for Catalyst](https://img.shields.io/badge/Catalyst%202026-Solo%20AI%20Hackathon-orange?style=for-the-badge)](https://ojas-catalyst26.vercel.app/)

> **Live Deployment:** [https://ojas-catalyst26.vercel.app/](https://ojas-catalyst26.vercel.app/)  
> **Source Code:** [https://github.com/yashkoparde/ojas](https://github.com/yashkoparde/ojas)

---

## Executive Summary

OJAS is an intelligent, interconnected healthcare platform designed to solve the critical challenges of medication non-adherence, clinical isolation, and fragmented routine monitoring among elderly individuals. By bridging the physical-digital divide through an Internet of Things (IoT) Smart Pillbox, Google Gemini AI clinical reasoning, and a sovereign multi-persona collaborative framework, OJAS transforms routine eldercare into a proactive, accessible, and dignified experience.

---

## 1. Problem Statement & Clinical Context

### The Challenge of Aging in Place
Elderly individuals managing multiple chronic conditions (polypharmacy) face severe cognitive, physical, and sensory hurdles:
- **Complex Medication Regimens**: A typical geriatric patient takes between 5 to 12 distinct medications daily across disparate time slots (fasting, post-breakfast, pre-lunch, bedtime). Complex schedules lead to unintentional double dosing, omission of critical doses, and hazardous drug-drug contraindications.
- **Physical and Cognitive Sensory Decline**: Visual impairment compromises reading fine print on blister packs; memory decline impedes recollection of whether a pill was consumed; motor stiffness makes traditional medicine bottles difficult to open.
- **Caregiver Fatigue and Information Silos**: Family members often live in separate cities or work long hours, leaving them uninformed about daily adherence until acute medical emergencies occur. Dedicated nurses and domestic caretakers lack standardized tools to record observational bedside notes and vitals.
- **Loss of Patient Dignity and Agency**: Existing reminder applications treat elderly individuals as passive recipients rather than sovereign managers of their own health, leading to resistance, non-compliance, and depression.

### Objectives of the Platform
1. **Centering the Elderly Individual**: Provide intuitive, one-tap visual and voice interfaces that preserve autonomy while eliminating technological friction.
2. **Sovereign Multi-Persona Collaboration**: Facilitate secure, passcode-governed role segregation where patients explicitly grant, manage, or revoke access permissions for family and caregivers.
3. **Hardware-Software Symbiosis**: Integrate a physical 6-compartment IoT Smart Pillbox with LED guidance, magnetic reed switch lid sensors, NFC blister verification, and audio alarms.
4. **Proactive Clinical Escalation**: Implement an automated multi-tier alerting engine that dispatches email, WhatsApp, and SMS alerts upon missed doses or vital anomalies.
5. **Direct Physician Continuity**: Allow caregivers to compile and transmit structured medication adherence and vital trend reports directly to the primary doctor's clinic.

---

## 2. System Architecture

OJAS is built on a modern full-stack architecture combining a Vite-powered React 19 single-page client, an Express server with Server-Sent Events (SSE) for real-time telemetry streaming, and server-side Google Gemini 2.5 Flash API integration.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application Layer"]
        UI_Elderly["Elderly Portal (One-Tap Intake, High Contrast, Voice TTS)"]
        UI_Caregiver["Caregiver Clinical Command (Bedside Vitals, Notes, Restock)"]
        UI_Family["Family Remote Dashboard (Read-Only Telemetry, SOS, Calls)"]
        UI_Pillbox["Smart Pillbox Real-Time Dashboard (Circular Status Lights)"]
    end

    subgraph ServerLayer["Express Application Server"]
        Router["REST & SSE Event Bus (/api/*)"]
        RBAC["Passcode & Consent Gatekeeper"]
        Engine_Dose["Medication Scheduling & Adherence Engine"]
        Engine_IoT["ESP32 Hardware Telemetry & Sensor Manager"]
        Engine_Doctor["Doctor Dispatch & Messaging Relay"]
        Engine_AI["Gemini AI Clinical Interaction Service"]
    end

    subgraph PhysicalHardware["IoT Smart Pillbox Hardware (ESP32-S3)"]
        Sensors_Lid["Magnetic Reed Switch (Lid Sensor)"]
        Actuators_LED["6x Compartment Status LEDs"]
        Actuators_Buzzer["85dB Piezoelectric Buzzer"]
        Sensors_NFC["PN532 NFC Strip Authenticator"]
        Actuators_Button["Tactile Microswitch Intake Button"]
    end

    subgraph ExternalServices["External APIs & Clinicians"]
        DoctorOffice["Primary Physician Clinic (Sahyadri Hospitals)"]
        GeminiAPI["Google Gemini GenAI Clinical Reasoning"]
        NotificationRelay["SMTP Email & WhatsApp Business API Relays"]
    end

    UI_Elderly --> Router
    UI_Caregiver --> Router
    UI_Family --> Router
    UI_Pillbox --> Router

    Router --> RBAC
    Router --> Engine_Dose
    Router --> Engine_IoT
    Router --> Engine_Doctor
    Router --> Engine_AI

    Engine_IoT <--> PhysicalHardware
    Engine_AI <--> GeminiAPI
    Engine_Doctor --> DoctorOffice
    Engine_Doctor --> NotificationRelay
```

---

## 3. Multi-Persona Sovereignty & Access Control (RBAC)

OJAS avoids the common pitfall of infantalizing the elderly by establishing strict patient sovereignty. The elderly patient owns the master health identity. Caregivers and remote family members can only access data and perform authorized clinical actions through validated 4-digit PIN authentication.

```mermaid
classDiagram
    class PatientProfile {
        +String id
        +String qrCodeId
        +String fullName
        +int age
        +String bloodGroup
        +Doctor primaryDoctor
        +List~String~ conditions
        +List~String~ allergies
        +manageConsent()
        +revokeMember()
    }

    class AuthorizedMember {
        +String id
        +String name
        +UserRole role
        +String passcode
        +boolean consentGrantedByPatient
        +RolePermissions permissions
        +verifyPasscode()
    }

    class RolePermissions {
        +boolean canView
        +boolean canAdd
        +boolean canEdit
        +boolean canDelete
        +boolean canManageAccess
    }

    PatientProfile "1" *-- "many" AuthorizedMember : delegates access
    AuthorizedMember "1" *-- "1" RolePermissions : enforces
```

### Granular Persona Matrices

1. **Elderly Patient (Smt. Kamala Deshmukh)**:
   - Rights: One-tap dose confirmation, emergency SOS dispatch, language switching, high-contrast toggle, consent granting/revocation.
   - Guardrails: Clinical prescription modifications are locked to prevent accidental dosing errors.

2. **Primary On-Site Caregiver (Sister Priya Sharma, RN)**:
   - Rights: Verify physical dose intake, record bedside vitals (BP, glucose, SpO2), log clinical observational notes, batch restock pillbox, transmit doctor reports.
   - Authentication: 4-digit numeric PIN verified against backend hash before administrative views unlock.

3. **Remote Family Member (Rohan Deshmukh)**:
   - Rights: Real-time adherence monitoring, 1-tap direct phone call to patient/caregiver, emergency alert reception, read-only medical reports.
   - Guardrails: Cannot remotely mark physical pills as consumed unless physically on site.

---

## 4. IoT Smart Pillbox Hardware Integration

The platform includes a real-time hardware status dashboard built with a circular indicator light style user interface. It simulates an ESP32-S3 microcontroller node communicating bidirectionally with the server.

```mermaid
stateDiagram-v2
    [*] --> Standby : Power On / WiFi Sync

    state Standby {
        [*] --> SecureClosed : Lid Closed
        SecureClosed --> DoorOpenAlert : Magnetic Reed Switch Opens
        DoorOpenAlert --> SecureClosed : Lid Closed Securely
    }

    Standby --> DoseDueAlert : Scheduled Dose Window Reached
    
    state DoseDueAlert {
        [*] --> LED_Illuminated : Active Slot LED On
        LED_Illuminated --> Audio_Buzzer : 85dB Audio Pulse
        Audio_Buzzer --> NFC_Verification : Blister Strip Presented
        NFC_Verification --> Button_Pressed : Tactile Switch Depressed
    }

    DoseDueAlert --> Standby : Dose Confirmed Taken (Stock -1)
    DoseDueAlert --> MissedEscalation : Grace Period Elapsed (30 mins)
    
    MissedEscalation --> Standby : Alert Dispatched to Family/Caregiver
```

### Hardware Specifications & Telemetry Metrics

- **Circular Indicator Light Gauges**:
  - **Network Link**: Concentric pulsating emerald ring indicating active 2.4 GHz 802.11 b/g/n link (-52 dBm, 18ms latency).
  - **Power Subsystem**: Radial circular meter tracking 3.7V 2500mAh Lithium-Ion battery reserve (95% nominal).
  - **Lid Sensor**: High-visibility circular indicator glowing solid emerald when closed, and pulsing amber when the magnetic reed switch detects an open door.
  - **Piezo Alarm**: Circular alert ring displaying 85dB active buzzer alerts during dose intake windows.
- **6-Slot LED Status Ring**: Discrete circular indicator LEDs for each physical medicine compartment. Illuminating an LED immediately guides the elderly user to the correct medicine slot without confusion.

---

## 5. Proactive Notification, Escalation & Doctor Relay

A missed dose triggers an automated multi-tier escalation flow. OJAS also allows on-site caregivers to transmit structured clinical summaries directly to the primary doctor's office.

```mermaid
sequenceDiagram
    autonumber
    actor Elderly as Elderly Patient
    participant Pillbox as IoT Smart Pillbox
    participant Server as OJAS Server (SSE)
    actor Nurse as Caregiver Nurse
    actor Family as Remote Family
    participant Doctor as Primary Doctor's Office

    Note over Pillbox,Server: Scheduled Time 08:00 Reached
    Server->>Pillbox: POST /api/hardware/sync (Light Slot #1, Start Buzzer)
    Pillbox-->>Elderly: Audible Beep + LED Ring Light
    
    alt Elderly Confirms Dose
        Elderly->>Pillbox: Press Physical Button / Tap App
        Pillbox->>Server: POST /api/medications/:id/dose (taken)
        Server->>Server: Decrement Stock, Stop Buzzer
        Server-->>Elderly: Speech TTS Confirmation + Green Check Overlay
        Server-->>Nurse: SSE Event Broadcast (Dose Verified)
    else Dose Missed (Grace Period Elapsed)
        Server->>Server: Check Escalation Policy
        Server->>Nurse: Dispatch High-Priority Push & Escalation Alert
        Server->>Family: Dispatch SMS & WhatsApp Alert to Family
    end

    opt Caregiver Doctor Transmission
        Nurse->>Server: POST /api/doctor/share-report
        Server->>Doctor: Automated Clinical Email & Structured Summary
        Server-->>Nurse: Transmission Acknowledged & Activity Logged
    end
```

---

## 6. Healthcare Domain Data Architecture

```mermaid
erDiagram
    PATIENT_PROFILE ||--o{ AUTHORIZED_MEMBER : authorizes
    PATIENT_PROFILE ||--o{ MEDICATION : prescribed
    PATIENT_PROFILE ||--o{ APPOINTMENT : attends
    PATIENT_PROFILE ||--o{ DAILY_ROUTINE : performs
    PATIENT_PROFILE ||--o{ MEDICAL_REPORT : stores
    MEDICATION ||--|{ DOSE_SLOT : schedules
    PATIENT_PROFILE ||--|| HARDWARE_STATE : binds

    PATIENT_PROFILE {
        string id PK
        string fullName
        int age
        string bloodGroup
        float weightKg
        string encryptionKeyFingerprint
    }

    MEDICATION {
        string id PK
        string name
        string dosage
        string frequency
        int stockCount
        int compartmentNumber
        string nfcTagId
    }

    DOSE_SLOT {
        string id PK
        string scheduledTime
        string status
        string acknowledgedAt
        string notes
    }

    HARDWARE_STATE {
        string deviceId PK
        boolean connected
        int batteryPercent
        boolean doorOpen
        boolean buzzerActive
        int activeSlotLed
    }

    AUTHORIZED_MEMBER {
        string id PK
        string name
        string role
        string passcode
        boolean consentGrantedByPatient
    }
```

---

## 7. Key Features & Clinical Innovations

### 1. Subtle Confirmation Animation & Caregiver Observational Notes
- **Visual Feedback for Elderly**: Marking a dose as taken triggers a spring-animated emerald overlay featuring a centered checkmark and confirmation badge, preventing anxiety and repetitive button clicking.
- **Observational Notes Field**: Caregivers can append qualitative clinical notes to any dose slot (for example, "Taken post-breakfast with warm water; blood pressure 124/80; patient rested comfortably") with one-tap preset tags.

### 2. Longitudinal 7-Day Vitals Trend Visualizer
- Visualizes systolic/diastolic blood pressure and fasting blood glucose curves over a 7-day period.
- Directly correlates regular medication compliance with physiological stability.

### 3. One-Tap Elderly Voice Input (Speech-to-Text)
- Elderly users can confirm medications by pressing the microphone icon and speaking natural phrases such as "Maine goli le li" or "Confirm morning dose", supported by Web Speech API recognition.

### 4. Direct Physician Reporting Suite
- Caregivers can generate and transmit an encrypted summary directly to Dr. Rajesh Kulkarni's office at Sahyadri Super Speciality Hospital, encompassing adherence percentages, vital logs, and observational remarks.

### 5. First-Responder Emergency QR Health Pass
- A high-visibility emergency badge modal provides immediate access to blood group, chronic illnesses, critical allergies, and direct physician telephone lines without requiring authentication.

### 6. AI Clinical Assistant (Google Gemini 2.5 Flash)
- **Drug-Drug Contraindication Scanner**: Analyzes the active medication regimen against candidate prescriptions to detect interactions, duplicate therapeutic classes, and food timing restrictions.
- **Weekly Longitudinal Summaries**: Synthesizes complex adherence logs into actionable insights for visiting physicians.

---

## 8. Expected Impact & Outcomes

| Dimension | Traditional ElderCare | OJAS Impact |
| :--- | :--- | :--- |
| **Medication Adherence** | 50% - 65% average geriatric adherence | Targeted 95%+ adherence via multi-modal sensory cues and physical pillbox sync |
| **Emergency Hospitalizations** | High incidence due to drug contraindications and missed hypertensive doses | Preventative detection via Gemini AI and proactive escalation loops |
| **Caregiver Stress Index** | High anxiety and constant manual telephone check-ins | Real-time visibility, automated notifications, and shift handover records |
| **Elderly Psychological Agency** | Feeling monitored and stripped of independence | Autonomous one-tap portal, multi-language speech, and sovereign consent |
| **Physician Visit Efficiency** | Vague recollections of symptom timelines | Objective 7-day vitals trends and timestamped caregiver observational notes |

---

## 9. How to Run Locally

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or bun package manager
- Google Gemini API Key (optional for offline testing, required for live AI interactions)

### Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yashkoparde/ojas.git
   cd ojas
   ```

2. **Install Dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```

4. **Start the Integrated Development Server**:
   ```bash
   npm run dev
   ```
   The platform will launch concurrently on `http://localhost:3000`, serving the Express backend and the Vite React frontend.

5. **Execute Verification Checks**:
   ```bash
   # Run automated test suite (75 tests across clinical adherence, RBAC, vitals, IoT telemetry, i18n, emergency & serverless API)
   npm test

   # Verify TypeScript strict type compilation
   npm run lint

   # Execute production bundle build
   npm run build
   ```

---

## 10. API Reference Summary

| Endpoint | Method | Role Restriction | Description |
| :--- | :---: | :---: | :--- |
| `/api/state` | GET | All | Retrieve complete healthcare state snapshot |
| `/api/events` | GET | All | Real-time Server-Sent Events (SSE) telemetry stream |
| `/api/auth/verify-passcode` | POST | All | Validate 4-digit numeric PIN for role elevation |
| `/api/medications/:id/dose` | POST | Elderly, Caretaker | Mark dose status (taken, missed, skipped) with optional notes |
| `/api/medications/:id/dose/notes` | POST | Caretaker | Update observational clinical notes for a dose slot |
| `/api/hardware/sync` | POST | Elderly, Caretaker | ESP32 hardware telemetry sync (alarm, button, door toggle) |
| `/api/doctor/share-report` | POST | Caretaker | Transmit structured clinical report directly to physician's office |
| `/api/notifications/whatsapp-dispatch` | POST | Caretaker | Dispatch simulated WhatsApp/SMS alerts to Care Circle |
| `/api/ai/interaction-check` | POST | All | Evaluate medication regimen for contraindications via Gemini AI |
| `/api/sos` | POST | All | Trigger emergency broadcast to primary doctor and family contacts |
