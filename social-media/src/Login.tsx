import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase";

// Define the props for the Login component
interface LoginProps {
  // Callback invoked after successful login or signup
  onLogin: (username: string, id: number) => void;
}

export default function Login({ onLogin }: LoginProps) {
  // Local state for form inputs and control flags
  const [username, setUsername] = useState<string>(""); // stores the entered username
  const [password, setPassword] = useState<string>(""); // stores the entered password
  const [confirmPassword, setConfirmPassword] = useState<string>(""); // stores confirmation when signing up
  const [isSignup, setIsSignup] = useState<boolean>(false); // toggles between login and signup modes
  const [error, setError] = useState<string>(""); // holds any validation or Firebase errors

  /**
   * Generates a unique 6-digit ID not already in the users collection
   */
  const generateUniqueId = async (): Promise<number> => {
    // Fetch all user documents
    const usersSnapshot = await getDocs(collection(db, "users"));
    const existingIds = new Set<number>();
    usersSnapshot.forEach((doc) => {
      const data = doc.data() as any;
      if (data.id) existingIds.add(data.id);
    });

    let newId: number;
    // Keep generating until an unused ID is found
    do {
      newId = Math.floor(100000 + Math.random() * 900000);
    } while (existingIds.has(newId));

    return newId;
  };

  /**
   * Handles form submission for both login and signup
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent default form reload
    setError(""); // Clear any previous errors

    const trimmed = username.trim(); // Remove whitespace
    if (!trimmed) return setError("Username cannot be empty.");
    if (!password) return setError("Password cannot be empty.");

    // Reference to the user document by username
    const userRef = doc(db, "users", trimmed);
    const userSnap = await getDoc(userRef);

    if (isSignup) {
      // SIGN UP flow
      if (userSnap.exists()) {
        // Prevent duplicate usernames
        setError("Username already taken.");
        return;
      }
      if (password !== confirmPassword) {
        // Ensure password confirmation matches
        setError("Passwords do not match.");
        return;
      }
      // Generate a new unique ID and create the user document
      const newId = await generateUniqueId();
      await setDoc(userRef, {
        id: newId,
        password,
        createdAt: new Date(),
      });
      // Invoke parent callback with new credentials
      onLogin(trimmed, newId);
    } else {
      // LOGIN flow
      if (!userSnap.exists()) {
        // Username not found
        setError("Incorrect username or password.");
        return;
      }
      const data = userSnap.data() as any;
      if (data.password !== password) {
        // Password mismatch
        setError("Incorrect username or password.");
        return;
      }
      // Successful login: call parent callback
      onLogin(trimmed, data.id);
    }
  };

  return (
    <main className="login-screen">
      {/* App title */}
      <h1>Welcome to SnapClone 📸</h1>

      {/* Toggle between Log In and Sign Up */}
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

      {/* Authentication form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={isSignup ? "Choose a username..." : "Username..."}
          value={username}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setUsername(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password..."
          value={password}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
        />

        {/* Show confirm password only in signup mode */}
        {isSignup && (
          <input
            type="password"
            placeholder="Confirm password..."
            value={confirmPassword}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfirmPassword(e.target.value)
            }
          />
        )}

        <button type="submit">{isSignup ? "Create Account" : "Log In"}</button>
      </form>

      {/* Display any error messages */}
      {error && <p className="error-message">{error}</p>}
    </main>
  );
}
