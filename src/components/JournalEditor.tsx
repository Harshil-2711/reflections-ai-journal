import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send,
  Sparkles,
  Save,
  RotateCcw,
  Tag,
  Smile,
  Brain,
  FileText,
  Lightbulb,
  Check,
  Copy,
  AlertCircle,
  Clock,
  Pin,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Compass,
  HeartPulse,
  Network
} from "lucide-react";
import {
  JournalEntry,
  JournalMessage,
  ReflectionMode,
  MoodType,
  PerspectiveItem,
  EmotionalAnalysisData,
  ThoughtMapData
} from "../types";
import { generateGeminiReflection, summarizeJournalEntry } from "../lib/geminiApi";
import {
  speakText,
  stopSpeaking,
  isSpeechRecognitionAvailable,
  createSpeechRecognizer,
  stopSpeechRecognizer
} from "../utils/speechUtils";
import { PerspectiveShifterModal } from "./PerspectiveShifterModal";
import { EmotionalAnalysisModal } from "./EmotionalAnalysisModal";
import { ThoughtCanvasModal } from "./ThoughtCanvasModal";

interface JournalEditorProps {
  userId: string;
  activeEntry: JournalEntry;
  onUpdateEntry: (entry: JournalEntry) => void;
  onSaveToFirestore: (entry: JournalEntry) => Promise<void>;
  isSaving: boolean;
  saveError: string | null;
  lastSavedAt: number | null;
}

const MOODS: MoodType[] = [
  "Peaceful",
  "Inspired",
  "Focused",
  "Reflective",
  "Grateful",
  "Anxious",
  "Energized",
];

