import React, { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

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
    getDocs(collection(db, "users")).then(userdocs => {
      const current_friends: string[] = [];
      const sent_requests: string[] = [];
      const other_users: string[] = [];

      userdocs.forEach(doc => {
        const id = doc.id;
        const data = doc.data();

        if (id === currentUser){
          current_friends.push(...(data.friends || []));
          sent_requests.push(...(data.sentRequests || []));
        } else{
          other_users.push(id)
        }
      });
      setFriends(current_friends);
      setSent(sent_requests);
      setUsers(other_users)
    })
  }, [currentUser]) // run this modal everytime currentuser changes, like when different person logs in
  

  // Function to send a friend request

  const sendRequest = async(to_otheruser: string) => {
    if (sent.includes(to_otheruser) === true){ // if you already sent a friend request
      return;
    }
    await updateDoc(doc(db, "users", to_otheruser), {
      requests: arrayUnion(currentUser)
    });
    await updateDoc(doc(db, "users", currentUser), {
      sentRequests: arrayUnion(to_otheruser),
    });

    setSent(prev_array => [...prev_array, to_otheruser]); // takes current array of sent requests and adds another value.
  }


  // Filter users by search query and exclude existing friends
  const filtered = users.filter(eachuser =>
    eachuser.toLowerCase().includes(query.toLowerCase()) && !friends.includes(eachuser) //filters through each user, query looks at what user typed in search, includes sees if it is included.
  );

  // Render UI
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Search for Friends</h3>
        <button onClick={onClose}>Close</button>

        {/* Search input field */}
        <input
          type="text"
          value={query}
          onChange={type_event => setQuery(type_event.target.value)}
          placeholder="Search by username..."
          style={{ padding: 8, width: "100%", marginBottom: 12, borderRadius: 5 }}
        />

        {/* User list */}
        <ul style={{ maxHeight: 400,overflowY: "scroll", padding: 0 }}>
          {filtered.length ? ( // checks if their is more then 0 names
            filtered.map(user => (
              <li key={user} style={{ marginBottom: 10 }}>
                {user}{" "}
                <button
                  onClick={() => sendRequest(user)} // sends request to user(u)
                  disabled={sent.includes(user)} // Disable button if already sent, sent

                >
                  {sent.includes(user) ? "Sent" : "Add"}
                </button>
              </li>
            ))
          ) : (
            <p>No matching users found.</p>//if filtred name has no matching name
          )}
        </ul>
      </div>
    </div>
  );
}
