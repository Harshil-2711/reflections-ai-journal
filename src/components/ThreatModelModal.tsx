import React from "react";
import { ShieldCheck, X, Lock, Key, Database, Cpu, CheckCircle2, ShieldAlert } from "lucide-react";

interface ThreatModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Agentic Threat Modeling &amp; Security Architecture</h2>
              <p className="text-xs text-zinc-400 font-light">
                OWASP Web &amp; LLM Top 10 Mapping &bull; 5 Threat Zones Defense-in-Depth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-sm text-zinc-300">
          {/* Summary Table */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white text-base flex items-center gap-2 font-serif">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>5 Threat Zones &amp; Countermeasures Table</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#0a0a0a] text-zinc-300 uppercase tracking-wider font-semibold border-b border-zinc-800">
                  <tr>
                    <th className="p-3">Threat Zone</th>
                    <th className="p-3">Vulnerability / Vector</th>
                    <th className="p-3">OWASP Reference</th>
                    <th className="p-3">Implemented Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80 bg-[#121214]">
                  <tr>
                    <td className="p-3 font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      1. Input Surfaces
                    </td>
                    <td className="p-3">Prompt Injection, malicious payloads, payload format bomb</td>
                    <td className="p-3 text-amber-300">OWASP LLM01, LLM02</td>
                    <td className="p-3 text-zinc-300 font-light">
                      Express top-level JSON limit (10MB), defensive null-safe destructuring, strict role separation in Gemini contents.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-zinc-400" />
                      2. Planning &amp; Reasoning
                    </td>
                    <td className="p-3">System prompt override, behavioral hijacking</td>
                    <td className="p-3 text-amber-300">OWASP LLM01</td>
                    <td className="p-3 text-zinc-300 font-light">
                      System instruction anchored server-side via GoogleGenAI SDK; user messages treated strictly as non-instructional context.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-400" />
                      3. Tool Execution &amp; APIs
                    </td>
                    <td className="p-3">API Key exposure in client-side bundle, SSRF, model outages</td>
                    <td className="p-3 text-amber-300">OWASP A01, LLM05</td>
                    <td className="p-3 text-zinc-300 font-light">
                      <span className="font-semibold text-emerald-300">Server-Side Proxy:</span> GEMINI_API_KEY never leaks to browser. 4-tier model fallback ladder (<code className="text-[10px] text-zinc-300 font-mono">gemini-3.6-flash &rarr; 3.1-flash-lite &rarr; flash-latest &rarr; 3.7-flash</code>).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-zinc-200 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-zinc-400" />
                      4. Memory &amp; State
                    </td>
                    <td className="p-3">Cross-tenant data leakage, session hijacking, corrupted documents</td>
                    <td className="p-3 text-amber-300">OWASP A01, A03</td>
                    <td className="p-3 text-zinc-300 font-light">
                      <span className="font-semibold text-zinc-200">Strict Owner-Bound Rules:</span> <code className="text-[10px] text-zinc-300 font-mono">/users/{'{userId}'}</code> matching <code className="text-[10px] text-zinc-300 font-mono">request.auth.uid == userId</code>. Recursive undefined-stripping before writes.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      5. Inter-System Comm
                    </td>
                    <td className="p-3">Credential theft, insecure password storage</td>
                    <td className="p-3 text-amber-300">OWASP A07, A02</td>
                    <td className="p-3 text-zinc-300 font-light">
                      Passwordless Federated Google Authentication via Firebase Auth. App never handles, processes, or stores raw user passwords.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Firestore Rules Verification */}
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Deployed Firestore Security Rules</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Zero Insecure Defaults
              </span>
            </div>
            <pre className="p-3 bg-zinc-950 rounded-xl text-[11px] font-mono text-emerald-400 overflow-x-auto border border-zinc-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
            </pre>
          </div>

          {/* Fallback Resilience */}
          <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-200 font-serif">Gemini Resilient Fallback Ladder Architecture</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Tier 1 (Primary)</span>
                <span className="font-semibold text-indigo-300">gemini-3.6-flash</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Tier 2 (High-Avail)</span>
                <span className="font-semibold text-zinc-200">gemini-3.1-flash-lite</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Tier 3 (Dynamic)</span>
                <span className="font-semibold text-amber-300">gemini-flash-latest</span>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center">
                <span className="text-[10px] text-zinc-400 block">Tier 4 (Reasoning)</span>
                <span className="font-semibold text-emerald-300">gemini-3.7-flash</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#121214] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Close Threat Model
          </button>
        </div>
      </div>
    </div>
  );
};
