import React, { useState, useEffect } from "react";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from "firebase/firestore";
import { db } from "./firebase";

import Login from "./Login";
import Camera from "./Camera";
import Gallery from "./Gallery";
import ChatRoom from "./ChatRoom";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";
import "./App.css";

// Utility: add each user to the other’s friends array
const addFriendToUsers = async (a: string, b: string) => {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", a), { friends: arrayUnion(b) }),
      updateDoc(doc(db, "users", b), { friends: arrayUnion(a) })
    ]);
    console.log("✅ Friends added");
  } catch (err) {
    console.error("❌ Add friend error:", err);
  }
};

type Screen =
  | { name: "login" }
  | { name: "main" }
  | { name: "chat"; id: string }
  | { name: "camera" }
  | { name: "gallery" };

enum Modal {
  None,
  AddFriend,
  PendingRequests,
  NewChat,
  MakeGroup,
  ViewGroups
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "login" });
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [groupChats, setGroupChats] = useState<{ id: string; name: string }[]>([]);
  const [modal, setModal] = useState<Modal>(Modal.None);
  const [profile, setProfile] = useState({ url: null as string | null, name: null as string | null });
  const [groupForm, setGroupForm] = useState({ name: "", members: [] as string[] });

  // login handler
  const handleLogin = (u: string) => {
    setUsername(u);
    setScreen({ name: "main" });
  };

  // real-time profile
  useEffect(() => {
    if (screen.name !== "main") return;
    const ref = doc(db, "users", username, "profile", "image");
    return onSnapshot(ref, snap => {
      const d = snap.data() || {};
      setProfile({ url: d.imageData || null, name: d.imageName || null });
    });
  }, [screen, username]);

  // load friends
  useEffect(() => {
    if (screen.name !== "main") return;
    getDoc(doc(db, "users", username))
      .then(snap => setFriends(snap.data()?.friends || []))
      .catch(() => setFriends([]));
  }, [screen, username]);

  // load group chats
  useEffect(() => {
    if (modal !== Modal.ViewGroups) return;
    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", username)
    );
    getDocs(q)
      .then(snap =>
        setGroupChats(
          snap.docs.map(d => ({ id: d.id, name: d.data().name }))
        )
      )
      .catch(() => setGroupChats([]));
  }, [modal, username]);

  // create group chat
  const createGroupChat = async () => {
    const name = groupForm.name.trim();
    if (!name || !groupForm.members.length) return alert("Enter name and select friends.");
    const id = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const ref = doc(db, "groupChats", id);
    if ((await getDoc(ref)).exists()) return alert("Name taken.");
    await setDoc(ref, { name, members: [username, ...groupForm.members], createdAt: new Date() });
    setScreen({ name: "chat", id });
    setGroupForm({ name: "", members: [] });
    setModal(Modal.None);
  };

  // render login
  if (screen.name === "login") return <Login onLogin={handleLogin} />;
  // render chat
  if (screen.name === "chat")
    return (
      <ChatRoom
        currentUser={username}
        friend={screen.id}
        onBack={() => setScreen({ name: "main" })}
      />
    );
  // render camera
  if (screen.name === "camera")
    return <Camera userId={username} onClose={() => setScreen({ name: "main" })} />;
  // render gallery
  if (screen.name === "gallery")
    return (
      <Gallery
        userId={username}
        onClose={() => setScreen({ name: "main" })}
        setSelectedImageUrl={url => setProfile(p => ({ ...p, url }))}
        setSelectedImageName={name => setProfile(p => ({ ...p, name }))}
      />
    );

  // main UI
  return (
    <main className="main-screen">
      <aside className="sidebar">
        <button onClick={() => setModal(Modal.AddFriend)}>➕ Add Friend</button>
        <button onClick={() => setModal(Modal.PendingRequests)}>📩 Pending</button>
        <button onClick={() => setModal(Modal.NewChat)}>💬 Chats</button>
        <button onClick={() => setModal(Modal.MakeGroup)}>👥 New Group</button>
        <button onClick={() => setModal(Modal.ViewGroups)}>👀 Groups</button>
        <h4>Your Friends</h4>
        <ul>{friends.map(f => (
          <li key={f} onClick={() => setScreen({ name: "chat", id: f })}>
            {f}
          </li>
        ))}</ul>
      </aside>

      <section className="content">
        <div className="actions">
          <button onClick={() => setScreen({ name: "camera" })}>📸 Camera</button>
          <button onClick={() => setScreen({ name: "gallery" })}>🖼️ Gallery</button>
        </div>
        <div className="preview">
          <h4>📷 {profile.name || "No image selected."}</h4>
          {profile.url && (
            <>
              <img src={profile.url} alt="Preview" className="profile-preview" />
              <button onClick={() => deleteDoc(doc(db, "users", username, "profile", "image"))}>
                Remove Pic
              </button>
            </>
          )}
        </div>
      </section>

      {/* Modals */}
      {modal === Modal.AddFriend && <AddFriendModal onClose={() => setModal(Modal.None)} currentUser={username} />}
      {modal === Modal.PendingRequests && (
        <PendingRequestsModal
          onClose={() => setModal(Modal.None)}
          currentUser={username}
          addFriendToUsers={addFriendToUsers}
        />
      )}
      {modal === Modal.NewChat && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Start Chat</h3>
            <ul>{friends.map(f => (
              <li key={f}>
                {f} <button onClick={() => { setScreen({ name: "chat", id: f }); setModal(Modal.None); }}>Chat</button>
              </li>
            ))}</ul>
            <button onClick={() => setModal(Modal.None)}>Close</button>
          </div>
        </div>
      )}
      {modal === Modal.MakeGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Group</h3>
            <input
              placeholder="Group name…"
              value={groupForm.name}
              onChange={e => setGroupForm(g => ({ ...g, name: e.target.value }))}
            />
            <ul>{friends.map(f => (
              <li key={f}>
                <label>
                  <input
                    type="checkbox"
                    checked={groupForm.members.includes(f)}
                    onChange={() => setGroupForm(g => ({
                      ...g,
                      members: g.members.includes(f)
                        ? g.members.filter(x => x !== f)
                        : [...g.members, f]
                    }))}
                  /> {f}
                </label>
              </li>
            ))}</ul>
            <button onClick={createGroupChat}>Create</button>
            <button onClick={() => setModal(Modal.None)}>Cancel</button>
          </div>
        </div>
      )}
      {modal === Modal.ViewGroups && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Groups</h3>
            <ul>{groupChats.map(c => (
              <li key={c.id}>
                {c.name} <button onClick={() => { setScreen({ name: "chat", id: c.id }); setModal(Modal.None); }}>Open</button>
              </li>
            ))}</ul>
            <button onClick={() => setModal(Modal.None)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
