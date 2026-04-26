import React, { useState, useEffect } from "react";
import {
  doc, // reference a document by path
  getDoc, // read a single document once
  setDoc, // create or overwrite a document
  deleteDoc, // delete a document
  updateDoc, // update specific fields of a document
  arrayUnion, // helper to append items to array fields
  collection, //  the collection by its path
  query, // build a query against a collection
  where, // filter criteria for queries
  getDocs, // read multiple documents once
  onSnapshot, // subscribe to real-time updates
} from "firebase/firestore";
import { db } from "./firebase"; // your initialized Firestore instance
// import { onAuthStateChanged } from "firebase/auth";
// import { auth } from "./firebase";

// Child components for different app screens & modals
type Props = { onLogin: (u: string) => void };
import Login from "./Login";
import Camera from "./Camera"; 
import Gallery from "./Gallery"; 
import Profile from "./Profile";
import ChatRoom from "./ChatRoom"; 
import AddFriendModal from "./AddFriendModal"; 
import PendingRequestsModal from "./PendingRequestsModal"; 
import "./App.css"; 

// add each user to the other's `friends` array
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
  const [loggedIn, setLoggedIn] = useState(false); 
  const [username, setUsername] = useState(""); 
  const [chatId, SetChatId] = useState<string | null>(null); // active 1-on-1 or group chat ID: id of chat


  const [friends, setFriends] = useState<string[]>([]);
  const [groupChatsList, setGroupChatsList] = useState<
    { id: string; name: string }[]
  >([]);


  const [showCamera, setShowCamera] = useState(false); 
  const [showGallery, setShowGallery] = useState(false); 
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showPending, setShowPending] = useState(false); 
  const [showNewChat, setShowNewChat] = useState(false); 
  const [showMakeGroup, setShowMakeGroup] = useState(false); 
  const [showViewGroups, setShowViewGroups] = useState(false); 
  const [Showprofile, setShowprofile] = useState(false);

  const [newGroupName, setNewGroupName] = useState(""); 
  const [groupSelection, setGroupSelection] = useState<string[]>([]); 

  const [imgUrl, setImgUrl] = useState<string | null>(null); 
  const [imgName, setImgName] = useState<string | null>(null); 
  const [postedImages, setPostedImages] = useState<PostedImage[]>([]);

  interface PostedImage {
    id: string;
    imageName: string;
    imageData: string;
  }

  // login functio, recieves and gives to state to username
  const handleLogin = (username: string) => {
    setUsername(username); 
    setLoggedIn(true); 
  };


  useEffect(() => {
    if (!username) {
      return;
    }
    const imageref = doc(db, "users", username, "profile", "image");
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
  const default_image =
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png";
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
  // when user first goes to site, 
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

  if (Showprofile)
    return (
      <Profile
        onClose={() => setShowprofile(false)}
        currentUser={username}
        currentImg={imgUrl ?? default_image}
        image={postedImages}
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

  // --- MAIN UI LAYOUT ---

  return (
    <main className="main-screen">
      <h1  style={{ textAlign: "center" }}>Welcome {username}, to SnapClone</h1>
      <div className="strip-container">
        {/* Sidebar with buttons to open various modals */}
        <div className="white_strip">
          <div className="sidebar-button-grid">
            <button onClick={() => setShowAddFriend(true)}>Add friends</button>
            <button onClick={() => setShowPending(true)}> Pending</button>
            <button onClick={() => setShowNewChat(true)}> Chats</button>
            <button onClick={() => setShowMakeGroup(true)}> New Group</button>
            <button onClick={() => setShowViewGroups(true)}>View Groups</button>
            <button onClick={() => setShowprofile(true)}>
              View your profile
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
            ) : (
              //if length is 0
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
            <h4>{imgName || "No image selected."}</h4>
            {imgUrl && (
              <>
                {" "}
                {/* preview and removal of existing profile pic */}
                <h4 style={{ marginTop: 20 }}> Preview</h4>
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

      {/* {Showprofile &&(
        <Profile
        currentUser={username}
        currentImg ={imgUrl ?? default_image}
       />
      )} */}
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
