// Importing React hooks and Firestore functions
import React, { useState, useEffect, FormEvent } from "react";
import {
  doc,        // create a reference (pointer) to a specific document in Firestore
  getDoc,     // read one document from Firestore
  setDoc,     // create or overwrite a document
  updateDoc,  // update certain fields in an existing document
  getDocs,    // read multiple documents from a collection
  collection, // create a reference to a collection (like "users")
} from "firebase/firestore";
import { db } from "./firebase"; // your initialized Firestore instance

// The props this component accepts (from its parent)
interface LoginProps {
  onLogin: (username: string, id: number) => void;
  // onLogin is a function the parent passes in
  // we call it when login or signup succeeds
}

export default function Login({ onLogin }: LoginProps) {
  // --- STATE (form + UI) ---
  const [username, setUsername] = useState(""); // stores typed username
  const [password, setPassword] = useState(""); // stores typed password
  const [isSignup, setIsSignup] = useState(false); // true=signup view, false=login view
  const [error, setError] = useState(""); // stores any error message shown to user

  // --- HELPER: Generate a unique random ID for new users ---
  const generateId = async () => {
    const used: number[] = [];
    const snapshot = await getDocs(collection(db, "users"));
    snapshot.forEach((doc) => {
      const dataid = doc.data();
      if (dataid.id != null) {
        used.push(dataid.id);
      }
    })
    let id;
    do {
      let alreadyused = false;
      id = Math.floor(100_000 + Math.random() * 900_000);
      for (let i = 0; i < used.length; i++) {
        if (used[i] === id) {
          alreadyused = true;
          break
        }
      }
      if (alreadyused === false) {
        break
      }
    } while (true)
    return id
  }

  // --- FORM SUBMISSION HANDLER (login or signup) ---
  //  const handleSubmit = async (submitEvent: FormEvent) => {
  //   const name = username.trim();
  //   const pass = password.trim();
  //   if (name === null || pass === null){
  //     setError("Username and password cannot be empty");
  //   }
  //  }
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // prevent page refresh
    const name = username.trim(); // trim extra spaces
    const pass = password.trim();

    // basic validation
    if (name === ("") || pass === ("")) {
      setError("Username and password cannot be empty.");
      return;
    }

    // reference to Firestore document: "users/{username}"
    //makes a reference to document in database "users" and the names under them
    const document = doc(db, "users", name);

    // get document snapshot from Firestore
    // after making reference(pointing at it) you actually grab it
    const user = await getDoc(document);

    // get the data inside the document (or undefined if doc doesn't exist)
    const userdata = user.data();

    if (isSignup === true) {
      // --- SIGNUP MODE ---
      if (user.exists() === true) {
        setError("Username already taken."); // user exists
        return;
      } 
      const id = await generateId(); // make a unique numeric ID calls function from line 43
      await setDoc(document, { // setdoc means creat a document in the database
        id,
        password: pass,
        createdAt: new Date(), // store signup timestamp
      });
      onLogin(name, id); // tell parent login/signup was successful
    } else {
      // --- LOGIN MODE ---
      if (user.exists() === false) {
        setError("Incorrect username."); // no such user
        return;
      }
      if (userdata?.password !== pass) { // ? stops program from crashing if data is undefined
        setError("Incorrect password."); // password mismatch
        return;
      }
      onLogin(name, userdata.id); // success → notify parent
    }
  };

  // --- CHANGE PASSWORD HANDLER (only visible in login mode) ---
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

    // ask for current + new passwords
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

    // update Firestore with new password
    try {
      await updateDoc(ref, { password: next.trim() });
      alert("✅ Password updated!");
    } catch {
      alert("❌ Failed to update password.");
    }
  };

  // --- UI RENDER ---
  return (
    <main className="login-screen">
      <h1>
        Welcome to SnapClone 📸
        <br />
        <span style={{ fontSize: 14, color: "#888" }}>
          {/* (optional subtitle here) */}
        </span>
      </h1>

      {/* Buttons to toggle between Login and Signup */}
      <div className="toggle-buttons">
        {["Log In", "Sign Up"].map((label, i) => (
          <button
            key={label}
            onClick={() => {
              setIsSignup(!!i); // switch mode: 0=false=login, 1=true=signup
              setError("");     // clear any old error messages
            }}
            className={isSignup === !!i ? "active" : ""} // highlight active button
          >
            {label}
          </button>
        ))}
      </div>

      {/* The login/signup form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={isSignup ? "Choose a username…" : "Enter your username…"}
          value={username}
          onChange={(e) => setUsername(e.target.value)} // update state on typing
        />
        <input
          type="password"
          placeholder={isSignup ? "Choose a password…" : "Enter your password…"}
          value={password}
          onChange={(e) => setPassword(e.target.value)} // update state on typing
        />
        <button type="submit">
          {isSignup ? "Create Account" : "Log In"}
        </button>
      </form>

      {/* Show password change option ONLY if logging in */}
      {!isSignup && (
        <button
          onClick={handleChangePassword}
          style={{ marginTop: 10, backgroundColor: "#eee" }}
        >
          🔑 Change Password
        </button>
      )}

      {/* Show error message if exists */}
      {error && <p className="error-message">{error}</p>}

      {/* Little note under form */}
      <p className="login-note">
        {isSignup
          ? "Already have an account? Click Log In above."
          : "New here? Click Sign Up above."}
      </p>
    </main>
  );
}
