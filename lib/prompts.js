export const MODES = {
  coding: {
    label: "Coding",
    description: "Write, debug & explain code",
    icon: "💻",
    suggestions: [
      {
        icon: "⚡",
        text: "Debug my code",
        hint: "Paste an error or broken snippet",
      },
      {
        icon: "🔧",
        text: "Build a REST API",
        hint: "Node.js, Python, or any language",
      },
      {
        icon: "📖",
        text: "Explain useEffect",
        hint: "React hooks, with examples",
      },
      {
        icon: "🔒",
        text: "JWT auth in Next.js",
        hint: "Secure login with tokens",
      },
    ],
    system:
      "You are Nexora AI, an expert coding assistant. Always put code in markdown code blocks with the language name. First give a short explanation, then the code, then usage instructions if needed. When fixing bugs, explain what was wrong. Follow best practices and prioritize security.",
  },
  study: {
    label: "Study",
    description: "Learn concepts & prep for exams",
    icon: "📚",
    suggestions: [
      {
        icon: "🌱",
        text: "Explain photosynthesis",
        hint: "Simple, 10th grade level",
      },
      {
        icon: "📝",
        text: "Create revision notes",
        hint: "On any topic you choose",
      },
      {
        icon: "🧠",
        text: "Quiz me on History",
        hint: "MCQ or open questions",
      },
      {
        icon: "📅",
        text: "7-day DSA study plan",
        hint: "Structured daily schedule",
      },
    ],
    system:
      "You are Nexora AI, a patient and encouraging study tutor. Explain concepts in simple language with real-life examples, then give key bullet points. When asked, create notes, summaries, quizzes, flashcards, or study plans. Always include answers and brief explanations in quizzes.",
  },
  general: {
    label: "General",
    description: "Any question, any topic",
    icon: "✨",
    suggestions: [
      {
        icon: "📄",
        text: "Polish my resume",
        hint: "Paste it and get instant feedback",
      },
      {
        icon: "🎯",
        text: "Interview tips",
        hint: "For tech or any industry",
      },
      {
        icon: "✉️",
        text: "Write a professional email",
        hint: "Clear, concise, impactful",
      },
      {
        icon: "⏱️",
        text: "Time management tips",
        hint: "Practical daily habits",
      },
    ],
    system:
      "You are Nexora AI, a helpful and knowledgeable assistant. Give clear, accurate, and concise answers. Use markdown formatting to organize information clearly.",
  },
  creative: {
    label: "Creative",
    description: "Write, imagine & brainstorm",
    icon: "🎨",
    suggestions: [
      {
        icon: "✍️",
        text: "Write a short story",
        hint: "Give me a genre or theme",
      },
      {
        icon: "💡",
        text: "Brainstorm startup ideas",
        hint: "In any industry or niche",
      },
      {
        icon: "🎭",
        text: "Write a poem",
        hint: "Any style: haiku, sonnet, free verse",
      },
      {
        icon: "🗣️",
        text: "Craft a speech or pitch",
        hint: "Compelling and memorable",
      },
    ],
    system:
      "You are Nexora AI, a creative writing partner full of imagination. Help with stories, poems, scripts, song lyrics, brainstorming, world-building, character development, and any creative task. Be vivid, original, and inspiring. Match the tone and style the user asks for.",
  },
};

export const BASE_RULES =
  " Respond in whatever language the user writes in — English, Hindi, or Hinglish. If you are not sure of something, say so honestly rather than guessing. Use markdown formatting to make your responses clear and easy to read.";
