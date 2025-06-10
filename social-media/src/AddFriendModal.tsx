import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db } from "./firebase";

interface AddFriendModalProps {
  onClose: () => void;
  currentUser: string;
}

export default function AddFriendModal({
  onClose,
  currentUser,
}: AddFriendModalProps) {
  const [users, setUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestSentTo, setRequestSentTo] = useState<Set<string>>(new Set());
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Step 1: Fetch all users except currentUser
        const usersSnapshot = await getDocs(collection(db, "users"));
        const allUsernames: string[] = [];
        usersSnapshot.forEach((doc) => {
          if (doc.id !== currentUser) {
            allUsernames.push(doc.id);
          }
        });

        // Step 2: Fetch all accepted friend requests involving currentUser
        // friendRequests where (from == currentUser OR to == currentUser) AND status == 'accepted'
        const friendRequestsRef = collection(db, "friendRequests");

        const q1 = query(
          friendRequestsRef,
          where("from", "==", currentUser),
          where("status", "==", "accepted")
        );
        const q2 = query(
          friendRequestsRef,
          where("to", "==", currentUser),
          where("status", "==", "accepted")
        );

        const [q1Snapshot, q2Snapshot] = await Promise.all([
          getDocs(q1),
          getDocs(q2),
        ]);

        // Extract friend usernames from accepted requests
        const friendsSet = new Set<string>();

        q1Snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.to) friendsSet.add(data.to);
        });

        q2Snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.from) friendsSet.add(data.from);
        });

        // Step 3: Filter out friends from allUsernames
        const unfriendedUsers = allUsernames.filter(
          (username) => !friendsSet.has(username)
        );

        setUsers(unfriendedUsers);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to load users: " + err.message);
        console.error("❌ Error fetching users:", err);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  const sendFriendRequest = async (toUsername: string) => {
    console.log(
      `📨 Sending friend request from ${currentUser} to ${toUsername}...`
    );
    setSendError(null);

    try {
      const docRef = await addDoc(collection(db, "friendRequests"), {
        from: currentUser,
        to: toUsername,
        status: "pending",
        createdAt: new Date(),
      });

      console.log("✅ Friend request sent! Doc ID:", docRef.id);
      setRequestSentTo((prev) => new Set(prev).add(toUsername));
    } catch (err: any) {
      console.error("❌ Failed to send friend request:", err);
      setSendError("Failed to send friend request: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>👥 Unfriended Users</h3>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {sendError && <p style={{ color: "red" }}>{sendError}</p>}

        {loading ? (
          <p>Loading users...</p>
        ) : (
          <ul>
            {users.map((name) => (
              <li key={name} style={{ marginBottom: "10px" }}>
                {name}{" "}
                {requestSentTo.has(name) ? (
                  <span style={{ color: "green" }}>Sent Request ✅</span>
                ) : (
                  <button onClick={() => sendFriendRequest(name)}>
                    Add Friend ➕
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <button onClick={onClose}>❌ Close</button>
      </div>
    </div>
  );
}
