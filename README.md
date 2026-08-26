# Reflections & Journal: Production AI-Guided Reflection Application

A full-stack, user-authenticated personal reflection and cognitive growth web application powered by **Google Gemini AI (@google/genai)**, **Firebase Authentication (Google Sign-In)**, and **Cloud Firestore** for private, owner-isolated journal persistence.

---

## 🌟 Overview & Standout AI Features

- **Multi-Perspective Philosophical Shifter**: View and deconstruct any reflection through 4 distinct wisdom archetypes (**Stoic Sage**, **Cognitive Behavioral Therapist**, **10-Year Future Self**, and **Socratic Questioner**) with 1-click adoption into the dialogue.
- **Emotional Valence & Cognitive Bias Visualizer**: Real-time gauge measuring emotional polarity ($-100$ to $+100$), detecting cognitive distortions (*Catastrophizing*, *Mind Reading*, *Black-and-White Thinking*) with actionable reframes, and an interactive **2-minute Box Breathing micro-grounding** tool.
- **Cross-Reflection Life Insights Retrospective**: Longitudinal semantic memory synthesizing core life themes, percentage distributions, recurring behavioral triggers, celebrated milestones, and forward-looking growth focus prompts.
- **Interactive Thought Map Canvas**: Visual cognitive graph deconstructing thoughts into sequential nodes: **Trigger $\rightarrow$ Feeling $\rightarrow$ Core Belief $\rightarrow$ Reframe $\rightarrow$ Action**.
- **Voice Stream-of-Consciousness & Empathetic Audio**: Hands-free voice dictation (Speech-to-Text) and empathetic vocalization playback (Text-to-Speech).
- **Zero-Password Federated Auth**: Seamless Google Sign-In via Firebase Auth. The application never stores or processes raw passwords.
- **Strict Firestore Isolation**: All entries, messages, and reflections are isolated under `/users/{userId}/journals` with owner-bound Firestore security rules.
- **Resilient 4-Tier Model Fallback Ladder**:
  1. `gemini-3.6-flash` (Primary)
  2. `gemini-3.1-flash-lite` (High Availability Fallback)
  3. `gemini-flash-latest` (Dynamic Alias)
  4. `gemini-3.7-flash` (Deep Reasoning Fallback)

---

## 📦 1. Push to GitHub (Step-by-Step)

### Option A: Export from Google AI Studio
1. In Google AI Studio Build, click on the **Settings / Export** menu in the top right.
2. Select **Export to GitHub** or **Download as ZIP**.
3. If downloading as ZIP: Extract the archive on your local computer.

### Option B: Push via Git CLI
Open your terminal in the project directory:

```bash
# 1. Initialize git if not already initialized
git init

# 2. Add all project files
git add .

# 3. Commit the changes
git commit -m "feat: complete reflections journal with Gemini AI and Firebase"

# 4. Set the main branch
git branch -M main

# 5. Link your GitHub repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/reflections-journal.git

# 6. Push to GitHub
git push -u origin main
```

---

## 💻 2. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### Environment Configuration
Create a `.env` file at the root of the project:
```env
# Gemini API Key (Get from https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Client Configuration (From your Firebase Console Project Settings)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)
```

### Install and Run
```bash
# Install dependencies
npm install

# Start the full-stack dev server (Express + Vite on port 3000)
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## ☁️ 3. Deploy to Google Cloud Run

### Prerequisites
1. Install and authenticate the **Google Cloud SDK (`gcloud`)**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
2. Enable required Google Cloud APIs:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     secretmanager.googleapis.com \
     firestore.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com
   ```

### Step 1: Secret Management Setup
Store your Gemini API key in **Google Cloud Secret Manager**:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run default compute service account permission to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 2: Configure Cloud Firestore Security Rules
Deploy secure, owner-bound security rules to ensure zero cross-tenant data leakage:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

Deploy rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### Step 3: Deploy Service to Cloud Run
Deploy the container directly from the root repository:
```bash
gcloud run deploy reflections-journal \
  --source . \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000
```

### Step 4: Apply Challenge Verification Label
Attach the mandatory campaign verification label to your deployed Cloud Run service:
```bash
gcloud run services update reflections-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-east1
```

---

## 🧪 4. Testing & Verification Walkthrough Matrix

The application includes an interactive test matrix accessible directly from the **Test Walkthrough** modal in the UI navigation bar:

| Test ID | Category | Objective |
| :--- | :--- | :--- |
| `TC-AUTH-01` | Authentication | Federated Google Sign-In & local session state persistence. |
| `TC-CHAT-02` | Multi-Turn Reflection | Multi-turn contextual reflection with system persona adaptation. |
| `TC-VOICE-03` | Voice & Speech Engine | Real-time speech-to-text dictation and TTS empathetic voice playback. |
| `TC-PERSP-04` | Perspective Shifter | Multi-persona philosophical lens analysis (Stoic, CBT, Future Self, Socratic). |
| `TC-EMOT-05` | Emotional & Bias | Emotional valence meter, distortion detection, and 2-min box breathing. |
| `TC-TRENDS-06` | Life Insights | Longitudinal semantic trends, recurring patterns, and next-week prompt seeds. |
| `TC-CANVAS-07` | Thought Canvas | Interactive node-based cognitive sequence graph and causal relationships. |
| `TC-SUMM-08` | AI Summarization | Extraction of titles, 2-sentence summaries, and thematic tag chips. |
| `TC-DB-09` | Firestore Isolation | Verification of owner-bound paths and undefined-stripping payload hygiene. |
| `TC-RESIL-10` | Model Resilience | Automatic fallback ladder execution across 4 Gemini model variants. |
| `TC-HIST-11` | History Management | Search, mood filtering, pinning reflections, and markdown file export. |

---

## 🛡️ Security & Privacy Architecture

- **OWASP LLM01 Mitigation**: Strict prompt isolation and input escaping.
- **OWASP LLM02 / A03 Mitigation**: Server-side JSON schema validation and input sanitization.
- **OWASP A01 Access Control**: Owner-bound Firestore security rules verify `request.auth.uid == userId`.
- **Zero-Storage of API Keys on Client**: All Gemini generation calls are proxied securely through server-side Express routes.
