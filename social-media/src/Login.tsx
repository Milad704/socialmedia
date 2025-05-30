import React, { useState, FormEvent, ChangeEvent } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // Make sure firebase.ts exports `db`
//export const id
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
      let userRef;
      try {
        userRef = doc(db, "users", trimmed); // Reference to user doc
      } catch (err) {
        console.error("❌ Error creating Firestore doc reference:", err);
        setError("Internal error setting up Firestore.");
        return;
      }

      let userSnap;
      try {
        userSnap = await getDoc(userRef); // Check if document exists
      } catch (err) {
        console.error("❌ Error reading user document:", err);
        setError("Failed to read user data from database.");
        return;
      }

      if (isSignup) {
        // 🔐 Sign Up logic
        if (userSnap.exists()) {
          setError("Username already taken.");
        } else {
          const id = Math.floor(100000 + Math.random() * 900000);
          try {
            await setDoc(userRef, {
              createdAt: new Date(),
              id: id,
            });
          } catch (err) {
            console.error("❌ Error writing new user document:", err);
            setError("Failed to create account. Try again later.");
            return;
          }
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
      console.error("❌ Unexpected error during login/signup:", err);
      setError("Something went wrong. Try again.");
    }
  };

  // Handle typing in the input box
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    try {
      setUsername(e.target.value);
    } catch (err) {
      console.error("❌ Error handling input change:", err);
      setError("Problem updating username.");
    }
  };

  return (
    <main className="login-screen">
      <h1>Welcome to SnapClone 📸</h1>

      {/* Toggle between Log In and Sign Up */}
      <div className="toggle-buttons">
        <button
          onClick={() => {
            try {
              setIsSignup(false);
              setError("");
            } catch (err) {
              console.error("❌ Error toggling to Log In:", err);
              setError("Failed to switch mode.");
            }
          }}
          className={!isSignup ? "active" : ""}
        >
          Log In
        </button>
        <button
          onClick={() => {
            try {
              setIsSignup(true);
              setError("");
            } catch (err) {
              console.error("❌ Error toggling to Sign Up:", err);
              setError("Failed to switch mode.");
            }
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
