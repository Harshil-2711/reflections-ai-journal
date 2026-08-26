import React, { useState, useEffect } from "react";
import {
  Shield,
  Brain,
  Sparkles,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  PlusCircle,
  Copy,
  Check,
  RefreshCw,
  Quote,
  Lightbulb,
  Compass
} from "lucide-react";
import { PerspectiveItem, JournalEntry } from "../types";
import { speakText, stopSpeaking, isCurrentlySpeaking } from "../utils/speechUtils";

interface PerspectiveShifterModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  onAdoptPerspective: (perspective: PerspectiveItem) => void;
}

export const PerspectiveShifterModal: React.FC<PerspectiveShifterModalProps> = ({
  isOpen,
  onClose,
  entry,
  onAdoptPerspective,
}) => {
  const [perspectives, setPerspectives] = useState<PerspectiveItem[]>(entry.perspectives || []);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("stoic");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && (!perspectives || perspectives.length === 0)) {
      fetchPerspectives();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      setSpeakingId(null);
    }
  }, [isOpen]);

  const fetchPerspectives = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/perspectives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entry.summary || entry.title,
          conversationHistory: entry.messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate perspectives.");
      }

      if (data.perspectives && Array.isArray(data.perspectives)) {
        setPerspectives(data.perspectives);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate perspectives with Gemini.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeak = (item: PerspectiveItem) => {
    if (speakingId === item.id) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      stopSpeaking();
      setSpeakingId(item.id);
      speakText(`${item.name}. ${item.quote}. ${item.analysis}. Key insight: ${item.keyInsight}. Action step: ${item.actionStep}`, {
        onEnd: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  };

  const handleCopy = (item: PerspectiveItem) => {
    const text = `## ${item.name}\n\n> "${item.quote}"\n\n${item.analysis}\n\n**Key Insight:** ${item.keyInsight}\n\n**Action Step:** ${item.actionStep}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const currentPerspective = perspectives.find((p) => p.id === selectedPersonaId) || perspectives[0];

  const getPersonaIcon = (id: string) => {
    switch (id) {
      case "stoic":
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case "cbt":
        return <Brain className="w-4 h-4 text-indigo-400" />;
      case "future_self":
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case "socratic":
      default:
        return <HelpCircle className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-indigo-300">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">Perspective Shifter</h2>
              <p className="text-xs text-zinc-400 font-light">
                View your reflection through distinct philosophical &amp; psychological mental models
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="regenerate-perspectives-btn"
              onClick={fetchPerspectives}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
              title="Regenerate with Gemini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">Refresh Models</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona Switcher Tabs */}
        <div className="p-3 bg-[#0a0a0a] border-b border-zinc-800 flex items-center gap-2 overflow-x-auto">
          {perspectives.map((p) => {
            const isSelected = p.id === (currentPerspective?.id || "stoic");
            return (
              <button
                key={p.id}
                id={`persona-tab-${p.id}`}
                onClick={() => setSelectedPersonaId(p.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-zinc-800 text-white border border-zinc-700 shadow-sm"
                    : "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                {getPersonaIcon(p.id)}
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-3 text-zinc-400 text-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
              <p>Gemini is synthesizing wisdom across mental models...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchPerspectives}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : currentPerspective ? (
            <div className="space-y-6">
              {/* Quote Anchor */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-zinc-800/90 relative overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Quote className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm sm:text-base font-serif italic text-zinc-100 leading-relaxed">
                        &ldquo;{currentPerspective.quote}&rdquo;
                      </p>
                      <span className="text-[11px] text-zinc-400 font-medium block mt-1">
                        &mdash; {currentPerspective.name}
                      </span>
                    </div>
                  </div>

                  {/* Audio Playback button */}
                  <button
                    id={`play-persona-audio-${currentPerspective.id}`}
                    onClick={() => handleToggleSpeak(currentPerspective)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      speakingId === currentPerspective.id
                        ? "bg-indigo-600 text-white border-indigo-500 animate-pulse"
                        : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white hover:bg-zinc-800"
                    }`}
                    title={speakingId === currentPerspective.id ? "Stop voice playback" : "Listen in calming voice"}
                  >
                    {speakingId === currentPerspective.id ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Analysis Text */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Philosophical Deconstruction
                </h4>
                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 text-xs sm:text-sm text-zinc-200 leading-relaxed font-light whitespace-pre-line">
                  {currentPerspective.analysis}
                </div>
              </div>

              {/* Key Insight & Action Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-indigo-900/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
                    <Lightbulb className="w-4 h-4 text-indigo-400" />
                    <span>Key Insight</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {currentPerspective.keyInsight}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-emerald-900/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Micro-Practice Action</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed font-light">
                    {currentPerspective.actionStep}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-[#121214] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentPerspective && (
              <button
                onClick={() => handleCopy(currentPerspective)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors cursor-pointer"
              >
                {copiedId === currentPerspective.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                <span>{copiedId === currentPerspective.id ? "Copied" : "Copy Insight"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentPerspective && (
              <button
                id="adopt-perspective-btn"
                onClick={() => {
                  onAdoptPerspective(currentPerspective);
                  onClose();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold shadow transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Adopt into Journal Dialogue</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