const PROMPT_SUGGESTIONS = [
  "What is on your mind most heavily today?",
  "Help me reframe this feeling into a constructive step.",
  "Brainstorm 3 practical strategies for dealing with this challenge.",
  "What are 3 subtle things I should be grateful for right now?",
  "Ask me 3 deep reflection questions about what I just wrote.",
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  userId,
  activeEntry,
  onUpdateEntry,
  onSaveToFirestore,
  isSaving,
  saveError,
  lastSavedAt,
}) => {
  const [inputText, setInputText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState("");

  // Modals state
  const [showPerspectiveModal, setShowPerspectiveModal] = useState(false);
  const [showEmotionalModal, setShowEmotionalModal] = useState(false);
  const [showThoughtCanvasModal, setShowThoughtCanvasModal] = useState(false);

  // Voice Dictation state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeEntry.messages, isGenerating]);

  // Clean up audio & speech recognition on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopSpeechRecognizer();
    };
  }, []);

  // Voice recording toggle
  const toggleVoiceRecording = () => {
    if (isRecordingVoice) {
      stopSpeechRecognizer();
      setIsRecordingVoice(false);
    } else {
      if (!isSpeechRecognitionAvailable()) {
        alert("Speech recognition is not supported in this browser. You can type your entry directly.");
        return;
      }
      setIsRecordingVoice(true);
      const recognizer = createSpeechRecognizer({
        onResult: (transcript, isFinal) => {
          setInputText((prev) => {
            const separator = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
            return prev + separator + transcript;
          });
        },
        onError: (err) => {
          console.warn("Voice error:", err);
          setIsRecordingVoice(false);
        },
        onEnd: () => {
          setIsRecordingVoice(false);
        },
      });
      if (recognizer) {
        try {
          recognizer.start();
          recognitionRef.current = recognizer;
        } catch {
          setIsRecordingVoice(false);
        }
      }
    }
  };

  // Empathetic Voice audio toggle
  const handleToggleVoicePlayback = (msgId: string, content: string) => {
    if (speakingMessageId === msgId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopSpeaking();
      setSpeakingMessageId(msgId);
      speakText(content, {
        onEnd: () => setSpeakingMessageId(null),
        onError: () => setSpeakingMessageId(null),
      });
    }
  };

  // Adopt Perspective into Dialogue
  const handleAdoptPerspective = (perspective: PerspectiveItem) => {
    const adoptedText = `### Adopted Perspective: ${perspective.name}\n\n> "${perspective.quote}"\n\n${perspective.analysis}\n\n**Key Insight:** ${perspective.keyInsight}\n\n**Action Step:** ${perspective.actionStep}`;
    const adoptedMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "assistant",
      content: adoptedText,
      createdAt: Date.now(),
    };

    const updatedEntry: JournalEntry = {
      ...activeEntry,
      messages: [...activeEntry.messages, adoptedMessage],
      perspectives: activeEntry.perspectives
        ? [...activeEntry.perspectives.filter((p) => p.id !== perspective.id), perspective]
        : [perspective],
      updatedAt: Date.now(),
    };

    onUpdateEntry(updatedEntry);
    onSaveToFirestore(updatedEntry);
  };

  // Handle Mode Change
  const handleModeChange = (mode: ReflectionMode) => {
    onUpdateEntry({
      ...activeEntry,
      reflectionMode: mode,
    });
  };

  // Handle Mood Select
  const handleMoodSelect = (mood: MoodType) => {
    onUpdateEntry({
      ...activeEntry,
      mood: activeEntry.mood === mood ? undefined : mood,
    });
  };

  // Handle Tag Addition
  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (("key" in e && e.key === "Enter") || e.type === "click") {
      e.preventDefault();
      const tag = newTagInput.trim().replace(/^#/, "");
      if (tag && !activeEntry.tags.includes(tag)) {
        onUpdateEntry({
          ...activeEntry,
          tags: [...activeEntry.tags, tag],
        });
        setNewTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateEntry({
      ...activeEntry,
      tags: activeEntry.tags.filter((t) => t !== tagToRemove),
    });
  };

  // Send message to Gemini
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isGenerating) return;

    if (isRecordingVoice) {
      stopSpeechRecognizer();
      setIsRecordingVoice(false);
    }

    setGenerationError(null);
    const userMessage: JournalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      content: textToSend,
      createdAt: Date.now(),
    };

    const updatedMessages = [...activeEntry.messages, userMessage];

    // Optimistically update entry with user message
    const updatedEntry: JournalEntry = {
      ...activeEntry,
      messages: updatedMessages,
      title: activeEntry.title === "New Reflection" ? textToSend.slice(0, 40) + "..." : activeEntry.title,
    };
    onUpdateEntry(updatedEntry);

    if (!customPrompt) {
      setInputText("");
    }

    setIsGenerating(true);

    try {
      const response = await generateGeminiReflection(updatedMessages, activeEntry.reflectionMode);
      
      const assistantMessage: JournalMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: response.text,
        createdAt: Date.now(),
      };

      const finalEntry: JournalEntry = {
        ...updatedEntry,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: Date.now(),
      };

      setActiveModel(response.modelUsed);
      onUpdateEntry(finalEntry);
      
      // Auto-save to Firestore
      await onSaveToFirestore(finalEntry);
    } catch (err: any) {
      console.error("Gemini Generation Error:", err);
      setGenerationError(err?.message || "Failed to get a response from Gemini. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger AI Auto-Summarize & Tagging
  const handleAutoSummarize = async () => {
    if (activeEntry.messages.length === 0) return;
    setIsSummarizing(true);
    setGenerationError(null);

    try {
      const response = await summarizeJournalEntry(undefined, activeEntry.messages);
      if (response.success && response.data) {
        const { title, summary, tags } = response.data;
        const mergedTags = Array.from(new Set([...activeEntry.tags, ...(tags || [])]));
        
        const summarizedEntry: JournalEntry = {
          ...activeEntry,
          title: title || activeEntry.title,
          summary: summary || activeEntry.summary,
          tags: mergedTags,
          updatedAt: Date.now(),
        };

        onUpdateEntry(summarizedEntry);
        await onSaveToFirestore(summarizedEntry);
      }
    } catch (err: any) {
      console.error("Summarization Error:", err);
      setGenerationError("Failed to auto-summarize with Gemini: " + (err?.message || ""));
    } finally {
      setIsSummarizing(false);
    }
  };

  // Copy message text
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-zinc-800/80 bg-[#121214] flex flex-col gap-3">
        {/* Title and Pin & Save Controls */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 flex items-center gap-2">
            <button
              id="pin-entry-btn"
              onClick={() => onUpdateEntry({ ...activeEntry, pinned: !activeEntry.pinned })}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                activeEntry.pinned
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
              }`}
              title={activeEntry.pinned ? "Unpin Reflection" : "Pin Reflection"}
            >
              <Pin className="w-4 h-4" />
            </button>
            <input
              id="entry-title-input"
              type="text"
              value={activeEntry.title}
              onChange={(e) => onUpdateEntry({ ...activeEntry, title: e.target.value })}
              placeholder="Give your reflection a title..."
              className="w-full bg-transparent text-lg sm:text-xl font-semibold font-serif text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 rounded px-2 py-0.5"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-summarize sparkle button */}
            <button
              id="ai-summarize-btn"
              onClick={handleAutoSummarize}
              disabled={isSummarizing || activeEntry.messages.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-amber-300 bg-amber-950/30 border border-amber-800/40 hover:bg-amber-950/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Generate Smart Title, Summary, and Tags using Gemini"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? "animate-spin text-amber-400" : "text-amber-300"}`} />
              <span className="hidden sm:inline">{isSummarizing ? "Summarizing..." : "AI Summarize"}</span>
            </button>

            {/* Manual Save Button */}
            <button
              id="save-firestore-btn"
              onClick={() => onSaveToFirestore(activeEntry)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-zinc-200 text-black shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save to Cloud"}</span>
            </button>
          </div>
        </div>

        {/* Standout AI Capabilities Action Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            id="open-perspective-shifter-btn"
            onClick={() => setShowPerspectiveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-indigo-300 border border-indigo-900/40 transition-all hover:border-indigo-700/60 shadow-sm cursor-pointer"
            title="View reflection through Stoic, CBT, Future Self & Socratic lenses"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Perspective Shifter</span>
          </button>

          <button
            id="open-emotional-analysis-btn"
            onClick={() => setShowEmotionalModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-rose-300 border border-rose-900/40 transition-all hover:border-rose-700/60 shadow-sm cursor-pointer"
            title="Analyze emotional valence, detect cognitive biases & practice 2-min micro grounding"
          >
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            <span>Emotional &amp; Bias Visualizer</span>
          </button>

          <button
            id="open-thought-canvas-btn"
            onClick={() => setShowThoughtCanvasModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-900/40 transition-all hover:border-amber-700/60 shadow-sm cursor-pointer"
            title="Untangle situation triggers, automatic feelings, core beliefs, and reframes"
          >
            <Network className="w-3.5 h-3.5 text-amber-400" />
            <span>Thought Map Canvas</span>
          </button>
        </div>

        {/* Mode Selector & Mood Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
          {/* Reflection Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#0a0a0a] rounded-xl border border-zinc-800">
            <button
              id="mode-reflective-guide-btn"
              onClick={() => handleModeChange("reflective_guide")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeEntry.reflectionMode === "reflective_guide"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Guide</span>
            </button>
            <button
              id="mode-brainstormer-btn"
              onClick={() => handleModeChange("brainstormer")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeEntry.reflectionMode === "brainstormer"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Brainstorm</span>
            </button>
            <button
              id="mode-summarizer-btn"
              onClick={() => handleModeChange("summarizer")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeEntry.reflectionMode === "summarizer"
                  ? "bg-zinc-800 text-white shadow-sm border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Synthesize</span>
            </button>
          </div>

          {/* Mood Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs text-zinc-400 flex items-center gap-1 shrink-0">
              <Smile className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">Mood:</span>
            </span>
            {MOODS.map((mood) => (
              <button
                key={mood}
                id={`mood-chip-${mood.toLowerCase()}`}
                onClick={() => handleMoodSelect(mood)}
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all shrink-0 cursor-pointer ${
                  activeEntry.mood === mood
                    ? "bg-zinc-800 text-white border-zinc-600 shadow-sm"
                    : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {/* Tags & AI Summary preview (if available) */}
        {(activeEntry.summary || activeEntry.tags.length > 0) && (
          <div className="p-3 bg-[#0a0a0a]/80 rounded-xl border border-zinc-800/80 text-xs space-y-2">
            {activeEntry.summary && (
              <div className="text-zinc-300 italic flex items-start gap-1.5 font-light">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{activeEntry.summary}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="w-3 h-3 text-zinc-500 shrink-0" />
              {activeEntry.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 text-[11px]"
                >
                  #{tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-400 hover:text-rose-400 text-xs ml-0.5 cursor-pointer"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  className="bg-transparent border border-zinc-800 rounded px-1.5 py-0.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-20"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {activeEntry.messages.length === 0 ? (
          <div className="h-full min-h-[240px] flex flex-col items-center justify-center text-center p-6 text-zinc-400 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Brain className="w-6 h-6" />
            </div>
            <div className="max-w-md space-y-1">
              <h4 className="text-base font-semibold text-zinc-200 font-serif">Start Your Multi-Turn Reflection</h4>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Type your thoughts, speak via voice dictation, or explore philosophical lenses. Gemini provides empathetic perspectives and structured growth insights.
              </p>
            </div>

            {/* Starter Prompt Chips */}
            <div className="pt-2 flex flex-col gap-2 w-full max-w-md">
              <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider text-left">
                Inspiration Prompts:
              </p>
              {PROMPT_SUGGESTIONS.slice(0, 3).map((prompt, idx) => (
                <button
                  key={idx}
                  id={`starter-prompt-${idx}`}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left text-xs px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 transition-all hover:border-zinc-600 cursor-pointer"
                >
                  &ldquo;{prompt}&rdquo;
                </button>
              ))}
            </div>
          </div>
        ) : (
          activeEntry.messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id || index}
                id={`message-bubble-${index}`}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-300 shrink-0 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                    isUser
                      ? "bg-zinc-800 text-white rounded-br-none border border-zinc-700/80"
                      : "bg-[#18181b] text-zinc-200 border border-zinc-800 rounded-bl-none"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1 text-[11px] opacity-75">
                    <span className="font-semibold">
                      {isUser ? "You" : `Gemini (${activeEntry.reflectionMode.replace("_", " ")})`}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Audio Playback button for Assistant reflections */}
                      {!isUser && (
                        <button
                          id={`listen-audio-btn-${index}`}
                          onClick={() => handleToggleVoicePlayback(msg.id, msg.content)}
                          className={`p-1 rounded hover:text-white transition-colors cursor-pointer ${
                            speakingMessageId === msg.id ? "text-indigo-400 animate-pulse" : "text-zinc-400"
                          }`}
                          title={speakingMessageId === msg.id ? "Stop voice" : "Listen to reflection"}
                        >
                          {speakingMessageId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                      <Clock className="w-3 h-3" />
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="p-0.5 hover:text-white transition-colors cursor-pointer"
                        title="Copy text"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-300" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none text-zinc-200 leading-relaxed font-light">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0 mt-1 font-semibold text-xs">
                    You
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isGenerating && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-300 shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-300" />
            </div>
            <div className="bg-[#18181b] border border-zinc-800 rounded-2xl rounded-bl-none px-4 py-3 text-xs text-zinc-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              <span>Gemini is contemplating and crafting your reflection...</span>
            </div>
          </div>
        )}

        {/* Generation Error Banner */}
        {generationError && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">Generation Notice</p>
              <p className="text-rose-200/90">{generationError}</p>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-100 font-medium text-[11px] cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Save Error Banner with Retry */}
        {saveError && (
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300">Cloud Sync Alert</p>
              <p className="text-amber-200/90">{saveError}</p>
            </div>
            <button
              onClick={() => onSaveToFirestore(activeEntry)}
              className="px-2.5 py-1 rounded bg-amber-800/60 hover:bg-amber-700 text-white font-medium text-[11px] cursor-pointer"
            >
              Retry Save
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Workspace Footer */}
      <div className="p-3 sm:p-4 bg-[#121214] border-t border-zinc-800/80 space-y-2.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              id="journal-input-textarea"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isRecordingVoice ? "Listening to your voice stream of consciousness..." : "Write your thoughts here, or use the microphone to speak freely... (Press Enter to send)"}
              className={`w-full bg-[#0a0a0a] border rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none transition-all ${
                isRecordingVoice
                  ? "border-rose-500/80 ring-1 ring-rose-500"
                  : "border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
              }`}
            />
            {isRecordingVoice && (
              <span className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[11px] text-rose-400 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Live Transcribing...
              </span>
            )}
          </div>

          {/* Voice Dictation Button */}
          <button
            id="voice-dictation-btn"
            type="button"
            onClick={toggleVoiceRecording}
            className={`h-11 px-3.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
              isRecordingVoice
                ? "bg-rose-600 text-white border-rose-500 animate-pulse shadow-lg"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
            }`}
            title={isRecordingVoice ? "Stop voice dictation" : "Voice dictation (speech-to-text)"}
          >
            {isRecordingVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Send to Gemini Button */}
          <button
            id="journal-send-btn"
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="h-11 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
            title="Send to Gemini"
          >
            <Send className="w-4 h-4 text-black" />
          </button>
        </form>

        {/* Footer Meta Details */}
        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
          <div className="flex items-center gap-2">
            <span>
              {activeEntry.messages.length} {activeEntry.messages.length === 1 ? "turn" : "turns"}
            </span>
            <span>&bull;</span>
            <span>Mode: {activeEntry.reflectionMode.replace("_", " ")}</span>
            {activeModel && (
              <>
                <span>&bull;</span>
                <span className="text-emerald-400 font-mono text-[10px]">Model: {activeModel}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lastSavedAt && (
              <span className="text-zinc-500">
                Cloud synced at {new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Standout Feature Modals */}
      <PerspectiveShifterModal
        isOpen={showPerspectiveModal}
        onClose={() => setShowPerspectiveModal(false)}
        entry={activeEntry}
        onAdoptPerspective={handleAdoptPerspective}
      />

      <EmotionalAnalysisModal
        isOpen={showEmotionalModal}
        onClose={() => setShowEmotionalModal(false)}
        entry={activeEntry}
        onSaveAnalysis={(data: EmotionalAnalysisData) => {
          const updated = { ...activeEntry, emotionalAnalysis: data, updatedAt: Date.now() };
          onUpdateEntry(updated);
          onSaveToFirestore(updated);
        }}
      />

      <ThoughtCanvasModal
        isOpen={showThoughtCanvasModal}
        onClose={() => setShowThoughtCanvasModal(false)}
        entry={activeEntry}
        onSaveThoughtMap={(map: ThoughtMapData) => {
          const updated = { ...activeEntry, thoughtMap: map, updatedAt: Date.now() };
          onUpdateEntry(updated);
          onSaveToFirestore(updated);
        }}
      />
    </div>
  );
};

