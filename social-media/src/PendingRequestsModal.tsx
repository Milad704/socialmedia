import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "./firebase";

interface Props {
  onClose(): void;
  currentUser: string;
  addFriendToUsers(currentUser: string, otheruser: string): Promise<void>; // 2 users being added
}

export default function PendingRequestsModal({
  onClose,
  currentUser,
  addFriendToUsers,
}: Props) {
  // `requests === null` → still loading; `[]` → loaded with zero entries
  const [requests, setRequests] = useState<string[] | null>(null);
  const [error, setError] = useState<string>(); // Store any fetch error

  // Fetch pending requests once when `currentUser` changes
  useEffect(() => {
    const userdoc_ref = getDoc(doc(db, "users", currentUser))
    userdoc_ref.then(userdoc_snap => {
      if (userdoc_snap.exists() === true) {
        setRequests(userdoc_snap.data().requests || [])
      } else {
        setRequests([]);
      }
    })
  }, [currentUser]) // whenuser changes
  // useEffect(() => {
  //   getDoc(doc(db, "users", currentUser))
  //     .then(userdoc => 
  //       setRequests(
  //         userdoc.exists() 
  //           ? userdoc.data().requests || []  // get array or fallback
  //           : []
  //       )
  //     )
  //     .catch(err => {
  //       setError(err.message); // show error message
  //       setRequests([]);       // stop loading
  //     });
  // }, [currentUser]); // when user changes

  // Handles both accept (accept=true) and reject (accept=false)
  const handle = async (otheruser: string, accept = false) => {
    if (accept === true) {
      await addFriendToUsers(currentUser, otheruser);
    }
    await updateDoc(doc(db, "users", currentUser), {
      requests: arrayRemove(otheruser),
    });
    setRequests(prev => {
      if (prev === null) return [];
      return prev.filter(u => u !== otheruser); // u is new array
    });
  }
  // const handle = async (user: string, accept = false) => {
  //   try {
  //     if (accept) {
  //       // add each other as friends
  //       await addFriendToUsers(currentUser, user);
  //     }
  //     // remove from pending in Firestore
  //     await updateDoc(doc(db, "users", currentUser), {
  //       requests: arrayRemove(user),
  //     });
  //     // update UI list
  //     setRequests(prev => prev?.filter(u => u !== user) ?? []);
  //   } catch (err: any) {
  //     alert(`${accept ? "Accept" : "Reject"} error: ${err.message}`);
  //   }
  // };

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
            {requests.map(otheruser => (
              <li key={otheruser} style={{ marginBottom: 10 }}>
                {otheruser} wants to be your friend&nbsp;
                {/* accept */}
                <button onClick={() => handle(otheruser, true)}>✅</button>
                {/* reject */}
                <button onClick={() => handle(otheruser)}>❌</button>
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
