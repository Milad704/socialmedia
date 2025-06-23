import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";

// Props passed into the modal: current user and onClose function
interface Props {
  currentUser: string;
  onClose: () => void;
}

// Main component: AddFriendModal
export default function AddFriendModal({ currentUser, onClose }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const [sent, setSent] = useState<string[]>([]);

  const [query, setQuery] = useState("");

  // Load user data from Firestore when modal opens
  useEffect(() => {
    getDocs(collection(db, "users")).then(snap => {
      const u: string[] = []; // Other users available to add
      const f: string[] = []; // Friend usernames of currentUser
      const s: string[] = []; // Usernames to whom currentUser has sent requests

      snap.forEach(d => {
        const id = d.id, data = d.data() as any;

        if (id === currentUser) {
          // Extract current user's friends and sent requests
          f.push(...(data.friends || []));
          s.push(...(data.sentRequests || []));
        } else {
          // Add all other usernames to list
          u.push(id);
        }
      });

      // Save results to state
      setUsers(u);
      setFriends(f);
      setSent(s);
    });
  }, [currentUser]);

  // Function to send a friend request
  const sendRequest = async (to: string) => {
    if (sent.includes(to)) return; // Prevent sending again

    // Add request to recipient's "requests" array
    await updateDoc(doc(db, "users", to), {
      requests: arrayUnion(currentUser),
    });

    // Add recipient to sender's "sentRequests" array
    await updateDoc(doc(db, "users", currentUser), {
      sentRequests: arrayUnion(to),
    });

    // Update local UI state
    setSent(prev => [...prev, to]);
  };

  // Filter users by search query and exclude existing friends
  const filtered = users.filter(u =>
    u.toLowerCase().includes(query.toLowerCase()) && !friends.includes(u)
  );

  // Render UI
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Search for Friends</h3>
        
        {/* Search input field */}
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by username..."
          style={{ padding: 8, width: "100%", marginBottom: 12, borderRadius: 5 }}
        />

        {/* User list */}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filtered.length ? (
            filtered.map(u => (
              <li key={u} style={{ marginBottom: 10 }}>
                {u}{" "}
                <button
                  onClick={() => sendRequest(u)} // sends request to user(u)
                  disabled={sent.includes(u)} // Disable button if already sent, sent
                  
                >
                  {sent.includes(u) ? "✅ Sent" : "➕ Add"} 
                </button>
              </li>
            ))
          ) : (
            <p>No matching users found.</p>//if filtred name has no matching name
          )}
        </ul>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
