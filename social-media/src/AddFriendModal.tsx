import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "./firebase";

interface AddFriendModalProps {
  currentUser: string;
  onClose: () => void;
}

export default function AddFriendModal({
  currentUser,
  onClose,
}: AddFriendModalProps) {
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [existingChats, setExistingChats] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const chatsSnap = await getDocs(collection(db, "chats"));

        const usersList: string[] = [];
        let myFriends: string[] = [];
        const chatPartnersSet = new Set<string>();

        usersSnap.forEach((uDoc) => {
          const username = uDoc.id;
          const data = uDoc.data();

          if (username === currentUser) {
            myFriends = data.friends || [];
          } else {
            usersList.push(username);
          }
        });

        chatsSnap.forEach((cDoc) => {
          const data = cDoc.data() as { users?: string[] };
          const chatUsers = data.users || [];

          if (chatUsers.includes(currentUser)) {
            chatUsers.forEach((u) => {
              if (u !== currentUser) chatPartnersSet.add(u);
            });
          }
        });

        setAllUsers(usersList);
        setFriends(myFriends);
        setExistingChats(Array.from(chatPartnersSet));
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleSendRequest = async (recipient: string) => {
    try {
      const uDoc = doc(db, "users", recipient);
      await updateDoc(uDoc, {
        requests: arrayUnion(currentUser),
      });
      alert(`Friend request sent to ${recipient}`);
    } catch (err) {
      console.error("Failed to send request:", err);
      alert("Unable to send request.");
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !friends.includes(u) &&
      !existingChats.includes(u)
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Search for Friends</h3>
        <input
          type="text"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "8px",
            width: "100%",
            marginBottom: "12px",
            borderRadius: "5px",
          }}
        />

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {filteredUsers.length === 0 ? (
            <p>No matching users found.</p>
          ) : (
            filteredUsers.map((u) => (
              <li key={u} style={{ marginBottom: "10px" }}>
                <strong>{u}</strong>{" "}
                <button onClick={() => handleSendRequest(u)}>➕ Add</button>
              </li>
            ))
          )}
        </ul>

        <button onClick={onClose} style={{ marginTop: "10px" }}>
          Close
        </button>
      </div>
    </div>
  );
}
