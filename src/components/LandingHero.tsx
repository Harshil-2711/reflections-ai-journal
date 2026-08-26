import React, { useState } from "react";
import { Sparkles, Shield, Lock, Brain, FileText, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

interface LandingHeroProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    try {
      setSigningIn(true);
      await onSignIn();
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 bg-[#0a0a0a] text-zinc-100 relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-500/5 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-4xl w-full text-center space-y-8 relative z-10">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-zinc-900/80 text-zinc-300 border border-zinc-800 shadow-sm">
          <Shield className="w-3.5 h-3.5 text-indigo-400" />
          <span>Zero-Password Federated Auth &bull; User-Isolated Firestore</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-serif">
            A Safe Haven for Your Thoughts,{" "}
            <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-indigo-300 bg-clip-text text-transparent">
              Elevated by Gemini
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-400 leading-relaxed font-light">
            Express yourself freely in multi-turn journal conversations. Gemini provides compassionate reflections, fresh perspectives, and instant structured summaries—all strictly isolated to your private account.
          </p>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-300">Sign-in Notice</p>
              <p className="text-xs mt-0.5 text-rose-200/90">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Sign In CTA */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <button
            id="google-signin-btn"
            onClick={handleSignIn}
            disabled={isLoading || signingIn}
            className="flex items-center gap-3 px-8 py-3.5 rounded-xl font-medium text-black bg-white hover:bg-zinc-200 shadow-xl shadow-black/60 hover:shadow-2xl transition-all transform active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed text-base cursor-pointer"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span>{signingIn || isLoading ? "Connecting with Google..." : "Continue with Google"}</span>
            <ArrowRight className="w-4 h-4 text-zinc-500 ml-1" />
          </button>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>No passwords stored &bull; Single-tenant Firestore security rules enforced</span>
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 text-left">
          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800/80 shadow-lg space-y-3 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-indigo-300">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 font-serif">Multi-Turn Gemini Dialogue</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Engage in organic conversations across multiple turns. Gemini adapts as an empathetic guide, brainstorming partner, or synthesizer.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800/80 shadow-lg space-y-3 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 font-serif">Automatic AI Summarization</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Generate insightful 2-sentence summaries, evocative titles, and thematic tags with a single click before saving.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#121214] border border-zinc-800/80 shadow-lg space-y-3 hover:border-zinc-700 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-emerald-300">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 font-serif">Strict Firestore Isolation</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-light">
              Every journal document is stored in <code className="text-xs text-zinc-300 font-mono">/users/{'{uid}'}/journals</code> governed by owner-only rules.
            </p>
          </div>
        </div>

        {/* Security & Reliability Checklist */}
        <div className="pt-4 flex flex-wrap justify-center items-center gap-y-2 gap-x-6 text-xs text-zinc-400 border-t border-zinc-800/80">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Gemini 3.6 Flash with 4-Tier Fallback Ladder</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero Unsanitized Payloads</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encrypted At Rest &amp; In Transit</span>
          </span>
        </div>

      </div>
    </div>
  );
};
