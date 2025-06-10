import React, { useEffect, useState } from "react";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

interface NewChatModalProps {
  currentUser: string;
  onClose: () => void;
  onStartChat: (friendName: string) => void;
}

export default function NewChatModal({
  currentUser,
  onClose,
  onStartChat,
}: NewChatModalProps) {
  const [friends, setFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser));
        const data = userDoc.data();
        const friendList = data?.friends || [];
        setFriends(friendList);
        setLoading(false);
      } catch (error) {
        console.error("Error loading friends:", error);
        setLoading(false);
      }
    };

    fetchFriends();
  }, [currentUser]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>New Chat</h3>
        {loading ? (
          <p>Loading friends...</p>
        ) : friends.length === 0 ? (
          <p>You have no friends to chat with.</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend}>
                {friend}{" "}
                <button onClick={() => onStartChat(friend)}>💬 Chat</button>
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
