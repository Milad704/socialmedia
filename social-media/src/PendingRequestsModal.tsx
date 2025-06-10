import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "./firebase";

interface PendingRequestsModalProps {
  onClose: () => void;
  currentUser: string;
  addFriendToUsers: (userA: string, userB: string) => Promise<void>; // added prop
}

interface FriendRequest {
  id: string;
  from: string;
  status: string;
}

export default function PendingRequestsModal({
  onClose,
  currentUser,
  addFriendToUsers, // accept prop here
}: PendingRequestsModalProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const q = query(
          collection(db, "friendRequests"),
          where("to", "==", currentUser),
          where("status", "==", "pending")
        );
        const snapshot = await getDocs(q);
        const reqs: FriendRequest[] = [];
        snapshot.forEach((doc) => {
          reqs.push({ id: doc.id, ...doc.data() } as FriendRequest);
        });
        setRequests(reqs);
        setLoading(false);
      } catch (err: any) {
        setError("Failed to load pending requests: " + err.message);
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, [currentUser]);

  // Accept friend request — update request and add friends both ways
  const acceptRequest = async (requestId: string, fromUser: string) => {
    try {
      // Update friendRequests doc to accepted
      await updateDoc(doc(db, "friendRequests", requestId), {
        status: "accepted",
      });

      // Add each other as friends
      await addFriendToUsers(currentUser, fromUser);

      // Remove accepted request from local state
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      alert("Failed to accept request: " + err.message);
    }
  };

  // Reject friend request
  const rejectRequest = async (requestId: string) => {
    try {
      await updateDoc(doc(db, "friendRequests", requestId), {
        status: "rejected",
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      alert("Failed to reject request: " + err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Pending Friend Requests</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {loading ? (
          <p>Loading pending requests...</p>
        ) : requests.length === 0 ? (
          <p>No pending friend requests.</p>
        ) : (
          <ul>
            {requests.map((req) => (
              <li key={req.id} style={{ marginBottom: "10px" }}>
                {req.from} wants to be your friend{" "}
                <button onClick={() => acceptRequest(req.id, req.from)}>
                  Accept ✅
                </button>{" "}
                <button onClick={() => rejectRequest(req.id)}>Reject ❌</button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
