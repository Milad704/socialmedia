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
<<<<<<< Updated upstream
  currentUser: string;
=======
  currentUser: string; // username
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  // Load group metadata if group
=======
  // Check if this is a group chat by seeing if current user has group metadata stored under chats/{friend}
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  // Listen for messages under users/{user}/chats/{friend}/messages
  useEffect(() => {
    const msgRef = collection(
      db,
      "users",
      currentUser,
      "chats",
      friend,
      "messages"
    );
    const q = query(msgRef, orderBy("createdAt"));

    const unsub = onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );

    return () => unsub();
  }, [currentUser, friend]);

>>>>>>> Stashed changes
  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) return;

<<<<<<< Updated upstream
    const messagesCollection = isGroup
      ? collection(db, "users", currentUser, "groupChats", friend, "messages")
      : collection(db, "users", currentUser, "chats", friend, "messages");

    try {
      await addDoc(messagesCollection, {
        text,
        sender: currentUser,
        createdAt: new Date(),
      });
=======
    const message = {
      text,
      sender: currentUser,
      createdAt: new Date(),
    };

    try {
      if (isGroup) {
        // Save message under ALL members’ chats/{groupId}/messages
        await Promise.all(
          participants.map((participant) =>
            addDoc(
              collection(db, "users", participant, "chats", friend, "messages"),
              message
            )
          )
        );
      } else {
        // 1-on-1 chat between currentUser and friend
        await Promise.all([
          addDoc(
            collection(db, "users", currentUser, "chats", friend, "messages"),
            message
          ),
          addDoc(
            collection(db, "users", friend, "chats", currentUser, "messages"),
            message
          ),
        ]);
      }

>>>>>>> Stashed changes
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
