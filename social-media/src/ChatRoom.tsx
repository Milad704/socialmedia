// ChatRoom.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface ChatRoomProps {
  currentUser: string;
  friend: string;
  onBack: () => void;
}

export default function ChatRoom({
  currentUser,
  friend,
  onBack,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Create a unique chat ID based on usernames (alphabetically sorted)
  const chatId =
    currentUser < friend
      ? `${currentUser}_${friend}`
      : `${friend}_${currentUser}`;

  // Listen for new messages in Firestore in real time
  useEffect(() => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a new message to Firestore
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    await addDoc(messagesRef, {
      sender: currentUser,
      text: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  return (
    <div className="chat-room">
      <h2>Chat with {friend}</h2>
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.sender === currentUser ? "my-message" : "their-message"
            }
          >
            <strong>{msg.sender === currentUser ? "You" : msg.sender}:</strong>{" "}
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          placeholder="Type your message..."
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
