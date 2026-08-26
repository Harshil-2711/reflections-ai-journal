import React, { useState, useEffect } from "react";
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  RefreshCw,
  Zap,
  Info
} from "lucide-react";
import { EmotionalAnalysisData, JournalEntry } from "../types";

interface EmotionalAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  onSaveAnalysis?: (analysis: EmotionalAnalysisData) => void;
}

export const EmotionalAnalysisModal: React.FC<EmotionalAnalysisModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSaveAnalysis,
}) => {
  const [analysis, setAnalysis] = useState<EmotionalAnalysisData | null>(entry.emotionalAnalysis || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Micro-Action Timer State
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(120);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen && !analysis) {
      fetchAnalysis();
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: any = null;
    if (timerActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsRemaining]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/emotional-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entry.summary || entry.title,
          conversationHistory: entry.messages,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to analyze emotional resonance.");
      }

      if (resData.data) {
        setAnalysis(resData.data);
        if (resData.data.microAction?.durationSeconds) {
          setSecondsRemaining(resData.data.microAction.durationSeconds);
        }
        onSaveAnalysis?.(resData.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to perform emotional analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setSecondsRemaining(analysis?.microAction?.durationSeconds || 120);
    setCurrentStepIndex(0);
  };

  if (!isOpen) return null;

  const valence = analysis?.valence ?? 0;
  const valenceNormalized = Math.min(100, Math.max(0, (valence + 100) / 2)); // 0 to 100%

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-rose-400">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">
                Emotional Resonance &amp; Cognitive Biases
              </h2>
              <p className="text-xs text-zinc-400 font-light">
                Empathetic valence detection, distortion identification &amp; micro-grounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-rose-400" : ""}`} />
              <span className="hidden sm:inline">Re-analyze</span>
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
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-zinc-400 text-xs">
              <HeartPulse className="w-8 h-8 animate-pulse text-rose-400" />
              <p>Analyzing emotional valence and cognitive patterns...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchAnalysis}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Valence & Energy Meter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emotional Valence */}
                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Emotional Valence
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-100">
                      {valence > 0 ? `+${valence}` : valence}/100
                    </span>
                  </div>

                  {/* Gradient Track */}
                  <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden relative border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${valenceNormalized}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                    <span>-100 (Challenging)</span>
                    <span>0 (Neutral)</span>
                    <span>+100 (Peaceful/Energized)</span>
                  </div>
                </div>

                {/* Energy Level & Dominant Emotions */}
                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-zinc-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Energy Resonance
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-zinc-900 text-amber-300 border border-zinc-800 font-semibold">
                      {analysis.energyLevel} Energy
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {analysis.dominantEmotions.map((emo, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-zinc-900 text-zinc-200 border border-zinc-800 text-xs font-medium"
                      >
                        {emo}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Detected Cognitive Biases */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Detected Cognitive Patterns &amp; Distortions
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    {analysis.biasesDetected.length}{" "}
                    {analysis.biasesDetected.length === 1 ? "pattern" : "patterns"} identified
                  </span>
                </div>

                {analysis.biasesDetected.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 text-center text-xs text-zinc-400">
                    No prominent cognitive distortions detected in this reflection. Your perspective appears balanced and objective!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysis.biasesDetected.map((bias, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#0a0a0a] border border-zinc-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-400" />
                            {bias.name}
                          </span>
                        </div>

                        {bias.detectedQuote && (
                          <p className="text-[11px] font-mono italic text-zinc-400 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/80">
                            &ldquo;{bias.detectedQuote}&rdquo;
                          </p>
                        )}

                        <p className="text-xs text-zinc-300 leading-relaxed font-light">
                          {bias.explanation}
                        </p>

                        <div className="pt-2 border-t border-zinc-800/60 flex items-start gap-2 text-xs text-emerald-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-[11px] text-emerald-400 block">
                              Compassionate Reframe:
                            </span>
                            <span className="text-zinc-300 font-light leading-relaxed">
                              {bias.counterReframe}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Interactive 2-Minute Micro-Action with Timer */}
              {analysis.microAction && (
                <div className="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 block">
                        {analysis.microAction.category} &bull; Guided Practice
                      </span>
                      <h4 className="text-sm font-semibold text-white font-serif">
                        {analysis.microAction.title}
                      </h4>
                    </div>

                    {/* Timer Controls */}
                    <div className="flex items-center gap-2 bg-[#0a0a0a] px-3 py-1.5 rounded-xl border border-zinc-800">
                      <span className="font-mono text-sm font-bold text-white">
                        {formatTimer(secondsRemaining)}
                      </span>
                      <button
                        id="toggle-microaction-timer"
                        onClick={() => setTimerActive(!timerActive)}
                        className="p-1 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                        title={timerActive ? "Pause" : "Start"}
                      >
                        {timerActive ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                      </button>
                      <button
                        onClick={handleResetTimer}
                        className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Reset Timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visual Breathing Bubble / Pulse Animation when Timer is Running */}
                  {timerActive && (
                    <div className="py-4 flex flex-col items-center justify-center space-y-2">
                      <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-400/60 flex items-center justify-center animate-ping duration-1000">
                        <Sparkles className="w-6 h-6 text-indigo-300" />
                      </div>
                      <span className="text-xs text-indigo-300 animate-pulse">
                        Breathe in calm... release tension...
                      </span>
                    </div>
                  )}

                  {/* Step list */}
                  <div className="space-y-1.5">
                    {analysis.microAction.instructions.map((step, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentStepIndex(idx)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                          currentStepIndex === idx
                            ? "bg-[#0a0a0a] border-zinc-700 text-white shadow-sm"
                            : "bg-[#0a0a0a]/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-mono font-bold shrink-0 border border-zinc-800">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed font-light">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#121214] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
