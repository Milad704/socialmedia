import React, { useState } from "react";

interface ChatScreenProps {
  friend: string;
  onClose: () => void;
  currentUser: string;
}

export default function ChatScreen({
  friend,
  onClose,
  currentUser,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<{ from: string; text: string }[]>(
    []
  );
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { from: currentUser, text: input }]);
    setInput("");
  };

  return (
    <main className="chat-screen">
      <header>
        <h2>Chat with {friend}</h2>
        <button onClick={onClose}>Back</button>
      </header>
      <div
        className="messages"
        style={{
          minHeight: "300px",
          border: "1px solid #ccc",
          padding: "10px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, i) => (
          <p
            key={i}
            style={{ textAlign: msg.from === currentUser ? "right" : "left" }}
          >
            <strong>{msg.from}: </strong>
            {msg.text}
          </p>
        ))}
      </div>
      <div className="input-area" style={{ marginTop: "10px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ width: "80%" }}
        />
        <button
          onClick={sendMessage}
          style={{ width: "18%", marginLeft: "2%" }}
        >
          Send
        </button>
      </div>
    </main>
  );
}
