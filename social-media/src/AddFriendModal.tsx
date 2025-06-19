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
    const fetchData = async () => {
      // fetch all users except current
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: string[] = [];
      let currentFriends: string[] = [];
      let sent: string[] = [];

      usersSnap.forEach((snap) => {
        const id = snap.id;
        const data = snap.data() as any;
        if (id === currentUser) {
          currentFriends = data.friends || [];
          sent = data.sentRequests || [];
        } else {
          usersList.push(id);
        }
      });

      setAllUsers(usersList);
      setFriends(currentFriends);
      setSentRequests(sent);
    };
    fetchData();
  }, [currentUser]);

  const handleSendRequest = async (recipient: string) => {
    // prevent duplicate
    if (sentRequests.includes(recipient)) return;

    // update recipient requests
    await updateDoc(doc(db, "users", recipient), {
      requests: arrayUnion(currentUser),
    });
    // update sender sentRequests
    await updateDoc(doc(db, "users", currentUser), {
      sentRequests: arrayUnion(recipient),
    });

    setSentRequests((prev) => [...prev, recipient]);
  };

  const filtered = allUsers.filter(
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
          {filtered.length === 0 ? (
            <p>No matching users found.</p>
          ) : (
            filtered.map((user) => (
              <li key={user} style={{ marginBottom: "10px" }}>
                {user}{" "}
                <button
                  onClick={() => handleSendRequest(user)}
                  disabled={sentRequests.includes(user)}
                >
                  {sentRequests.includes(user) ? "✅ Sent" : "➕ Add"}
                </button>
              </li>
            ))
          )}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
