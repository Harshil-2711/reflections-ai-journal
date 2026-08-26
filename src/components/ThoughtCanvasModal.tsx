import React, { useState, useEffect } from "react";
import {
  Network,
  Sparkles,
  RefreshCw,
  X,
  Info,
  Maximize2,
  Minimize2,
  Compass,
  ArrowRight,
  Layers
} from "lucide-react";
import { JournalEntry, ThoughtMapData, ThoughtNode } from "../types";

interface ThoughtCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
  onSaveThoughtMap?: (map: ThoughtMapData) => void;
}

export const ThoughtCanvasModal: React.FC<ThoughtCanvasModalProps> = ({
  isOpen,
  onClose,
  entry,
  onSaveThoughtMap,
}) => {
  const [thoughtMap, setThoughtMap] = useState<ThoughtMapData | null>(entry.thoughtMap || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<ThoughtNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    if (isOpen && !thoughtMap) {
      fetchThoughtMap();
    }
  }, [isOpen]);

  const fetchThoughtMap = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/thought-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: entry.summary || entry.title,
          conversationHistory: entry.messages,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Failed to generate thought map.");
      }

      if (resData.map) {
        setThoughtMap(resData.map);
        setSelectedNode(resData.map.nodes?.[0] || null);
        onSaveThoughtMap?.(resData.map);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to construct cognitive thought map.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getNodeColor = (type: string, impact?: string) => {
    switch (type) {
      case "trigger":
        return {
          bg: "bg-zinc-900",
          border: "border-zinc-700",
          text: "text-zinc-200",
          badge: "bg-zinc-800 text-zinc-300",
          stroke: "#71717a"
        };
      case "feeling":
        return {
          bg: "bg-rose-950/40",
          border: "border-rose-800/60",
          text: "text-rose-200",
          badge: "bg-rose-900/60 text-rose-300",
          stroke: "#f43f5e"
        };
      case "belief":
        return {
          bg: "bg-amber-950/40",
          border: "border-amber-800/60",
          text: "text-amber-200",
          badge: "bg-amber-900/60 text-amber-300",
          stroke: "#f59e0b"
        };
      case "reframe":
        return {
          bg: "bg-indigo-950/40",
          border: "border-indigo-800/60",
          text: "text-indigo-200",
          badge: "bg-indigo-900/60 text-indigo-300",
          stroke: "#6366f1"
        };
      case "action":
      default:
        return {
          bg: "bg-emerald-950/40",
          border: "border-emerald-800/60",
          text: "text-emerald-200",
          badge: "bg-emerald-900/60 text-emerald-300",
          stroke: "#10b981"
        };
    }
  };

  const filteredNodes = thoughtMap?.nodes.filter(
    (n) => filterType === "all" || n.type === filterType
  ) || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-[#121214] border border-zinc-800 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-[#121214] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-indigo-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-serif">
                Interactive Thought Canvas &amp; Concept Map
              </h2>
              <p className="text-xs text-zinc-400 font-light">
                Untangle triggers, sensations, cognitive roots &amp; empowered action paths
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchThoughtMap}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span className="hidden sm:inline">Regenerate Map</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="p-3 bg-[#0a0a0a] border-b border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-semibold text-[11px] px-1">Filter Nodes:</span>
          {["all", "trigger", "feeling", "belief", "reframe", "action"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl font-medium capitalize transition-all cursor-pointer ${
                filterType === t
                  ? "bg-zinc-800 text-white border border-zinc-700"
                  : "bg-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Canvas Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading ? (
            <div className="h-72 flex flex-col items-center justify-center space-y-3 text-zinc-400 text-xs">
              <Network className="w-8 h-8 animate-pulse text-indigo-400" />
              <p>Deconstructing mental triggers, beliefs, and resolutions into graph nodes...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchThoughtMap}
                className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-white rounded-lg text-xs"
              >
                Retry
              </button>
            </div>
          ) : thoughtMap ? (
            <div className="space-y-6">
              {/* Concept Flow Timeline / Nodes Grid */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-zinc-800/90 relative">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Cognitive Sequence Flow
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Click any node to inspect deeper cognitive roots
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                  {filteredNodes.map((node, idx) => {
                    const colors = getNodeColor(node.type, node.impact);
                    const isSelected = selectedNode?.id === node.id;
                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                          colors.bg
                        } ${colors.border} ${
                          isSelected ? "ring-2 ring-indigo-500 shadow-lg scale-102" : "hover:border-zinc-500"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${colors.badge}`}>
                              {node.type}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">#{idx + 1}</span>
                          </div>
                          <h4 className={`text-xs font-semibold ${colors.text} line-clamp-2`}>
                            {node.label}
                          </h4>
                        </div>

                        <p className="text-[11px] text-zinc-300 font-light leading-relaxed line-clamp-3">
                          {node.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edge Connections Map */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Concept Pathways &amp; Causal Chains
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {thoughtMap.edges.map((edge, idx) => {
                    const fromNode = thoughtMap.nodes.find((n) => n.id === edge.from);
                    const toNode = thoughtMap.nodes.find((n) => n.id === edge.to);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-zinc-300 block truncate">
                            {fromNode?.label || edge.from}
                          </span>
                          <span className="text-[10px] text-indigo-400 font-medium italic">
                            &rarr; {edge.relationship}
                          </span>
                        </div>
                        <span className="text-zinc-400 text-right truncate text-[11px] font-light">
                          {toNode?.label || edge.to}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Node Deep Dive Inspector */}
              {selectedNode && (
                <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-indigo-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60">
                        {selectedNode.type} &bull; Node Inspection
                      </span>
                      <h4 className="text-sm font-semibold text-white">{selectedNode.label}</h4>
                    </div>
                    {selectedNode.impact && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          selectedNode.impact === "empowering"
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : selectedNode.impact === "challenging"
                            ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {selectedNode.impact.toUpperCase()} IMPACT
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 font-light leading-relaxed">
                    {selectedNode.description}
                  </p>
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
