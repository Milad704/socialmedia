import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users: string[] = [];
      let currentUserFriends: string[] = [];
      let currentUserRequests: string[] = [];

      querySnapshot.forEach((docSnap) => {
        const username = docSnap.id;
        const data = docSnap.data();
        if (username === currentUser) {
          currentUserFriends = data.friends || [];
        } else {
          users.push(username);
        }
      });

      // Get sent requests (people who already received your request)
      const myDoc = await getDoc(doc(db, "users", currentUser));
      if (myDoc.exists()) {
        const myData = myDoc.data();
        const mySent = myData?.sentRequests || []; // optional: if you store it this way
        setSentRequests(mySent);
      }

      setAllUsers(users);
      setFriends(currentUserFriends);
    };

    fetchUsers();
  }, [currentUser]);

  const handleSendRequest = async (recipient: string) => {
    const recipientRef = doc(db, "users", recipient);

    await updateDoc(recipientRef, {
      requests: arrayUnion(currentUser),
    });

    // Optional: if you want to store "sentRequests" in the sender’s doc:
    // await updateDoc(doc(db, "users", currentUser), {
    //   sentRequests: arrayUnion(recipient),
    // });

    setSentRequests((prev) => [...prev, recipient]);
    alert(`Friend request sent to ${recipient}`);
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !friends.includes(u)
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
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredUsers.length === 0 ? (
            <p>No matching users found.</p>
          ) : (
            filteredUsers.map((user) => (
              <li key={user} style={{ marginBottom: "10px" }}>
                {user}{" "}
                {sentRequests.includes(user) ? (
                  <button disabled>✅ Sent</button>
                ) : (
                  <button onClick={() => handleSendRequest(user)}>
                    ➕ Add
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
