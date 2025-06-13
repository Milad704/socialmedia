import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";

interface PendingRequestsModalProps {
  onClose: () => void;
  currentUser: string;
  addFriendToUsers: (userA: string, userB: string) => Promise<void>;
}

export default function PendingRequestsModal({
  onClose,
  currentUser,
  addFriendToUsers,
}: PendingRequestsModalProps) {
  const [requests, setRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setRequests(data.requests || []);
        } else {
          setRequests([]);
        }
        setLoading(false);
      } catch (err: any) {
        setError("Failed to load requests: " + err.message);
        setLoading(false);
      }
    };

    fetchRequests();
  }, [currentUser]);

  const acceptRequest = async (fromUser: string) => {
    try {
      await addFriendToUsers(currentUser, fromUser);

      // Remove request from Firestore
      const userRef = doc(db, "users", currentUser);
      await updateDoc(userRef, {
        requests: arrayRemove(fromUser),
      });

      setRequests((prev) => prev.filter((r) => r !== fromUser));
    } catch (err: any) {
      alert("Error accepting request: " + err.message);
    }
  };

  const rejectRequest = async (fromUser: string) => {
    try {
      const userRef = doc(db, "users", currentUser);
      await updateDoc(userRef, {
        requests: arrayRemove(fromUser),
      });

      setRequests((prev) => prev.filter((r) => r !== fromUser));
    } catch (err: any) {
      alert("Error rejecting request: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Pending Friend Requests</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul>
            {requests.map((username) => (
              <li key={username} style={{ marginBottom: "10px" }}>
                {username} wants to be your friend{" "}
                <button onClick={() => acceptRequest(username)}>
                  ✅ Accept
                </button>{" "}
                <button onClick={() => rejectRequest(username)}>
                  ❌ Reject
                </button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
