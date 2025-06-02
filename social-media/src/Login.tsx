import React, { useState, FormEvent, ChangeEvent } from "react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase"; // Make sure firebase.ts exports `db`

// Pass both username and ID to parent
interface LoginProps {
  onLogin: (username: string, id: number) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");

  // Generate a unique 6-digit ID not already in Firestore
  const generateUniqueId = async (): Promise<number> => {
    let unique = false;
    let newId = 0;

    const usersSnapshot = await getDocs(collection(db, "users"));
    const existingIds = new Set<number>();

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.id) existingIds.add(data.id);
    });

    while (!unique) {
      newId = Math.floor(100000 + Math.random() * 900000);
      if (!existingIds.has(newId)) {
        unique = true;
      }
    }

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
          const newId = await generateUniqueId(); // ✅ get unique ID
          await setDoc(userRef, {
            createdAt: new Date(),
            id: newId,
          });
          onLogin(trimmed, newId); // ✅ pass username + ID
        }
      } else {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          onLogin(trimmed, userData.id); // ✅ pass stored ID
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
      <h1>Welcome to SnapClone 📸</h1>

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
