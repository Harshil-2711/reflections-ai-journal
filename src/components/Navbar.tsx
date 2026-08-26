import React from "react";
import { Sparkles, ShieldCheck, ListChecks, LogOut, Plus, TrendingUp } from "lucide-react";
import { User } from "firebase/auth";

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onNewEntry: () => void;
  onOpenThreatModel: () => void;
  onOpenTestWalkthrough: () => void;
  onOpenTrends?: () => void;
  hasActiveEntry: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  onNewEntry,
  onOpenThreatModel,
  onOpenTestWalkthrough,
  onOpenTrends,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-zinc-800/80 text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 border border-zinc-700/80 flex items-center justify-center shadow-md shadow-black/40">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base sm:text-lg tracking-tight text-white font-serif">Reflections</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-zinc-900 text-zinc-300 border border-zinc-700/60">
                Gemini &bull; Firestore
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Private AI-Guided Journaling &amp; Insights</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && onOpenTrends && (
            <button
              id="nav-trends-btn"
              onClick={onOpenTrends}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-amber-300 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-950/60 transition-colors cursor-pointer"
              title="View Longitudinal Life Themes & Growth Retrospective"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Life Insights</span>
              <span className="md:hidden">Insights</span>
            </button>
          )}

          <button
            id="nav-threat-model-btn"
            onClick={onOpenThreatModel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 hover:bg-emerald-950/60 transition-colors cursor-pointer"
            title="View Threat Model & Security Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Threat Model</span>
            <span className="md:hidden">Threats</span>
          </button>

          <button
            id="nav-test-walkthrough-btn"
            onClick={onOpenTestWalkthrough}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-sky-300 bg-sky-950/30 border border-sky-800/40 hover:bg-sky-950/60 transition-colors cursor-pointer"
            title="View Functional Test Walkthrough"
          >
            <ListChecks className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Test Walkthrough</span>
            <span className="md:hidden">Tests</span>
          </button>

          {user && (
            <>
              <button
                id="nav-new-entry-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-zinc-200 text-zinc-900 shadow-sm transition-all hover:shadow cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Reflection</span>
              </button>

              <div className="h-5 w-px bg-zinc-800 mx-1 hidden sm:block" />

              {/* User Profile */}
              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded-full border border-zinc-700 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-semibold">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium text-zinc-200 truncate max-w-[120px]">
                    {user.displayName || "User"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                    {user.email || ""}
                  </p>
                </div>
                <button
                  id="nav-sign-out-btn"
                  onClick={onSignOut}
                  className="p-1.5 text-zinc-400 hover:text-rose-300 hover:bg-zinc-800/80 rounded-lg transition-colors ml-1 cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

