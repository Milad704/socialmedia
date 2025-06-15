// ChatRoom.tsx
import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";

interface ChatRoomProps {
  currentUser: string;
  friend: string;          // username or groupChat ID
  onBack: () => void;
}

export default function ChatRoom({
  currentUser,
  friend,
  onBack,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  // Group metadata
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  // Load group name & members if this is a group chat
  useEffect(() => {
    (async () => {
      const groupRef = doc(db, "groupChats", friend);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        setIsGroup(true);
        const data = groupSnap.data();
        setGroupName(data.name);
        setParticipants(data.members || []);
      } else {
        setIsGroup(false);
      }
    })();
  }, [friend]);

  // Subscribe to messages in the proper collection
  useEffect(() => {
    const path = isGroup
      ? collection(db, "groupChats", friend, "messages")
      : collection(db, "chats", friend, "messages");

    const q = query(path, orderBy("createdAt"));
    const unsub = onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return unsub;
  }, [friend, isGroup]);

  // **Send message** handler (restored)
  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) return;

    const path = isGroup
      ? collection(db, "groupChats", friend, "messages")
      : collection(db, "chats", friend, "messages");

    try {
      await addDoc(path, {
        text,
        sender: currentUser,
        createdAt: new Date(),
      });
      setNewMsg("");
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  return (
    <main className="chat-room">
      <header>
        <button onClick={onBack}>◀️ Back</button>
        <h2>{isGroup ? groupName : friend}</h2>
        {isGroup && participants.length > 0 && (
          <p className="chat-participants">
            Participants: {participants.join(", ")}
          </p>
        )}
      </header>

      <section className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender === currentUser ? "my-message" : "their-message"}
          >
            <strong>{msg.sender}</strong>
            <span>{msg.text}</span>
          </div>
        ))}
      </section>

      <div className="chat-input">
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </main>
  );
}
