"use client";

// Check feature availability in the current browser
export function isSpeechRecognitionSupported() {
  if (typeof window === "undefined") return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === "undefined") return false;
  return Boolean("speechSynthesis" in window && window.SpeechSynthesisUtterance);
}

// Clean markdown text into natural human speech
export function cleanTextForSpeech(markdown) {
  if (!markdown) return "";

  return (
    markdown
      // Replace code blocks with brief note
      .replace(/```[\s\S]*?```/g, " Code block. ")
      // Replace inline code with text
      .replace(/`([^`]+)`/g, "$1")
      // Replace markdown links [text](url) with just text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove raw URLs
      .replace(/https?:\/\/\S+/g, "")
      // Remove bold/italic markers
      .replace(/[*_~]+/g, "")
      // Remove headings (#, ##, ###)
      .replace(/^#{1,6}\s+/gm, "")
      // Remove blockquotes
      .replace(/^>\s+/gm, "")
      // Remove bullet and list markers
      .replace(/^[\s*-+]+(?=\S)/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      // Remove horizontal rules
      .replace(/[-*_]{3,}/g, "")
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Text-to-Speech: Speak text aloud with natural voice selection
export function speakText(text, { onStart, onEnd, onError } = {}) {
  if (!isSpeechSynthesisSupported()) {
    onError?.(new Error("Text-to-speech is not supported in this browser."));
    return;
  }

  // Cancel any ongoing speech
  stopSpeech();

  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.02;
  utterance.pitch = 1.0;

  // Pick best available voice (Hindi/English preferred)
  const voices = window.speechSynthesis.getVoices() || [];
  const voice =
    voices.find((v) => v.lang.startsWith("hi") || v.name.toLowerCase().includes("hindi")) ||
    voices.find((v) => v.lang.startsWith("en-IN")) ||
    voices.find((v) => v.name.includes("Google") && v.lang.startsWith("en")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];

  if (voice) {
    utterance.voice = voice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = (e) => {
    if (e.error !== "canceled" && e.error !== "interrupted") {
      onError?.(e);
    }
    onEnd?.();
  };

  window.speechSynthesis.speak(utterance);
}

// Stop any currently playing audio
export function stopSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

// Speech-to-Text: Listen to user's microphone
export function createSpeechRecognizer({ onResult, onError, onEnd, onStart, lang = "hi-IN" }) {
  if (!isSpeechRecognitionSupported()) {
    throw new Error("Speech recognition is not supported in this browser. Use Chrome or Edge.");
  }

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognizer = new SpeechRec();

  recognizer.continuous = false;
  recognizer.interimResults = true;
  // Multilingual auto-detection support (Hindi & English)
  recognizer.lang = lang;

  recognizer.onstart = () => {
    onStart?.();
  };

  recognizer.onresult = (event) => {
    let interim = "";
    let final = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    onResult?.({ final, interim, combined: (final || interim).trim() });
  };

  recognizer.onerror = (event) => {
    onError?.(event);
  };

  recognizer.onend = () => {
    onEnd?.();
  };

  return recognizer;
}
