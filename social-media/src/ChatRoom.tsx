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
  friend: string; // username or groupChat ID
  onBack: () => void;
}

export default function ChatRoom({
  currentUser,
  friend,
  onBack,
}: ChatRoomProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");

  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);

  // Load group metadata if group
  useEffect(() => {
    const checkGroup = async () => {
      const chatMetaRef = doc(db, "users", currentUser, "chats", friend);
      const snap = await getDoc(chatMetaRef);
      const data = snap.data();
      if (snap.exists() && data?.isGroup) {
        setIsGroup(true);
        setGroupName(data.name || "Unnamed Group");
        setParticipants(data.members || []);
      } else {
        setIsGroup(false);
        setGroupName("");
        setParticipants([]);
      }
    };
    checkGroup();
  }, [currentUser, friend]);

  // Subscribe to messages under currentUser's doc
  useEffect(() => {
    if (!currentUser) return;

    // Build collection path based on isGroup
    const messagesCollection = isGroup
      ? collection(db, "users", currentUser, "groupChats", friend, "messages")
      : collection(db, "users", currentUser, "chats", friend, "messages");

    const q = query(messagesCollection, orderBy("createdAt"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [currentUser, friend, isGroup]);

  // Send message saved under currentUser's doc
  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) return;

    const messagesCollection = isGroup
      ? collection(db, "users", currentUser, "groupChats", friend, "messages")
      : collection(db, "users", currentUser, "chats", friend, "messages");

    try {
      await addDoc(messagesCollection, {
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
            className={
              msg.sender === currentUser ? "my-message" : "their-message"
            }
          >
            <strong>{msg.sender}</strong>: <span>{msg.text}</span>
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
