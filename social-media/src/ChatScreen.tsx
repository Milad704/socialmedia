// ChatScreen.tsx
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

interface ChatScreenProps {
  currentUser: string;
  friend: string;
  onClose: () => void;
}

export default function ChatScreen({
  currentUser,
  friend,
  onClose,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<{ text: string; sender: string }[]>(
    []
  );
  const [newMessage, setNewMessage] = useState("");

  const chatId = [currentUser, friend].sort().join("_");

  useEffect(() => {
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => doc.data()) as any;
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: newMessage,
      sender: currentUser,
      timestamp: new Date(),
    });
    setNewMessage("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Chat with {friend}</h3>
        <div className="chat-box">
          {messages.map((msg, i) => (
            <p key={i}>
              <strong>{msg.sender}:</strong> {msg.text}
            </p>
          ))}
        </div>
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
