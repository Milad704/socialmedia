import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";

interface Props {
  onClose(): void;                               // Close the modal
  currentUser: string;                           // Logged-in user
  addFriendToUsers(a: string, b: string): Promise<void>; // Friend-add helper
}

export default function PendingRequestsModal({
  onClose,
  currentUser,
  addFriendToUsers,
}: Props) {
  // `requests === null` → still loading; `[]` → loaded with zero entries
  const [requests, setRequests] = useState<string[] | null>(null);
  const [error, setError]     = useState<string>(); // Store any fetch error

  // Fetch pending requests once when `currentUser` changes
  useEffect(() => {
    getDoc(doc(db, "users", currentUser))
      .then(snap => 
        setRequests(
          snap.exists() 
            ? snap.data().requests || []  // get array or fallback
            : []
        )
      )
      .catch(err => {
        setError(err.message); // show error message
        setRequests([]);       // stop loading
      });
  }, [currentUser]);

  // Handles both accept (accept=true) and reject (accept=false)
  const handle = async (user: string, accept = false) => {
    try {
      if (accept) {
        // add each other as friends
        await addFriendToUsers(currentUser, user);
      }
      // remove from pending in Firestore
      await updateDoc(doc(db, "users", currentUser), {
        requests: arrayRemove(user),
      });
      // update UI list
      setRequests(prev => prev?.filter(u => u !== user) ?? []);
    } catch (err: any) {
      alert(`${accept ? "Accept" : "Reject"} error: ${err.message}`);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Pending Friend Requests</h3>

        {/* Error banner */}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Loading / empty / list states */}
        {requests === null ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <ul>
            {requests.map(u => (
              <li key={u} style={{ marginBottom: 10 }}>
                {u} wants to be your friend&nbsp;
                {/* accept */}
                <button onClick={() => handle(u, true)}>✅</button>
                {/* reject */}
                <button onClick={() => handle(u)}>❌</button>
              </li>
            ))}
          </ul>
        )}

        {/* close modal */}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
