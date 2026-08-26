export interface JournalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export type ReflectionMode = "reflective_guide" | "brainstormer" | "summarizer";

export type MoodType = "Peaceful" | "Inspired" | "Focused" | "Reflective" | "Grateful" | "Anxious" | "Energized";

export interface PerspectiveItem {
  id: "stoic" | "cbt" | "future_self" | "socratic" | string;
  name: string;
  icon?: string;
  quote: string;
  analysis: string;
  keyInsight: string;
  actionStep: string;
}

export interface CognitiveBias {
  name: string;
  detectedQuote: string;
  explanation: string;
  counterReframe: string;
}

export interface MicroAction {
  title: string;
  durationSeconds: number;
  category: string;
  instructions: string[];
}

export interface EmotionalAnalysisData {
  valence: number; // -100 to 100
  energyLevel: "Low" | "Moderate" | "High" | string;
  dominantEmotions: string[];
  biasesDetected: CognitiveBias[];
  microAction: MicroAction;
}

export interface ThoughtNode {
  id: string;
  type: "trigger" | "feeling" | "belief" | "reframe" | "action";
  label: string;
  description: string;
  impact?: "neutral" | "challenging" | "empowering";
}

export interface ThoughtEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface ThoughtMapData {
  nodes: ThoughtNode[];
  edges: ThoughtEdge[];
}

export interface TrendTheme {
  theme: string;
  percentage: number;
  description: string;
}

export interface RecurringPattern {
  triggerOrContext: string;
  observedOutcome: string;
  actionableInsight: string;
}

export interface WeeklyRetrospectiveData {
  retrospectiveTitle: string;
  overallTrajectory: string;
  topThemes: TrendTheme[];
  recurringPatterns: RecurringPattern[];
  celebrations: string[];
  growthPromptForNextWeek: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary: string;
  tags: string[];
  category: string;
  reflectionMode: ReflectionMode;
  mood?: MoodType;
  messages: JournalMessage[];
  pinned?: boolean;
  perspectives?: PerspectiveItem[];
  emotionalAnalysis?: EmotionalAnalysisData;
  thoughtMap?: ThoughtMapData;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
