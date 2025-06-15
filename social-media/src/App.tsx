// App.tsx
import React, { useState, useEffect } from "react";
import Login from "./Login";
import "./App.css";
import Camera from "./Camera";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";
import ChatRoom from "./ChatRoom";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

async function addFriendToUsers(userA: string, userB: string) {
  try {
    const userADoc = doc(db, "users", userA);
    const userBDoc = doc(db, "users", userB);
    await updateDoc(userADoc, { friends: arrayUnion(userB) });
    await updateDoc(userBDoc, { friends: arrayUnion(userA) });
    console.log("✅ Friends added successfully!");
  } catch (error) {
    console.error("❌ Error adding friends:", error);
  }
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState(""); // will be used as string userId
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMakeGroupChat, setShowMakeGroupChat] = useState(false);
  const [showViewGroupChats, setShowViewGroupChats] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [groupChatsList, setGroupChatsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(null);
  const [selectedGroupFriends, setSelectedGroupFriends] = useState<string[]>([]);
  const [newGroupName, setNewGroupName] = useState("");

  const handleLogin = (username: string, _id: number) => {
    setUsername(username);
    setLoggedIn(true);
  };

  const closeAddFriendModal = () => setShowAddFriend(false);
  const closePendingRequestsModal = () => setShowPendingRequests(false);
  const closeNewChat = () => {
    setShowNewChat(false);
    setSelectedChatFriend(null);
  };

  const toggleGroupFriend = (friend: string) => {
    setSelectedGroupFriends((prev) =>
      prev.includes(friend) ? prev.filter((f) => f !== friend) : [...prev, friend]
    );
  };

  const createGroupChat = async () => {
    const rawName = newGroupName.trim();
    if (!rawName) return alert("Please enter a group chat name.");
    if (!selectedGroupFriends.length) return alert("Please select at least one friend.");

    const safeId = rawName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const members = [username, ...selectedGroupFriends];

    try {
      const ref = doc(db, "groupChats", safeId);
      const existing = await getDoc(ref);
      if (existing.exists()) {
        alert("That group name is already taken.");
        return;
      }
      await setDoc(ref, { name: rawName, members, createdAt: new Date() });
      setSelectedChatFriend(safeId);
    } catch (err) {
      console.error("❌ Failed to create group chat:", err);
      alert("Could not create group chat.");
    }

    setNewGroupName("");
    setSelectedGroupFriends([]);
    setShowMakeGroupChat(false);
  };

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", username));
        setFriends(docSnap.exists() ? docSnap.data().friends || [] : []);
      } catch {
        setFriends([]);
      }
    })();
  }, [username]);

  useEffect(() => {
    if (!showViewGroupChats) return;
    (async () => {
      try {
        const q = query(collection(db, "groupChats"), where("members", "array-contains", username));
        const snap = await getDocs(q);
        setGroupChatsList(snap.docs.map((d) => ({ id: d.id, name: d.data().name })));
      } catch {
        setGroupChatsList([]);
      }
    })();
  }, [showViewGroupChats, username]);

  if (!loggedIn) return <Login onLogin={handleLogin} />;
  if (showCamera) return <Camera onClose={() => setShowCamera(false)} userId={username} />;
  if (showGallery)
    return (
      <main className="main-screen">
        <h2>Gallery (Coming Soon)</h2>
        <button onClick={() => setShowGallery(false)}>Back</button>
      </main>
    );
  if (selectedChatFriend)
    return (
      <ChatRoom
        currentUser={username}
        friend={selectedChatFriend}
        onBack={() => setSelectedChatFriend(null)}
      />
    );

  return (
    <main className="main-screen">
      <div className="strip-container">
        <div className="white_strip">
          <div className="sidebar-button-grid">
            <button onClick={() => setShowAddFriend(true)}>➕ Add Friend</button>
            <button onClick={() => setShowPendingRequests(true)}>📩 Pending Requests</button>
            <button onClick={() => setShowNewChat(true)}>💬 New Chat</button>
            <button onClick={() => setShowMakeGroupChat(true)}>👥 Make Groupchat</button>
            <button onClick={() => setShowViewGroupChats(true)}>👀 View Group Chats</button>
          </div>
          <div className="friend-list-container">
            <h4>Your Friends</h4>
            {friends.length === 0 ? (
              <p>No friends yet.</p>
            ) : (
              <ul className="friend-list">
                {friends.map((f) => (
                  <li key={f} className="friend-item" onClick={() => setSelectedChatFriend(f)}>
                    <div className="friend-avatar">{f.slice(0, 2).toUpperCase()}</div>
                    <div className="friend-name">{f}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="center_white_strip">
          <div className="buttons">
            <button onClick={() => setShowCamera(true)}>📸 Open Camera</button>
            <button onClick={() => setShowGallery(true)}>🖼️ View Pictures</button>
          </div>
        </div>
      </div>

      {showAddFriend && <AddFriendModal onClose={closeAddFriendModal} currentUser={username} />}
      {showPendingRequests && (
        <PendingRequestsModal
          onClose={closePendingRequestsModal}
          currentUser={username}
          addFriendToUsers={addFriendToUsers}
        />
      )}
      {showNewChat && (
        <div className="modal-overlay new-chat-modal">
          <div className="modal-content">
            <h3>Your Friends</h3>
            {friends.length === 0 ? (
              <p>You have no friends yet.</p>
            ) : (
              <ul className="new-chat-list">
                {friends.map((f) => (
                  <li key={f}>
                    <span>{f}</span>
                    <button
                      onClick={() => {
                        setSelectedChatFriend(f);
                        setShowNewChat(false);
                      }}
                    >
                      Chat ➡️
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={closeNewChat}>Close</button>
          </div>
        </div>
      )}
      {showMakeGroupChat && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create a New Group Chat</h3>
            <input
              type="text"
              className="group-name-input"
              placeholder="Enter group name…"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            {friends.length === 0 ? (
              <p>You have no friends yet.</p>
            ) : (
              <ul className="group-friend-list">
                {friends.map((friend) => (
                  <li key={friend}>
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedGroupFriends.includes(friend)}
                        onChange={() => toggleGroupFriend(friend)}
                      />{" "}
                      {friend}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={createGroupChat}>Create Group Chat</button>
            <button
              onClick={() => {
                setShowMakeGroupChat(false);
                setSelectedGroupFriends([]);
                setNewGroupName("");
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {showViewGroupChats && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Group Chats</h3>
            {groupChatsList.length === 0 ? (
              <p>You’re not in any group chats yet.</p>
            ) : (
              <ul className="new-chat-list">
                {groupChatsList.map((chat) => (
                  <li key={chat.id} className="modal-list-item">
                    <span>{chat.name}</span>
                    <button
                      onClick={() => {
                        setSelectedChatFriend(chat.id);
                        setShowViewGroupChats(false);
                      }}
                    >
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowViewGroupChats(false)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
