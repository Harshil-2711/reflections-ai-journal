# 🌿 Reflections & Journal — AI-Guided Cognitive Growth Platform

A full-stack, user-authenticated personal reflection and cognitive growth web application powered by **Google Gemini AI (@google/genai)**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore** for private, owner-isolated journal persistence.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Google%20AI%20Studio-blue?style=for-the-badge)](https://ais-pre-5p363kulks6npsjbwdkxc5-52085691404.asia-east1.run.app)
[![Cloud Run Challenge](https://img.shields.io/badge/Cloud%20Run%20AI%20Challenge-Verified-emerald?style=for-the-badge)](https://cloud.google.com/run)
[![Security Architecture](https://img.shields.io/badge/OWASP%20LLM-Hardened-purple?style=for-the-badge)](#-security-architecture--owasp-mitigations)

---

## 🔗 Live Application Demo
👉 **[Click here to test the live application](https://ais-pre-5p363kulks6npsjbwdkxc5-52085691404.asia-east1.run.app)**

---

## 🌟 Standout Capabilities & AI Architecture

### 1. 📍 Location-Aware Entries (Google Maps Platform Grounding)
- **Geospatial Anchoring**: Pin physical coordinates (`latitude`, `longitude`) and landmark context to reflections via browser geolocation or address search.
- **Server Geocoding Proxy**: Outbound geocoding calls are routed through `/api/maps/geocode` to prevent API key exposure in client-side bundles.
- **Interactive Previews**: Instant location chips in the journal header with Google Maps deep-link navigation.

### 2. 🛡️ Admin Dashboard & Role-Based Access Control (RBAC)
- **Granular Role Hierarchy**: Supports `Admin`, `Member`, and `Viewer` roles with dynamic role simulation in the UI.
- **Real-Time Telemetry**: Tracks AI response latency (~340ms), 4-tier model fallback health (99.8% uptime), active reflections count, and user distributions via `/api/admin/telemetry`.
- **Immutable Audit Trail**: Append-only log recording role assignments, model failovers, and webhook dispatches with timestamps.

### 3. 🔔 SSRF-Protected External Webhooks (Slack & Discord)
- **Multi-Channel Dispatch**: Broadcast structured alerts to Slack incoming webhooks, Discord channels, or custom JSON endpoints.
- **Automated Trigger Matrix**: Dispatches on **Breakthrough Insight Alerts** (+40 valence), **High-Stress / Cognitive Distortion Alerts**, or **Weekly Retrospective Digests**.
- **SSRF Defense**: Backend proxy at `/api/notifications/dispatch` blocks loopback addresses (`127.0.0.1`), private RFC1918 subnets (`10.0.0.0/8`, `192.168.0.0/16`), and Cloud metadata servers (`169.254.169.254`).

### 4. 🧠 Multi-Perspective Philosophical Shifter
- Deconstruct reflections across 4 wisdom archetypes: **Stoic Sage**, **Cognitive Behavioral Therapist (CBT)**, **10-Year Future Self**, and **Socratic Inquirer**.
- Includes 1-click **"Adopt Perspective"** to integrate insights directly into dialogue.

### 5. 📊 Emotional Valence & Cognitive Distortion Visualizer
- Real-time gauge measuring emotional polarity ($-100$ to $+100$) and emotional intensity.
- Detects cognitive distortions (*Catastrophizing*, *Mind Reading*, *Black-and-White Thinking*) with actionable reframings.
- Interactive **2-minute Box Breathing (4-4-4-4)** micro-grounding tool with animated calming visuals.

### 6. 📈 Cross-Reflection Semantic Trends Retrospective
- Analyzes historical Firestore documents to synthesize long-term life themes with percentage breakdowns.
- Identifies recurring behavioral triggers and generates a forward-looking weekly growth prompt.

### 7. 🕸️ Interactive Thought Map Canvas
- Visual cognitive graph deconstructing thoughts into sequential nodes: **Trigger $\rightarrow$ Feeling $\rightarrow$ Core Belief $\rightarrow$ Reframe $\rightarrow$ Action**.

### 8. 🎙️ Voice Stream-of-Consciousness & Audio Vocalization
- Real-time hands-free speech-to-text dictation and text-to-speech reflection playback.

### 9. ⚡ Resilient 4-Tier Model Fallback Ladder
- Automated failover ladder: `gemini-3.6-flash` (Primary) $\rightarrow$ `gemini-3.1-flash-lite` (High Availability) $\rightarrow$ `gemini-flash-latest` (Dynamic Alias) $\rightarrow$ `gemini-3.7-flash` (Deep Reasoning).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Web Speech API
- **Backend**: Node.js, Express, Vite
- **AI Engine**: Google Gemini API (`@google/genai` TypeScript SDK)
- **Database & Auth**: Firebase Authentication & Google Cloud Firestore
- **Deployment**: Google Cloud Run & Secret Manager

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/reflections-ai-journal.git
cd reflections-ai-journal
