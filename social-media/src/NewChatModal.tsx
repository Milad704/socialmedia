import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

interface ChatScreenProps {
  currentUser: string;
  friendName: string;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: string;
  text: string;
  createdAt: Timestamp;
}

export default function ChatScreen({
  currentUser,
  friendName,
  onClose,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const chatId = [currentUser, friendName].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Message, "id">),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [currentUser, friendName]);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    const chatId = [currentUser, friendName].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), {
      sender: currentUser,
      text: newMessage,
      createdAt: Timestamp.now(),
    });

    setNewMessage("");
  };

  return (
    <div className="chat-screen">
      <h3>Chat with {friendName}</h3>
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender === currentUser ? "my-msg" : "their-msg"}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
      <button onClick={onClose}>Close Chat</button>
    </div>
  );
}
