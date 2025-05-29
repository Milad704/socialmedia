import React, { useState, FormEvent, ChangeEvent } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // Make sure firebase.ts exports `db`

// Define the props for the Login component
interface LoginProps {
  onLogin: (username: string) => void; // Callback to proceed to main screen
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState(""); // Store entered username
  const [isSignup, setIsSignup] = useState(false); // Toggle between login/signup
  const [error, setError] = useState(""); // Display any error messages

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = username.trim();

    if (trimmed === "") {
      setError("Username cannot be empty.");
      return;
    }

    try {
      const userRef = doc(db, "users", trimmed); // Reference to user doc
      const userSnap = await getDoc(userRef); // Check if it exists

      if (isSignup) {
        // 🔐 Sign Up logic
        if (userSnap.exists()) {
          setError("Username already taken.");
        } else {
          // Create new user with current timestamp
          await setDoc(userRef, {
            createdAt: new Date(),
          });
          onLogin(trimmed); // Move to next screen
        }
      } else {
        // 🔓 Log In logic
        if (userSnap.exists()) {
          onLogin(trimmed); // Move to next screen
        } else {
          setError("Incorrect username.");
        }
      }
    } catch (err) {
      console.error("Error checking Firestore:", err);
      setError("Something went wrong. Try again.");
    }
  };

  // Handle typing in the input box
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  return (
    <main className="login-screen">
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

      {/* Username input form */}
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

      {/* Show error if there is one */}
      {error && <p className="error-message">{error}</p>}

      {/* Small note */}
      <p className="login-note">
        {isSignup
          ? "Already have an account? Click Log In above."
          : "New here? Click Sign Up above."}
      </p>
    </main>
  );
}
