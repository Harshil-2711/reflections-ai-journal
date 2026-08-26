import React, { useState } from "react";
import { ListChecks, X, CheckCircle2, Circle, Play, AlertCircle, Copy, Check } from "lucide-react";

interface TestWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestCase {
  id: string;
  category: string;
  title: string;
  description: string;
  steps: string[];
  expected: string;
}

const TEST_CASES: TestCase[] = [
  {
    id: "TC-AUTH-01",
    category: "Authentication & Identity",
    title: "Federated Google Sign-In & Session Persistence",
    description: "Verify that user logs in via Google popup without entering password and session state persists.",
    steps: [
      "1. Navigate to landing page while unauthenticated.",
      "2. Click 'Continue with Google' button.",
      "3. Complete the Google OAuth account selection popup.",
      "4. Observe transition to private dashboard showing user avatar and email."
    ],
    expected: "User is authenticated via Firebase Auth; UID is populated; private dashboard is rendered."
  },
  {
    id: "TC-CHAT-02",
    category: "Gemini Multi-Turn Dialogue",
    title: "Multi-Turn Reflection with System Persona Adaptation",
    description: "Verify sending multi-turn messages to Gemini and receiving contextual responses in different modes.",
    steps: [
      "1. In the active reflection editor, type 'I am feeling overwhelmed with deadlines' and press Enter.",
      "2. Verify Gemini 3.6 Flash responds with empathetic reflection guidance in markdown.",
      "3. Switch mode to 'Brainstorming' and reply 'Give me 3 steps to tackle this'.",
      "4. Observe that Gemini shifts tone to actionable bullet points."
    ],
    expected: "Gemini responds contextually, preserving multi-turn conversation history."
  },
  {
    id: "TC-VOICE-03",
    category: "Voice & Speech Engine",
    title: "Voice Dictation (STT) & Empathetic AI Voice Synthesis (TTS)",
    description: "Verify hands-free voice stream-of-consciousness dictation and audio reflection playback.",
    steps: [
      "1. Click the microphone button next to the journal textarea to start speech-to-text dictation.",
      "2. Speak into the microphone and observe live transcribing text in the input box.",
      "3. Send the message and receive Gemini's written reflection.",
      "4. Click the speaker audio icon on Gemini's message card to listen to the empathetic voice synthesizer."
    ],
    expected: "Voice is accurately transcribed into the input box and Gemini's response is vocalized cleanly with speech synthesis."
  },
  {
    id: "TC-PERSP-04",
    category: "Standout: Perspective Shifter",
    title: "Multi-Persona Philosophical Lens Deconstruction",
    description: "Verify exploring a reflection through Stoic, CBT, Future Self (10 Years), and Socratic lenses.",
    steps: [
      "1. With an active reflection, click 'Perspective Shifter' on the toolbar.",
      "2. Select a philosophical lens (e.g. 'Stoic Sage' or '10-Year Future Self').",
      "3. Inspect the tailored quote, breakdown analysis, key insight, and concrete action step.",
      "4. Click 'Adopt Perspective into Reflection' to integrate the insight into the chat stream."
    ],
    expected: "Gemini generates 4 distinct philosophical angles; adopting a perspective injects structured wisdom into the conversation."
  },
  {
    id: "TC-EMOT-05",
    category: "Standout: Emotional & Bias Visualizer",
    title: "Emotional Valence Meter, Cognitive Bias Detector & Micro-Grounding",
    description: "Verify cognitive distortion auditing (catastrophizing, mind reading) and 2-min box breathing.",
    steps: [
      "1. Click 'Emotional & Bias Visualizer' on the reflection toolbar.",
      "2. View the emotional intensity gauge, primary/secondary emotions, and cognitive bias flags.",
      "3. Review the balanced reframe for each detected distortion.",
      "4. Click 'Start Micro Grounding (2 Min)' and follow the guided 4-second box-breathing cycle."
    ],
    expected: "Visualizer displays emotional valence, detects cognitive distortions with reframes, and provides interactive grounding."
  },
  {
    id: "TC-TRENDS-06",
    category: "Standout: Life Insights Retrospective",
    title: "Cross-Reflection Semantic Trends & Growth Snapshot",
    description: "Verify analyzing historical reflections to uncover recurring patterns and growth trajectories.",
    steps: [
      "1. Click 'Life Insights' in the top navigation bar.",
      "2. Observe Gemini synthesizing longitudinal trends across all saved entries.",
      "3. Inspect core life themes, percentage distributions, and recurring behavioral patterns.",
      "4. Click 'Journal About This Prompt' to start a new reflection seeded with the suggested growth prompt."
    ],
    expected: "Longitudinal insights synthesize top themes, celebrated milestones, and seed next week's focus question."
  },
  {
    id: "TC-CANVAS-07",
    category: "Standout: Thought Map Canvas",
    title: "Interactive Cognitive Graph & Mental Triggers Canvas",
    description: "Verify deconstructing thoughts into triggers, feelings, core beliefs, and actionable reframes.",
    steps: [
      "1. Click 'Thought Map Canvas' in the reflection toolbar.",
      "2. Observe the generated node sequence (Trigger -> Feeling -> Belief -> Reframe -> Action).",
      "3. Click individual nodes to inspect underlying roots and empowering impact ratings.",
      "4. Filter nodes by category (Trigger, Feeling, Belief, Reframe, Action)."
    ],
    expected: "Nodes and causal connection paths render interactively with deep inspection metadata."
  },
  {
    id: "TC-SUMM-08",
    category: "AI Summarization & Tagging",
    title: "Automated AI Summary, Title & Tag Extraction",
    description: "Verify one-click synthesis of multi-turn conversation into title, 2-sentence summary, and tags.",
    steps: [
      "1. After generating at least 1 turn of reflection, click the 'AI Summarize' button.",
      "2. Observe the sparkle animation as `/api/gemini/summarize` processes the conversation.",
      "3. Verify title input updates, summary block appears, and tag chips are generated."
    ],
    expected: "Concise title, structured summary, and tags are extracted and automatically synced to state."
  },
  {
    id: "TC-DB-09",
    category: "Firestore User Isolation",
    title: "Document Isolation & Undefined-Stripping Hygiene",
    description: "Verify that reflection documents are saved strictly under `/users/{userId}/journals` with zero undefined fields.",
    steps: [
      "1. Click 'Save to Cloud' or trigger auto-save after editing an entry.",
      "2. Verify that Firestore write succeeds with confirmed timestamp.",
      "3. If logged in as User A, entries are saved to `/users/UserA/journals`.",
      "4. Sign out and sign in as User B; observe that User A's journals are completely inaccessible."
    ],
    expected: "Firestore security rules enforce UID check; documents strictly isolated per user."
  },
  {
    id: "TC-RESIL-10",
    category: "Resilience & Fallback Ladder",
    title: "Gemini Model Fallback & Error Recovery",
    description: "Verify backend fallback ladder (gemini-3.6-flash -> 3.1-flash-lite -> flash-latest -> 3.7-flash).",
    steps: [
      "1. Trigger prompt generation.",
      "2. Server logs attempt primary model (gemini-3.6-flash).",
      "3. If rate-limited or unavailable, server catches error and sequentially invokes fallback model.",
      "4. Model badge in UI displays the successful model used."
    ],
    expected: "Seamless user experience with automated fallback and retry banners if network fails."
  },
  {
    id: "TC-HIST-11",
    category: "History & Management",
    title: "History Search, Mood Filtering, Pinning & Markdown Export",
    description: "Verify searching past entries, filtering by mood, pinning important reflections, and exporting .md files.",
    steps: [
      "1. Use the search bar in the History panel to find reflections by keyword or tag.",
      "2. Click the Pin icon to pin an entry to the top.",
      "3. Click the Download icon on a history card to export the reflection as a formatted Markdown file.",
      "4. Click the Trash icon and confirm deletion in modal to remove entry from Firestore."
    ],
    expected: "Search filters accurately; pinned items stay at top; file downloads cleanly; deletion syncs to database."
  }
];

