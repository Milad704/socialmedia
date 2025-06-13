import React, { useState, useEffect } from "react";
import Login from "./Login";
import "./App.css";
import Camera from "./Camera";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";
import ChatRoom from "./ChatRoom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

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
  const [showMakeGroupChat, setShowMakeGroupChat] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(
    null
  );

  const [selectedGroupFriends, setSelectedGroupFriends] = useState<string[]>(
    []
  );

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

  const toggleGroupFriend = (friend: string) => {
    if (selectedGroupFriends.includes(friend)) {
      setSelectedGroupFriends(selectedGroupFriends.filter((f) => f !== friend));
    } else {
      setSelectedGroupFriends([...selectedGroupFriends, friend]);
    }
  };

  const createGroupChat = () => {
    if (selectedGroupFriends.length === 0) {
      alert("Please select at least one friend for group chat.");
      return;
    }

    // Include current user
    const members = [username, ...selectedGroupFriends].sort();

    // Example group chat ID based on sorted usernames and suffix "_group"
    const chatId = members.join("_") + "_group";

    // TODO: You can add Firestore logic here to create group chat document

    // For now, open chat room using chatId as friend name (handle groups in ChatRoom component)
    setSelectedChatFriend(chatId);
    setShowMakeGroupChat(false);
    setSelectedGroupFriends([]);
  };

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

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (showCamera) {
    return <Camera onClose={() => setShowCamera(false)} userId={userId!} />;
  }

  if (showGallery) {
    return (
      <main className="main-screen">
        <h2>Gallery (Coming Soon)</h2>
        <button onClick={() => setShowGallery(false)}>Back</button>
      </main>
    );
  }

  if (selectedChatFriend) {
    return (
      <ChatRoom
        currentUser={username}
        friend={selectedChatFriend}
        onBack={() => setSelectedChatFriend(null)}
      />
    );
  }

  return (
    <main className="main-screen">
      <div className="strip-container">
        {/* Left Strip */}
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
            style={{
              marginLeft: "10px",
              display: "block",
              marginBottom: "8px",
            }}
          >
            💬 New Chat
          </button>

          <button
            onClick={() => setShowMakeGroupChat(true)}
            style={{ marginLeft: "10px", display: "block" }}
          >
            👥 Make Groupchat
          </button>

          {/* Scrollable Friends List */}
          <div
            style={{
              marginTop: "20px",
              overflowY: "auto",
              maxHeight: "600px",
              width: "100%",
              padding: "0 10px",
            }}
          >
            <h4 style={{ marginBottom: "10px", textAlign: "center" }}>
              Your Friends
            </h4>
            {friends.length === 0 ? (
              <p style={{ textAlign: "center" }}>No friends yet.</p>
            ) : (
              <ul className="friend-list">
                {friends.map((friend) => (
                  <li
                    key={friend}
                    className="friend-item"
                    onClick={() => setSelectedChatFriend(friend)}
                  >
                    <div className="friend-avatar">
                      {friend.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="friend-name">{friend}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Center Strip */}
        <div className="center_white_strip">
          <div className="buttons">
            <button onClick={() => setShowCamera(true)}>📸 Open Camera</button>
            <button onClick={() => setShowGallery(true)}>
              🖼️ View Pictures
            </button>
          </div>
        </div>
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

      {showMakeGroupChat && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Select Friends for Group Chat</h3>
            {friends.length === 0 ? (
              <p>You have no friends yet.</p>
            ) : (
              <ul style={{ maxHeight: "300px", overflowY: "auto" }}>
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
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
