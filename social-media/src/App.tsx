// Import React and necessary Firestore functions
import React, { useState, useEffect } from "react";
import {
  doc,            // get a reference to a document
  getDoc,         // fetch a single document
  setDoc,         // create or overwrite a document
  deleteDoc,      // remove a document
  updateDoc,      // update specific fields in a document
  arrayUnion,     // Firestore helper to add to array fields
  collection,     // get a reference to a collection
  query,          // construct Firestore queries
  where,          // query filter clauses
  getDocs,        // fetch multiple documents
  onSnapshot      // real-time listener
} from "firebase/firestore";
import { db } from "./firebase"; // initialized Firestore instance

// Import child components for different app screens
import Login from "./Login";
import Camera from "./Camera";
import Gallery from "./Gallery";
import ChatRoom from "./ChatRoom";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";
import "./App.css"; // global styles

// Helper: add two users to each other's friends arrays in Firestore
const addFriendToUsers = async (a: string, b: string) => {
  try {
    // Run both updates in parallel
    await Promise.all([
      updateDoc(doc(db, "users", a), { friends: arrayUnion(b) }),
      updateDoc(doc(db, "users", b), { friends: arrayUnion(a) }),
    ]);
    console.log("✅ Friends added");
  } catch (err) {
    console.error("❌ Add friend error:", err);
  }
};

