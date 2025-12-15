// Import React and hooks for state & side effects
import React, { useState, useEffect } from "react";
// Firestore functions for reading, writing, querying, and real-time updates
import {
  doc, // reference a document by path
  getDoc, // read a single document once
  setDoc, // create or overwrite a document
  deleteDoc, // delete a document
  updateDoc, // update specific fields of a document
  arrayUnion, // helper to append items to array fields
  collection, // reference a collection by path
  query, // build a query against a collection
  where, // filter criteria for queries
  getDocs, // read multiple documents once
  onSnapshot, // subscribe to real-time updates
} from "firebase/firestore";
import { db } from "./firebase"; // your initialized Firestore instance

// Child components for different app screens & modals
type Props = { onLogin: (u: string) => void };
import Login from "./Login"; // login screen
import Camera from "./Camera"; // camera capture screen
import Gallery from "./Gallery"; // gallery browser screen
import ChatRoom from "./ChatRoom"; // chat interface screen
import AddFriendModal from "./AddFriendModal"; // modal to send friend requests
import PendingRequestsModal from "./PendingRequestsModal"; // modal to accept/decline
import "./App.css"; // global styles

// HELPER: add each user to the other's `friends` array
const addFriendToUsers = async (currentUser: string, otheruser: string) => {
  try {
    // update both user docs
    await Promise.all([
      updateDoc(doc(db, "users", currentUser), {
        friends: arrayUnion(otheruser),
      }),
      updateDoc(doc(db, "users", otheruser), {
        friends: arrayUnion(currentUser),
      }),
    ]);
    console.log("✅ Friends added");
  } catch (err) {
    console.error("❌ Add friend error:", err);
  }
};

