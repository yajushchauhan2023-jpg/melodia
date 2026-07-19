"use client";

import { useState } from "react";

type Message = { role: "tutor" | "user"; text: string };

const STARTER_REPLIES = [
  "Nice work! Try that phrase one more time, a little slower, then bring it back up to tempo.",
  "Good question — let's break that down into two smaller steps so it feels easier.",
  "That's a really common sticking point. Focus on relaxing your hand between notes.",
  "Let's revisit that in your next lesson too, so it really sticks."
];

export function TutorChat({ instrument }: { instrument: string }) {
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
      const reply = STARTER_REPLIES[Math.floor(Math.random() * STARTER_REPLIES.length)];
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