// Main application component
export default function App() {
  // --- Local state hooks ---
  const [loggedIn, setLoggedIn] = useState(false);                         // login status
  const [username, setUsername] = useState("");                          // current user ID
  const [friends, setFriends] = useState<string[]>([]);                    // list of user’s friends
  const [groupChatsList, setGroupChatsList] = useState<{ id: string; name: string }[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null); // which chat/group is open

  // Booleans to toggle different modals/screens
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMakeGroup, setShowMakeGroup] = useState(false);
  const [showViewGroups, setShowViewGroups] = useState(false);

  // Group-creation form state
  const [groupSelection, setGroupSelection] = useState<string[]>([]); // which friends are checked
  const [newGroupName, setNewGroupName] = useState("");                // group name input

  // Profile picture state
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [imgName, setImgName] = useState<string | null>(null);

  // --- Event handlers ---
  // Called by Login component when user logs in successfully
  const handleLogin = (u: string) => {
    setUsername(u);
    setLoggedIn(true);
  };

  // --- Real-time listener: fetch profile pic when username changes ---
  useEffect(() => {
    if (!username) return;
    const ref = doc(db, "users", username, "profile", "image");
    // Subscribe to changes in the image document
    return onSnapshot(
      ref,
      snap => {
        const data = snap.data() || {};
        setImgUrl(data.imageData || null);
        setImgName(data.imageName || null);
      },
      err => console.error(err)
    );
  }, [username]);

  // --- Fetch friends list once after login ---
  useEffect(() => {
    if (!username) return;
    getDoc(doc(db, "users", username))
      .then(snap => setFriends(snap.data()?.friends || []))
      .catch(() => setFriends([]));
  }, [username]);

  // --- Load group chats when viewing groups modal opens ---
  useEffect(() => {
    if (!showViewGroups || !username) return;
    const q = query(
      collection(db, "groupChats"),
      where("members", "array-contains", username)
    );
    getDocs(q)
      .then(snap =>
        setGroupChatsList(
          snap.docs.map(d => ({ id: d.id, name: d.data().name }))
        )
      )
      .catch(() => setGroupChatsList([]));
  }, [showViewGroups, username]);

  // Toggle a friend’s inclusion when building a new group
  const toggleGroupFriend = (friendId: string) =>
    setGroupSelection(prev =>
      prev.includes(friendId)
        ? prev.filter(x => x !== friendId)
        : [...prev, friendId]
    );

  // Create a new group chat document in Firestore
  const createGroupChat = async () => {
    const name = newGroupName.trim();
    if (!name) return alert("Enter a name.");
    if (!groupSelection.length) return alert("Select friends.");

    // generate a Firestore-safe ID from the name
    const id = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const ref = doc(db, "groupChats", id);

    if ((await getDoc(ref)).exists()) {
      return alert("Name taken.");
    }

    try {
      await setDoc(ref, {
        name,
        members: [username, ...groupSelection],
        createdAt: new Date(),
      });
      setSelectedFriend(id); // open new group chat
    } catch {
      alert("Failed to create.");
    }

    // reset form & close modal
    setNewGroupName("");
    setGroupSelection([]);
    setShowMakeGroup(false);
  };

  // --- Conditional rendering: different screens ---
  if (!loggedIn)               return <Login onLogin={handleLogin} />;
  if (selectedFriend)          return <ChatRoom currentUser={username} friend={selectedFriend} onBack={() => setSelectedFriend(null)} />;
  if (showCamera)              return <Camera userId={username} onClose={() => setShowCamera(false)} />;
  if (showGallery) return (
    <Gallery
      userId={username}
      onClose={() => setShowGallery(false)}
      setSelectedImageUrl={setImgUrl}
      setSelectedImageName={setImgName}
    />
  );

  // --- Main UI layout ---
  return (
    <main className="main-screen">
      <div className="strip-container">
        {/* Sidebar with friend & modal controls */}
        <div className="white_strip">
          <div className="sidebar-button-grid">
            <button onClick={() => setShowAddFriend(true)}>➕ Add new friends</button>
            <button onClick={() => setShowPending(true)}>📩 Pending requests</button>
            <button onClick={() => setShowNewChat(true)}>💬 view Chats</button>
            <button onClick={() => setShowMakeGroup(true)}>👥 create Groupchat</button>
            <button onClick={() => setShowViewGroups(true)}>👀 View groupchats</button>
          </div>

          {/* Render friend list */}
          <div className="friend-list-container">
            <h4>Your Friends</h4>
            {friends.length ? (
              <ul className="friend-list">
                {friends.map(f => (
                  <li key={f} className="friend-item" onClick={() => setSelectedFriend(f)}>
                    <div className="friend-avatar">{f.slice(0,2).toUpperCase()}</div>
                    <div className="friend-name">{f}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No friends yet.</p>
            )}
          </div>
        </div>

        {/* Center area: camera/gallery and profile preview */}
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
                {/* Remove profile picture */}
                <button onClick={async () => {
                  try {
                    await deleteDoc(doc(db, "users", username, "profile", "image"));
                  } catch (e) {
                    console.error(e);
                  }
                }}>
                  Remove Pic
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* --- Modals/Overlays --- */}
      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} currentUser={username} />}
      {showPending && <PendingRequestsModal onClose={() => setShowPending(false)} currentUser={username} addFriendToUsers={addFriendToUsers} />}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="modal-overlay new-chat-modal">
          <div className="modal-content">
            <h3>Your Friends</h3>
            {friends.length ? (
              <ul className="new-chat-list">
                {friends.map(f => (
                  <li key={f}>
                    <span>{f}</span>
                    <button onClick={() => { setSelectedFriend(f); setShowNewChat(false); }}>
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

      {/* Create Group Modal */}
      {showMakeGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Groupchat</h3>
            <input
              className="group-name-input"
              placeholder="Group name…"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
            />
            {friends.length ? (
              <ul className="group-friend-list">
                {friends.map(f => (
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
            <button onClick={() => { setShowMakeGroup(false); setGroupSelection([]); setNewGroupName(""); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* View Groups Modal */}
      {showViewGroups && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Groups</h3>
            {groupChatsList.length ? (
              <ul className="new-chat-list">
                {groupChatsList.map(chat => (
                  <li key={chat.id}>
                    <span>{chat.name}</span>
                    <button onClick={() => { setSelectedFriend(chat.id); setShowViewGroups(false); }}>Open</button>
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
