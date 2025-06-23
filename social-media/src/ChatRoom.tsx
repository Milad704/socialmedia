import React, { useState, useEffect } from "react";
import {
  doc, getDoc, getDocs, onSnapshot,
  collection, query, orderBy, addDoc,
  updateDoc, arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

interface Props {
  currentUser: string;    // logged-in user
  friend: string;         // other user or groupChat ID
  onBack(): void;         // navigate back
}

export default function ChatRoom({ currentUser, friend, onBack }: Props) {
  
  const [msgs, setMsgs] = useState<any[]>([]);      // list of messages
  const [newMsg, setNewMsg] = useState("");         // input text
  const [isGroup, setIsGroup] = useState(false);    // chat type flag
  const [groupInfo, setGroupInfo] = useState<{ name: string; members: string[] }>({
    name: "",
    members: [],
  });

  // detect group vs 1:1 and load participants 
  useEffect(() => {
    (async () => {
      const gDoc = await getDoc(doc(db, "groupChats", friend));
      if (gDoc.exists()) {
        const { name, members } = gDoc.data();
        setIsGroup(true);
        setGroupInfo({ name, members });
      } else {
        setIsGroup(false);
        setGroupInfo({ name: "", members: [currentUser, friend] });
      }
    })();
  }, [currentUser, friend]);

  // ─── helper for message collection path ────────────
  const colFor = (user: string) =>
    collection(
      db,
      "users",
      user,
      isGroup ? "groupChats" : "chats",
      isGroup ? friend : [currentUser, friend].sort().join("_"),
      "messages"
    );

  // ─── load & subscribe to messages ──────────────────
  useEffect(() => {
    const col = colFor(currentUser);
    const q = query(col, orderBy("createdAt"));
    // initial fetch
    getDocs(q).then(s => setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    // realtime updates
    const unsub = onSnapshot(q, s => setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [currentUser, friend, isGroup]);

  // ─── send message to all participants ─────────────
  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) return; 
    const payload = { text, sender: currentUser, createdAt: new Date() };
    try {
      if (isGroup) {
        // push to each member’s subcollection
        await Promise.all(groupInfo.members.map(m => addDoc(colFor(m), payload)));
      } else {
        // 1:1, write to both sides
        await addDoc(colFor(currentUser), payload);
        await addDoc(colFor(friend), payload);
      }
      setNewMsg("");
    } catch (err) {
      console.error("❌ sendMessage error:", err);
    }
  };

  // ─── soft-delete for own messages ──────────────────
  const deleteMessage = async (id: string) => {
    try {
      await updateDoc(
        doc(
          db,
          "users",
          currentUser,
          isGroup ? "groupChats" : "chats",
          isGroup ? friend : [currentUser, friend].sort().join("_"),
          "messages",
          id
        ),
        { text: "This message was deleted.", deleted: true }
      );
    } catch (err) {
      console.error("❌ deleteMessage error:", err);
    }
  };

  // ─── remove self from groupChat → go back ─────────
  const leaveGroup = async () => {
    try {
      await updateDoc(doc(db, "groupChats", friend), {
        members: arrayRemove(currentUser),
      });
      onBack();
    } catch (err) {
      console.error("❌ leaveGroup error:", err);
    }
  };

  // ─── UI rendering ───────────────────────────────────
  return (
    <main className="chat-room">
      <header>
        <button onClick={onBack}>Back</button>
        <h2>{isGroup ? groupInfo.name : friend}</h2>
        {isGroup && (
          <>
            <p>Participants: {groupInfo.members.join(", ")}</p>
            <button onClick={leaveGroup} style={{ marginLeft: "1rem", fontSize: "0.8rem" }}>
              Leave Group
            </button>
          </>
        )}
      </header>

      <section className="messages">
        {msgs.map(m => (
          <div key={m.id} className={m.sender === currentUser ? "my-message" : "their-message"}>
            <strong>{m.sender}</strong>: {m.text}
            {m.sender === currentUser && !m.deleted && (
              <button onClick={() => deleteMessage(m.id)} style={{ fontSize: "0.6rem", marginLeft: "4px" }}>
                🗑️
              </button>
            )}
          </div>
        ))}
      </section>

      <div className="chat-input">
        <input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </main>
  );
}
