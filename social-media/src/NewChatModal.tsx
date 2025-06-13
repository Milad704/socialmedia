import React, { useState } from "react";

interface Friend {
  id: string;
  username: string;
}

interface NewChatModalProps {
  friends: Friend[];
  onClose: () => void;
  onStartChat: (friendId: string) => void;
  onCreateGroupChat: (friendIds: string[]) => void;
}

export default function NewChatModal({
  friends,
  onClose,
  onStartChat,
  onCreateGroupChat,
}: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelectFriend = (id: string) => {
    if (selectedFriends.includes(id)) {
      setSelectedFriends(selectedFriends.filter((fid) => fid !== id));
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  };

  const handleCreateGroup = () => {
    if (selectedFriends.length > 0) {
      onCreateGroupChat(selectedFriends);
      setSelectedFriends([]);
      setIsGroupMode(false);
      onClose();
    }
  };

  return (
    <div className="modal">
      <button className="close-button" onClick={onClose}>
        Close
      </button>

      {!isGroupMode ? (
        <>
          <h2>Start a New Chat</h2>
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="friend-list">
            {filteredFriends.map((friend) => (
              <li key={friend.id}>
                <button onClick={() => onStartChat(friend.id)}>
                  {friend.username}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setIsGroupMode(true)}>Make Groupchat</button>
        </>
      ) : (
        <>
          <h2>Create Group Chat</h2>
          <input
            type="text"
            placeholder="Search friends to add..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <ul className="friend-list">
            {filteredFriends.map((friend) => (
              <li key={friend.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={() => toggleSelectFriend(friend.id)}
                  />{" "}
                  {friend.username}
                </label>
              </li>
            ))}
          </ul>
          <button
            onClick={handleCreateGroup}
            disabled={selectedFriends.length === 0}
          >
            Create Group
          </button>
          <button onClick={() => setIsGroupMode(false)}>
            Back to Single Chat
          </button>
        </>
      )}
    </div>
  );
}
