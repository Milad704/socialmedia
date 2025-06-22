// Importing necessary React hooks and Firestore functions
import React, { useState, useEffect, FormEvent } from "react";
import { doc, getDoc, setDoc, updateDoc, getDocs, collection } from "firebase/firestore";
import { db } from "./firebase"; // Firebase config

// Props type for Login component
interface LoginProps {
  onLogin: (username: string, id: number) => void;
}

// Main login component
export default function Login({ onLogin }: LoginProps) {
  // Input fields and UI state
  const [username, setUsername] = useState(""), [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false), [error, setError] = useState("");


  // Fetch all existing usernames on initial load
  useEffect(() => {
    getDocs(collection(db, "users"))
      .catch(err => console.error("⚠️ Fetch error:", err));
  }, []);

  // Generate a unique 6-digit ID not already used by any user
  const generateId = async (): Promise<number> => {
    const used = new Set<number>();
    (await getDocs(collection(db, "users"))).forEach(doc => {
      const d = doc.data();
      if (d.id) used.add(d.id); // Add each existing ID to the set
    });
    let id = 0;
    do id = Math.floor(100000 + Math.random() * 900000); // Random 6-digit number
    while (used.has(id)); // Repeat until unique
    return id;
  };

  // Handle login or signup form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // Prevent page reload
    const name = username.trim(), pass = password.trim();
    if (!name || !pass) return setError("Username and password cannot be empty.");

    const ref = doc(db, "users", name), snap = await getDoc(ref);
    const data = snap.data();

    if (isSignup) {
      if (snap.exists()) return setError("Username already taken.");
      const id = await generateId();
      await setDoc(ref, { id, password: pass, createdAt: new Date() }); // Create new user doc
      onLogin(name, id); // Pass data to parent
    } else {
      if (!snap.exists()) return setError("Incorrect username.");
      if (data?.password !== pass) return setError("Incorrect password.");
      onLogin(name, data.id); // Pass existing user data to parent
    }
  };

  // Handle password change button click
  const handleChangePassword = async () => {
    const name = username.trim();
    if (!name) return setError("Enter your username first."); // 🔴 Key check for username

    const ref = doc(db, "users", name), snap = await getDoc(ref);
    if (!snap.exists()) return setError("User not found.");

    const current = prompt("Enter your current password:");
    if (!current || snap.data()?.password !== current.trim())
      return alert("❌ Incorrect current password.");

    const next = prompt("Enter your new password:");
    if (!next || next.trim().length < 3)
      return alert("❌ Password too short.");

    try {
      await updateDoc(ref, { password: next.trim() }); // Update password in Firestore
      alert("✅ Password updated!");
    } catch {
      alert("❌ Failed to update password.");
    }
  };

  return (
    <main className="login-screen">
      {/* Heading & username preview */}
      <h1>Welcome to SnapClone 📸<br />
        <span style={{ fontSize: 14, color: "#888" }}>
        </span>
      </h1>

      {/* Log In / Sign Up toggle buttons */}
      <div className="toggle-buttons">
        {["Log In", "Sign Up"].map((label, i) => (
          <button
            key={label}
            onClick={() => { setIsSignup(!!i); setError(""); }}
            className={isSignup === !!i ? "active" : ""}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Main login/signup form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={isSignup ? "Choose a username..." : "Enter your username..."}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder={isSignup ? "Choose a password..." : "Enter your password..."}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isSignup ? "Create Account" : "Log In"}</button>
      </form>

      {/* Password reset button (login only) */}
      {!isSignup && (
        <button
          onClick={handleChangePassword}
          style={{ marginTop: 10, backgroundColor: "#eee" }}
        >
          🔑 Change Password
        </button>
      )}

      {/* Error message display */}
      {error && <p className="error-message">{error}</p>}

      {/* Helper text below form */}
      <p className="login-note">
        {isSignup
          ? "Already have an account? Click Log In above."
          : "New here? Click Sign Up above."}
      </p>
    </main>
  );
}
