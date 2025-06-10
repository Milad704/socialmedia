import React, { useState, useEffect } from "react";
import Login from "./Login";
import "./App.css";
import Camera from "./Camera";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";

import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

// Helper to add friends mutually in Firestore
async function addFriendToUsers(userA: string, userB: string) {
  try {
    const userADoc = doc(db, "users", userA);
    const userBDoc = doc(db, "users", userB);

    await updateDoc(userADoc, {
      friends: arrayUnion(userB),
    });

    await updateDoc(userBDoc, {
      friends: arrayUnion(userA),
    });

    console.log("✅ Friends added successfully!");
  } catch (error) {
    console.error("❌ Error adding friends:", error);
  }
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(
    null
  );

  // Handle user login
  const handleLogin = (username: string, id: number) => {
    setUsername(username);
    setUserId(id);
    setLoggedIn(true);
  };

  const closeAddFriendModal = () => setShowAddFriend(false);
  const closePendingRequestsModal = () => setShowPendingRequests(false);
  const closeNewChat = () => {
    setShowNewChat(false);
    setSelectedChatFriend(null);
  };

  // Fetch friends list from Firestore whenever username changes
  useEffect(() => {
    if (!username) return;

    const fetchFriends = async () => {
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setFriends(data.friends || []);
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.error("Failed to fetch friends:", err);
        setFriends([]);
      }
    };

    fetchFriends();
  }, [username]);

  // Show login screen if not logged in
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Show camera screen if toggled
  if (showCamera) {
    return <Camera onClose={() => setShowCamera(false)} userId={userId!} />;
  }

  // Show gallery screen if toggled
  if (showGallery) {
    return (
      <main className="main-screen">
        <h2>Gallery (Coming Soon)</h2>
        <button onClick={() => setShowGallery(false)}>Back</button>
      </main>
    );
  }

  // Show chat screen when a friend is selected
  if (selectedChatFriend) {
    return (
      <main className="main-screen">
        <h2>Chat with {selectedChatFriend}</h2>
        {/* Replace this with your actual chat UI */}
        <p>Chat UI coming soon...</p>
        <button onClick={() => setSelectedChatFriend(null)}>Back</button>
      </main>
    );
  }

  // Main app screen
  return (
    <main className="main-screen">
      <div className="strip-container">
        {/* Left strip with buttons */}
        <div className="white_strip">
          <button onClick={() => setShowAddFriend(true)}>➕ Add Friend</button>
          <button
            onClick={() => setShowPendingRequests(true)}
            style={{ marginLeft: "10px" }}
          >
            📩 Pending Requests
          </button>
          <button
            onClick={() => setShowNewChat(true)}
            style={{ marginLeft: "10px" }}
          >
            💬 New Chat
          </button>
        </div>

        {/* Center strip */}
        <div className="center_white_strip">
          <div className="buttons">
            <button onClick={() => setShowCamera(true)}>📸 Open Camera</button>
            <button onClick={() => setShowGallery(true)}>
              🖼️ View Pictures
            </button>
          </div>
        </div>

        {/* You can add a "Chats" headline on the right using CSS */}
      </div>

      {/* Modals */}
      {showAddFriend && (
        <AddFriendModal onClose={closeAddFriendModal} currentUser={username} />
      )}

      {showPendingRequests && (
        <PendingRequestsModal
          onClose={closePendingRequestsModal}
          currentUser={username}
          addFriendToUsers={addFriendToUsers}
        />
      )}

      {showNewChat && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Friends</h3>
            {friends.length === 0 ? (
              <p>You have no friends yet.</p>
            ) : (
              <ul>
                {friends.map((friendName) => (
                  <li key={friendName} style={{ marginBottom: "10px" }}>
                    {friendName}{" "}
                    <button
                      onClick={() => {
                        setSelectedChatFriend(friendName);
                        setShowNewChat(false);
                      }}
                    >
                      Chat ➡️
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowNewChat(false)}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
