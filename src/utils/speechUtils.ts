// Voice Recording (STT) and AI Audio Synthesis (TTS) Helper Utilities

// Safe check for browser Speech Synthesis
export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Safe check for browser Speech Recognition
export function isSpeechRecognitionAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function speakText(
  text: string,
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: any) => void;
    pitch?: number;
    rate?: number;
  }
) {
  if (!isSpeechSynthesisAvailable()) {
    console.warn("Speech Synthesis is not supported in this browser environment.");
    options?.onError?.("Speech Synthesis not supported");
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Strip markdown symbols for natural clean speech
  const cleanText = text
    .replace(/[#*_`~>-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();

  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.pitch = options?.pitch ?? 0.95; // Slightly grounded warm pitch
  utterance.rate = options?.rate ?? 0.95;   // Thoughtful, unhurried pace

  // Select a pleasant natural voice if available
  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") ||
        v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Serena") ||
        v.name.includes("Daniel"))
  ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  utterance.onstart = () => {
    options?.onStart?.();
  };

  utterance.onend = () => {
    activeUtterance = null;
    options?.onEnd?.();
  };

  utterance.onerror = (e) => {
    activeUtterance = null;
    options?.onError?.(e);
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (isSpeechSynthesisAvailable()) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function isCurrentlySpeaking(): boolean {
  if (!isSpeechSynthesisAvailable()) return false;
  return window.speechSynthesis.speaking;
}

// Web Speech Recognition Controller
let recognitionInstance: any = null;

export function createSpeechRecognizer(callbacks: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: any) => void;
  onEnd: () => void;
}) {
  if (!isSpeechRecognitionAvailable()) {
    return null;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onresult = (event: any) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }

    callbacks.onResult(final || interim, Boolean(final));
  };

  recognition.onerror = (event: any) => {
    console.warn("Speech recognition error:", event.error);
    callbacks.onError(event.error);
  };

  recognition.onend = () => {
    callbacks.onEnd();
  };

  recognitionInstance = recognition;
  return recognition;
}

export function stopSpeechRecognizer() {
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {
      // Ignored if already stopped
    }
    recognitionInstance = null;
  }
}
