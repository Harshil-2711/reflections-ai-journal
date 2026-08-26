import { JournalMessage, ReflectionMode } from "../types";

export interface GenerateReflectionResponse {
  success: boolean;
  text: string;
  modelUsed: string;
  error?: string;
}

export interface SummarizeResponse {
  success: boolean;
  data: {
    title: string;
    summary: string;
    tags: string[];
  };
  modelUsed: string;
  error?: string;
}

export async function generateGeminiReflection(
  messages: JournalMessage[],
  reflectionMode: ReflectionMode
): Promise<GenerateReflectionResponse> {
  const response = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      reflectionMode,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network response was not ok" }));
    throw new Error(errorData.error || `Server responded with status: ${response.status}`);
  }

  return response.json();
}

export async function summarizeJournalEntry(
  content?: string,
  conversationHistory?: JournalMessage[]
): Promise<SummarizeResponse> {
  const response = await fetch("/api/gemini/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to generate summary" }));
    throw new Error(errorData.error || `Server responded with status: ${response.status}`);
  }

  return response.json();
}
