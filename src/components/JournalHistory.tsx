import React, { useState } from "react";
import {
  Search,
  Pin,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  Tag,
  Smile,
  ChevronRight,
  BookOpen,
  Download,
  AlertTriangle,
} from "lucide-react";
import { JournalEntry, MoodType } from "../types";

interface JournalHistoryProps {
  entries: JournalEntry[];
  selectedEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entryId: string) => Promise<void>;
  isLoading: boolean;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
  onDeleteEntry,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | "all">("all");
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMood =
      selectedMoodFilter === "all" || entry.mood === selectedMoodFilter;

    return matchesSearch && matchesMood;
  });

  // Group into Pinned vs Others
  const pinnedEntries = filteredEntries.filter((e) => e.pinned);
  const regularEntries = filteredEntries.filter((e) => !e.pinned);

  // Export entry to markdown file
  const handleExportEntry = (e: React.MouseEvent, entry: JournalEntry) => {
    e.stopPropagation();
    const mdContent = `# ${entry.title}
*Date: ${new Date(entry.createdAt).toLocaleDateString()} | Mode: ${entry.reflectionMode} | Mood: ${entry.mood || "None"}*
${entry.summary ? `\n> **Summary**: ${entry.summary}\n` : ""}
${entry.tags.length > 0 ? `\n**Tags**: ${entry.tags.map((t) => `#${t}`).join(" ")}\n` : ""}
---
${entry.messages
  .map(
    (m) =>
      `### ${m.role === "user" ? "You" : "Gemini"}\n*${new Date(m.createdAt).toLocaleTimeString()}*\n\n${m.content}\n`
  )
  .join("\n---\n")}
`;

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entry.title.replace(/[^a-zA-Z0-9_-]/g, "_") || "reflection"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      setIsDeleting(true);
      await onDeleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#121214] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Header & Search */}
      <div className="p-4 border-b border-zinc-800/80 bg-[#121214] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <h3 className="font-semibold text-zinc-100 text-sm font-serif">Reflection History</h3>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="history-search-input"
            type="text"
            placeholder="Search entries, tags, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-[#0a0a0a] border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400 space-y-2">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin mx-auto" />
            <p>Loading your private reflections...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 space-y-1">
            <p className="font-medium text-zinc-400">No reflections found</p>
            <p>{searchQuery ? "Try searching for a different keyword" : "Start your first reflection with Gemini above"}</p>
          </div>
        ) : (
          <>
            {/* Pinned Section */}
            {pinnedEntries.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider px-1 flex items-center gap-1">
                  <Pin className="w-3 h-3" /> Pinned Reflections
                </p>
                {pinnedEntries.map((entry) => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntryId === entry.id}
                    onSelect={() => onSelectEntry(entry)}
                    onExport={(e) => handleExportEntry(e, entry)}
                    onDeletePrompt={(e) => {
                      e.stopPropagation();
                      setEntryToDelete(entry);
                    }}
                  />
                ))}
              </div>
            )}

            {/* Regular Entries */}
            {regularEntries.length > 0 && (
              <div className="space-y-1.5">
                {pinnedEntries.length > 0 && (
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-1">
                    All Reflections
                  </p>
                )}
                {regularEntries.map((entry) => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntryId === entry.id}
                    onSelect={() => onSelectEntry(entry)}
                    onExport={(e) => handleExportEntry(e, entry)}
                    onDeletePrompt={(e) => {
                      e.stopPropagation();
                      setEntryToDelete(entry);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-9 h-9 rounded-xl bg-rose-950/40 border border-rose-800/40 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-zinc-100 text-sm">Delete Reflection?</h4>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to delete &ldquo;{entryToDelete.title}&rdquo;? This will permanently remove it from your private Firestore collection.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEntryToDelete(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 border border-zinc-700/60"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-entry-btn"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white shadow transition-all disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface HistoryCardProps {
  entry: JournalEntry;
  isSelected: boolean;
  onSelect: () => void;
  onExport: (e: React.MouseEvent) => void;
  onDeletePrompt: (e: React.MouseEvent) => void;
}

const HistoryCard: React.FC<HistoryCardProps> = ({
  entry,
  isSelected,
  onSelect,
  onExport,
  onDeletePrompt,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-xl border transition-all cursor-pointer group text-left ${
        isSelected
          ? "bg-zinc-900 border-zinc-600 shadow-md text-white"
          : "bg-[#0a0a0a]/60 border-zinc-800/60 hover:bg-zinc-900/50 hover:border-zinc-700 text-zinc-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-xs text-zinc-200 line-clamp-1 group-hover:text-white">
          {entry.title || "Untitled Reflection"}
        </h4>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onExport}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
            title="Export Markdown"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={onDeletePrompt}
            className="p-1 text-zinc-400 hover:text-rose-400 rounded hover:bg-zinc-800"
            title="Delete Entry"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {entry.summary && (
        <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 italic font-light">
          {entry.summary}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5" />
          {new Date(entry.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
        </span>
        <span>&bull;</span>
        <span>{entry.messages.length} turns</span>
        {entry.mood && (
          <>
            <span>&bull;</span>
            <span className="text-zinc-300 font-medium">{entry.mood}</span>
          </>
        )}
      </div>
    </div>
  );
};
