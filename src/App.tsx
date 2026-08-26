import React, { useState, useEffect, useCallback } from "react";
import { User } from "firebase/auth";
import {
  signInWithGoogle,
  logOut,
  subscribeToAuth,
  saveJournalEntry,
  fetchUserJournals,
  deleteJournalEntry,
} from "./lib/firebase";
import { JournalEntry, ReflectionMode } from "./types";
import { Navbar } from "./components/Navbar";
import { LandingHero } from "./components/LandingHero";
import { JournalEditor } from "./components/JournalEditor";
import { JournalHistory } from "./components/JournalHistory";
import { ThreatModelModal } from "./components/ThreatModelModal";
import { TestWalkthroughModal } from "./components/TestWalkthroughModal";
import { SemanticTrendsModal } from "./components/SemanticTrendsModal";
import { Plus, PanelLeftClose, PanelLeft, Sparkles } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Journal State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isThreatModelOpen, setIsThreatModelOpen] = useState(false);
  const [isTestWalkthroughOpen, setIsTestWalkthroughOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);

  // Create an initial new entry template
  const createBlankEntry = useCallback((userId: string, initialPrompt?: string): JournalEntry => {
    return {
      id: `journal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      userId,
      title: initialPrompt ? "Reflection: " + initialPrompt.slice(0, 30) + "..." : "New Reflection",
      summary: "",
      tags: initialPrompt ? ["GrowthFocus"] : [],
      category: "Personal Growth",
      reflectionMode: "reflective_guide",
      messages: initialPrompt
        ? [
            {
              id: `msg-${Date.now()}-prompt`,
              role: "user",
              content: initialPrompt,
              createdAt: Date.now(),
            },
          ]
        : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = subscribeToAuth(async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        loadUserJournals(currentUser.uid);
      } else {
        setEntries([]);
        setActiveEntry(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load Journals from Firestore
  const loadUserJournals = async (uid: string) => {
    try {
      setIsLoadingEntries(true);
      const userEntries = await fetchUserJournals(uid);
      setEntries(userEntries);

      if (userEntries.length > 0) {
        setActiveEntry(userEntries[0]);
      } else {
        setActiveEntry(createBlankEntry(uid));
      }
    } catch (err: any) {
      console.error("Failed to load user journals:", err);
      // Fallback to blank entry on initial error
      setActiveEntry(createBlankEntry(uid));
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Sign In Handler
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign-in Error:", err);
      setAuthError(err?.message || "Failed to complete Google Sign-In. Please check your connection.");
    }
  };

  // Sign Out Handler
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err: any) {
      console.error("Sign-out Error:", err);
    }
  };

  // Save entry to Cloud Firestore with Transaction Guarantee
  const handleSaveToFirestore = async (entryToSave: JournalEntry) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      await saveJournalEntry(user.uid, entryToSave);
      setLastSavedAt(Date.now());

      // Update state in entries list
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === entryToSave.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = entryToSave;
          return updated.sort((a, b) => b.updatedAt - a.updatedAt);
        } else {
          return [entryToSave, ...prev];
        }
      });
    } catch (err: any) {
      console.error("Firestore Save Error:", err);
      setSaveError(err?.message || "Failed to persist reflection to Cloud Firestore.");
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Reflection
  const handleNewEntry = () => {
    if (!user) return;
    const newEntry = createBlankEntry(user.uid);
    setActiveEntry(newEntry);
  };

  // Delete Entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteJournalEntry(user.uid, entryId);
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);

      if (activeEntry?.id === entryId) {
        if (remaining.length > 0) {
          setActiveEntry(remaining[0]);
        } else {
          setActiveEntry(createBlankEntry(user.uid));
        }
      }
    } catch (err: any) {
      console.error("Delete Error:", err);
      setSaveError("Failed to delete entry: " + (err?.message || ""));
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onOpenThreatModel={() => setIsThreatModelOpen(true)}
        onOpenTestWalkthrough={() => setIsTestWalkthroughOpen(true)}
        onOpenTrends={() => setIsTrendsModalOpen(true)}
        hasActiveEntry={!!activeEntry}
      />

      {/* Main Body */}
      <main className="flex-1 flex flex-col">
        {authLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-sm text-zinc-400 font-medium">Verifying Authentication...</p>
          </div>
        ) : !user ? (
          <LandingHero
            onSignIn={handleSignIn}
            isLoading={authLoading}
            errorMessage={authError}
          />
        ) : (
          <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-4 h-[calc(100vh-4rem)]">
            {/* Sidebar toggle on mobile/desktop */}
            <div className="lg:hidden flex items-center justify-between pb-2 border-b border-zinc-800">
              <button
                id="toggle-sidebar-mobile-btn"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
                <span>{isSidebarOpen ? "Hide History" : "Show History"}</span>
              </button>

              <button
                id="mobile-new-reflection-btn"
                onClick={handleNewEntry}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-900 text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Left: History Sidebar */}
            <aside
              className={`${
                isSidebarOpen ? "block" : "hidden"
              } lg:block w-full lg:w-80 lg:shrink-0 h-64 lg:h-full`}
            >
              <JournalHistory
                entries={entries}
                selectedEntryId={activeEntry?.id || null}
                onSelectEntry={(entry) => setActiveEntry(entry)}
                onDeleteEntry={handleDeleteEntry}
                isLoading={isLoadingEntries}
              />
            </aside>

            {/* Right: Active Reflection Workspace */}
            <section className="flex-1 h-full min-w-0">
              {activeEntry ? (
                <JournalEditor
                  key={activeEntry.id}
                  userId={user.uid}
                  activeEntry={activeEntry}
                  onUpdateEntry={(updated) => setActiveEntry(updated)}
                  onSaveToFirestore={handleSaveToFirestore}
                  isSaving={isSaving}
                  saveError={saveError}
                  lastSavedAt={lastSavedAt}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200">No Reflection Selected</h3>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Select a previous reflection from your history or start a fresh journal entry.
                  </p>
                  <button
                    onClick={handleNewEntry}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-xs font-semibold text-zinc-900 shadow transition-all"
                  >
                    Start New Reflection
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      <ThreatModelModal
        isOpen={isThreatModelOpen}
        onClose={() => setIsThreatModelOpen(false)}
      />

      <TestWalkthroughModal
        isOpen={isTestWalkthroughOpen}
        onClose={() => setIsTestWalkthroughOpen(false)}
      />

      <SemanticTrendsModal
        isOpen={isTrendsModalOpen}
        onClose={() => setIsTrendsModalOpen(false)}
        entries={entries}
        onStartEntryWithPrompt={(promptText) => {
          if (user) {
            const newEntry = createBlankEntry(user.uid, promptText);
            setActiveEntry(newEntry);
          }
        }}
      />
    </div>
  );
}
