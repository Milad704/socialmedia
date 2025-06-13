import React, { useEffect, useState, useRef } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  deleteDoc,
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

  // Unique chat ID
  const chatId =
    currentUser < friend
      ? `${currentUser}_${friend}`
      : `${friend}_${currentUser}`;

  // Real-time listener for messages
  useEffect(() => {
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
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

  // Delete a message (only your own)
  const deleteMessage = async (msgId: string) => {
    const messageDocRef = doc(db, "chats", chatId, "messages", msgId);
    await deleteDoc(messageDocRef);
  };

  return (
    <div className="chat-room">
      <h2>Chat with {friend}</h2>
      <div className="messages">
        {messages.map((msg) => {
          const isMine = msg.sender === currentUser;
          return (
            <div
              key={msg.id}
              className={isMine ? "my-message" : "their-message"}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {isMine && (
                <button
                  className="delete-button"
                  title="Delete message"
                  onClick={() => deleteMessage(msg.id)}
                  style={{ order: 0 }}
                >
                  🗑️
                </button>
              )}
              <div style={{ order: 1 }}>
                <strong>{isMine ? "You" : msg.sender}:</strong> {msg.text}
              </div>
            </div>
          );
        })}
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
