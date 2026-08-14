"use client";

import { useState } from "react";

type Message = { role: "tutor" | "user"; text: string };

type ReplyCategory = "greeting" | "practice" | "lesson" | "encouragement" | "general";

const REPLIES: Record<ReplyCategory, string[]> = {
  greeting: [
    "Hey there! Ready to work on {instrument} today? Tell me what you'd like to practice.",
    "Hi! Good to see you. What part of your {instrument} practice do you want to focus on?"
  ],
  practice: [
    "Try that phrase one more time, a little slower, then bring it back up to tempo.",
    "That's a really common sticking point. Focus on relaxing your hand between notes.",
    "Break it into two smaller steps so it feels easier, then chain them back together."
  ],
  lesson: [
    "You're currently on \"{lesson}\" — want to walk through the next step of it together?",
    "Let's revisit \"{lesson}\" in your next session too, so it really sticks."
  ],
  encouragement: [
    "That's completely normal at the {level} stage — everyone hits that wall. Keep going, it clicks with repetition.",
    "You're making real progress toward your goal of {goal}. Don't be discouraged, this is part of the process."
  ],
  general: [
    "Good question — let's break that down into smaller steps so it feels easier.",
    "Tell me a bit more about what you're working on and I can help you dig into it."
  ]
};

function categorize(text: string): ReplyCategory {
  const lower = text.toLowerCase();
  if (/^(hi|hey|hello|yo|sup)\b/.test(lower)) return "greeting";
  if (/(stuck|hard|difficult|frustrat|nervous|can't|cant|worried|scared|struggl)/.test(lower)) return "encouragement";
  if (/(lesson|plan|next|progress|goal)/.test(lower)) return "lesson";
  if (/(practice|tempo|slow|fast|rhythm|timing|note|scale|chord|technique|finger|hand|phrase)/.test(lower)) return "practice";
  return "general";
}

export function TutorChat({
  instrument,
  level,
  goal,
  lessonTitle
}: {
  instrument: string;
  level?: string;
  goal?: string;
  lessonTitle?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "tutor", text: `Hi! I'm your ${instrument} coach. Ask me anything about your current lesson, or tell me how practice is going.` }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  function send() {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setSending(true);
    setTimeout(() => {
      const category = categorize(text);
      const pool = REPLIES[category];
      const template = pool[Math.floor(Math.random() * pool.length)];
      const reply = template
        .replace("{instrument}", instrument)
        .replace("{level}", level || "current")
        .replace("{goal}", goal || "your goal")
        .replace("{lesson}", lessonTitle || "your current lesson");
      setMessages((prev) => [...prev, { role: "tutor", text: reply }]);
      setSending(false);
    }, 600);
  }

  return (
    <div className="tutor-chat card">
      <h3>Chat with your Coach</h3>
      <div className="tutor-chat-log">
        {messages.map((message, i) => (
          <div key={i} className={`tutor-chat-bubble ${message.role}`}>
            {message.text}
          </div>
        ))}
        {sending && <div className="tutor-chat-bubble tutor typing">...</div>}
      </div>
      <div className="tutor-chat-input">
        <input
          type="text"
          placeholder="Ask your tutor something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="button" type="button" onClick={send} disabled={!input.trim() || sending}>
          Send
        </button>
      </div>
    </div>
  );
}
