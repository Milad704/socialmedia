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
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";

import Login from "./Login";
import Camera from "./Camera";
import Gallery from "./Gallery";
import ChatRoom from "./ChatRoom";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";
import "./App.css";

// Add each to the other’s friends list
const addFriendToUsers = async (a: string, b: string) => {
  try {
    await Promise.all([
      updateDoc(doc(db, "users", a), { friends: arrayUnion(b) }),
      updateDoc(doc(db, "users", b), { friends: arrayUnion(a) }),
    ]);
    console.log("✅ Friends added");
  } catch (err) {
    console.error("❌ Add friend error:", err);
  }
};

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [groupChatsList, setGroupChatsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMakeGroup, setShowMakeGroup] = useState(false);
  const [showViewGroups, setShowViewGroups] = useState(false);
  const [groupSelection, setGroupSelection] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgName, setImgName] = useState<string | null>(null);

  // login callback to tell user is logged in
  const handleLogin = (u: string) => {
    setUsername(u);
    setLoggedIn(true);
  };

  //  realtime profile pic
  useEffect(() => {
    if (!username) return;
    const ref = doc(db, "users", username, "profile", "image");
    return onSnapshot(
      ref,
      (snap) => {
        const d = snap.data() || {};
        setImgUrl(d.imageData || null);
        setImgName(d.imageName || null);
      },
      (err) => console.error(err)
    );
  }, [username]);

  // load group chats when modal opens
  useEffect(() => {
    if (!showViewGroups || !username) return;
    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", username)
    );
    getDocs(q)
      .then((snap) =>
        setGroupChatsList(
          snap.docs.map((d) => ({ id: d.id, name: d.data().name }))
        )
      )
      .catch(() => setGroupChatsList([])); //store it here
  }, [showViewGroups, username]);

  //  toggle friend in group selection when clicked on
  const toggleGroupFriend = (f: string) =>
    setGroupSelection((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  // create new group chat
  const createGroupChat = async () => {
    const name = newGroupName.trim();
    if (!name) return alert("Enter a name.");
    if (!groupSelection.length) return alert("Select friends.");
    const id = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const ref = doc(db, "groupChats", id);
    if ((await getDoc(ref)).exists()) return alert("Name taken.");
    try {
      await setDoc(ref, {
        name,
        members: [username, ...groupSelection],
        createdAt: new Date(),
      });
      setSelectedFriend(id);
    } catch {
      alert("Failed to create.");
    }
    setNewGroupName("");
    setGroupSelection([]);
    setShowMakeGroup(false);
  };

  //  screens that get open by clicking on them
  if (!loggedIn) return <Login onLogin={handleLogin} />;
  if (selectedFriend)
    return (
      <ChatRoom
        currentUser={username}
        friend={selectedFriend}
        onBack={() => setSelectedFriend(null)}
      />
    ); //renders 1-1 chatroom
  if (showCamera)
    return <Camera onClose={() => setShowCamera(false)} userId={username} />;
  if (showGallery)
    return (
      <Gallery
        userId={username}
        onClose={() => setShowGallery(false)}
        setSelectedImageUrl={setImgUrl}
        setSelectedImageName={setImgName}
      />
    );

  // — main UI ————————————————————————————————————————
  return (
    <main className="main-screen">
      <div className="strip-container">
        {/* sidebar */}
        <div className="white_strip">
          <div className="sidebar-button-grid">
            <button onClick={() => setShowAddFriend(true)}>
              ➕ Add new friends
            </button>
            <button onClick={() => setShowPending(true)}>
              📩 Pending requests
            </button>
            <button onClick={() => setShowNewChat(true)}>💬 view Chats</button>
            <button onClick={() => setShowMakeGroup(true)}>
              👥 create Groupchat
            </button>
            <button onClick={() => setShowViewGroups(true)}>
              👀 View groupchats
            </button>
          </div>
          <div className="friend-list-container">
            <h4>Your Friends</h4>
            {friends.length ? (
              <ul className="friend-list">
                {friends.map((f) => (
                  <li
                    key={f}
                    className="friend-item"
                    onClick={() => setSelectedFriend(f)}
                  >
                    <div className="friend-avatar">
                      {f.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="friend-name">{f}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No friends yet.</p>
            )}
          </div>
        </div>

        {/* center */}
        <div className="center_white_strip">
          <div className="buttons">
            <button onClick={() => setShowCamera(true)}>📸 Camera</button>
            <button onClick={() => setShowGallery(true)}>🖼️ Gallery</button>
          </div>
          <div style={{ marginTop: 30, textAlign: "center" }}>
            <h4>📷 {imgName || "No image selected."}</h4>
            {imgUrl && (
              <>
                <h4 style={{ marginTop: 20 }}>🖼️ Preview</h4>
                <img src={imgUrl} alt="Selected" className="profile-preview" />
                <button
                  onClick={async () => {
                    try {
                      await deleteDoc(
                        doc(db, "users", username, "profile", "image")
                      );
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Remove Pic
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* modals */}
      {showAddFriend && (
        <AddFriendModal
          onClose={() => setShowAddFriend(false)}
          currentUser={username}
        />
      )}
      {showPending && (
        <PendingRequestsModal
          onClose={() => setShowPending(false)}
          currentUser={username}
          addFriendToUsers={addFriendToUsers}
        />
      )}
      {showNewChat && (
        <div className="modal-overlay new-chat-modal">
          <div className="modal-content">
            <h3>Your Friends</h3>
            {friends.length ? (
              <ul className="new-chat-list">
                {friends.map((f) => (
                  <li key={f}>
                    <span>{f}</span>
                    <button
                      onClick={() => {
                        setSelectedFriend(f);
                        setShowNewChat(false);
                      }}
                    >
                      Chat ➡️
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>You have no friends yet.</p>
            )}
            <button onClick={() => setShowNewChat(false)}>Close</button>
          </div>
        </div>
      )}
      {showMakeGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Groupchat</h3>
            <input
              className="group-name-input"
              placeholder="Group name…"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            {friends.length ? (
              <ul className="group-friend-list">
                {friends.map((f) => (
                  <li key={f}>
                    <label>
                      <input
                        type="checkbox"
                        checked={groupSelection.includes(f)}
                        onChange={() => toggleGroupFriend(f)}
                      />
                      {f}
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No friends yet.</p>
            )}
            <button onClick={createGroupChat}>Create</button>
            <button
              onClick={() => {
                setShowMakeGroup(false);
                setGroupSelection([]);
                setNewGroupName("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showViewGroups && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Groups</h3>
            {groupChatsList.length ? (
              <ul className="new-chat-list">
                {groupChatsList.map((chat) => (
                  <li key={chat.id}>
                    <span>{chat.name}</span>
                    <button
                      onClick={() => {
                        setSelectedFriend(chat.id);
                        setShowViewGroups(false);
                      }}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No group chats yet.</p>
            )}
            <button onClick={() => setShowViewGroups(false)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
