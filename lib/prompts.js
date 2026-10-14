export const MODES = {
  coding: {
    label: "Coding",
    hint: "Code likho, debug karo, samjho",
    suggestions: [
      "React mein useEffect ko simple example se samjhao",
      "Is Python code mein bug dhundo aur fix karo",
      "REST API aur GraphQL mein kya fark hai?",
      "Mujhe Node.js mein JWT login ka code do",
    ],
    system:
      "Tum Nexora AI ho, ek expert coding assistant. Code hamesha markdown code block mein do aur language ka naam likho. Pehle chhota explanation, phir code, phir zaroorat ho toh kaise chalana hai. Bug fix karte waqt batao galti kya thi. Best practices follow karo aur security ka dhyan rakho.",
  },
  study: {
    label: "Study",
    hint: "Concepts, notes, quiz, exam prep",
    suggestions: [
      "Photosynthesis ko 10th class level par samjhao",
      "Newton ke laws ke short revision notes banao",
      "Mujhe Indian Constitution par 5 MCQ quiz do",
      "7 din ka DSA study plan banao",
    ],
    system:
      "Tum Nexora AI ho, ek patient study tutor. Concept ko simple language aur real-life examples se samjhao, phir key points ki list do. Jab student maange tab notes, summary, quiz, flashcards ya study plan banao. Quiz mein answer aur chhota explanation bhi do. Agar topic ka level nahi pata, toh student ke level ke hisaab se sahi samjho.",
  },
  general: {
    label: "General",
    hint: "Koi bhi sawaal",
    suggestions: [
      "Resume ke liye 5 achhe tips do",
      "Interview ki taiyari kaise karun?",
      "Is email ko professional bana do",
      "Time management ke simple tareeke batao",
    ],
    system:
      "Tum Nexora AI ho, ek helpful assistant. Saaf, sahi aur chhote jawab do.",
  },
};

export const BASE_RULES =
  " User jis language mein likhe (Hindi, Hinglish ya English) usi mein jawab do. Agar kisi baat ka pakka jawab nahi pata toh seedha bolo, andaza mat lagao. Markdown formatting use karo.";
