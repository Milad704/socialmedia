import React, { useState, useEffect } from "react";
import Login from "./Login";
import "./App.css";
import Camera from "./Camera";
import AddFriendModal from "./AddFriendModal";
import PendingRequestsModal from "./PendingRequestsModal";
import ChatRoom from "./ChatRoom";
import GroupChatRoom from "./GroupChatRoom";
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
  const [userId, setUserId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showMakeGroupChat, setShowMakeGroupChat] = useState(false);
  const [showViewGroupChats, setShowViewGroupChats] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
<<<<<<< Updated upstream
  const [groupChatsList, setGroupChatsList] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(
    null
  );
  const [selectedGroupFriends, setSelectedGroupFriends] = useState<string[]>(
    []
  );
  const [newGroupName, setNewGroupName] = useState("");
=======
  const [groupChats, setGroupChats] = useState<string[]>([]);
  const [selectedChatFriend, setSelectedChatFriend] = useState<string | null>(
    null
  );
  const [selectedGroupChat, setSelectedGroupChat] = useState<string | null>(
    null
  );
  const [selectedGroupFriends, setSelectedGroupFriends] = useState<string[]>(
    []
  );
>>>>>>> Stashed changes

  const handleLogin = (username: string, id: string) => {
    setUsername(username);
    setUserId(id);
    setLoggedIn(true);
  };

  // Close modals
  const closeAddFriendModal = () => setShowAddFriend(false);
  const closePendingRequestsModal = () => setShowPendingRequests(false);
  const closeNewChat = () => {
    setShowNewChat(false);
    setSelectedChatFriend(null);
  };
  const closeGroupChat = () => {
    setSelectedGroupChat(null);
  };
  const closeGroupChatModal = () => {
    setShowViewGroupChats(false);
  };

  // Toggle friend selection for group chat
  const toggleGroupFriend = (friend: string) => {
<<<<<<< Updated upstream
    setSelectedGroupFriends((prev) =>
      prev.includes(friend)
        ? prev.filter((f) => f !== friend)
        : [...prev, friend]
    );
  };

  const createGroupChat = async () => {
    const rawName = newGroupName.trim();
    if (!rawName) return alert("Please enter a group chat name.");
    if (!selectedGroupFriends.length)
      return alert("Please select at least one friend.");

    const safeId = rawName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
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
=======
    if (selectedGroupFriends.includes(friend)) {
      setSelectedGroupFriends(selectedGroupFriends.filter((f) => f !== friend));
    } else {
      setSelectedGroupFriends([...selectedGroupFriends, friend]);
>>>>>>> Stashed changes
    }
  };

  // Create group chat handler
  const createGroupChat = () => {
    if (selectedGroupFriends.length === 0) {
      alert("Please select at least one friend for group chat.");
      return;
    }
    const members = [username, ...selectedGroupFriends].sort();
    const chatId = members.join("_") + "_group";

    // TODO: Add Firestore logic to create group chat document

    setSelectedGroupChat(chatId);
    setShowMakeGroupChat(false);
    setSelectedGroupFriends([]);
  };

  // Fetch friends and group chats on username change
  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", username);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setFriends(data.friends || []);
          setGroupChats(data.groupChats || []);
        } else {
          setFriends([]);
          setGroupChats([]);
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setFriends([]);
        setGroupChats([]);
      }
    };

    fetchUserData();
  }, [username]);

<<<<<<< Updated upstream
  useEffect(() => {
    if (!showViewGroupChats) return;
    (async () => {
      try {
        const q = query(
          collection(db, "groupChats"),
          where("members", "array-contains", username)
        );
        const snap = await getDocs(q);
        setGroupChatsList(
          snap.docs.map((d) => ({ id: d.id, name: d.data().name }))
        );
      } catch {
        setGroupChatsList([]);
      }
    })();
  }, [showViewGroupChats, username]);

  if (!loggedIn) return <Login onLogin={handleLogin} />;
  if (showCamera)
    return <Camera onClose={() => setShowCamera(false)} userId={username} />;
  if (showGallery)
=======
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (showCamera) {
    return <Camera onClose={() => setShowCamera(false)} userId={userId!} />;
  }

  if (showGallery) {
>>>>>>> Stashed changes
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

  if (selectedGroupChat) {
    return (
      <GroupChatRoom
        currentUser={username}
        groupChatId={selectedGroupChat}
        onBack={closeGroupChat}
      />
    );
  }

  return (
    <main className="main-screen">
      <div className="strip-container">
        {/* Left Strip */}
        <div className="white_strip">
<<<<<<< Updated upstream
          <div className="sidebar-button-grid">
            <button onClick={() => setShowAddFriend(true)}>
              ➕ Add Friend
            </button>
            <button onClick={() => setShowPendingRequests(true)}>
              📩 Pending Requests
            </button>
            <button onClick={() => setShowNewChat(true)}>💬 New Chat</button>
            <button onClick={() => setShowMakeGroupChat(true)}>
              👥 Make Groupchat
            </button>
            <button onClick={() => setShowViewGroupChats(true)}>
              👀 View Group Chats
            </button>
          </div>
          <div className="friend-list-container">
            <h4>Your Friends</h4>
=======
          <button onClick={() => setShowAddFriend(true)}>➕ Add Friend</button>
          <button
            onClick={() => setShowPendingRequests(true)}
            style={{ marginLeft: 10 }}
          >
            📩 Pending Requests
          </button>
          <button
            onClick={() => setShowNewChat(true)}
            style={{ marginLeft: 10, display: "block", marginBottom: 8 }}
          >
            💬 New Chat
          </button>
          <button
            onClick={() => setShowMakeGroupChat(true)}
            style={{ marginLeft: 10, display: "block" }}
          >
            👥 Make Groupchat
          </button>

          {/* REMADE View Group Chats Button */}
          <button
            onClick={() => setShowViewGroupChats(true)}
            style={{ marginLeft: 10, display: "block" }}
          >
            📂 View Group Chats
          </button>

          {/* Friends List */}
          <div
            style={{
              marginTop: 20,
              overflowY: "auto",
              maxHeight: 600,
              width: "100%",
              padding: "0 10px",
            }}
          >
            <h4 style={{ marginBottom: 10, textAlign: "center" }}>
              Your Friends
            </h4>
>>>>>>> Stashed changes
            {friends.length === 0 ? (
              <p style={{ textAlign: "center" }}>No friends yet.</p>
            ) : (
              <ul className="friend-list">
<<<<<<< Updated upstream
                {friends.map((f) => (
                  <li
                    key={f}
                    className="friend-item"
                    onClick={() => setSelectedChatFriend(f)}
                  >
                    <div className="friend-avatar">
                      {f.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="friend-name">{f}</div>
=======
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
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
      {/* Modals */}
>>>>>>> Stashed changes
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
                  <li key={friendName} style={{ marginBottom: 10 }}>
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
            <button onClick={closeNewChat}>Close</button>
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
              <ul style={{ maxHeight: 300, overflowY: "auto" }}>
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

      {/* REMADE View Group Chats Modal */}
      {showViewGroupChats && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Group Chats</h3>
            {groupChats.length === 0 ? (
              <p>You have no group chats yet.</p>
            ) : (
              <ul>
                {groupChats.map((groupChatId) => (
                  <li key={groupChatId} style={{ marginBottom: 10 }}>
                    {groupChatId}{" "}
                    <button
                      onClick={() => {
                        setSelectedGroupChat(groupChatId);
                        setShowViewGroupChats(false);
                      }}
                    >
                      Open ➡️
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={closeGroupChatModal}>Close</button>
          </div>
        </div>
      )}
    </main>
  );
}