export const TestWalkthroughModal: React.FC<TestWalkthroughModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [completedTests, setCompletedTests] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleTest = (id: string) => {
    setCompletedTests((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyTestScript = () => {
    const text = TEST_CASES.map(
      (tc) => `### ${tc.id}: ${tc.title} [${tc.category}]
**Description**: ${tc.description}
**Steps**:
${tc.steps.join("\n")}
**Expected Result**: ${tc.expected}
`
    ).join("\n---\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completedCount = Object.values(completedTests).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-sky-400">
              <ListChecks className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Functional Stability &amp; Test Walkthrough</h2>
              <p className="text-xs text-zinc-400 font-light">
                End-to-End User Interaction Verification Matrix &bull; {completedCount}/{TEST_CASES.length} Verified
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTestScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? "Copied Script" : "Copy Test Script"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {TEST_CASES.map((tc) => {
            const isDone = !!completedTests[tc.id];
            return (
              <div
                key={tc.id}
                onClick={() => toggleTest(tc.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                  isDone
                    ? "bg-[#0a0a0a] border-emerald-500/40 shadow-sm"
                    : "bg-[#0a0a0a]/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTest(tc.id);
                      }}
                      className="mt-0.5 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-600 hover:text-zinc-400" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-semibold">
                          {tc.id}
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">{tc.category}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-100 mt-1 font-serif">{tc.title}</h4>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      isDone
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                    }`}
                  >
                    {isDone ? "PASS / VERIFIED" : "PENDING"}
                  </span>
                </div>

                <p className="text-xs text-zinc-300 mt-2 leading-relaxed font-light">{tc.description}</p>

                <div className="mt-3 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Execution Steps:</span>
                    <ul className="space-y-1 text-zinc-300 pl-1 font-light">
                      {tc.steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/60">
                    <span className="text-[11px] font-semibold text-emerald-400">Expected Outcome: </span>
                    <span className="text-zinc-300 font-light">{tc.expected}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#121214] flex justify-between items-center text-xs text-zinc-400">
          <span>Click any test case to toggle verification state.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold shadow transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
