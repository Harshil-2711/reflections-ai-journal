import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Sparkles,
  BarChart3,
  Calendar,
  Award,
  ArrowRight,
  RefreshCw,
  X,
  Copy,
  Check,
  Compass,
  FileText
} from "lucide-react";
import { JournalEntry, WeeklyRetrospectiveData } from "../types";

interface SemanticTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: JournalEntry[];
  onStartEntryWithPrompt?: (promptText: string) => void;
}

export const SemanticTrendsModal: React.FC<SemanticTrendsModalProps> = ({
  isOpen,
  onClose,
  entries,
  onStartEntryWithPrompt,
}) => {
  const [retrospective, setRetrospective] = useState<WeeklyRetrospectiveData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && !retrospective && entries.length > 0) {
      fetchTrends();
    }
  }, [isOpen, entries.length]);

  const fetchTrends = async () => {
    if (entries.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini/synthesize-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to synthesize journal trends.");
      }

      if (resData.retrospective) {
        setRetrospective(resData.retrospective);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to synthesize trends across journal entries.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRetrospective = () => {
    if (!retrospective) return;
    const text = `# ${retrospective.retrospectiveTitle}
${new Date().toLocaleDateString()} • Based on ${entries.length} Reflections

## Overall Trajectory
${retrospective.overallTrajectory}

## Core Life Themes
${retrospective.topThemes.map((t) => `- **${t.theme} (${t.percentage}%)**: ${t.description}`).join("\n")}

## Observed Behavioral Patterns
${retrospective.recurringPatterns.map((p) => `### When: ${p.triggerOrContext}\n- **Outcome:** ${p.observedOutcome}\n- **Actionable Insight:** ${p.actionableInsight}`).join("\n\n")}

## Celebrations & Breakthroughs
${retrospective.celebrations.map((c) => `- 🏆 ${c}`).join("\n")}

## Growth Focus for Next Week
> "${retrospective.growthPromptForNextWeek}"
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">
                Life Insights &amp; Growth Retrospective
              </h2>
              <p className="text-xs text-zinc-400 font-light">
                Cross-reflection semantic memory, behavioral patterns &amp; longitudinal trends
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchTrends}
              disabled={isLoading || entries.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Synthesize Trends</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {entries.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-zinc-400 text-xs text-center p-6">
              <FileText className="w-8 h-8 text-zinc-600" />
              <p className="font-semibold text-zinc-200">No Journal Entries Found Yet</p>
              <p className="font-light max-w-sm">
                Write your first few journal reflections to let Gemini discover semantic trends and recurring behavioral patterns!
              </p>
            </div>
          ) : isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-zinc-400 text-xs">
              <Sparkles className="w-8 h-8 animate-pulse text-amber-400" />
              <p>Analyzing {entries.length} reflections to uncover life themes and milestones...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchTrends}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : retrospective ? (
            <div className="space-y-6">
              {/* Overall Arc */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-zinc-800/90 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white font-serif">
                    {retrospective.retrospectiveTitle}
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                    {entries.length} Entries Synthesized
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                  {retrospective.overallTrajectory}
                </p>
              </div>

              {/* Core Themes */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  Primary Life Themes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {retrospective.topThemes.map((theme, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{theme.theme}</span>
                        <span className="text-[11px] font-mono text-indigo-400 font-bold">
                          {theme.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${theme.percentage}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                        {theme.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recurring Behavioral Patterns */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Observed Correlation &amp; Behavioral Insights
                </h4>
                <div className="space-y-3">
                  {retrospective.recurringPatterns.map((pat, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 space-y-2 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-zinc-400 min-w-[70px]">Context:</span>
                        <span className="text-zinc-200 font-light">{pat.triggerOrContext}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-amber-400/90 min-w-[70px]">Observed:</span>
                        <span className="text-zinc-300 font-light">{pat.observedOutcome}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-2 text-emerald-300">
                        <span className="font-semibold text-emerald-400 min-w-[70px]">Action:</span>
                        <span className="text-zinc-200 font-light">{pat.actionableInsight}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Celebrations & Breakthroughs */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <h4 className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Demonstrated Breakthroughs &amp; Strengths
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {retrospective.celebrations.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 font-light">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Week's Growth Prompt */}
              {retrospective.growthPromptForNextWeek && (
                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-indigo-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400">
                      Growth Focus Question for Next Reflection
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-serif italic text-white leading-relaxed">
                    &ldquo;{retrospective.growthPromptForNextWeek}&rdquo;
                  </p>
                  {onStartEntryWithPrompt && (
                    <button
                      id="start-reflection-from-prompt-btn"
                      onClick={() => {
                        onStartEntryWithPrompt(retrospective.growthPromptForNextWeek);
                        onClose();
                      }}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
                    >
                      <span>Journal About This Prompt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div>
            {retrospective && (
              <button
                onClick={handleCopyRetrospective}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copied ? "Copied Report" : "Copy Retrospective"}</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
};
