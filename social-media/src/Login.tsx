import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase"; // ✅ Ensure correct path to your firebase.ts

// Pass both username and ID to parent
interface LoginProps {
  onLogin: (username: string, id: number) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [allUsers, setAllUsers] = useState<string[]>([]); // ✅ Store fetched usernames

  // ✅ Fetch all usernames on load
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const names: string[] = [];

        snapshot.forEach((doc) => {
          names.push(doc.id); // usernames are stored as document IDs
        });

        setAllUsers(names);
      } catch (err) {
        console.error("⚠️ Failed to fetch users:", err);
      }
    };

    fetchUsers();
  }, []);

  const generateUniqueId = async (): Promise<number> => {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const existingIds = new Set<number>();

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.id) existingIds.add(data.id);
    });

    let newId = 0;
    do {
      newId = Math.floor(100000 + Math.random() * 900000);
    } while (existingIds.has(newId));

    return newId;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = username.trim();

    if (trimmed === "") {
      setError("Username cannot be empty.");
      return;
    }

    try {
      const userRef = doc(db, "users", trimmed);
      const userSnap = await getDoc(userRef);

      if (isSignup) {
        if (userSnap.exists()) {
          setError("Username already taken.");
        } else {
          const newId = await generateUniqueId();
          await setDoc(userRef, {
            createdAt: new Date(),
            id: newId,
          });
          onLogin(trimmed, newId);
        }
      } else {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          onLogin(trimmed, userData.id);
        } else {
          setError("Incorrect username.");
        }
      }
    } catch (err) {
      console.error("❌ Unexpected error during login/signup:", err);
      setError("Something went wrong. Try again.");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <main className="login-screen">
      <h1>
        Welcome to SnapClone 📸
        <br />
        <span style={{ fontSize: "14px", color: "#888" }}>
          Users: {allUsers.join(", ") || "loading..."}
        </span>
      </h1>

      <div className="toggle-buttons">
        <button
          onClick={() => {
            setIsSignup(false);
            setError("");
          }}
          className={!isSignup ? "active" : ""}
        >
          Log In
        </button>
        <button
          onClick={() => {
            setIsSignup(true);
            setError("");
          }}
          className={isSignup ? "active" : ""}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={
            isSignup ? "Choose a username..." : "Enter your username..."
          }
          value={username}
          onChange={handleChange}
        />
        <button type="submit">{isSignup ? "Create Account" : "Log In"}</button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <p className="login-note">
        {isSignup
          ? "Already have an account? Click Log In above."
          : "New here? Click Sign Up above."}
      </p>
    </main>
  );
}
