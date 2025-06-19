import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  collection,
  query,
  orderBy,
  addDoc,
  updateDoc,
  arrayRemove,
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

  // Determine chat type and participants
  useEffect(() => {
    (async () => {
      const groupRef = doc(db, "groupChats", friend);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const data = groupSnap.data();
        setIsGroup(true);
        setGroupName(data.name);
        setParticipants(data.members);
      } else {
        setIsGroup(false);
        setParticipants([currentUser, friend]);
      }
    })();
  }, [currentUser, friend]);

  // Compute chatId
  const chatId = isGroup ? friend : [currentUser, friend].sort().join("_");

  // Per-user message collection
  const userMessagesCol = (user: string) =>
    collection(
      db,
      "users",
      user,
      isGroup ? "groupChats" : "chats",
      chatId,
      "messages"
    );

  // Load existing messages and subscribe
  useEffect(() => {
    const col = userMessagesCol(currentUser);
    const q = query(col, orderBy("createdAt"));
    getDocs(q)
      .then((snap) =>
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      )
      .catch(console.error);
    const unsub = onSnapshot(q, (snap) =>
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [currentUser, friend, isGroup]);

  // Leave group chat
  const leaveGroup = async () => {
    try {
      await updateDoc(doc(db, "groupChats", chatId), {
        members: arrayRemove(currentUser),
      });
      onBack();
    } catch (err) {
      console.error("❌ Error leaving group:", err);
    }
  };

  // Send new message
  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) return;
    const payload = { text, sender: currentUser, createdAt: new Date() };
    try {
      if (isGroup) {
        await Promise.all(
          participants.map((mem) => addDoc(userMessagesCol(mem), payload))
        );
      } else {
        await addDoc(userMessagesCol(currentUser), payload);
        await addDoc(userMessagesCol(friend), payload);
      }
      setNewMsg("");
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message only from current user's view
  const deleteMessage = async (id: string) => {
    try {
      const msgRef = doc(
        db,
        "users",
        currentUser,
        isGroup ? "groupChats" : "chats",
        chatId,
        "messages",
        id
      );
      await updateDoc(msgRef, {
        text: "This message was deleted.",
        deleted: true,
      });
    } catch (err) {
      console.error("❌ Error deleting message:", err);
    }
  };

  return (
    <main className="chat-room">
      <header>
        <button onClick={onBack}>Back</button>
        <h2>{isGroup ? groupName : friend}</h2>
        {isGroup && (
          <>
            <p>Participants: {participants.join(", ")}</p>
            <button
              onClick={leaveGroup}
              style={{ marginLeft: "1rem", fontSize: "0.8rem" }}
            >
              Leave Group
            </button>
          </>
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
            <>
              <strong>{msg.sender}</strong>: {msg.text}
              {!msg.deleted && msg.sender === currentUser && (
                <button
                  onClick={() => deleteMessage(msg.id)}
                  style={{ fontSize: "0.6rem", marginLeft: "4px" }}
                >
                  🗑️
                </button>
              )}
            </>
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
