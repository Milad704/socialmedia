import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";

interface AddFriendModalProps {
  onClose: () => void;
}

export default function AddFriendModal({ onClose }: AddFriendModalProps) {
  const [users, setUsers] = useState<{ [key: string]: any }>({});
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const db = getDatabase();
      const usersRef = ref(db, "users");

      const unsubscribe = onValue(
        usersRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (typeof data === "object" && data !== null) {
              setUsers(data);
              setError(null);
            } else {
              setError("Unexpected data format received from database.");
              console.error("Unexpected data format:", data);
            }
          } else {
            setError("No user data found in database.");
            console.warn("No user data found.");
          }
        },
        (err) => {
          setError("Error listening to database: " + err.message);
          console.error("Firebase listener error:", err);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      setError("Failed to connect to database: " + err.message);
      console.error("Error connecting to Firebase:", err);
    }
  }, []);

  const handleSearch = () => {
    try {
      const allUsernames = Object.values(users)
        .map((user: any) => user?.username)
        .filter((username: any) => typeof username === "string");

      if (allUsernames.length === 0) {
        setError("No usernames found in the data.");
        setResults([]);
      } else {
        setError(null);
        setResults(allUsernames);
      }
    } catch (err: any) {
      setError("Error processing users data: " + err.message);
      console.error("Error during handleSearch:", err);
      setResults([]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>🔍 Search for Friends</h3>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button onClick={handleSearch}>Search</button>
        <ul>
          {results.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
        <button onClick={onClose}>❌ Close</button>
      </div>
    </div>
  );
}