export default function App() {
  // --- AUTH & NAVIGATION STATE ---
  const [loggedIn, setLoggedIn] = useState(false); // is user logged in?
  const [username, setUsername] = useState(""); // current user's ID (string)
  const [chatId, SetChatId] = useState<string | null>(null); // active 1-on-1 or group chat ID: id of chat

  // --- DATA LISTS FROM FIRESTORE ---
  const [friends, setFriends] = useState<string[]>([]); // array of friend usernames
  const [groupChatsList, setGroupChatsList] = useState<
    { id: string; name: string }[]
  >([]);

  // --- UI TOGGLES FOR SCREENS & MODALS ---
  const [showCamera, setShowCamera] = useState(false); // camera screen
  const [showGallery, setShowGallery] = useState(false); // gallery screen
  const [showAddFriend, setShowAddFriend] = useState(false); // add-friend modal
  const [showPending, setShowPending] = useState(false); // pending requests modal
  const [showNewChat, setShowNewChat] = useState(false); // new chat modal
  const [showMakeGroup, setShowMakeGroup] = useState(false); // create group modal
  const [showViewGroups, setShowViewGroups] = useState(false); // view groups modal

  // --- FORM STATE FOR GROUP CREATION ---
  const [newGroupName, setNewGroupName] = useState(""); // group name input
  const [groupSelection, setGroupSelection] = useState<string[]>([]); // selected friend IDs

  // --- PROFILE PICTURE STATE ---
  const [imgUrl, setImgUrl] = useState<string | null>(null); // image data URL
  const [imgName, setImgName] = useState<string | null>(null); // image filename or label

  // --- LOGIN HANDLER ---
  const handleLogin = (username: string) => {
    setUsername(username); // store the username
    setLoggedIn(true); // switch to main UI
  };

  // --- REAL-TIME PROFILE PIC LISTENER ---
  useEffect(() => {
    if (!username) {
      return;
    }
    const imageref = doc(db, "users", username, "profile", "image"); // profile image
    return onSnapshot(
      imageref,
      (imagesnapshot) => {
        const imagedata = imagesnapshot.data() || {};
        setImgUrl(imagedata.imageData || null);
        setImgName(imagedata.imgName || null);
      },
      (err) => console.error(err)
    );
  }, [username]);
  // useEffect(() => {
  //   if (!username) return; // skip until user logs in
  //   const image_ref = doc(db, "users", username, "profile", "image"); // reference to image of user
  //   return onSnapshot( // onshapshot means when it changes
  //     image_ref,
  //     (image_snap) => {
  //       const image_data = image_snap.data() || {};
  //       setImgUrl(image_data.imageData || null); // update image URL
  //       setImgName(image_data.imageName || null); // update image label
  //     },
  //     (err) => console.error(err)
  //   );
  // }, [username]);

  // Friend list loading
  useEffect(() => {
    if (!username) {
      return;
    }
    const ref = doc(db, "users", username);
    const newfriendadd = onSnapshot(ref, (snapshot) => {
      setFriends(snapshot.data()?.friends || []);
    });
  }, [username]);
  // useEffect(() => {
  //   if (!username) return;
  //   getDoc(doc(db, "users", username))
  //     .then((snap) => setFriends(snap.data()?.friends || [])) // default to [] if missing
  //     .catch(() => setFriends([]));
  // }, [username]);

  // --- LOAD GROUP CHATS WHEN VIEW GROUPS MODAL OPENS ---
  useEffect(() => {
    if (!showViewGroups || !username) {
      return;
    }
    const groupwithuser = query(
      collection(db, "groupChats"),
      where("members", "array-contains", username)
    );
    getDocs(groupwithuser).then((snapshot) =>
      setGroupChatsList(
        snapshot.docs.map((document) => ({
          id: document.id,
          name: document.data().name,
        }))
      )
    );
  }, [showViewGroups, username]);
  // useEffect(() => {
  //   if (!showViewGroups || !username) return;
  //   const q = query(
  //     collection(db, "groupChats"),
  //     where("members", "array-contains", username) // only groups containing this user
  //   );
  //   getDocs(q)
  //     .then((snap) =>
  //       setGroupChatsList(
  //         snap.docs.map((d) => ({ id: d.id, name: d.data().name }))
  //       )
  //     )
  //     .catch(() => setGroupChatsList([]));
  // }, [showViewGroups, username]);

  // --- GROUP CREATION HELPERS ---
  // toggle friend selection in new-group form
  const toggleGroupFriend = (id: string) => {
    // id is friends id
    setGroupSelection((prevfriend) => {
      // prev friend array that are clicked
      const includedfriend = prevfriend.includes(id); // is friend included in friend array that got clicked
      if (includedfriend) {
        return prevfriend.filter((friend_Id) => friend_Id !== id); // remove user from array
      } else {
        return [...prevfriend, id]; // add user to the array
      }
    });
  };
  // const toggleGroupFriend = (id: string) =>
  //   setGroupSelection(
  //     (prev) =>
  //       prev.includes(id)
  //         ? prev.filter((x) => x !== id) // remove if already selected
  //         : [...prev, id] // add if not
  //   );

  // create and write a new group chat to Firestore
  const createGroupChat = async () => {
    const name = newGroupName.trim(); // variable value that user inputs
    if (!name) return alert("Enter a name");
    if (!groupSelection.length) return alert("Select friends");

    const id = name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const ref = doc(db, "groupChats", id);

    if ((await getDoc(ref)).exists()) {
      return alert("Name taken");
    }
    try {
      await setDoc(ref, {
        name,
        members: [username, ...groupSelection],
        createdAt: new Date(),
      });
      SetChatId(id);
    } catch {
      alert("Failed to create.");
    }
    setNewGroupName("");
    setGroupSelection([]);
    setShowMakeGroup(false);
  };

  // const createGroupChat = async () => {
  //   const name = newGroupName.trim();
  //   if (!name) return alert("Enter a name.");
  //   if (!groupSelection.length) return alert("Select friends.");

  //   // sanitize group name into a document ID
  //   const id = name
  //     .toLowerCase()
  //     .replace(/\s+/g, "_") // spaces → underscores
  //     .replace(/[^a-z0-9_]/g, ""); // remove invalid chars
  //   const ref = doc(db, "groupChats", id);

  //   if ((await getDoc(ref)).exists()) {
  //     return alert("Name taken.");
  //   }

  //   try {
  //     await setDoc(ref, {
  //       name,
  //       members: [username, ...groupSelection],
  //       createdAt: new Date(),
  //     });
  //     SetChatId(id); // immediately open new group chat
  //   } catch {
  //     alert("Failed to create.");
  //   }

  //   // reset and close modal
  //   setNewGroupName("");
  //   setGroupSelection([]);
  //   setShowMakeGroup(false);
  // };

  // --- CONDITIONAL RENDERING FOR NAVIGATION ---

  if (!loggedIn) return <Login onLogin={handleLogin} />;

  if (chatId)
    //checks that if null, it stays main screen, if true(their is a chat with id) goes to ChatRoom
    return (
      <ChatRoom
        currentUser={username}
        chatId={chatId}
        onBack={() => SetChatId(null)} // if back button is clicked, goes back to main screen
      />
    );
  if (showCamera)
    return <Camera userId={username} onClose={() => setShowCamera(false)} />;
  if (showGallery)
    return (
      <Gallery
        userId={username}
        onClose={() => setShowGallery(false)}
        setSelectedImageUrl={setImgUrl}
        setSelectedImageName={setImgName}
      />
    );
  // if (!loggedIn) return <Login onLogin={handleLogin} />; // login screen first
  // if (chatId)
  //   // open ChatRoom for 1-on-1 or group chat
  //   return (
  //     <ChatRoom
  //       currentUser={username}
  //       chatId={chatId} // refers to either groupchat name or name of other user in 1 on 1 chat.
  //       onBack={() => SetChatId(null)} // go back to main UI
  //     />
  //   );
  // if (showCamera)
  //   return <Camera userId={username} onClose={() => setShowCamera(false)} />; // camera screen
  // if (showGallery)
  //   return (
  //     <Gallery
  //       userId={username}
  //       onClose={() => setShowGallery(false)}
  //       setSelectedImageUrl={setImgUrl} // update state when an image is chosen
  //       setSelectedImageName={setImgName}
  //     />
  //   );

  // --- MAIN UI LAYOUT ---

  return (
    <main className="main-screen">
      <h1>Your username is {username}</h1>
      <div className="strip-container">
        {/* Sidebar with buttons to open various modals */}
        <div className="white_strip">
          <div className="sidebar-button-grid">
            <button onClick={() => setShowAddFriend(true)}>
             Add friends
            </button>
            <button onClick={() => setShowPending(true)}> Pending</button>
            <button onClick={() => setShowNewChat(true)}> Chats</button>
            <button onClick={() => setShowMakeGroup(true)}> New Group</button>
            <button onClick={() => setShowViewGroups(true)}>
              View Groups
            </button>
          </div>
          {/* List of friends; click to open a chat */}
          <div className="friend-list-container">
            <h4>Your Friends</h4>
            {friends.length ? (
              <ul className="friend-list">
                {friends.map((friend) => (
                  <li
                    key={friend}
                    className="friend-item"
                    onClick={() => SetChatId(friend)}
                  >
                    <div className="friend-avatar">
                      {friend.slice(0, 2).toUpperCase()} 
                    </div>
                    <div className="friend-name">{friend}</div>
                  </li>
                ))}
              </ul>
            ) : ( //if length is 0
              <p>No friends yet.</p>
            )}
          </div>
        </div>

        {/* Center section: camera/gallery triggers & profile preview */}
        <div className="center_white_strip">
          <div className="buttons">
            <button onClick={() => setShowCamera(true)}> Camera</button>
            <button onClick={() => setShowGallery(true)}> Gallery</button>
          </div>
          <div style={{ marginTop: 30, textAlign: "center" }}>
            <h4>📷 {imgName || "No image selected."}</h4>
            {imgUrl && (   
              <>
                {" "}
                {/* preview and removal of existing profile pic */}
                <h4 style={{ marginTop: 20 }}>🖼️ Preview</h4>
                <img src={imgUrl} alt="Selected" className="profile-preview" />
                <button
                  onClick={async () => {
                    try {
                      await deleteDoc(
                        doc(db, "users", username, "profile", "image")
                      );
                    } catch (error) {
                      console.error(error);
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

      {/* --- MODALS & OVERLAYS --- */}
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
          setFriends={setFriends}
        />
      )}

      {/* New Chat: list friends with Chat buttons */}
      {showNewChat && (
        <div className="modal-overlay new-chat-modal">
          <div className="modal-content">
            <h3>Your Friends</h3>
            {friends.length ? (
              <ul className="new-chat-list">
                {friends.map((friend) => (
                  <li key={friend}>
                    <span>{friend}</span>
                    <button
                      onClick={() => {
                        SetChatId(friend);
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

      {/* Create Group modal: enter name, pick friends, create */}
      {showMakeGroup && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Groupchat</h3>
            <input
              className="group-name-input"
              placeholder="Group name…"
              value={newGroupName}
              onChange={(error) => setNewGroupName(error.target.value)}
            />
            {friends.length ? (
              <ul className="group-friend-list">
                {friends.map((friend) => (
                  <li key={friend}>
                    <label>
                      <input
                        type="checkbox"
                        checked={groupSelection.includes(friend)}
                        onChange={() => toggleGroupFriend(friend)}
                      />
                      {friend}
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

      {/* View Groups modal: list and open group chats */}
      {showViewGroups && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Your Groups</h3>
            {groupChatsList.length ? (
              <ul className="new-chat-list">
                {groupChatsList.map((c) => (
                  <li key={c.id}>
                    <span>{c.name}</span>
                    <button
                      onClick={() => {
                        SetChatId(c.id);
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
