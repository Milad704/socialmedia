import React, { useState, useEffect } from "react";
import {
  doc, getDoc, getDocs, onSnapshot,
  collection, query, orderBy, addDoc,
  updateDoc, arrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

interface Props {
  currentUser: string;    
  chatId: string;         // other user(if 1 on 1) or groupChat ID
  onBack(): void;       
}

export default function ChatRoom({ currentUser, chatId, onBack }: Props) {

  const [Messages, setMessages] = useState<any[]>([]);      
  const [newMsg, setNewMsg] = useState("");         // input text
  const [isGroup, setIsGroup] = useState(false);    
  const [groupInfo, setGroupInfo] = useState<{ name: string; members: string[] }>({
    name: "",
    members: [],
  });

  // detect if group or 1:1 and load participants 
  useEffect(() => {
    (async () => {
      const chatdoc = await getDoc(doc(db, "groupChats", chatId));
      if (chatdoc.exists() === true) {
        const chatdata = chatdoc.data();
        if (!chatdata){
          return;
        }
        setIsGroup(true);
        setGroupInfo({ name: chatdata.name, members: chatdata.members })
      } else {
        setIsGroup(false);
      }

    })();
  }, [currentUser, chatId]);

  // see collection if its groupchat or not, and returns messages of that collections along the way
  const collectionFor = (user: string) => {
    if (isGroup === true) {
      return collection(db, "users", user, "groupChats", chatId, "messages");
    } else {
      return collection(db, "users", user, "chats", [currentUser, chatId].sort().join("_"), "messages") // chatid represents other user so name of user_other user in this case
    }
  }


  // ─── load & subscribe to messages ──────────────────
  useEffect(() => {
    const collection = collectionFor(currentUser);
    const querysearch = query(collection, orderBy("createdAt")); // query search to check all messages of collection, order it by whens its created at
    getDocs(querysearch).then(docSnap => setMessages(docSnap.docs.map(document => ({ id: document.id, ...document.data() })))) // ... adds in key pair value of document, const obj = { a: 1, b: 2 }; const newObj = { ...obj, c: 3 };
    const realtimeListen = onSnapshot(querysearch, snapshot => setMessages(snapshot.docs.map(document => ({ id: document.id, ...document.data() }))))
    return () => realtimeListen();
  }, [currentUser, chatId, isGroup]);

  // ─── send message to all participants ─────────────
  const sendMessage = async () => {
    const text = newMsg.trim();
    if (!text) { // checks if text is empty
      return;
    }
    const chatmessage = { text, sender: currentUser, createdAt: new Date() } // message that will be stored in firebase
    if (isGroup === true) {
      await Promise.all(groupInfo.members.map(member => addDoc(collectionFor(member), chatmessage))); //.map loops over each member, and adds the chatmessage in their subcollection thats stores messages
    } else {
      await addDoc(collectionFor(currentUser), chatmessage);
      await addDoc(collectionFor(chatId), chatmessage);
    }
    setNewMsg(""); // make variable holding text go back to being empty after sending message
  }

  const deleteMessage = async (id: string) => { // id is document id for a specific message
    if (isGroup) {
      //replaces message text, deleted becomes true
      await updateDoc(doc(db, "users", currentUser, "groupChats", chatId, "messages", id), { text: "This message was deleted for you.", deleted: true });
    } else {

      await updateDoc(doc(db, "users", currentUser, "chats", [currentUser, chatId].sort().join("_"), "messages", id), { text: "This message was deleted for you.", deleted: true })
    }
  }


  // ─── remove self from groupChat → go back ─────────
  const leaveGroup = async () => {
    await updateDoc(doc(db, "groupChats", chatId), {
      members: arrayRemove(currentUser),
    });
    onBack();
  }

  let title;
  if (isGroup) {
    title = groupInfo.name
  } else {
    title = chatId
  }
  // ─── UI rendering ───────────────────────────────────
  return (
    <main className="chat-room">
      <header>
        <button onClick={onBack}>Back</button>
        <h2>{title}</h2>
        {isGroup && (
          <>
            <p>Members: {groupInfo.members.join("/ ")}</p>
            <button onClick={leaveGroup} style={{ marginLeft: "1rem", fontSize: "0.8ren" }}>
              Leave Group
            </button>
          </>
        )}
      </header>
      <section className="messages">
        {/* loops over ever message */}
        {Messages.map(message => (
          <div key={message.id} className={message.sender === currentUser ? "my-message" : "their-message"}>
            <strong>{message.sender}</strong> {message.text}
            {message.sender === currentUser && !message.deleted && ( 
              <button onClick={() => deleteMessage(message.id)} style={{ fontSize: "0.6rem", marginLeft: "3px" }}>
                delete
              </button>
            )}

          </div>
        ))}

      </section>
      <div className="chat-input">
        <input
          value={newMsg}
          onChange={input_event => setNewMsg(input_event.target.value)}
          onKeyDown={input_event => input_event.key === "Enter"}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </main>
  );
}
