// Importing React hooks and Firestore functions we’ll use
import React, { useState, useEffect, FormEvent } from "react";
import {
  doc,        // to get a reference to a specific document
  getDoc,     // to read a document
  setDoc,     // to create/overwrite a document
  updateDoc,  // to update fields in an existing document
  getDocs,    // to read multiple documents from a collection
  collection, // to get a reference to a collection
} from "firebase/firestore";
import { db } from "./firebase"; // your initialized Firestore instance

// Define the props accepted by this component
interface LoginProps {
  onLogin: (username: string, id: number) => void; 
  // callback to notify parent when login/signup succeeds
}

export default function Login({ onLogin }: LoginProps) {
  // --- FORM STATE ---
  const [username, setUsername] = useState(""); // holds current username input
  const [password, setPassword] = useState(""); // holds current password input
  const [isSignup, setIsSignup] = useState(false); // toggle between Log In / Sign Up
  const [error, setError] = useState("");         // stores any error message

  // --- ID GENERATOR FOR NEW USERS ---
  // Ensures each new user gets a unique 6-digit numeric ID
  const generateId = async (): Promise<number> => {
    const used = new Set<number>();
    // Fetch all existing users, collect their .id values
    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.id) used.add(data.id);
    });

    // Keep picking a random 6-digit number until it’s unused
    let id: number;
    do {
      id = Math.floor(100_000 + Math.random() * 900_000);
    } while (used.has(id));
    return id;
  };

  // --- FORM SUBMISSION HANDLER ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // prevent full-page reload
    const name = username.trim();
    const pass = password.trim();

    // Simple client-side validation
    if (!name || !pass) {
      setError("Username and password cannot be empty.");
      return;
    }

    // Reference to this user’s document
    const ref = doc(db, "users", name);
    const snap = await getDoc(ref);
    const data = snap.data();

    if (isSignup) {
      // ----- SIGN UP FLOW -----
      if (snap.exists()) {
        setError("Username already taken.");
        return;
      }
      // generate and assign a unique numeric ID
      const id = await generateId();
      await setDoc(ref, {
        id,
        password: pass,
        createdAt: new Date(),
      });
      onLogin(name, id); // notify parent component
    } else {
      // ----- LOG IN FLOW -----
      if (!snap.exists()) {
        setError("Incorrect username.");
        return;
      }
      if (data?.password !== pass) {
        setError("Incorrect password.");
        return;
      }
      onLogin(name, data.id); // successful login
    }
  };

  // --- PASSWORD CHANGE HANDLER (only on Login view) ---
  const handleChangePassword = async () => {
    const name = username.trim();
    if (!name) {
      setError("Enter your username first.");
      return;
    }

    const ref = doc(db, "users", name);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      setError("User not found.");
      return;
    }

    // Prompt for current and new passwords
    const current = prompt("Enter your current password:");
    if (!current || snap.data()?.password !== current.trim()) {
      alert("❌ Incorrect current password.");
      return;
    }
    const next = prompt("Enter your new password:");
    if (!next || next.trim().length < 3) {
      alert("❌ Password too short.");
      return;
    }

    // Update Firestore
    try {
      await updateDoc(ref, { password: next.trim() });
      alert("✅ Password updated!");
    } catch {
      alert("❌ Failed to update password.");
    }
  };

  // --- RENDER ---
  return (
    <main className="login-screen">
      <h1>
        Welcome to SnapClone 📸
        <br />
        <span style={{ fontSize: 14, color: "#888" }}>
          {/* You could show a subtitle here */}
        </span>
      </h1>

      {/* Toggle between Login and Sign-Up modes */}
      <div className="toggle-buttons">
        {["Log In", "Sign Up"].map((label, i) => (
          <button
            key={label}
            onClick={() => {
              setIsSignup(!!i); // i===0 → Log In, i===1 → Sign Up
              setError("");      // clear errors when switching
            }}
            className={isSignup === !!i ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>

      {/* The actual form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={isSignup ? "Choose a username…" : "Enter your username…"}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder={isSignup ? "Choose a password…" : "Enter your password…"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">
          {isSignup ? "Create Account" : "Log In"}
        </button>
      </form>

      {/* Only show password-change when logging in */}
      {!isSignup && (
        <button
          onClick={handleChangePassword}
          style={{ marginTop: 10, backgroundColor: "#eee" }}
        >
          🔑 Change Password
        </button>
      )}

      {/* Display any form errors */}
      {error && <p className="error-message">{error}</p>}

      {/* Helper text under the form */}
      <p className="login-note">
        {isSignup
          ? "Already have an account? Click Log In above."
          : "New here? Click Sign Up above."}
      </p>
    </main>
  );
}
